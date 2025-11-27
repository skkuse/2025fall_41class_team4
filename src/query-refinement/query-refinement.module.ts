import { Module } from '@nestjs/common';
import { QueryRefinementService } from './query-refinement.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [QueryRefinementService],
  exports: [QueryRefinementService], // ChatService에서 갖다 써야 하므로 export 필수
})
export class QueryRefinementModule {}