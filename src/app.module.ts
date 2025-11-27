import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { QueryAnalysisModule } from './query-analysis/query-analysis.module';
import { QueryRefinementModule } from './query-refinement/query-refinement.module';
import { TmdbClientModule } from './tmdb-client/tmdb-client.module';
import { LlmResponseModule } from './llm-response/llm-response.module';

@Module({
    imports: [ConfigModule.forRoot({
      isGlobal: true, // 전역 설정
    }), 

    ChatModule,
    QueryAnalysisModule,
    QueryRefinementModule,
    TmdbClientModule,
    LlmResponseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
