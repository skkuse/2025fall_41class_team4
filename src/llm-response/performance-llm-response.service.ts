import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
// 검색 서비스에서 정의한 타입 가져오기
import { PerformanceData } from '../search/performance-search.service';

export interface PerformanceResponse {
    answer: string; 
    items: PerformanceData[];
}

@Injectable()
export class PerformanceLlmResponseService {
    private openai: OpenAI;
    private readonly logger = new Logger(PerformanceLlmResponseService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.openai = new OpenAI({ apiKey });
    }

    async generateAnswer(userQuestion: string, candidates: PerformanceData[]): Promise<PerformanceResponse> {
        
        // 👇 [로그 추가] 이 줄을 추가해주세요!
        this.logger.log(`🤖 LLM 답변 생성 진입... 후보 데이터 ${candidates.length}개`);
        
        const hasData = candidates && candidates.length > 0;
        
        // [수정] candidates는 이미 포맷팅된 PerformanceData[] 이므로 바로 사용
        const contextData = hasData ? JSON.stringify(candidates) : "NO_DATA";

        const systemPrompt = `
        당신은 친절하고 감성적인 '공연/전시 추천 큐레이터'입니다.
        사용자의 질문과 '검색된 후보 공연 리스트'를 바탕으로 최종 답변을 JSON으로 작성하세요.

        [입력 데이터 상황]
        Context Data: ${hasData ? '검색된 공연 후보들이 제공됨' : '데이터베이스에 일치하는 공연이 없음 (NO_DATA)'}

        [지침 1: 검색 결과가 있을 경우 (RAG Mode)]
        - 제공된 후보 리스트(${candidates.length}개) 중에서 사용자의 질문 의도에 가장 잘 맞는 **Top 3**를 선정하세요.
        - 'message': 선정된 공연들을 자연스럽게 소개하며 추천하는 멘트를 작성하세요. (이모지 활용)
        - 'items': 선정된 3개 공연의 상세 정보를 배열로 담으세요. (제공된 포스터 URL 필수 포함)

        [지침 2: 검색 결과가 없을 경우 (Fallback Mode)]
        - **절대로 가짜 공연 정보를 지어내지 마세요.** (없는 공연을 추천하면 안 됨)
        - 'message': "아쉽게도 현재 예매 가능한 공연 정보 중에는 딱 맞는 결과가 없네요 😢"라고 솔직히 말하고, 
            대신 당신의 **일반적인 지식**을 활용해 해당 지역/장르의 유명한 공연장이나 정보를 알려주거나, 다른 검색어를 제안하세요.
        - 'items': 빈 배열 [] 로 반환하세요.

        [최종 출력 형식 - JSON]
        {
            "message": "여기에 당신의 답변 메시지를 작성하세요.",
            "items": [
                {
                    "id": "공연ID",
                    "title": "공연 제목",
                    "type": "장르",
                    "eventSite": "공연 장소",
                    "eventPeriod": "공연 기간",
                    "imageObject": "포스터 이미지 URL",
                    "description": "공연 내용 요약"
                },
                {
                    "id": "공연ID",
                    "title": "공연 제목",
                    "type": "장르",
                    "eventSite": "공연 장소",
                    "eventPeriod": "공연 기간",
                    "imageObject": "포스터 이미지 URL",
                    "description": "공연 내용 요약"
                }, // 최대 3개 아이템
            ]
        }
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4.1-nano', // [수정] 올바른 모델명
                messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `질문: "${userQuestion}"\n\n[후보 리스트]:\n${contextData}` },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('Empty response');

        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed.items) ? parsed.items : [];

        return {
            answer: parsed.message || "추천 결과를 확인해보세요.",
            items: items
        };

        } catch (error) {
        this.logger.error('답변 생성 실패', error);
        return { 
            answer: "죄송합니다. 답변을 생성하는 도중 문제가 발생했습니다.",
            items: []
        };
        }
    }
}
