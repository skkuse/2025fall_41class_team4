import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
// 분석 결과 타입 가져오기 (경로 확인 필요)
import { PerformanceQueryAnalysisResult } from '../query-analysis/performance-query-analysis.service';

// [NEW] 반환 데이터 타입 정의
export interface PerformanceData {
    id: string;
    title: string;
    type: string;        // 뮤지컬, 연극 등
    imageObject: string;  // 포스터 이미지
    start_date: string;
    end_date: string;
    eventSite: string;
    description: string;    // 요약된 줄거리/설명
    distance: number;    // 유사도 점수
}

@Injectable()
export class PerformanceSearchService implements OnModuleInit {
    private client: ChromaClient;
    private collection: Collection;
    private embedder: OpenAIEmbeddingFunction;
    private readonly logger = new Logger(PerformanceSearchService.name);
    private readonly openai_key: string;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) throw new Error('OPENAI_API_KEY Missing');
        this.openai_key = apiKey;

        const chromaUrl = this.configService.get<string>('PERFORMANCE_DB_URL');
        this.client = new ChromaClient({ path: chromaUrl });
        this.embedder = new OpenAIEmbeddingFunction({
            modelName: 'text-embedding-3-small',
            apiKey: this.openai_key,
        });
    }

    async onModuleInit() {
        try {
            this.collection = await this.client.getCollection({
                name: 'performances',
                embeddingFunction: this.embedder,
            });
            const count = await this.collection.count();
            this.logger.log(`✅ Performance DB 연결됨 (${count}건)`);
        } catch (e) {
            this.logger.warn(`⚠️ Performance DB 연결 실패 (ETL 필요)`);
        }
    }

    /**
     * [메인 검색 메서드] ChatService에서 호출하기 편하게 구조 통일
     */
    async search(analysis: PerformanceQueryAnalysisResult): Promise<PerformanceData[]> {
        const { query, filter } = analysis; // 분석 결과에서 바로 꺼냄
        
        if (!this.collection) {
            this.logger.error('DB가 준비되지 않았습니다.');
            return [];
        }

        this.logger.log(`🔍 공연 검색: "${query}" (Filter: ${JSON.stringify(filter)})`);

        try {
            const queryOptions: any = {
                queryTexts: [query || ''], // 쿼리가 없으면 빈 문자열(전체검색 유사 효과)
                nResults: 5, // 상위 5개만
                include: ['metadatas', 'documents', 'distances'],
            };

            if (filter && Object.keys(filter).length > 0) {
                queryOptions.where = filter;
            }

            const startTime = Date.now();

            const results = await this.collection.query(queryOptions);

            // [로그 추가 2] 쿼리 완료 직후 (시간 측정)
            const duration = Date.now() - startTime;
            this.logger.log(`✅ ChromaDB Query 완료! (소요시간: ${duration}ms)`);

            if (!results.ids[0] || results.ids[0].length === 0) {
                return [];
            }

            // [Formatting] 영화 데이터와 비슷한 구조로 변환
            const formattedResults: PerformanceData[] = results.ids[0].map((id, idx) => {
                const meta = results.metadatas[0][idx] as any;
                const dist = results.distances?.[0]?.[idx];
                return {
                    id: id,
                    title: meta.title || '제목 없음',
                    type: meta.type || '기타',
                    imageObject: meta.imageObject || '', // 메타데이터에 image_url 있다고 가정
                    start_date: meta.start_date || '',
                    end_date: meta.end_date || '',
                    eventSite: meta.eventSite || '',
                    description: results.documents[0][idx] || '', // document 내용(줄거리)
                    distance: dist ?? 0
                };
            });

            // [디버깅 로그] 포맷팅된 결과 확인
            console.log(JSON.stringify(formattedResults, null, 2));

            return formattedResults;

        } catch (e) {
            this.logger.error(`공연 검색 실패: ${e.message}`);
            return [];
        }
    }
}