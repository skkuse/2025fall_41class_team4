import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';

import { MovieQueryAnalysisResult } from '../query-analysis/movie-query-analysis.service';

@Injectable()
export class QueryRefinementService implements OnModuleInit {
    private client: ChromaClient;
    private readonly openai_key: string;
    private collections: Map<string, Collection> = new Map();
    private embedder: OpenAIEmbeddingFunction;
    private readonly logger = new Logger(QueryRefinementService.name);

    constructor(private configService: ConfigService) {
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
        const chromaUrl = this.configService.get<string>('MOVIE_DB_URL');

        if (!openaiKey) {
        throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
        }

        this.openai_key = openaiKey;

        // 1. ChromaDB 클라이언트 및 임베딩 함수 초기화
        this.client = new ChromaClient({
            path: chromaUrl,
        });
        this.embedder = new OpenAIEmbeddingFunction({
        apiKey: this.openai_key,
        modelName: 'text-embedding-3-small',
        });
    }

    async onModuleInit() {
        const collectionNames = ['movies_actors', 'movies_director', 'movies_genres', 'movies_title'];

        this.logger.log('MovieDB 컬렉션 연결 시도 중...');

        for (const name of collectionNames) {
        try {
            const collection = await this.client.getCollection({
            name: name,
            embeddingFunction: this.embedder,
            });
            this.collections.set(name, collection);
            this.logger.log(`✅ 컬렉션 연결됨: ${name}`);
        } catch (e) {
            this.logger.warn(`⚠️ 컬렉션을 찾을 수 없음: ${name} (데이터가 비어있을 수 있음)`);
        }
        }
    }

    /**
     * [Step 3] 오타 수정 및 엔티티 정규화
     * 분석된 쿼리 객체를 받아, 벡터 유사도 검색을 통해 정확한 명칭으로 교정합니다.
     */
    async refineQuery(analysis: MovieQueryAnalysisResult): Promise<MovieQueryAnalysisResult> {
        
        // 원본 객체 복사 (불변성 유지)
        const refined = JSON.parse(JSON.stringify(analysis)) as MovieQueryAnalysisResult;
        const { keywords } = refined;

        // [NEW] 교정 내역을 담을 배열 초기화
        refined.correctedKeywords = [];

        // 헬퍼 함수: 교정 실행 및 기록 저장
        const processCorrection = async (collection: string, value: string) => {
            const corrected = await this.searchAndCorrect(collection, value);
            if (corrected !== value) {
                // 값이 바뀌었으면 기록 (예: 주디훈 -> 주지훈)
                refined.correctedKeywords?.push({ original: value, corrected: corrected });
            }
            return corrected;
        };
        
        // 1. 배우 이름 교정
        if (keywords.actors && keywords.actors.length > 0) {
            keywords.actors = await Promise.all(
                keywords.actors.map((actor) => processCorrection('movies_actors', actor))
            );
        }

        // 2. 감독 이름 교정
        if (keywords.directors && keywords.directors.length > 0) {
            keywords.directors = await Promise.all(
                keywords.directors.map((director) => processCorrection('movies_director', director))
            );
        }

        // 3. 장르 교정
        if (keywords.genres && keywords.genres.length > 0) {
            keywords.genres = await Promise.all(
                keywords.genres.map((genre) => processCorrection('movies_genres', genre))
            );
        }

        this.logger.log(`교정 완료: ${JSON.stringify(refined.keywords)}`);
        return refined;
    }

    /**
     * 실제 ChromaDB 검색 로직
     * @param collectionName 검색할 컬렉션 이름
     * @param rawQuery 사용자가 입력한 날것의 키워드
     */
// src/query-refinement/query-refinement.service.ts

// ... (위쪽 코드는 동일)

    private async searchAndCorrect(
        collectionName: string,
        rawQuery: string,
    ): Promise<string> {
        const collection = this.collections.get(collectionName);

        if (!collection) {
        return rawQuery;
        }

        try {
        const results = await collection.query({
            queryTexts: [rawQuery],
            nResults: 1, 
            include: ['documents', 'distances'] as any,
        });

        const hasDocuments =
            results.documents &&
            results.documents.length > 0 &&
            results.documents[0].length > 0;
        
        const hasDistances =
            results.distances &&
            results.distances.length > 0 &&
            results.distances[0].length > 0;

        if (!hasDocuments || !hasDistances) {
            return rawQuery;
        }

        const foundItem = results.documents[0][0];
        // 안전하게 null 체크 (null이면 1로 처리)
        const distance = results.distances[0][0] ?? 1;

        // [수정 포인트] 기준값을 0.6 -> 0.8로 완화했습니다.
        // 이제 거리 0.68인 '머동석'도 통과됩니다.
        const THRESHOLD = 0.99; 

        if (foundItem && distance < THRESHOLD) {
            if (foundItem !== rawQuery) {
            this.logger.log(
                `🔧 오타 수정 [${collectionName}]: "${rawQuery}" -> "${foundItem}" (거리: ${distance.toFixed(4)})`,
            );
            }
            return foundItem;
        } else {
            // 여전히 거리가 0.8보다 멀면 (완전 엉뚱한 단어면) 교정하지 않음
            this.logger.debug(
            `유사한 결과 없음 [${collectionName}]: "${rawQuery}" (가장 가까운 것: ${foundItem}, 거리: ${distance})`,
            );
            return rawQuery;
        }
        } catch (e) {
        this.logger.error(`ChromaDB 검색 에러 (${collectionName})`, e);
        return rawQuery;
        }
    }
}