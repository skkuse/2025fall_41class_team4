import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
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
    private readonly GYEONGGI_CITIES = ["수원","용인","성남","고양","의정부","안산","부천","남양주","평택","시흥","화성","안양","파주","김포","광주","광명","군포","하남","오산","이천","안성","의왕","양주","여주","과천"];

    constructor(cfg: ConfigService) {
        const apiKey = cfg.get<string>("OPENAI_API_KEY");
        const db = cfg.get<string>("PERFORMANCE_DB_URL");

        this.client = new ChromaClient({ path: db });
        this.embedder = new OpenAIEmbeddingFunction({
        apiKey,
        modelName: "text-embedding-3-small"
        });
        this.gpt = new OpenAI({ apiKey });
    }

    async onModuleInit() {
        try {
        this.collection = await this.client.getCollection({
            name: "performances",
            embeddingFunction: this.embedder
        });
        this.logger.log("🎵 Performance DB 연결됨");
        } catch {
        this.logger.warn("⚠️ ChromaDB 연결 실패 (ETL 확인 필요)");
        }
    }

    async search(a: PerformanceQueryAnalysisResult): Promise<PerformanceData[]> {
        const { keywords, city, district, target_date } = a;

        // 1차 검색
        let res = await this._runSearch(keywords, city, district, target_date);

        // 1차 실패 & 도시 정보 있음 → 인접 도시 재검색 (Fallback)
        if (res.length === 0 && city) {
        this.logger.log(`⚠️ '${city}' 검색 결과 0건 -> 인접 도시 탐색`);
        const fallbackCities = await this.getNearbyCities(city);

        for (const nc of fallbackCities) {
            // 인접 도시는 district 무시하고 광역으로 검색
            res = await this._runSearch(keywords, nc, null, target_date);
            if (res.length > 0) {
                this.logger.log(`✅ 인접 도시 '${nc}'에서 결과 발견`);
                break;
            }
        }
        }

        return res.slice(0, 3);
    }

    private async _runSearch(
        kw: string,
        city: string | null,
        district: string | null,
        date: string
    ): Promise<PerformanceData[]> {
        if (!this.collection) return [];

        const dateNum = parseInt(date);

        // [ChromaDB Where 절 구성]
        const whereConditions: any[] = [
        { start_date: { $lte: dateNum } },
        { end_date: { $gte: dateNum } }
        ];

        if (city) {
        if (city === "경기") {
            // $in 연산자 사용 (ChromaDB 버전에 따라 지원 여부 확인 필요, 최신은 지원)
            whereConditions.push({ city: { $in: this.GYEONGGI_CITIES } });
        } else {
            whereConditions.push({ city: { $eq: city } });
        }
        }

        try {
            const query = await this.collection.query({
                queryTexts: [kw || "공연"], // 키워드 없으면 전체 검색 효과
                nResults: 50, // 넉넉히 가져와서 후처리 필터링
                where: { $and: whereConditions },
                include: ["metadatas", "documents", "distances"]
            });

            const ids = query.ids[0];
            if (!ids || ids.length === 0) return [];

            const out: PerformanceData[] = [];

            for (let i = 0; i < ids.length; i++) {
                const meta = query.metadatas[0][i] as any;
                const doc = query.documents[0][i] ?? "";
                const dist = query.distances?.[0]?.[i] ?? 1; // distance가 없으면 1(불일치)로 가정

                if (!meta) continue;
                
                // 후처리 필터링 (구/군 단위 정밀 검사)
                if (!this.locationMatch(meta, city, district)) continue;

                // 유사도 점수 변환 (0~100점)
                const score = Number(((1 - dist) * 100).toFixed(1));

                out.push({
                    id: ids[i],
                    title: meta.title || "제목 없음",
                    type: meta.type || "기타",
                    image_url: meta.image_url || "",
                    start_date: meta.start_date,
                    end_date: meta.end_date,
                    eventSite: meta.eventSite || "",
                    city: meta.city || "",
                    district: meta.district || "",
                    booking_url: meta.booking_url,
                    description: doc,
                    score
                });
            }

            // 점수 높은 순 정렬
            return out.sort((a, b) => b.score - a.score);

        } catch (e) {
            this.logger.error(`Search Error: ${e.message}`);
            return [];
        }
    }

    private locationMatch(meta: any, city: string | null, district: string | null): boolean {
        // 1. 도시 불일치 체크 (이미 DB에서 걸렀지만, '경기' 같은 그룹 처리를 위해 확인)
        if (city && meta.city) {
        if (city === "경기") {
            if (!this.GYEONGGI_CITIES.includes(meta.city)) return false;
        } else if (meta.city !== city) {
            return false;
        }
        }

        // 2. 구/군 불일치 체크 (DB 필터링이 안 된 부분)
        if (district && meta.district) {
            // "강남구" vs "강남구" (정확 일치) 또는 포함 관계 확인
            if (!meta.district.includes(district) && !district.includes(meta.district)) {
                return false;
            }
        }

        return true;
    }

    async getNearbyCities(c: string): Promise<string[]> {
        const p = `
        한국 도시 "${c}" 주변의 주요 도시 3개를 JSON 배열로 반환.
        예: ["경주","포항","울산"]
        오직 JSON만 출력.
        `;

        try {
            const res = await this.gpt.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: p }],
                temperature: 0.1
            });

            const text = res.choices[0].message.content ?? "[]";
            const s = text.indexOf("[");
            const e = text.lastIndexOf("]") + 1;
            return JSON.parse(text.substring(s, e));
        } catch {
            return [];
        }
    }
}