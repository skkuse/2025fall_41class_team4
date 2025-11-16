import { Controller, Get, Param } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) {}

    @Get(':id')
    findOne(@Param('id') movieId: string){
        return this.moviesService.findMovieById(movieId);
    }
}
