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
    tagline?: string;
    review?: string;
    keywords?: string[];
    director?: string;
    actors?: string[];
    release_status: string;
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
        '스릴러': 53, '전쟁': 10752, '서부': 37, '뮤지컬': 10402, '멜로': 10749, '공상과학': 878,
        '사이파이': 878,    // SF
        '호러': 27,        // 공포
        '서스펜스': 53,     // 스릴러
        '느와르': 80,       // 범죄
        '시대극': 36,       // 역사
        '사극': 36,        // 역사
        '다큐': 99,         // 다큐멘터리
        '애니': 16,         // 애니메이션
        '만화': 16          // 애니메이션
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

        let basicResults: MovieData[] = [];

        if (keywords.timeframe === 'current') {
            // (A) 장르 조건이 있다면? -> Discover API로 "날짜 + 장르" 검색
            if (keywords.genres && keywords.genres.length > 0) {
                this.logger.log(`🎬 현재 상영중인 [${keywords.genres.join(', ')}] 영화 검색`);
                return await this.searchNowPlayingWithGenre(keywords.genres);
            }
            // (B) 장르 조건이 없다면? -> 그냥 Now Playing 호출
            this.logger.log(`🎬 현재 상영작(장르 무관) 검색 실행`);
            return await this.fetchMoviesByEndpoint('/movie/now_playing');
        }
        
        if (keywords.timeframe === 'upcoming') {
            this.logger.log(`🎬 개봉 예정작 검색 실행`);
            return await this.fetchMoviesByEndpoint('/movie/upcoming');
        }

        try {
        switch (intent) {
            case 'exact_search':
            basicResults = await this.handleExactSearch(keywords); break;
            case 'recommendation_search':
            basicResults = await this.handleRecommendationSearch(keywords);
            break;
            case 'condition_search':
            basicResults = await this.handleConditionSearch(keywords);
            break;
            default:
            basicResults = await this.handleConditionSearch(keywords);
            break;
        }
        
        // [NEW] 검색된 기본 결과(최대 5개)에 대해 상세 정보(리뷰, 태그라인)를 채워 넣음
        if (basicResults.length > 0) {
            this.logger.log(`🔍 상세 데이터(리뷰/태그라인) 조회 시작 (${basicResults.length}개)`);
            return await this.enrichMoviesWithDetails(basicResults);
        }
        
        return [];

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
            // sort_by: 'popularity.desc',
            sort_by: 'vote_count.desc',
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
    // [NEW] 상세 정보 주입 메서드 (병렬 처리)
    // =================================================================
    private async enrichMoviesWithDetails(movies: MovieData[]): Promise<MovieData[]> {
        // Promise.all로 5개의 API를 동시에 호출하여 속도 저하 최소화
        const enriched = await Promise.all(
        movies.map(async (movie) => {
            try {
            // append_to_response를 사용하여 한 번 호출로 리뷰와 키워드를 같이 가져옴
            const { data } = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/movie/${movie.id}`, {
                params: {
                    api_key: this.tmdbApiKey,
                    language: 'ko-KR', // 기본 한국어
                    append_to_response: 'reviews,keywords,credits' // 리뷰, 키워드, 크레딧(감독/배우) 포함
                }
                })
            );

            // 1. Tagline (한줄 소개)
            const tagline = data.tagline || '';

            // 2. Reviews (리뷰) - 한국어 리뷰가 없으면 영어가 섞여 나올 수 있음
            // 너무 긴 리뷰는 잘라내고, 최대 2개까지만 가져옴
            const reviews = (data.reviews?.results || [])
                .slice(0, 2)
                .map((r: any) => {
                const content = r.content.replace(/\r\n/g, ' ').slice(0, 150); // 150자 제한
                return content.length === 150 ? content + '...' : content;
                });

            // 3. Keywords (키워드) - keywords.keywords 구조임
            const keywordList = (data.keywords?.keywords || [])
                .slice(0, 5)
                .map((k: any) => k.name);

            const director = data.credits?.crew?.find((p: any) => p.job === 'Director')?.name || '정보 없음';
            const cast = (data.credits?.cast || []).slice(0, 5).map((p: any) => p.name);

            return {
                ...movie,
                tagline,
                reviews,
                keywords: keywordList,
                director,
                actors: cast
            };
            } catch (e) {
            // 상세 조회 실패해도 기본 정보는 반환
            return movie;
            }
        })
        );

        if (enriched.length > 0) {
            const m = enriched[0];
        }

        return enriched;
    }

    // =================================================================
    // [Helper] 공통 유틸리티 메서드
    // =================================================================

    // 단순 키워드(제목) 검색
    private async searchByKeyword(query: string): Promise<MovieData[]> {
        try {
            const refinedQuery = query === '체인소맨' ? '극장판 체인소 맨: 레제편' : query;

            if (query !== refinedQuery) {
                this.logger.log(`🔧 체인소맨 예외 처리 적용: ${query} -> ${refinedQuery}`);
            }

            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/search/movie`, {
                params: {
                    api_key: this.tmdbApiKey,
                    language: 'ko-KR',
                    query: refinedQuery,
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

    private async fetchMoviesByEndpoint(endpoint: string): Promise<MovieData[]> {
    try {
        const response = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}${endpoint}`, {
                params: {
                api_key: this.tmdbApiKey,
                language: 'ko-KR',
                page: 1,
                region: 'KR' // 한국 개봉 기준 (중요!)
                }
            })
        );    
      // 검색 후 상세 정보(리뷰 등) 채워서 반환
        const formatted = this.formatMovies(response.data.results);
        return await this.enrichMoviesWithDetails(formatted);
        } catch (e) {
            this.logger.error(`${endpoint} 호출 실패`, e);
        return [];
        }
    }

    private async searchNowPlayingWithGenre(genres: string[]): Promise<MovieData[]> {
        // 1. 장르 ID 변환
        const genreIds = genres
            .map(g => this.genreMap[g] || this.genreMap[g.replace('영화', '').trim()])
            .filter(id => id !== undefined);

        // 2. 날짜 범위 계산 (오늘 기준: -45일 ~ +7일 정도를 '상영중'으로 간주)
        // TMDB now_playing API도 보통 이 정도 범위를 사용합니다.
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(today.getDate() - 45); // 한 달 반 전 개봉작까지
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);     // 다음 주 개봉작까지

        const params: any = {
            api_key: this.tmdbApiKey,
            language: 'ko-KR',
            region: 'KR',                  // 한국 개봉 기준
            sort_by: 'popularity.desc',    // 인기순
            include_adult: false,
            page: 1,
            'primary_release_date.gte': this.formatDate(oneMonthAgo), // 개봉일 >= 45일 전
            'primary_release_date.lte': this.formatDate(nextWeek),    // 개봉일 <= 7일 후
            with_release_type: '3',        // 3: 극장 개봉 (Theatrical)
        };

        if (genreIds.length > 0) {
            params.with_genres = genreIds.join(',');
        }

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/discover/movie`, { params })
            );
            const formatted = this.formatMovies(response.data.results);
            return await this.enrichMoviesWithDetails(formatted);
        } catch (e) {
            this.logger.error('장르 포함 상영작 검색 실패', e);
            return [];
        }
    }

    // [NEW] 날짜 포맷팅 (YYYY-MM-DD) 헬퍼
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    // 데이터 포맷팅
    private formatMovies(rawMovies: any[]): MovieData[] {
        const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

        // 제외할 언어
        const EXCLUDED_LANGS = ['zh', 'hi', 'kn'];

        // 최종 반환 개수
        const FINAL_COUNT = 5;

        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(now.getTime() + kstOffset);
        const todayStr = kstDate.toISOString().split('T')[0]; // "2025-12-21"
        const todayTime = new Date(todayStr).getTime(); // 시간 통일을 위해 자정 기준 타임스탬프

        const formattedMovies = rawMovies
        .filter(movie => !EXCLUDED_LANGS.includes(movie.original_language))            
        .map(movie => {
            let status = "정보 없음";
            
            // 2. 개봉일 비교 로직
            if (movie.release_date) {
                const releaseTime = new Date(movie.release_date).getTime();
                const diffMs = releaseTime - todayTime;
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    status = `미개봉 (D-${diffDays})`; // 미래
                } else if (diffDays === 0) {
                    status = `오늘 개봉`; // 당일
                } else {
                    status = `개봉됨 (개봉 ${Math.abs(diffDays)}일차)`; // 과거
                }
            } else {
                status = "개봉일 미정";
            }

            return {
                id: movie.id,
                title: movie.title,
                orginal_language: movie.original_language,
                overview: movie.overview || '줄거리 정보 없음',
                release_date: movie.release_date || '미정',
                vote_average: movie.vote_average,
                poster_url: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '',
                // [NEW] 계산된 상태값 주입
                release_status: status 
            };
        }).slice(0, FINAL_COUNT);

        //this.logger.debug(`✅ [Formatted Output]: ${JSON.stringify(formattedMovies, null, 2)}`);

        return formattedMovies;
    }
}