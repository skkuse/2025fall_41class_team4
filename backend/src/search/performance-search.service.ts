import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection, IncludeEnum } from 'chromadb'; // IncludeEnum 추가
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
import OpenAI from 'openai';
import { PerformanceQueryAnalysisResult } from '../query-analysis/performance-query-analysis.service';

export interface PerformanceData {
    id: string;
    title: string;
    type: string;
    image_url: string;
    start_date: number;
    end_date: number;
    eventSite: string;
    city: string;
    district: string;
    booking_url?: string;
    description: string;
    score: number;
    reason?: string;
    summary?: string;
}

@Injectable()
export class PerformanceSearchService implements OnModuleInit {
    private client: ChromaClient;
    private collection: Collection;
    private embedder: OpenAIEmbeddingFunction;
    private gpt: OpenAI;
    private logger = new Logger(PerformanceSearchService.name);

    // 경기도 주요 도시 목록
    private readonly GYEONGGI_CITIES = [
        '수원', '용인', '성남', '고양', '의정부', '안산', '부천', '남양주', '평택', '시흥', '화성', '안양', '파주', '김포', '광주', '광명', '군포', '하남', '오산', '이천', '안성', '의왕', '양주', '여주', '과천',
    ];

    constructor(cfg: ConfigService) {
        const apiKey = cfg.get<string>('OPENAI_API_KEY');
        
        // [수정] DB URL을 파싱하여 path 경고 해결
        const dbUrl = cfg.get<string>('PERFORMANCE_DB_URL') || 'http://localhost:8000';
        
        // Deprecated 경고 해결을 위해 path 그대로 사용하되, 명시적으로 문자열 확인
        this.client = new ChromaClient({ path: dbUrl });

        this.embedder = new OpenAIEmbeddingFunction({
            apiKey,
            modelName: 'text-embedding-3-small',
        });
        this.gpt = new OpenAI({ apiKey });
    }

    async onModuleInit() {
        try {
            this.collection = await this.client.getCollection({
                name: 'performances',
                embeddingFunction: this.embedder,
            });
            this.logger.log('🎵 Performance DB 연결됨');

            const sample = await this.collection.peek({ limit: 1 });
            // this.logger.debug(`👀 DB 데이터 구조 확인 (Sample):\n${JSON.stringify(sample, null, 2)}`);
            } catch (e) {
            this.logger.warn(`⚠️ ChromaDB 연결 실패 (ETL 확인 필요): ${e}`);
            }
    }

    async search(a: PerformanceQueryAnalysisResult): Promise<PerformanceData[]> {
        const { keywords, city, district, target_date } = a;

        // 1. 1차 검색
        let res = await this._runSearch(keywords, city, district, target_date);

        // 2. [문서 source: 9] 1차 실패 & 도시 정보 있음 → 인접 도시 재검색 (Fallback)
        if (res.length === 0 && city) {
        this.logger.log(`⚠️ '${city}' 검색 결과 0건 -> 인접 도시 탐색 (Smart Fallback)`);
        const fallbackCities = await this.getNearbyCities(city);

        for (const nc of fallbackCities) {
            // 인접 도시는 district 무시하고 광역으로 검색
            res = await this._runSearch(keywords, nc, null, target_date);
            if (res.length > 0) {
            this.logger.log(`✅ 인접 도시 '${nc}'에서 ${res.length}건 발견`);
            break;
            }
        }
        }

        return res.slice(0, 5); // [문서 source: 76] 상위 3~5개 반환
    }

