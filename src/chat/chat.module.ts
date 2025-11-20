import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { QueryAnalysisModule } from '../query-analysis/query-analysis.module'; // 👈 1. QueryAnalysisModule 임포트

@Module({
  imports: [QueryAnalysisModule], // 👈 2. QueryAnalysisModule 등록
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}