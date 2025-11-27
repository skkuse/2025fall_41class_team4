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
        
        // 오타 수정: equestion -> question
        if (!body.question) {
            return { error: "Body에 question 필드가 필요합니다." };
        }

        const results = await this.chatService.handleChat(body.question);
        return results; 
    }
}