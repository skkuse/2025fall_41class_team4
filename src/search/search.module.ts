import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; 
import { ConfigModule } from '@nestjs/config';
import { MovieSearchService } from './movie-search.service';
import { PerformanceSearchService } from './performance-search.service';

@Module({
  imports: [
    HttpModule,   
    ConfigModule  
  ],
  providers: [
    MovieSearchService, 
    PerformanceSearchService
  ],
  exports: [
    MovieSearchService, 
    PerformanceSearchService
  ]
})
export class SearchModule {}