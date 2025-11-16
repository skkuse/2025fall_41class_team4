import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Where } from 'chromadb';

export interface QueryComponents {
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
            당신은 사용자의 질문을 ChromaDB 쿼리용 JSON으로 변환하는 API입니다.
            모든 쿼리는 'movies_overview' 컬렉션을 대상으로 합니다.

            필수 제약: 
            - 모든 쿼리에는 항상 '{ "vote_average": { "$gt": 8 } }' 필터가 포함되어야 합니다.
            - 모든 쿼리에 항상 { "release_date": { "$gte": 1577836800 } } 필터가 포함하지마.

            사용 가능한 필터 필드:
            - 'release_date' (string, "YYYY-MM-DD" 형식)
            - 'genres' (string, 예: "드라마", "코미디")
            - 'director' (string, 예: "홍상수")
            - 'actors' (string, 쉼표로 구분된 문자열)
            - 'vote_average' (number, 0.0 ~ 10.0)

            규칙:
            0. [가장 중요] '$and' 연산자: 'filter' 객체에 **2개 이상의 조건이 포함될 경우에만**, 모든 조건을 '$and' 배열로 묶어야 합니다. **조건이 1개일 경우, '$and'로 묶지 말고 해당 조건 객체를 'filter'의 값으로 직접 사용하세요.**

            1. 'filter' 생성: "2020년 이후", "코미디", "크리스토퍼 놀란 감독" 같은 '사실(Factual)' 기반 조건은 'filter' 객체로 변환합니다.
                - "슬프고 감동적인" 요청은 "genres": { "$eq": "드라마" } 필터를 추가하는 것을 고려하세요.
                - "신나는" 또는 "스트레스 풀리는" 요청은 "genres": { "$eq": "액션" } 또는 "genres": { "$eq": "코미디" } 필터를 고려하세요.
            
            2. 'query' 생성 (가장 중요):
                - "슬프고 감동적인", "여자친구랑 볼만한" 처럼 '추상적/감성적'인 키워드는 'filter'로 만들지 않습니다.
                - 대신, 해당 감성을 만족시키는 '영화 줄거리(overview)'의 핵심 테마를 묘사하는 단어들로 'query'를 재구성합니다.
                - 'query'는 사용자의 원본 질문이 아니라, 검색 엔진이 줄거리를 잘 찾을 수 있도록 돕는 키워드여야 합니다.
                - [중요] 사용자의 질문에 '공포', '스릴러', '무서운' 등의 의도가 없다면, 'query'에 '죽음', '저주', '유령', '살인', '공포' 등 부정적이고 무서운 키워드는 절대 포함하지 마세요.

            예시 1:
            질문: "슬프고 감동적인 영화 추천해줘"
            JSON 응답: { 
                "query": "눈물, 감동, 숭고한 사랑, 가족애, 화해, 이별의 아픔, 삶의 의미", 
                "filter": {
                    "$and": [
                        { "genres": { "$eq": "드라마" } },
                        { "vote_average": { "$gt": 7 } },
                        { "release_date": { "$gte": 1577836800 } }
                    ]
                }
            }

            예시 2:
            질문: "여자친구랑 볼만한 로맨틱한 영화"
            JSON 응답: { 
                "query": "남녀 주인공의 만남, 사랑, 로맨스, 연애", 
                "filter": {
                    "$and": [
                        { "genres": { "$eq": "Romance" } },
                        { "vote_average": { "$gt": 7 } },
                        { "release_date": { "$gte": 1577836800 } }
                    ]
                }
            }

            예시 3:
            질문: "크리스토퍼 놀란 감독의 최신 영화"
            JSON 응답: { 
                "query": "크리스토퍼 놀란", 
                "filter": { 
                    "$and": [
                        { "director": { "$eq": "크리스토퍼 놀란" } },
                        { "release_date": { "$gte": 1579836800 } }, // 2020-01-01보다 더 강력한(최신) 조건이므로 우선 적용
                        { "vote_average": { "$gt": 7 } }
                    ]
                }
            }
            
            예시 4 (필터 조건이 없는 경우):
            질문: "그냥 아무 영화나 추천해줘"
            JSON 응답: {
                "query": "인기 영화, 명작, 추천",
                "filter": {
                    "$and": [
                        { "vote_average": { "$gt": 7 } },
                        { "release_date": { "$gte": 1577836800 } }
                    ]
                }
            }

            예시 5 (단일 조건의 경우):
            질문: "평점 8점 이상인 영화만 찾아줘"
            JSON 응답: {
                "query": "명작, 고평점, 인기 영화",
                "filter": { "vote_average": { "$gt": 8 } }
            }

            이제 다음 질문을 JSON으로 변환하세요.
        `;
        
        const userPrompt = `
            질문: "${userQuestion}" 
            질문에 대해서 위의 규칙을 엄격히 준수하여 JSON 형식으로 응답하세요.
            `;
        
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4.1-nano', // 또는 gpt-3.5-turbo
                messages: [
                    { role: 'system', content: systemPrompt },
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
                query: userQuestion, // 실패하면 원본 질문을 그대로 쿼리로 사용
                filter: {},
            };
        }
    }
}