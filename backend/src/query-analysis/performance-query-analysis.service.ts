
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
        // const today = new Date();
        // const todayStr = today.toISOString().slice(0,10).replace(/-/g,"");

        const today = new Date();
        const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
        const kstDate = new Date(today.getTime() + kstOffset);
        const todayStr = kstDate.toISOString().slice(0, 10).replace(/-/g, '');

        const systemPrompt = `
        너는 공연 검색 쿼리 분석가야. 사용자의 질문을 분석해서 다음 JSON 필드를 추출해.

        - 입력 문장에서 공연 제목(고유명사), 분위기, 지역을 각각 식별하세요.
        - keywords에서는 공연/뮤지컬/연극/추천/정보 등 일반 단어를 제거하고, 핵심 명사 또는 분위기 키워드만 남기세요.
        - 고유명사가 없으면 감성/분위기 기반 키워드로 확장하세요.
        - city는 한국의 광역자치단체만 넣으세요.
        - district는 예: 강남구/수원시/해운대구 등 기초자치단체만 넣으세요.
        - target_date는 질문에 날짜가 없으면 무조건 "${todayStr}"로 설정하세요.
        - 반드시 JSON만 출력하세요.
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
            temperature: 0.2
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

        // [수정] raw.keywords가 null이거나 배열일 수 있으므로 안전하게 처리
        // const keywordsToClean = raw.keywords || userQuestion;
        // raw.keywords = this.cleanKeywords(keywordsToClean);

        // [수정 2] 정밀한 키워드 클리닝
        
        const keywordsToClean = raw.keywords || userQuestion;
        raw.keywords = this.cleanKeywords(keywordsToClean, raw.city, raw.district);

        // 날짜 누락 대비 안전장치
        if (!raw.target_date) {
            raw.target_date = todayStr;
        }

        return QueryAnalysisSchema.parse(raw);
    }

    // [핵심 수정] 입력 타입이 any여도 안전하게 문자열로 변환
    private cleanKeywords(kw: any, city: string | null, district: string | null): string {
        let k: string;

        // 1. 배열인 경우 공백으로 합침 (예: ["뮤지컬", "위키드"] -> "뮤지컬 위키드")
        if (Array.isArray(kw)) {
            k = kw.join(" ");
        } 
        // 2. 문자열이 아닌 경우 강제 형변환
        else if (typeof kw !== 'string') {
            k = String(kw || "");
        } 
        // 3. 정상 문자열
        else {
            k = kw;
        }

        if (city && k.includes(city)) {
            k = k.replace(city, "");
        }

        if (district && k.includes(district)) {
            k = k.replace(district, "");
        }

        // 4. 광역 시/도 제거
        this.KOREAN_CITIES.forEach(c => {
            if (k.includes(c)) k = k.replace(c, "");
        });

        // 5. 구/군/시 접미사 제거
        this.DISTRICT_SUFFIX.forEach(s => {
            k = k.replace(new RegExp(`\\S+${s}`, "g"), ""); 
        });

        return k.replace(/\s+/g, " ").trim();
    }
}