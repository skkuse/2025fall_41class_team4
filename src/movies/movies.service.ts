import { Injectable, NotFoundException } from '@nestjs/common';
import { Movie } from './dto/movie.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // RxJS의 Observable을 Promise로 변환하기 위한 도구
import { release } from 'os';

@Injectable()
export class MoviesService {
    constructor(private httpService: HttpService) {}

    async findMovieById(movieId: string): Promise<any>{
        const kobisData = await this.fetchMovieFromKobis(movieId); // KOBIS에서 영화 정보 가져오기
        if (!kobisData) {
            throw new NotFoundException(`KOBIS에서 ID가 ${movieId}인 영화를 찾을 수 없습니다.`);
        }

        const koreanTitle = kobisData.movieNm; // KOBIS에서 가져온 영화 제목
        const englishTitle = kobisData.movieNmEn; // KOBIS에서 가져온 영어 제목

        const tmdbData = await this.fetchMovieFromTmdb(koreanTitle, englishTitle); // KOBIS에서 가져온 영화 제목 사용

        if (!tmdbData) {
            console.warn(`TMDB에서 '${koreanTitle}' 또는 '${englishTitle}'에 대한 정보를 찾지 못했습니다. KOBIS 정보만 반환합니다.`);
            
            return {
                id: `kobis-${kobisData.movieCd}`,
                title: kobisData.movieNm,
                releaseDate: kobisData.openDt ? `${kobisData.openDt}` : '',
                overview: '줄거리 정보 없음',
                posterUrl: '',
                rating: 0,
            }
        }

        const movie: Movie = {
            id: `kobis-${kobisData.movieCd}`,
            title: kobisData.movieNm,
            overview: tmdbData.overview,
            posterUrl: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
            releaseDate: kobisData.openDt ? `${kobisData.openDt}` : '',
            rating: tmdbData.vote_average,
        };
        return movie;
    }

    private async fetchMovieFromKobis(movieId: string): Promise<any> {
        const apiKey = process.env.KOBIS;
        const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${apiKey}&movieCd=${movieId}`;

        const response = await firstValueFrom(this.httpService.get(url));
        return response.data.movieInfoResult.movieInfo;
    }

    private async fetchMovieFromTmdb(koreanTitle: string, englishTitle: string): Promise<any> {
        // 1. 먼저 '영문 제목'으로 TMDB를 검색합니다.
        if (englishTitle) {
            const result = await this.searchTmdbByTitle(englishTitle);
            if (result) {
                return result;
            }
        }
        // 2. 영문 제목으로 못 찾았거나, 영문 제목이 없는 경우 '한글 제목'으로 다시 검색합니다.
        return this.searchTmdbByTitle(koreanTitle);
    }

    private async searchTmdbByTitle(movieTitle: string): Promise<any> {
        const apiKey = process.env.TMDB;
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(movieTitle)}`;

        try {
            const response = await firstValueFrom(this.httpService.get(url));
            if (response.data.results && response.data.results.length > 0) {
                return response.data.results[0]; // 검색 결과가 있으면 첫 번째 항목 반환
            }
            return null; // 검색 결과가 없으면 null 반환
            } catch (error) {
            console.error(`TMDB에서 '${movieTitle}' 검색 중 에러 발생:`, error.message);
            return null; // 에러 발생 시에도 null 반환
            }
        }
}
