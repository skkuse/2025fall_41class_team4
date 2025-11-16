// src/chroma/chroma.service.ts (예시)

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
import { QueryAnalysisService, QueryComponents } from 'src/query-analysis/query-analysis.service';

    @Injectable()
    export class ChatService implements OnModuleInit {
    private client: ChromaClient;
    private readonly openai_key: string;
    private collections: Map<string, Collection> = new Map();
    private embedder: OpenAIEmbeddingFunction;

    constructor(private configService: ConfigService, private queryAnalysisService: QueryAnalysisService) {

        const key = this.configService.get<string>('OPENAI_API_KEY');

        if (!key) {
            throw new Error('OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
        }

        this.openai_key = key;

        // 1. ChromaClient 초기화 (서버 주소로 접속)
        this.client = new ChromaClient({
            path: 'http://localhost:8000', // 1단계에서 실행한 서버 주소
        });

        this.embedder = new OpenAIEmbeddingFunction({
            modelName: 'text-embedding-3-small',
            apiKey: this.openai_key,
        });
    }
    
    async onModuleInit() {
        try {
        // 3. 컬렉션 가져오기
            const collectionNames = ['movies_overview', 'movies_title', 'movies_director', 'movies_actors'];

            for (const name of collectionNames) {
                const collection = await this.client.getCollection({
                    name: name,
                    embeddingFunction: this.embedder,
                });
                this.collections.set(name, collection);
                console.log(
                    `'${name}' 컬렉션 연결 성공! (총 ${await collection.count()}개 데이터)`,
                );
            }

        } catch (e) {
        console.error(`오류: 컬렉션을 가져오는 데 실패했습니다.`, e);
        console.log('ChromaDB 서버가 실행 중인지 확인하세요 (chroma run ...).');
        }
    }



    async queryMovie(question: string, nResults = 3) {

        console.log('--- 1차 LLM: 쿼리 분석 시작 ---');
        const queryComponents: QueryComponents = await this.queryAnalysisService.analyzeQuery(question);
        
        console.log('LLM 쿼리 분석 결과:', JSON.stringify(queryComponents, null, 2));

        const targetCollection = this.collections.get(queryComponents.collection);
        console.log('targetCollection:', targetCollection);

        if (!targetCollection) {
            throw new Error('적절한 컬렉션을 찾을 수 없습니다.');
        }

        const results = await targetCollection.query({
            queryTexts: [queryComponents.query],
            where: queryComponents.filter,
            nResults: nResults,
            include: ['metadatas', 'documents', 'distances'],
        });

        console.log('\n--- 쿼리 결과 ---');
        if (!results.ids[0] || results.ids[0].length === 0) {
            console.log('검색된 결과가 없습니다.');
            return null;
        }

        const prettyResults = {
            distances: results.distances[0],
            metadatas: results.metadatas[0],
            documents: results.documents[0],
        };

        console.log(JSON.stringify(prettyResults, null, 2));
        return prettyResults;
    }

        // const context = {};

        // return context
    }
