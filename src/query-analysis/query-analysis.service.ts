import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Where } from 'chromadb';

export interface QueryComponents {
    collection: 'movies_overview' | 'movies_title' | 'movies_director' | 'movies_actors';
    query: string;
    filter: Where;
}

@Injectable()
export class QueryAnalysisService {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
        throw new Error('OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
        }
        this.openai = new OpenAI({ apiKey });
    }

    /**
   * 1차 LLM 호출: 쿼리 분석 (Flow 3단계)
   * 사용자의 자연어 질문을 ChromaDB가 이해할 수 있는 JSON 쿼리로 변환
   */
    async analyzeQuery(userQuestion: string): Promise<QueryComponents> {
        const systemPrompt = `
            당신은 사용자의 영화 관련 질문을 ChromaDB 쿼리용 JSON 객체로 변환하는 API입니다.
            
            사용 가능한 컬렉션: 'movies_overview', movies_title, 'movies_director', 'movies_actors'.

            규칙:
            1. 질문에 "감독"이 포함되면 'director' 컬렉션을 대상으로 합니다.
            2. 질문에 "배우", "출연"이 포함되면 'actor' 컬렉션을 대상으로 합니다.
            3. 그 외에는 'movies_overview' 컬렉션을 대상으로 합니다.
            4. "최신"은 2023년 이후 (release_year: { $gte: 2023 }) 입니다.
            5. "여자친구"와 같은 키워드는 'Romance' 장르 필터 (genre: { $eq: "Romance" })로 해석합니다.
            6. "80년대"는 { $and: [{ release_year: { $gte: 1980 } }, { release_year: { $lte: 1989 } }] } 입니다.
            7. 의미 검색에 사용할 핵심 키워드를 'query' 필드에 담아주세요.
            8. 필터가 필요 없으면 'filters'는 빈 객체 {} 로 보내주세요.

            질문: "여자친구랑 볼만한 2020년 이후 최신 코미디 영화 추천해줘"
            JSON 응답 형식: 
            {
                "collection": "movies_overview",
                "query": "여자친구랑 볼만한 코미디 영화",
                "filter": {
                    "$and": [
                        { "release_year": { "$gte": 2020 } },
                        { "genre": { "$eq": "Comedy" } }]
                }
            }
        `;
        
        const userPrompt = `질문: "${userQuestion}"\n\n응답 JSON:`;
        
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4.1-nano', // 또는 gpt-3.5-turbo
                messages: [
                    { role: 'user', content: systemPrompt },
                    { role: 'user', content: userPrompt},
                    ],
                    temperature: 0.1,
                    
                    // 1. JSON 모드를 활성화하여 항상 유효한 JSON을 받도록 함
                    response_format: { type: 'json_object' },
            });
    
            const jsonResponse = completion.choices[0].message.content;

            if(jsonResponse){
                return JSON.parse(jsonResponse) as unknown as QueryComponents;
            } else {
                throw new Error('Query analysis 분석 결과가 없습니다. (Null 반환)');
            }

        } catch (error) {
            console.error('OpenAI 쿼리 분석 호출 실패:', error);
            // 실패 시 기본값 반환 (전체 검색)
            return {
                collection: 'movies_overview',
                query: userQuestion, // 실패하면 원본 질문을 그대로 쿼리로 사용
                filter: {},
            };
        }
    }
}