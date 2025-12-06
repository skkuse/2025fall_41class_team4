import { Module } from '@nestjs/common';
import { MovieQueryAnalysisService } from './movie-query-analysis.service';
import { PerformanceQueryAnalysisService } from './performance-query-analysis.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [MovieQueryAnalysisService, PerformanceQueryAnalysisService],
  exports: [MovieQueryAnalysisService, PerformanceQueryAnalysisService],
})
export class QueryAnalysisModule {}