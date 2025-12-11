import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  // 장르 매핑 (MovieSearchService와 동일)
  private readonly genreMap: Record<string, number> = {
    'SF': 878,
    '로맨스': 10749,
    '액션': 28,
    '스릴러': 53,
    '코미디': 35,
    '드라마': 18,
    '판타지': 14,
    '공포': 27,
    '애니메이션': 16,
    '범죄': 80,
    '미스터리': 9648,
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('TMDB_API_KEY');
    if (!key) {
      throw new Error('TMDB_API_KEY가 .env 파일에 설정되지 않았습니다.');
    }
    this.apiKey = key;
  }

  // 필터 옵션 반환
  async getFilterOptions() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

    return {
      genres: Object.keys(this.genreMap),
      years,
      ratings: ['9', '8', '7', '6', '5'],
    };
  }

  // 영화 검색
  async searchMovies(params: {
    query?: string;
    genre?: string;
    year?: string;
    rating?: string;
    sortBy: string;
    page: number;
    limit: number;
  }) {
    const { query, genre, year, rating, sortBy, page, limit } = params;

    try {
      let url = `${this.baseUrl}/discover/movie`;
      const tmdbParams: any = {
        api_key: this.apiKey,
        language: 'ko-KR',
        page,
        include_adult: false,
      };

      // 검색어가 있으면 search API 사용
      if (query) {
        url = `${this.baseUrl}/search/movie`;
        tmdbParams.query = query;
      }

      // 정렬
      if (sortBy === 'latest') {
        tmdbParams.sort_by = 'release_date.desc';
      } else if (sortBy === 'rating') {
        tmdbParams.sort_by = 'vote_average.desc';
        tmdbParams['vote_count.gte'] = 100;
      } else {
        tmdbParams.sort_by = 'popularity.desc';
      }

      // 개봉연도
      if (year && year !== '전체') {
        tmdbParams.primary_release_year = year;
      }

      // 평점
      if (rating && rating !== '전체') {
        tmdbParams['vote_average.gte'] = rating;
      }

      // 장르
      if (genre && genre !== '전체') {
        const genreId = this.genreMap[genre];
        if (genreId) {
          tmdbParams.with_genres = genreId;
        }
      }

      const response = await firstValueFrom(
        this.httpService.get(url, { params: tmdbParams }),
      );

      const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
      const movies = response.data.results.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '',
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        genres: this.mapGenreIds(movie.genre_ids || []),
        overview: movie.overview || '줄거리 정보 없음',
      }));

      this.logger.log(`✅ 영화 검색 완료: ${movies.length}개 발견`);

      return {
        movies: movies.slice(0, limit),
        total: response.data.total_results,
        page,
        totalPages: Math.ceil(response.data.total_results / limit),
      };
    } catch (error) {
      this.logger.error('TMDB API 호출 실패', error);
      return {
        movies: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  // 장르 ID → 한글 이름
  private mapGenreIds(genreIds: number[]): string[] {
    const reverseMap: Record<number, string> = {
      28: '액션',
      12: '모험',
      16: '애니메이션',
      35: '코미디',
      80: '범죄',
      99: '다큐멘터리',
      18: '드라마',
      10751: '가족',
      14: '판타지',
      36: '역사',
      27: '공포',
      10402: '음악',
      9648: '미스터리',
      10749: '로맨스',
      878: 'SF',
      53: '스릴러',
    };

    return genreIds
      .map((id) => reverseMap[id])
      .filter(Boolean)
      .slice(0, 3);
  }
}