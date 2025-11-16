// src/chroma/chroma.service.ts (예시)

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';

    @Injectable()
    export class ChatService implements OnModuleInit {
    private client: ChromaClient;
    private collections: Map<string, Collection> = new Map();
    private readonly openai_key: string;
    private embedder: OpenAIEmbeddingFunction;

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
        console.error(
            `오류: 컬렉션을 가져오는 데 실패했습니다.`,
            e,
        );
        console.log('ChromaDB 서버가 실행 중인지 확인하세요 (chroma run ...).');
        }
    }

    private getCollectionByQuestion(question: string): Collection | undefined {
        const lowerQuestion = question.toLowerCase();

        if (lowerQuestion.includes('title')) {
            console.log('Title 컬렉션 선택됨.');
            return this.collections.get('movies_title');
        } 
        else if (lowerQuestion.includes('director') || lowerQuestion.includes('감독')) {
            console.log('Director 컬렉션 선택됨.');
            return this.collections.get('movies_director');
        } 
        else if (lowerQuestion.includes('actor') || lowerQuestion.includes('actors') || lowerQuestion.includes('배우') || lowerQuestion.includes('출연')) {
            console.log('Actors 컬렉션 선택됨.');
            return this.collections.get('movies_actors');
        } 
        else {
            console.log('Overview 컬렉션 선택됨.');
            return this.collections.get('movies_overview');
        }
    }   

    async queryMovie(question: string, nResults = 3) {
        const targetCollection = this.getCollectionByQuestion(question);

        if (!targetCollection) {
            throw new Error('적절한 컬렉션을 찾을 수 없습니다.');
        }

        console.log(`\n--- 테스트 쿼리 실행: "${question}" ---`);

        const results = await targetCollection.query({
        queryTexts: [question],
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
}