    private async _runSearch(
        kw: string,
        city: string | null,
        district: string | null,
        date: string,
    ): Promise<PerformanceData[]> {
        if (!this.collection) return [];

        const dateNum = parseInt(date);

        // [ChromaDB Where 절 구성 - 문서 source: 54-61]
        const whereConditions: any[] = [
        { start_date: { $lte: dateNum } },
        { end_date: { $gte: dateNum } },
        ];

        if (city) {
        if (city === '경기') {
            whereConditions.push({ city: { $in: this.GYEONGGI_CITIES } });
        } else {
            whereConditions.push({ city: { $eq: city } });
        }
        }

        try {
        const query = await this.collection.query({
            queryTexts: [kw || '공연'], // 키워드가 비어있을 경우 기본값
            nResults: 30, // 넉넉히 가져와서 후처리 필터링
            where: { $and: whereConditions },
            // [수정] IncludeEnum 사용하여 타입 안전성 확보
            include: [IncludeEnum.metadatas, IncludeEnum.documents, IncludeEnum.distances],
        });

        const ids = query.ids[0];
        if (!ids || ids.length === 0) return [];

        const out: PerformanceData[] = [];

        for (let i = 0; i < ids.length; i++) {
            const meta = query.metadatas[0][i] as any;
            const doc = query.documents[0][i] ?? '';
            const dist = query.distances?.[0]?.[i] ?? 1;

            if (!meta) continue;

            // if (i < 3) {
            //         this.logger.debug(`============== [DB 원본 데이터 확인 ${i + 1}] ==============`);
            //         this.logger.debug(`제목(Title): ${meta.title}`);
            //         this.logger.debug(`지역(City): ${meta.city}`);
            //         this.logger.debug(`상세지역(District): ${meta.district}`);
            //         this.logger.debug(`장소(Place): ${meta.place || meta.eventSite}`); // 필드명 확인용
            //         this.logger.debug(`전체 메타데이터: ${JSON.stringify(meta)}`); // 전체 구조 확인
            //         this.logger.debug(`========================================================`);
            //     }

            // [문서 source: 79] 후처리 필터링 (구/군 단위 정밀 검사)
            if (!this.locationMatch(meta, city, district)) continue;

            // [수정] 유사도 점수 음수 방지 (0점 미만은 0점으로)
            const score = Math.max(0, Number(((1 - dist) * 100).toFixed(1)));

            out.push({
            id: ids[i],
            title: meta.title || '제목 없음',
            type: meta.type || '기타',
            image_url: meta.imageObject || meta.image_url || '',
            start_date: meta.start_date,
            end_date: meta.end_date,
            eventSite: meta.eventSite || meta.place || '', 
            city: meta.city || '',
            district: meta.district || '',
            booking_url: meta.url || meta.booking_url,
            description: doc,
            score,
            });
        }

        // 점수 높은 순 정렬
        return out.sort((a, b) => b.score - a.score);
        } catch (e) {
        this.logger.error(`Search Error: ${e.message}`);
        return [];
        }
    }

    // [문서 source: 79] 사후 필터링 로직
    private locationMatch(meta: any, city: string | null, district: string | null): boolean {
        // 1. 도시 불일치 체크
        if (city && meta.city) {
        if (city === '경기') {
            if (!this.GYEONGGI_CITIES.includes(meta.city)) return false;
        } else if (meta.city !== city) {
            return false;
        }
        }

        // 2. 구/군 불일치 체크
        if (district && meta.district) {
        if (!meta.district.includes(district) && !district.includes(meta.district)) {
            return false;
        }
        }

        return true;
    }

    // [문서 source: 63] GPT를 이용한 인접 도시 탐색
    async getNearbyCities(c: string): Promise<string[]> {
        const p = `
        한국 도시 "${c}" 주변의 실제로 이동 가능한 인접 주요 도시 3개를 JSON 배열로 반환해.
        예: ["경주","포항","울산"]
        오직 JSON 배열만 출력해. (마크다운 없이)
        `;

        try {
        const res = await this.gpt.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: p }],
            temperature: 0.1,
        });

        let text = res.choices[0].message.content ?? '[]';
        
        // [수정] GPT가 마크다운(```json)을 붙여줄 경우 제거 로직 추가
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const s = text.indexOf('[');
        const e = text.lastIndexOf(']') + 1;
        
        if (s === -1 || e === -1) return [];

        return JSON.parse(text.substring(s, e));
        } catch (e) {
        this.logger.warn(`인접 도시 파싱 실패: ${e}`);
        return [];
        }
    }
}