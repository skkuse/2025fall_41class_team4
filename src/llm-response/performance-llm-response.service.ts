import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PerformanceData } from '../search/performance-search.service';

@Injectable()
export class PerformanceLlmResponseService {
  private llm: OpenAI;
  private logger = new Logger(PerformanceLlmResponseService.name);

  constructor(cfg: ConfigService) {
    this.llm = new OpenAI({
      apiKey: cfg.get<string>("OPENAI_API_KEY")
    });
  }

  async generateAnswer(question: string, items: PerformanceData[]) {
    // 1. 검색 결과 없음 처리
    if (items.length === 0) {
      return {
        answer: "아쉽게도 조건에 딱 맞는 공연을 찾지 못했어요 😢 날짜나 지역을 조금 바꿔보시는 건 어떨까요?",
        items: []
      };
    }

    // 2. Context 생성
    const context = items.map((x, i) => `
      [ID: ${x.id}]
      제목: ${x.title}
      장소: ${x.eventSite} (${x.city} ${x.district})
      기간: ${x.start_date} ~ ${x.end_date}
      내용: ${x.description.slice(0, 150)}...
    `).join("\n\n");

    const sys = `
    너는 감성적이고 센스 있는 '공연 추천 큐레이터'야.
    사용자의 질문과 [공연 목록]을 바탕으로 답변을 JSON으로 작성해.

    [요구사항]
    1. 'message': 전체적인 추천 멘트 (이모지 사용, 친절하게).
    2. 'items': 각 공연에 대한 '한줄 요약(summary)'과 '추천 이유(reason)'를 작성.
       - **중요:** items 배열의 순서는 입력된 공연 목록의 순서와 정확히 일치해야 함.
    
    [출력 포맷]
    {
      "message": "...",
      "items": [
        { "id": "공연ID", "summary": "...", "reason": "..." },
        ...
      ]
    }
    `;

    try {
        const res = await this.llm.chat.completions.create({
            model: "gpt-4o", // 표현력을 위해 4o 사용
            messages: [
                { role: "system", content: sys },
                { role: "user", content: `질문: ${question}\n\n[공연 목록]\n${context}` }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = res.choices[0].message.content;
        if (!content) throw new Error("Empty LLM Response");
        
        const parsed = JSON.parse(content);

        // 3. [핵심] 원본 데이터와 LLM 데이터 병합 (Data Merging)
        // LLM이 이미지 URL이나 예매 링크를 모르기 때문에, 원본 items에 텍스트만 덮어씌움
        const enrichedItems = items.map(originalItem => {
            // ID로 매칭하거나, 순서대로 매칭
            const llmItem = parsed.items.find((p: any) => p.id === originalItem.id) || {};
            
            return {
                ...originalItem, // 원본 데이터 유지 (image_url, booking_url 등)
                summary: llmItem.summary || originalItem.description.slice(0, 50), // LLM 요약 적용
                reason: llmItem.reason || "추천합니다!" // LLM 이유 적용
            };
        });

        return {
            answer: parsed.message,
            items: enrichedItems
        };

    } catch (e) {
        this.logger.error(`LLM Response Error: ${e.message}`);
        // 에러 발생 시 원본 데이터라도 반환
        return {
            answer: "추천 공연을 확인해보세요! (상세 코멘트 생성 실패)",
            items: items
        };
    }
  }
}