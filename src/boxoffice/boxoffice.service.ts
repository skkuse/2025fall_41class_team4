import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BoxOfficeService {
    private readonly logger = new Logger(BoxOfficeService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
    const key = this.configService.get<string>('KOBIS_API_KEY');

    if (!key) {
        throw new Error('KOBIS_API_KEY가 .env 파일에 설정되지 않았습니다.');
    }

        this.apiKey = key; // 이제 TypeScript는 'key'가 무조건 string임을 알게 됩니다.
    }

    async getDailyRank() {
        // 1. 어제 날짜 구하기 (KOBIS는 오늘 데이터가 아직 안 나옴)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // YYYYMMDD 포맷으로 변환
        const targetDt = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

        this.logger.log(`📊 박스오피스 조회 요청: ${targetDt}`);

        try {
        const response = await firstValueFrom(
            this.httpService.get(this.baseUrl, {
            params: {
                key: this.apiKey,
                targetDt: targetDt,
            },
            })
        );

        // 필요한 정보만 추려서 반환
        const rawList = response.data.boxOfficeResult.dailyBoxOfficeList;
        return rawList.map((item) => ({
            rank: item.rank,
            title: item.movieNm,
            openDt: item.openDt,
            audiAcc: item.audiAcc, // 누적 관객수
            rankInten: item.rankInten, // 전일 대비 순위 변동
        }));

        } catch (error) {
        this.logger.error('KOBIS API 호출 실패', error);
        return [];
        }
    }
}