import { Module } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';
import { DataSyncController } from './data-sync.controller';
import { HttpModule } from '@nestjs/axios';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [HttpModule, MoviesModule],
  providers: [DataSyncService],
  controllers: [DataSyncController]
})
export class DataSyncModule {}
