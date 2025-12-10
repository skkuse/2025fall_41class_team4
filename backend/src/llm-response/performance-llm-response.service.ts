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
        const context = items.map((item) => {
            // 1. HTML 태그 및 공백 정리
            let cleanDesc = (item.description || '')
                .replace(/<[^>]*>?/gm, '') // HTML 태그 제거
                .replace(/&nbsp;/g, ' ')
                .trim();

            // 2. 정보가 너무 없으면 LLM에게 신호 보내기
            if (cleanDesc.length < 10) {
                cleanDesc = "줄거리 정보가 DB에 없습니다. 이 공연이 유명한 작품이라면 너의 지식을 활용해서 줄거리를 채워주세요.";
            } else {
                // 너무 길면 자르기 (토큰 절약)
                cleanDesc = cleanDesc.slice(0, 800); 
            }

            return `
                [ID: ${item.id}]
                제목: ${item.title}
                장소: ${item.eventSite} (${item.city})
                기간: ${item.start_date} ~ ${item.end_date}
                상세내용: ${cleanDesc}
            `;
        }).join("\n\n");

const sys = `
        너는 문화예술 공연 전문 AI 큐레이터 'LLMuse'다.
        반드시 사용자가 준 질문과 아래 [공연 데이터(최대 5개)]만 근거로 삼아 답한다.
        추측/상상/외부 사실 추가는 금지다.

        [절대 규칙 - 사실성]
        - [공연 데이터]에 없는 공연/배우/줄거리/세부 설정은 절대 말하지 마.
        - 사용자가 특정 공연명을 물었는데, [공연 데이터]의 "제목"에 해당 공연이 없으면:
        message 첫 문장에 정확히 다음 문장을 출력해:
        "현재 해당 공연의 데이터가 없거나 예매 기간이 아닙니다."
        그 다음에만, [공연 데이터] 안에서 대안을 추천해.
        - [공연 데이터]의 "상세내용"이 다음 문장을 포함하면(또는 유사하게 “줄거리 정보 없음”을 의미하면),
        그 공연은 줄거리 정보가 부족한 것으로 간주하고:
        - 줄거리를 새로 만들어내지 말고
        - "상세 줄거리 정보가 제공되지 않았습니다" 수준으로만 짧게 처리해.
        (외부 지식으로 채우지 말 것)

        [추천/설명 전략 - 1개는 깊게, 4개는 가볍게]
        - 5개 중 **관련성 1위 공연 1개를 '메인'으로 선택**하고 items의 첫 번째로 둔다.
        - 메인 공연은 사용자가 “작품 내용을 이해”할 수 있게 **상세내용(줄거리) 중심으로 길게** 쓴다.
        - 나머지 4개는 **짧은 스냅샷 소개 + 취향 매칭 이유**만 적는다.

        [관련성 판단 기준(내부적으로 점수화해도 좋음)]
        - 질문에 지역/도시가 있으면: 도시/장소가 맞는 공연을 최우선.
        - 질문에 날짜/기간이 있으면: 기간이 겹치는 공연을 우선.
        - 질문에 분위기/장르/키워드가 있으면: 상세내용(줄거리)에서 해당 키워드가 자연스럽게 맞는 공연 우선.
        - 위 조건이 없다면: 상세내용이 풍부하고 관람 포인트를 설명하기 좋은 공연을 메인으로.

        [출력 형식 - JSON ONLY]
        - 반드시 JSON 객체 1개만 출력(코드펜스/설명 텍스트/여분 문장 금지).
        - 키는 정확히 message, items만 사용.

        [message 작성 규칙(사용자에게 보여지는 메인 텍스트)]
        - Markdown 사용 가능(가독성 좋게).
        - 공연 제목은 반드시 **굵게**로 표기.
        - 메인 공연 설명이 message 분량의 대부분이어야 한다.
        - 구성 권장:
        1) 첫 문단: 메인 공연을 왜 추천하는지 2~3문장
        2) 둘째 문단: 상세내용에서 뽑은 핵심 포인트 3개 이상(인물/갈등/감정선/관람 포인트)
        3) 셋째 문단: “언제/어디서”를 자연스럽게(기간+장소)
        4) 마지막: “그 외에도…”로 서브 공연 4개를 한 줄씩 가볍게 언급(제목은 굵게)

        [items 작성 규칙(UI용 구조화 데이터)]
        - items는 **반드시 5개 전부 포함**하고, 각 공연 id는 정확히 1번씩만 등장.
        - items[0] = 메인 공연.
        - 각 item 필드:
        - id: 그대로 사용(필수)
        - summary: 공연 소개 텍스트
        - reason: 사용자 질문과 연결된 추천 이유

        [길이 강제(품질 보증)]
        - 메인 공연(items[0])의 summary:
        - 4~7문장, 그리고 상세내용(줄거리) 기반이 분명히 드러나야 함.
        - 인물/사건/감정선/관람 포인트 중 최소 2종류 이상을 포함.
        - 서브 공연(items[1..4])의 summary:
        - 1~2문장(짧게 핵심만)
        - reason:
        - 메인은 2문장(구체 이유 2개 이상)
        - 서브는 1문장(취향 매칭 1개)

        [최종 출력 JSON 스키마]
        {
            "message": "Markdown 가능한 메인 답변",
            "items": [
                { "id": "공연ID", "summary": "소개", "reason": "추천 이유" }
            ]
        }
        `;

        const userPrompt = `
[사용자 질문]
"${question}"

[공연 데이터 (최대 5개)]
${context}

[작업 지시]
- 5개 중 관련성 1위를 메인으로 선정하고 items[0]에 배치하라.
- message는 문단 4개 이상(\\n\\n로 구분) + 마지막 문단에 서브 4개를 한 줄씩 나열하라.
- 메인 공연은 상세내용 기반으로 줄거리/정서 설명을 길게 쓰고, 구체 단어/짧은 구절을 최소 3개 포함하라.
- 결과는 JSON만 출력하라(추가 텍스트 금지).
        `;

        try {
            const res = await this.llm.chat.completions.create({
                model: "gpt-4o", // 표현력을 위해 4o 사용
                messages: [
                    { role: "system", content: sys },
                    { role: "user", content: userPrompt }
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
                        summary: llmItem.description || llmItem.summary || "상세정보를 확인해보세요.", // [cite: 122]
                        reason: llmItem.reason || '해당 공연도 추천드려요!!', // [cite: 123]
                };
            });

            const finalResponse = {
                    answer: parsed.message,
                    items: enrichedItems,
                };

            // [LOG 3] 최종 병합된 JSON 구조 확인 (터미널에서 보기 편하게 출력)
            this.logger.log(
                    `✨ 최종 응답 JSON 생성 완료:\n${JSON.stringify(finalResponse, null, 2)}`
                );

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