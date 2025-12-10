import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
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

    // [Python 이식] 경쟁 지역 블랙리스트 (다른 지역 데이터 침범 방지용)
    private readonly MAJOR_REGIONS = [
        "서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", 
        "충북", "충남", "전북", "전남", "경북", "경남", "제주", "포항", "경주", "세종"
    ];

    // 경기도 주요 도시 (기존 유지)
    private readonly GYEONGGI_CITIES = [
        '수원', '용인', '성남', '고양', '의정부', '안산', '부천', '남양주', '평택', '시흥', '화성', '안양', '파주', '김포', '광주', '광명', '군포', '하남', '오산', '이천', '안성', '의왕', '양주', '여주', '과천',
    ];

    constructor(cfg: ConfigService) {
        const apiKey = cfg.get<string>('OPENAI_API_KEY');
        const dbUrl = cfg.get<string>('PERFORMANCE_DB_URL') || 'http://localhost:8000';
        
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
        } catch (e) {
        this.logger.warn(`⚠️ ChromaDB 연결 실패: ${e}`);
        }
    }

    async search(a: PerformanceQueryAnalysisResult): Promise<PerformanceData[]> {
        const { keywords, city, district, target_date } = a;

        // 1차 검색 실행
        let res = await this._runSearch(keywords, city, district, target_date);

        // [Smart Fallback] 결과 0건 & 도시 정보 있음 -> 인접 도시 재검색
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

        return res.slice(0, 5); // 상위 5개 반환
    }

    private async _runSearch(
        kw: string,
        city: string | null,
        district: string | null,
        date: string,
    ): Promise<PerformanceData[]> {
        if (!this.collection) return [];

        const dateNum = parseInt(date);
        const searchKw = kw || '공연';
        
        // 기본 필터 (날짜)
        const baseConditions: any[] = [
        { start_date: { $lte: dateNum } },
        { end_date: { $gte: dateNum } },
        ];

        // [Python 이식 1] 서울 아닐 때 강력한 지역 필터링
        if (city) {
        if (city === '경기') {
            baseConditions.push({ city: { $in: this.GYEONGGI_CITIES } });
        } else if (city !== '서울') {
            // 서울이 아니면 반드시 해당 city 필드 일치해야 함 (서울 데이터 침범 방지)
            baseConditions.push({ city: { $eq: city } });
        }
        // 서울인 경우: 데이터 누락이 많으므로 where 절에 city를 넣지 않고, 후처리(locationMatch)에서 거름
        }

        const candidates: PerformanceData[] = [];
        const existingIds = new Set<string>();

        // ---------------------------------------------------------
        // [Python 이식 2] 제목 우선 검색 (Keyword Exact Match) - Score 999
        // ---------------------------------------------------------
        const cleanKw = searchKw.replace(/\s+/g, '');
        if (cleanKw.length > 1 && searchKw !== '공연') {
            try {
                // 해당 조건의 메타데이터만 가볍게 가져옴 (임베딩 없이)
                const keywordQuery = await this.collection.get({
                    where: { $and: baseConditions },
                    include: [IncludeEnum.metadatas, IncludeEnum.documents],
                    limit: 100 // 너무 많이 가져오지 않도록 제한
                });

                if (keywordQuery.ids.length > 0) {
                    for (let i = 0; i < keywordQuery.ids.length; i++) {
                        const meta = keywordQuery.metadatas[i] as any;
                        const doc = keywordQuery.documents[i] || '';
                        const id = keywordQuery.ids[i];

                        // 제목에 검색어가 포함되어 있는지 확인 (공백 제거 후 비교)
                        const titleClean = (meta.title || '').replace(/\s+/g, '');
                        
                        if (titleClean.includes(cleanKw)) {
                            // 위치 검증 통과 시 추가
                            if (this.locationMatch(meta, city, district)) {
                                const item = this.formatItem(id, meta, doc, 999); // 만점 부여
                                candidates.push(item);
                                existingIds.add(id);
                            }
                        }
                    }
                }
            } catch (e) {
                this.logger.warn(`Keyword Search Error: ${e}`);
            }
        }

        // ---------------------------------------------------------
        // [기존] 벡터 검색 (Vector Search)
        // ---------------------------------------------------------
        try {
        const vectorQuery = await this.collection.query({
            queryTexts: [searchKw],
            nResults: 30,
            where: { $and: baseConditions },
            include: [IncludeEnum.metadatas, IncludeEnum.documents, IncludeEnum.distances],
        });

        const ids = vectorQuery.ids[0];
        if (ids && ids.length > 0) {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                
                // 이미 키워드 검색으로 찾은 데이터면 스킵 (중복 방지)
                if (existingIds.has(id)) continue;

                const meta = vectorQuery.metadatas[0][i] as any;
                const doc = vectorQuery.documents[0][i] ?? '';
                const dist = vectorQuery.distances?.[0]?.[i] ?? 1;

                if (!meta) continue;

                // [핵심] 위치 검증 (경쟁 지역 필터링 포함)
                if (!this.locationMatch(meta, city, district)) continue;

                const score = Math.max(0, Number(((1 - dist) * 100).toFixed(1)));
                candidates.push(this.formatItem(id, meta, doc, score));
            }
        }
        } catch (e) {
        this.logger.error(`Vector Search Error: ${e}`);
        }

        // 점수 높은 순 정렬 (999점인 제목 일치 항목이 최상단으로 옴)
        return candidates.sort((a, b) => b.score - a.score);
    }

    // [Python 이식 3] 정교한 위치 검증 및 경쟁 지역 필터링
    private locationMatch(meta: any, city: string | null, district: string | null): boolean {
        const dbCity = (meta.city || '').trim();
        const dbDistrict = (meta.district || '').trim();
        const dbTitle = (meta.title || '').trim();
        const dbSite = (meta.eventSite || meta.place || '').trim();
        const fullText = `${dbCity} ${dbDistrict} ${dbSite} ${dbTitle}`;

        // 1. 도시(City) 검증
        if (city) {
        // 경기 검색: 경기도 목록에 없으면 탈락
        if (city === '경기') {
            if (!this.GYEONGGI_CITIES.includes(dbCity)) return false;
        } 
        // 일반 도시 검색
        else {
            // [경쟁 지역 블랙리스트 필터링] - Python logic
            // 예: "수원" 검색 시 제목/장소에 "서울"이 있으면 탈락
            for (const region of this.MAJOR_REGIONS) {
                if (region === city) continue; // 자기 자신은 패스
                if (city.includes(region)) continue;

                // DB 데이터가 다른 경쟁 지역이면 탈락
                if (dbCity === region) return false;
                // 제목에 다른 지역 명시 (예: [대구])
                if (dbTitle.includes(`[${region}]`) || dbTitle.includes(`(${region})`)) return false;
                if (dbTitle.startsWith(region)) return false;
                // 장소명에 다른 지역 포함 (예: 부산시민회관)
                if (dbSite.includes(region)) return false;
            }

            // DB에 city가 있는데 검색어와 다르면 탈락 (단, 서울 검색 시 빈값은 허용)
            if (dbCity && !dbCity.includes(city) && !city.includes(dbCity)) {
                // 서울 검색인데 데이터가 비어있으면 봐줌, 하지만 명확히 다른 지역이면 탈락
                return false; 
            }
        }
        }

        // 2. 구/군(District) 정밀 검사
        if (district) {
            // DB에 구 정보가 있으면 직접 비교
            if (dbDistrict) {
                if (!dbDistrict.includes(district) && !district.includes(dbDistrict)) return false;
            } 
            // DB에 구 정보가 없으면 전체 텍스트에서 검색 (Python logic)
            else {
                if (!fullText.includes(district)) return false;
            }
        }

        return true;
    }

    // 데이터 포맷팅 헬퍼 (이미지 URL 처리 포함)
    private formatItem(id: string, meta: any, doc: string, score: number): PerformanceData {
        // 이미지 우선순위 로직 (URL > File)
        let finalImageUrl = '';
        if (meta.image_url && String(meta.image_url).startsWith('http')) {
            finalImageUrl = meta.image_url;
        } else if (meta.imageObject && String(meta.imageObject).startsWith('http')) {
            finalImageUrl = meta.imageObject;
        } else if (meta.imageObject) {
            // 문화포털 패턴 시도
            finalImageUrl = `http://www.culture.go.kr/upload/rdf/${String(meta.imageObject)}`;
        }

        return {
            id,
            title: meta.title || '제목 없음',
            type: meta.type || '기타',
            image_url: finalImageUrl,
            start_date: meta.start_date,
            end_date: meta.end_date,
            eventSite: meta.eventSite || meta.place || '', 
            city: meta.city || '',
            district: meta.district || '',
            booking_url: meta.url || meta.booking_url || '', 
            description: doc,
            score,
        };
    }

    async getNearbyCities(c: string): Promise<string[]> {
        const p = `
        한국 도시 "${c}" 주변의 실제로 이동 가능한 인접 주요 도시 3개를 JSON 배열로 반환해.
        예: ["경주","포항","울산"]
        오직 JSON 배열만 출력해.
        `;

        try {
        const res = await this.gpt.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: p }],
            temperature: 0.1,
        });
        let text = res.choices[0].message.content ?? '[]';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const s = text.indexOf('[');
        const e = text.lastIndexOf(']') + 1;
        if (s === -1 || e === -1) return [];
        return JSON.parse(text.substring(s, e));
        } catch (e) {
        return [];
        }
    }
}