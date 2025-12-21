import { Injectable, Logger } from '@nestjs/common';
import { ChatRequestDto, ChatCategory } from './dto/chat-request.dto';

import { MovieQueryAnalysisService } from '../query-analysis/movie-query-analysis.service';
import { QueryRefinementService } from '../query-refinement/query-refinement.service';
import { MovieSearchService } from '../search/movie-search.service';
import { MovieLlmResponseService } from '../llm-response/movie-llm-response.service';

import { PerformanceQueryAnalysisService } from '../query-analysis/performance-query-analysis.service';
import { PerformanceSearchService } from '../search/performance-search.service';
import { PerformanceLlmResponseService } from '../llm-response/performance-llm-response.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        private readonly movieAnalysisService: MovieQueryAnalysisService,
        private readonly refinementService: QueryRefinementService,
        private readonly movieSearchService: MovieSearchService,
        private readonly movieLlmResponseService: MovieLlmResponseService,

        private readonly performanceAnalysisService: PerformanceQueryAnalysisService,
        private readonly performanceSearchService: PerformanceSearchService,
        private readonly performanceLlmResponseService: PerformanceLlmResponseService,
    ) {}

    async handleChat(dto: ChatRequestDto) {
        const { category, question, history } = dto;
        
        
        try {
        if (category === ChatCategory.MOVIE) {
            this.logger.log('🎬 영화 파이프라인 시작');

            // 1. 분석
            const analysis = await this.movieAnalysisService.analyzeQuery(question);

            // 2. 정제
            const refinedAnalysis = await this.refinementService.refineQuery(analysis);

            // 3. 검색 (TMDB)
            const movies = await this.movieSearchService.search(refinedAnalysis);

            // 4. 답변 생성
            const response = await this.movieLlmResponseService.generateAnswer(question, movies, refinedAnalysis, history);

            return {
            category,
            question,
            answer: response.answer,
            items: response.items, // 영화 카드 리스트
            };
        } 
        
        else {
            this.logger.log('🎭 공연 파이프라인 시작');

            // 1. 분석
            const analysis = await this.performanceAnalysisService.analyzeQuery(question);

            // 2. RAG 검색
            const performances = await this.performanceSearchService.search(analysis);

            // 3. 답변 생성
            const response = await this.performanceLlmResponseService.generateAnswer(question, performances, history);

            return {
                category,
                question,
                answer: response.answer,
                items: response.items,
            };
        }

        } catch (error) {
        this.logger.error(`Chat Processing Error [${category}]`, error);
        throw error;
        }
    }
}