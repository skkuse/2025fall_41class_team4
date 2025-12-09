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
        this.logger.log(`🔍 답변 생성 시작 (검색된 공연: ${items.length}개)`);

        // 1. 검색 결과 없음 처리
        if (items.length === 0) {
            this.logger.warn('⚠️ 검색 결과 없음 -> 기본 답변 반환');
            return {
                answer: "아쉽게도 조건에 딱 맞는 공연을 찾지 못했어요 😢 날짜나 지역을 조금 바꿔보시는 건 어떨까요?",
                items: []
            };
        }

        // 2. Context 생성
        const context = items.map((item) => `
        [ID: ${item.id}]
        제목: ${item.title}
        장소: ${item.eventSite} (${item.city} ${item.district})
        기간: ${item.start_date} ~ ${item.end_date}
        내용: ${item.description.slice(0, 500)}...
        `).join("\n\n");

        const sys = `
        너는 문화예술 공연 전문 AI 큐레이터 'LLMuse'야.
        사용자의 질문과 [공연 목록]을 바탕으로 답변을 JSON으로 작성해.

        [🚨 팩트 체크 가이드 (매우 중요)]
        1. **제공된 [공연 목록]에 없는 공연은 절대 추천하지 마.**
        2. 사용자가 특정 공연(예: 지킬앤하이드)을 물어봤는데 [공연 목록]에 없다면, **"현재 해당 공연의 데이터가 없거나 예매 기간이 아닙니다."**라고 솔직하게 말해.
        3. 그 후, "[공연 목록]에 있는 다른 공연들"을 대안으로 자연스럽게 추천해줘.

        [핵심 행동 지침 - message 필드 작성법]
        1. **형식의 자유 (Storytelling)**:
            - 딱딱한 템플릿(항목 나열)에 얽매이지 마.
            - 질문의 의도에 맞춰서 **술술 읽히는 줄글(Narrative)** 형태로 답변해도 좋아
            - 단, 포스터는 사용하지마.
            - **만약 줄거리가 없다면, 네가 가진 외부 지식(Pre-trained Knowledge)을 동원해서 해당 공연(특히 유명한 뮤지컬/연극)의 줄거리를 1~2문장으로 요약해서 채워넣어.**

        2. **가독성 (필수)**:
            - 대신 가독성을 위해 **Markdown 문법**은 적극적으로 써줘.
            - 공연 제목은 반드시 **굵게(**제목**)** 처리해.
            - 문단 사이에는 빈 줄을 넣어서 시원하게 보이게 해.
            - 중요한 문구는 인용구(>)나 이탤릭(_) 등을 적절히 섞어서 강조해.
            - 이모지를 사용해도 좋아

        3. **데이터 활용 (Fact-based)**:
            - 제공된 데이터(기간, 장소, 줄거리)를 문장에 자연스럽게 녹여내.
            - 예: "기간은 ~부터 ~까지입니다" (X) -> "오는 12월부터 예술의전당에서 만나보실 수 있어요." (O)
            - 줄거리나 특징을 언급할 때 "이 작품은 ~한 내용입니다" 보다는 "관객들은 ~한 지점에서 깊은 감동을 받았어요" 처럼 큐레이팅 하듯 설명해.

        4. **message 작성법 **
            - 사용자의 질문의 의도에 맞춰서 답변해.
            - **추천 요청**이면: 1위 공연을 메인으로 강력 추천하고, 나머지는 "그 외에도 ~가 있습니다" 식으로 가볍게 언급해.
            - **단순 정보 질문**이면: 질문의 의도에 맞는 답변을 정확하게 전달해.
            - **풍성한 답변**: 메인 메시지(message)는 최소 3~4문장으로 구성해. 단순 나열이 아니라, "왜 이 공연이 지금 딱인지" 감성적으로 설득해.

        5. **말투 (Tone & Manner)**:
            - 친절하고 감성적이며, 예술을 사랑하는 '공연 덕후 친구'가 신나서 추천해주는 톤을 유지해.
            - "~합니다"체와 "~해요"체를 자연스럽게 섞어서 써.

        [시스템 요구사항 - JSON 포맷 준수]
        1. 'message': 위 가이드에 따라 작성된 메인 답변 텍스트.
        2. 'items': 각 공연에 대한 '소개(description)'와 '추천 이유(reason)'를 작성.
        - **중요:** 배열의 순서는 [공연 목록]의 원본 순서가 아니라, **네가 추천하는 우선순위대로 재정렬**해서 반환해.
        - 각 item의 'id'는 필수.
        
        [출력 포맷]
        {
            "message": "메인 추천 멘트",
            "items": [
                {
                    "id": "공연ID", 
                    "description": "공연의 핵심 줄거리 또는 매력 포인트 (DB에 없으면 네가 생성)", 
                    "reason": "이 공연을 추천하는 구체적인 이유"}
            ]
        }
        `;

        try {
            const res = await this.llm.chat.completions.create({
                model: "gpt-4o-mini", // 표현력을 위해 4o 사용
                messages: [
                    { role: "system", content: sys },
                    { role: "user", content: `질문: ${question}\n\n[공연 목록]\n${context}` }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            let content = res.choices[0].message.content;
            if (!content) throw new Error("Empty LLM Response");
            
            // this.logger.debug(`📝 LLM Raw Output (Length: ${content.length})`);

            content = content.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(content);
            const llmItemsMap = new Map(parsed.items.map((p: any) => [p.id, p]));

            // 3. [핵심] 원본 데이터와 LLM 데이터 병합 (Data Merging)
            // LLM이 이미지 URL이나 예매 링크를 모르기 때문에, 원본 items에 텍스트만 덮어씌움
            const enrichedItems = items.map(originalItem => {
                // ID로 매칭하거나, 순서대로 매칭
                const llmItem = (llmItemsMap.get(originalItem.id) || {}) as any;
                
                return {
                        ...originalItem, // 원본 데이터 유지 (image_url, booking_url 등) [cite: 106, 118]
                        summary: llmItem.summary || "상세정보를 확인해보세요.", // [cite: 122]
                        reason: llmItem.reason || '해당 공연도 추천드려요!!', // [cite: 123]
                };
            });

            const finalResponse = {
                    answer: parsed.message,
                    items: enrichedItems,
                };

            // [LOG 3] 최종 병합된 JSON 구조 확인 (터미널에서 보기 편하게 출력)
            // this.logger.log(
            //         `✨ 최종 응답 JSON 생성 완료:\n${JSON.stringify(finalResponse, null, 2)}`
            //     );

            return finalResponse;

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