import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ChatModule } from './chat/chat.module';
import { QueryAnalysisModule } from './query-analysis/query-analysis.module';
import { QueryRefinementModule } from './query-refinement/query-refinement.module';
import { SearchModule } from './search/search.module';
import { LlmResponseModule } from './llm-response/llm-response.module';
import { BoxOfficeModule } from './boxoffice/boxoffice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'), 
    }),
    
    ChatModule,            
    QueryAnalysisModule,   
    QueryRefinementModule, 
    SearchModule,          
    LlmResponseModule, 
    BoxOfficeModule      
  ],
  // controllers: [AppController],
  providers: [AppService], 
})
export class AppModule {}