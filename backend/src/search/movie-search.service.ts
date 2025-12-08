import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MovieQueryAnalysisResult } from '../query-analysis/movie-query-analysis.service';

export interface MovieData {
    id: number;
    title: string;
    overview: string;
    release_date: string;
    vote_average: number;
    poster_url: string;
    }

    @Injectable()
    export class MovieSearchService {
    private readonly tmdbApiKey: string;
    private readonly baseUrl = 'https://api.themoviedb.org/3';
    private readonly logger = new Logger(MovieSearchService.name);

    // 장르 ID 매핑
    private readonly genreMap: Record<string, number> = {
        '액션': 28, '모험': 12, '애니메이션': 16, '코미디': 35,
        '범죄': 80, '다큐멘터리': 99, '드라마': 18, '가족': 10751,
        '판타지': 14, '역사': 36, '공포': 27, '음악': 10402,
        '미스터리': 9648, '로맨스': 10749, 'SF': 878, 'TV 영화': 10770,
        '스릴러': 53, '전쟁': 10752, '서부': 37
    };

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const key = this.configService.get<string>('TMDB_API_KEY');
        if (!key) throw new Error('TMDB_API_KEY가 설정되지 않았습니다.');
        this.tmdbApiKey = key;
    }

    /**
     * [메인 메서드] 의도(Intent)에 따라 검색 전략을 분기합니다.
     */
    async search(analysis: MovieQueryAnalysisResult): Promise<MovieData[]> {
        const { intent, keywords } = analysis;
        this.logger.log(`🎬 검색 전략 실행: [${intent}]`);

        try {
        switch (intent) {
            case 'exact_search':
            return await this.handleExactSearch(keywords);
            
            case 'recommendation_search':
            return await this.handleRecommendationSearch(keywords);
            
            case 'condition_search':
            return await this.handleConditionSearch(keywords);
            
            default:
            this.logger.warn('알 수 없는 의도입니다. 기본값으로 조건 검색을 수행합니다.');
            return await this.handleConditionSearch(keywords);
        }
        } catch (error) {
            this.logger.error(`검색 중 오류 발생 (${intent})`, error);
        return [];
        }
    }

    // =================================================================
    // 1. Exact Search (완전 검색)
    // =================================================================
    private async handleExactSearch(keywords: MovieQueryAnalysisResult['keywords']): Promise<MovieData[]> {
        // 1-1. 제목이 있으면 제목으로 검색 (/search/movie)
        if (keywords.title) {
            this.logger.log(`검색어(제목)로 찾기: ${keywords.title}`);
            return this.searchByKeyword(keywords.title);
        }

        const personNames = [...keywords.actors, ...keywords.directors];
        if (personNames.length > 0) {
            this.logger.log(`인물로 대표작 찾기: ${personNames[0]}`);
            // condition search 로직을 재활용하되, 인물 필터만 걸어서 호출
            return this.handleConditionSearch(keywords);
        }

        return [];
    }

    // =================================================================
    // 2. Recommendation Search (추천 검색)
    // =================================================================
    private async handleRecommendationSearch(keywords: MovieQueryAnalysisResult['keywords']): Promise<MovieData[]> {
        const targetTitle = keywords.title;

        if (!targetTitle) {
        this.logger.warn('추천 검색에는 영화 제목이 필수입니다.');
        return [];
        }

        // 2-1. 기준이 될 영화의 ID를 먼저 찾습니다.
        const searchResult = await this.searchByKeyword(targetTitle);
        
        if (searchResult.length === 0) {
            this.logger.warn(`추천 기준 영화를 찾을 수 없습니다: ${targetTitle}`);
            return [];
        }

        const targetMovieId = searchResult[0].id; // 가장 정확도 높은 첫 번째 영화 선택
        this.logger.log(`'${targetTitle}'(ID: ${targetMovieId})와 유사한 영화 추천 요청`);

        // 2-2. 추천 API 호출 (/movie/{movie_id}/recommendations)
        try {
        const response = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/movie/${targetMovieId}/recommendations`, {
            params: {
                api_key: this.tmdbApiKey,
                language: 'ko-KR',
                page: 1
            }
            })
        );
        return this.formatMovies(response.data.results.slice(0, 10));
        } catch (e) {
        this.logger.error(`추천 API 호출 실패`, e);
        return [];
        }
    }

    // =================================================================
    // 3. Condition Search (조건 검색)
    // =================================================================
    private async handleConditionSearch(keywords: MovieQueryAnalysisResult['keywords']): Promise<MovieData[]> {
        this.logger.log(`조건 검색 시작: 배우(${keywords.actors}), 장르(${keywords.genres})`);

        // 3-1. ID 변환 (병렬 처리)
        const [actorIds, directorIds] = await Promise.all([
        this.getPersonIds(keywords.actors),
        this.getPersonIds(keywords.directors)
        ]);

        // 3-2. 장르 ID 변환
        const genreIds = keywords.genres
        .map(g => this.genreMap[g] || this.genreMap[g.replace('영화', '').trim()])
        .filter(id => id !== undefined);

        // 3-3. 파라미터 구성 (Discover API)
        const params: any = {
            api_key: this.tmdbApiKey,
            language: 'ko-KR',
            sort_by: 'popularity.desc',
            page: 1,
            include_adult: false,
        };

        // AND 조건처럼 동작하게 하기 위해 파라미터 추가
        if (actorIds.length > 0) params.with_cast = actorIds.join(','); 
        if (directorIds.length > 0) params.with_crew = directorIds.join(',');
        if (genreIds.length > 0) params.with_genres = genreIds.join(',');

        try {
        const response = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/discover/movie`, { params })
        );
        return this.formatMovies(response.data.results.slice(0, 10));
        } catch (e) {
            this.logger.error(`조건 검색(Discover) 실패`, e);
            return [];
        }
    }


    // =================================================================
    // [Helper] 공통 유틸리티 메서드
    // =================================================================

    // 단순 키워드(제목) 검색
    private async searchByKeyword(query: string): Promise<MovieData[]> {
        try {
        const response = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/search/movie`, {
            params: {
                api_key: this.tmdbApiKey,
                language: 'ko-KR',
                query: query,
                page: 1
            }
            })
        );
        return this.formatMovies(response.data.results.slice(0, 10));
        } catch (e) {
        this.logger.error(`키워드 검색 실패: ${query}`, e);
        return [];
        }
    }

    // 인물 이름 -> ID 변환
    private async getPersonIds(names: string[]): Promise<string[]> {
        if (!names || names.length === 0) return [];
        
        const ids = await Promise.all(names.map(async (name) => {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/search/person`, {
                    params: {
                    api_key: this.tmdbApiKey,
                    query: name,
                    language: 'ko-KR'
                    }
                })
            );
            if (response.data.results.length > 0) {
            return response.data.results[0].id.toString();
            }
        } catch {
            return null;
        }
        return null;
        }));
        
        return ids.filter((id) => id !== null) as string[];
    }

    // 데이터 포맷팅
    private formatMovies(rawMovies: any[]): MovieData[] {
        const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

        // 제외할 언어
        const EXCLUDED_LANGS = ['zh', 'hi', 'kn'];

        // 최종 반환 개수
        const FINAL_COUNT = 5;

        const formattedMovies = rawMovies
        .filter(movie => !EXCLUDED_LANGS.includes(movie.original_language))            
        .map(movie => ({
            id: movie.id,
            title: movie.title,
            orginal_language: movie.original_language,
            overview: movie.overview || '줄거리 정보 없음',
            release_date: movie.release_date || '미정',
            vote_average: movie.vote_average,
            poster_url: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '',
        })).slice(0, FINAL_COUNT);

        return formattedMovies;
    }
}