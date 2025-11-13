// src/chroma/chroma.service.ts (예시)

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';

    @Injectable()
    export class ChatService implements OnModuleInit {
    private client: ChromaClient;
    private collection: Collection;
    private readonly openai_key: string;

    constructor(private configService: ConfigService) {
        const key = this.configService.get<string>('OPENAI_API_KEY');
        if (!key) {
        throw new Error('OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
        }

        this.openai_key = key;

        // 1. ChromaClient 초기화 (서버 주소로 접속)
        this.client = new ChromaClient({
        path: 'http://localhost:8000', // 1단계에서 실행한 서버 주소
        });
    }

    async onModuleInit() {
        try {
        // 2. Python과 동일한 임베딩 함수 설정
        const embedder = new OpenAIEmbeddingFunction({
            modelName: 'text-embedding-3-small',
            apiKey: this.openai_key,
        });

        // 3. 컬렉션 가져오기
        this.collection = await this.client.getCollection({
            name: 'movies_overview',
            embeddingFunction: embedder,
        });

        console.log(
            `'movies_overview' 컬렉션 연결 성공! (총 ${await this.collection.count()}개 데이터)`,
        );
        } catch (e) {
        console.error(
            `오류: 'movies_overview' 컬렉션을 가져오는 데 실패했습니다.`,
            e,
        );
        console.log('ChromaDB 서버가 실행 중인지 확인하세요 (chroma run ...).');
        }
    }

    // 4. RAG 검색 (Retrieval) 메소드
    async queryMovie(question: string, nResults = 3) {
        if (!this.collection) {
        throw new Error('컬렉션이 초기화되지 않았습니다.');
        }

        console.log(`\n--- 테스트 쿼리 실행: "${question}" ---`);
        
        const results = await this.collection.query({
        queryTexts: [question],
        nResults: nResults,
        include: ['metadatas', 'documents', 'distances'],
        });

        console.log('\n--- 쿼리 결과 ---');
        if (!results.ids[0] || results.ids[0].length === 0) {
        console.log('검색된 결과가 없습니다.');
        return null;
        }

        // Python 스크립트와 유사한 형태로 결과 반환 (필요시 가공)
        const prettyResults = {
        distances: results.distances[0],
        metadatas: results.metadatas[0],
        documents: results.documents[0], // documents도 포함하는 것이 좋습니다.
        };

        console.log(JSON.stringify(prettyResults, null, 2));
        return prettyResults;
    }
}