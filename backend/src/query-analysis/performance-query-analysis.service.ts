import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';

const QueryAnalysisSchema = z.object({
    keywords: z.string(),
    city: z.string().nullable(),
    district: z.string().nullable(),
    target_date: z.string(), // YYYYMMDD
});

export type PerformanceQueryAnalysisResult = z.infer<typeof QueryAnalysisSchema>;

@Injectable()
export class PerformanceQueryAnalysisService {
    private openai: OpenAI;
    private logger = new Logger(PerformanceQueryAnalysisService.name);

    private readonly KOREAN_CITIES = [
        "서울","부산","대구","인천","광주","대전","울산",
        "세종","경기","강원","충북","충남","전북","전남",
        "경북","경남","제주"
    ];

    private readonly DISTRICT_SUFFIX = ["구", "군", "시"];

    constructor(config: ConfigService) {
        this.openai = new OpenAI({
        apiKey: config.get<string>("OPENAI_API_KEY")
        });
    }

    async analyzeQuery(userQuestion: string): Promise<PerformanceQueryAnalysisResult> {
        // 1. 오늘 날짜 계산 (KST 기준)
        const today = new Date();
        const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
        const kstDate = new Date(today.getTime() + kstOffset);
        const todayStr = kstDate.toISOString().slice(0, 10).replace(/-/g, '');
        const weekday = ['일', '월', '화', '수', '목', '금', '토'][kstDate.getDay()];

        // [Python test_chatbot.py 로직 이식]
        const systemPrompt = `
        현재 시각은 ${todayStr} (${weekday}요일)입니다.
        사용자의 질문을 분석하여 다음 JSON 필드를 추출하세요.

        [keywords 추출 규칙] ⭐ 핵심
        1. **고유명사(제목)**가 발견되면, 불필요한 수식어('뮤지컬', '공연', '정보', '추천', '예매', '티켓', '보여줘', '알려줘')를 **모두 제거**하고 제목만 남기세요.
            - 입력: "위키드 공연 정보 줘" -> keywords: "위키드"
            - 입력: "시카고 보고싶어" -> keywords: "시카고"
            - 입력: "뮤지컬 영웅 예매" -> keywords: "영웅"
        
        2. 고유명사가 없고 **분위기/상황**만 있다면, 검색이 잘 되도록 연관 단어로 확장하세요.
            - 입력: "연인과 볼만한거" -> keywords: "로맨틱 데이트 사랑 연인"
            - 입력: "신나는 거" -> keywords: "신나는 화려한 퍼포먼스"
            - 입력: "아이랑 갈만한 곳" -> keywords: "가족 어린이 체험 교육"

        [기타 필드 추출 규칙]
        - **city**: 
            - 한국의 광역자치단체만 넣으세요. (지역명은 keywords에서 빼고 여기로 이동)
            - **[중요] 지역명이 언급되지 않았다면 반드시 null을 반환하세요. (절대 '서울'로 추측하거나 기본값을 넣지 마세요)**
        - **district**: 기초자치단체(구/군/시)만 넣으세요.
        - **target_date**: 
            - 질문에 날짜가 없으면 무조건 "${todayStr}"로 설정하세요. (null 금지)
            - "이번 주말", "크리스마스" 등은 "${todayStr}"를 기준으로 구체적인 날짜(YYYYMMDD)로 변환하세요.

        반드시 JSON 형식으로만 응답하세요.
        `;

        let raw: any;

        try {
        const res = await this.openai.chat.completions.create({
            model: "gpt-4o-mini", 
            messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuestion }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1 // 분석의 정확도를 위해 온도를 낮춤
        });

        const content = res.choices[0].message.content;
        if (!content) throw new Error("No content");
        raw = JSON.parse(content);
        } catch (e) {
        this.logger.warn(`Analysis Fallback: ${e.message}`);
        raw = {
            keywords: userQuestion,
            city: null,
            district: null,
            target_date: todayStr
        };
        }

        // 키워드 2차 정제 (함수 활용)
        const keywordsToClean = raw.keywords || userQuestion;
        raw.keywords = this.cleanKeywords(keywordsToClean, raw.city, raw.district);

        if (!raw.target_date) {
            raw.target_date = todayStr;
        }

        const finalResult = QueryAnalysisSchema.parse(raw);

        // ▼▼▼ [요청하신 로그 추가] 터미널에서 확인 가능 ▼▼▼
        this.logger.log(`🕵️ [Query Analysis 결과]
        ---------------------------------------------------
        💬 질문: "${userQuestion}"
        🗝️ 키워드(Keywords): "${finalResult.keywords}"
        🏙️ 지역(City/District): ${finalResult.city || '-'} / ${finalResult.district || '-'}
        📅 날짜(Target Date): ${finalResult.target_date}
        ---------------------------------------------------`);
        // ▲▲▲ [로그 끝] ▲▲▲

        return finalResult;
    }

    // 키워드 정제 헬퍼 함수 (기존 유지)
    private cleanKeywords(kw: any, city: string | null, district: string | null): string {
        let k: string;
        if (Array.isArray(kw)) k = kw.join(" ");
        else if (typeof kw !== 'string') k = String(kw || "");
        else k = kw;

        if (city && k.includes(city)) k = k.replace(city, "");
        if (district && k.includes(district)) k = k.replace(district, "");

        this.KOREAN_CITIES.forEach(c => {
        if (k.includes(c)) k = k.replace(c, "");
        });

        this.DISTRICT_SUFFIX.forEach(s => {
        k = k.replace(new RegExp(`\\S+${s}`, "g"), ""); 
        });

        return k.replace(/\s+/g, " ").trim();
    }
}