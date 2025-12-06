import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BoxOfficeController } from './boxoffice.controller';
import { BoxOfficeService } from './boxoffice.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [BoxOfficeController],
  providers: [BoxOfficeService],
})
export class BoxOfficeModule {}