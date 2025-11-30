import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MovieLlmResponseService } from './movie-llm-response.service';
import { PerformanceLlmResponseService } from './performance-llm-response.service';

@Module({
    imports: [ConfigModule],
    providers: [MovieLlmResponseService, PerformanceLlmResponseService],
    exports: [MovieLlmResponseService, PerformanceLlmResponseService],
})
export class LlmResponseModule {}