import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

// 하위 모듈 Import
import { QueryAnalysisModule } from '../query-analysis/query-analysis.module';
import { QueryRefinementModule } from '../query-refinement/query-refinement.module';
import { SearchModule } from '../search/search.module';
import { LlmResponseModule } from '../llm-response/llm-response.module';

@Module({
  imports: [
    QueryAnalysisModule, 
    QueryRefinementModule, 
    SearchModule, 
    LlmResponseModule
  ], 
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}