import { Controller, Get, Query, Logger } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  private readonly logger = new Logger(MoviesController.name);

  constructor(private readonly moviesService: MoviesService) {}

  @Get('filters')
  async getFilters() {
    this.logger.log('📋 필터 옵션 조회 요청');
    return this.moviesService.getFilterOptions();
  }

  @Get('search')
  async searchMovies(
    @Query('query') query?: string,
    @Query('genre') genre?: string,
    @Query('year') year?: string,
    @Query('rating') rating?: string,
    @Query('sortBy') sortBy: string = 'popularity',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '6',
  ) {
    this.logger.log(`🔍 영화 검색: query=${query}, genre=${genre}, year=${year}`);
    
    return this.moviesService.searchMovies({
      query,
      genre,
      year,
      rating,
      sortBy,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }
}