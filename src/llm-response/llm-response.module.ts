import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmResponseService } from './llm-response.service';

@Module({
    imports: [ConfigModule],
    providers: [LlmResponseService],
    exports: [LlmResponseService],
})
export class LlmResponseModule {}