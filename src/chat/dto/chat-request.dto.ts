import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ChatCategory {
    MOVIE = 'movie',
    PERFORMANCE = 'performance',
}

export class ChatRequestDto {
    @ApiProperty({
        description: '대화 카테고리 (영화 또는 공연)',
        example: 'movie',
        enum: ChatCategory,
    })
    @IsEnum(ChatCategory)
    category: ChatCategory; 

    @ApiProperty({
        description: '사용자의 자연어 질문',
        example: '범죄도시4 감독이 누구야?', 
    })
    @IsString()
    @IsNotEmpty()
    question: string;
}