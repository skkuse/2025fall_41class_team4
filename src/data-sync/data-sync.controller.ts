import { Controller, Get } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';

@Controller('data-sync')
export class DataSyncController {
    constructor(private readonly dataSyncService: DataSyncService) {}

    @Get('sync-manual')
    manualSync() {
        this.dataSyncService.syncMovieWithDb();
        return "수동 동기화 작업을 시작했습니다. 서버 로그를 확인해주세요.";
    }
}
