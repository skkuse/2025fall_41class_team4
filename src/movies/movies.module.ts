import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // // 외부 API 호출 도구
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';

@Module({
    imports: [HttpModule], // HttpModule을 imports 배열에 추가
    providers: [MoviesService], // Module의 안내데스크
    controllers: [MoviesController], // Module의 실세
})
export class MoviesModule {}
