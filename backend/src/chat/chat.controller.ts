import { Controller, Post, Body, Logger, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class ChatController {
    private readonly logger = new Logger(ChatController.name);

    constructor(private readonly chatService: ChatService) {}

    @Post()
    async handleChat(@Body() dto: ChatRequestDto) {
        this.logger.log(`📩 요청 수신: [${dto.category}] "${dto.question}"`);

        if (!dto.question || !dto.category) {
        throw new BadRequestException('question과 category는 필수입니다.');
        }

        const result = await this.chatService.handleChat(dto);
        return result;
    }
}