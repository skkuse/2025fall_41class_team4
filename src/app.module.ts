import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MoviesModule } from './movies/movies.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './chat/chat.module';
import { QueryAnalysisModule } from './query-analysis/query-analysis.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, // 전역 설정
  }), 
  ScheduleModule.forRoot(),
  MoviesModule,
  ChatModule,
  QueryAnalysisModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
