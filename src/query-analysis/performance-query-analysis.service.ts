import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';

const QueryAnalysisSchema = z.object({
    query: z.string().optional(),
    filter: z.record(z.any()).optional().default({}),
});

export type PerformanceQueryAnalysisResult = z.infer<typeof QueryAnalysisSchema>;

@Injectable()
export class PerformanceQueryAnalysisService {
    private openai: OpenAI;
    private readonly logger = new Logger(PerformanceQueryAnalysisService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.openai = new OpenAI({ apiKey });
    }

    async analyzeQuery(userQuestion: string): Promise<PerformanceQueryAnalysisResult> {
        const systemPrompt = `
        당신은 사용자의 질문을 '공연/전시 데이터베이스(ChromaDB)' 검색을 위한 **JSON** 쿼리로 변환하는 AI입니다.

        **반드시 결과는 JSON 형식으로만 출력하세요.**

        [DB 스키마 (Metadata)]
        - 'type' (string): "뮤지컬", "연극", "전시" 등 
        - 'title' (string): 공연 제목

        [변환 규칙]
        
        [변환 규칙]
        1. **'query' (Semantic Search) - 핵심:**
            - ❌ **금지:** 사용자의 질문을 그대로 복사하지 마세요. ("~해?", "~어때?" 금지)
            - ✅ **권장:** DB에 저장된 데이터와 비슷해 보이도록 **'명사형 키워드'**나 **'설명조'**로 바꾸세요.
            - 예: "지금 위키드 공연해?" -> query: "뮤지컬 위키드 공연 정보" (O)
            - 예: "대학로에서 웃긴 거 뭐 있어?" -> query: "대학로 코미디 연극, 웃긴 스토리" (O)
            - 예: "잔잔한 거 추천좀" -> query: "잔잔한 분위기, 힐링, 감동적인 스토리" (O)
        
        2. **'filter' (Metadata Filtering) - 최소화 전략**
            - 오직 **'제목(title)'**과 **'장르(type)'**만 필터링합니다. 
            - **금지:** eventSite, start_date, end_date는 filter에 넣지 마세요.

        [제목 필터링 전략]
        - 사용자가 특정 제목(고유명사)을 명확히 언급했을 때만 사용하세요.
        - 예: "레베카 내용 알려줘" -> filter: { "title": { "$eq": "레베카" } }
        - 예: "지금 위키드 공연해?" -> filter: { "title": { "$eq": "위키드" } }
        - 일반 추천 질문이면 filter는 빈 객체 {} 로 두세요.
        `;

        try {
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4.1-nano', 
            messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuestion },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) throw new Error('LLM 응답이 비어있습니다.');

        const rawJson = JSON.parse(responseContent);

        // [Sanitization] 금지된 키 삭제
        if (rawJson.filter) {
            rawJson.filter = this.sanitizeFilter(rawJson.filter);
        }

        // [Auto-Wrapping] 키가 2개 이상이면 $and로 감싸기
        if (rawJson.filter && Object.keys(rawJson.filter).length > 1) {
            const keys = Object.keys(rawJson.filter);
            const wrappedFilter = {
            "$and": keys.map(key => ({ [key]: rawJson.filter[key] }))
            };
            rawJson.filter = wrappedFilter;
        }

        const parsedResult = QueryAnalysisSchema.parse(rawJson);
        
        this.logger.log(`Analysis Result: ${JSON.stringify(parsedResult)}`);
        return parsedResult;

        } catch (error) {
        this.logger.error('Query Analysis Failed', error);
        return { query: userQuestion, filter: {} };
        }
    }

    private sanitizeFilter(filter: any): any {
        if (!filter || typeof filter !== 'object') return {};

        // 재귀 처리
        if (filter['$and'] && Array.isArray(filter['$and'])) {
            filter['$and'].forEach((c) => this.sanitizeFilter(c));
        }
        if (filter['$or'] && Array.isArray(filter['$or'])) {
            filter['$or'].forEach((c) => this.sanitizeFilter(c));
        }

        // [핵심] 'genre'도 금지 목록에 추가하여 강제 삭제
        const forbiddenKeys = ['place', 'start_date', 'end_date', 'description', 'actor', 'genre'];
        forbiddenKeys.forEach((key) => {
            if (key in filter) {
                delete filter[key]; 
            }
        });

        for (const key in filter) {
            const value = filter[key];
            if (value && typeof value === 'object' && '$contains' in value) {
                delete filter[key];
            }
        }

        return filter;
    }
}