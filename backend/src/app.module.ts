import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { QueryAnalysisModule } from './query-analysis/query-analysis.module';
import { QueryRefinementModule } from './query-refinement/query-refinement.module';
import { SearchModule } from './search/search.module';
import { LlmResponseModule } from './llm-response/llm-response.module';
import { BoxOfficeModule } from './boxoffice/boxoffice.module';
import { MoviesModule } from './movies/movies.module'; // 👈 추가

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ChatModule,
    QueryAnalysisModule,
    QueryRefinementModule,
    SearchModule,
    LlmResponseModule,
    BoxOfficeModule,
    MoviesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}