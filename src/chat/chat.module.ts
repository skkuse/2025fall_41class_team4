import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { QueryAnalysisModule } from '../query-analysis/query-analysis.module';
import { QueryRefinementModule } from '../query-refinement/query-refinement.module'; // (파일경로 확인 필요)
import { TmdbClientModule } from '../tmdb-client/tmdb-client.module'; // (파일경로 확인 필요)
import { LlmResponseModule } from '../llm-response/llm-response.module'; // (파일경로 확인 필요)

@Module({
  imports: [
    QueryAnalysisModule, 
    QueryRefinementModule, 
    TmdbClientModule, 
    LlmResponseModule
  ], 
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}