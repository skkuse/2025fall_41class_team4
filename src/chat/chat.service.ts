// src/chroma/chroma.service.ts (예시)
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QueryAnalysisService } from 'src/query-analysis/query-analysis.service';
import { QueryRefinementService } from 'src/query-refinement/query-refinement.service';
import { TmdbClientService } from 'src/tmdb-client/tmdb-client.service';
import { LlmResponseService } from 'src/llm-response/llm-response.service';

@Injectable()
export class ChatService {
    constructor(
        private readonly analysisService: QueryAnalysisService,
        private readonly refinementService: QueryRefinementService,
        private readonly movieSearchService: TmdbClientService,
        private readonly llmResponseService: LlmResponseService, 
    ) {}

    async handleChat(userQuestion: string) {
        // 1. 분석
        const analysis = await this.analysisService.analyzeQuery(userQuestion);

        // 2. 정제 (오타 수정)
        const refinedAnalysis = await this.refinementService.refineQuery(analysis);

        // 3. 검색 (TMDB)
        const movies = await this.movieSearchService.searchMovies(refinedAnalysis);

        // 4. 답변 생성 (LLM)
        const finalAnswer = await this.llmResponseService.generateAnswer(userQuestion, movies);

        // 5. 결과 반환 (프론트엔드로)
        return {
            question: userQuestion,
            answer: finalAnswer,
            movies: movies // 원본 데이터도 같이 주면 프론트에서 포스터 띄우기 좋음
        };
    }
}