import { IsString, IsNotEmpty, IsEnum, IsNumber, IsArray, IsOptional } from 'class-validator';
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

    @ApiProperty({
        description: '과거 대화 내역 (기억력용)',
        example: [
            { role: 'user', content: '송강호 나오는 영화 알려줘' },
            { role: 'assistant', content: '송강호 배우님의 대표작으로는 기생충, 택시운전사 등이 있습니다.' }
        ],
        required: false, // 처음 대화할 떄 false
    })
    @IsArray()   
    @IsOptional()
    history?: any[];

    @ApiProperty({
    description: '최근 대화에서 검색되었던 데이터들',
        required: false,
    })
    @IsArray()
    @IsOptional()
    relevantMovies?: any[]; // MovieData[] 타입을 써도 좋습니다.
    
}