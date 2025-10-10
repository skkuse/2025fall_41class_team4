import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { MoviesService } from 'src/movies/movies.service'; // MoviesService 임포트
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataSyncService {
    private readonly logger = new Logger(DataSyncService.name);
    private chromaClient: ChromaClient;
    private chromaCollection: any;

    constructor(
        private readonly moviesService: MoviesService, // MoviesService 주입
        private readonly httpService: HttpService
    ) {
        this.chromaClient = new ChromaClient({path: 'http://localhost:8000'});
        this.initializeChroma();
    }

    private async initializeChroma() {
        const embedder = new OpenAIEmbeddingFunction({
            apiKey: process.env.OPENAI_API_KEY || '',
            modelName: 'text-embedding-3-small'
        });
        this.chromaCollection = await this.chromaClient.getOrCreateCollection({
            name: 'movies',
            embeddingFunction: embedder,
        });
        this.logger.log('ChromaDB 컬렉션이 초기화되었습니다.');
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'syncDailyMovies', timeZone: 'Asia/Seoul' })
    async syncMovieWithDb() {
        this.logger.debug('일별 영화 정보 동기화 작업 시작');
        const dailyBoxOfficeList = await this.fetchDailyBoxOffice();

        if (!dailyBoxOfficeList || dailyBoxOfficeList.length === 0) {
            this.logger.warn('KOBIS에서 박스오피스 정보를 가져오지 못했습니다. 작업을 중단합니다.');
            return;
        }

        for (const boxOfficeMovie of dailyBoxOfficeList) {
            try {
                const fullMovieData = await this.moviesService.findMovieById(boxOfficeMovie.movieCd);

                if (!fullMovieData || !fullMovieData.overview) {
                    this.logger.warn(`[${fullMovieData?.title}] 줄거리 정보가 없어 DB에 추가하지 않습니다.`);
                    continue;
                }
                
                await this.chromaCollection.upsert({
                    ids: [fullMovieData.id],
                    embeddings: [fullMovieData.overview],
                    metadatas: [{
                    title: fullMovieData.title,
                    posterUrl: fullMovieData.posterUrl,
                    releaseDate: fullMovieData.releaseDate,
                    rating: fullMovieData.rating,
                    overview: fullMovieData.overview,
                }],
            });

            this.logger.log(`[${fullMovieData.title}] 영화 정보가 DB에 저장/업데이트되었습니다.`);
        } catch (error) {
            this.logger.error(`[${boxOfficeMovie.movieNm}] 처리 중 에러 발생:`, error.message);
        }
        }
        this.logger.debug('일별 영화 정보 동기화 작업 완료');
    }


    private async fetchDailyBoxOffice(): Promise<any[]> {
        const apiKey = process.env.KOBIS;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const targetDt = yesterday.toISOString().slice(0,10).replace(/-/g, '');

        const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${apiKey}&targetDt=${targetDt}`;

        try {
        const response = await firstValueFrom(this.httpService.get(url));
        return response.data.boxOfficeResult.dailyBoxOfficeList || [];
        } catch (error) {
        this.logger.error('KOBIS 박스오피스 API 호출 에러:', error.message);
        return [];
        }
    }
}
