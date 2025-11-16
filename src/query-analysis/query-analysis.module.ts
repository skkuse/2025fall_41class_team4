import { Module } from '@nestjs/common';
import { QueryAnalysisService } from './query-analysis.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [QueryAnalysisService],
  exports: [QueryAnalysisService],
})
export class QueryAnalysisModule {}