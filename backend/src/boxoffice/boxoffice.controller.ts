import { Controller, Get } from '@nestjs/common';
import { BoxOfficeService } from './boxoffice.service';

@Controller('boxoffice')
export class BoxOfficeController {
    constructor(private readonly boxOfficeService: BoxOfficeService) {}

    @Get()
    async getRank() {
        return this.boxOfficeService.getDailyRank();
    }
}