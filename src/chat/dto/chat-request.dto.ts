import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum ChatCategory {
    MOVIE = 'movie',
    PERFORMANCE = 'performance',
}

export class ChatRequestDto {
    @IsEnum(ChatCategory)
    category: ChatCategory; // 'movie' 또는 'performance'

    @IsString()
    @IsNotEmpty()
    question: string;

    @IsNumber()
    @IsOptional()
    userId?: number;

    @IsNumber()
    @IsOptional()
    sessionId?: number;
}