// src/chat/chat.controller.ts
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

class TestQueryDto {
    question: string;
}

@Controller('chat')
export class ChatController {
    private readonly logger = new Logger(ChatController.name);

    constructor(private readonly chatService: ChatService) {}

    @Post()
    async handleChat(@Body() body: TestQueryDto) {
        this.logger.log(`Received question: "${body.question}"`);
        
        if (!body.question) {
            return { error: "Body에 equestion 필드가 필요합니다." };
        }

        const results = await this.chatService.queryMovie(body.question);
        return results; 
    }
}