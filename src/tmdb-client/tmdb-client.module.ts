import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TmdbClientService } from './tmdb-client.service';

@Module({
    imports: [
        HttpModule,   // HTTP 요청을 위한 모듈
        ConfigModule  // API Key 가져오기용
    ],
    providers: [TmdbClientService],
    exports: [TmdbClientService], // ChatService에서 써야 하므로 export
})
export class TmdbClientModule {}