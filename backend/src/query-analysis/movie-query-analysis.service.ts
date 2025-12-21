import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// [변경] 반환 타입이 ChromaDB 형식이 아니라, 우리만의 분석 규격으로 바뀝니다.
export interface MovieQueryAnalysisResult {
  intent: 'exact_search' | 'recommendation_search' | 'condition_search'; // 의도파악 = 완전검색, 관련검색, 조건검색
    keywords: {
        title: string;      // (예: "인셉션")
        genres: string[];   // (예: ["액션", "SF"])
        actors: string[];   // (예: ["머동석", "톰 크루즈"]) -> 오타 그대로 추출
        directors: string[];// (예: ["봉준호"])
        timeframe: 'current' | 'upcoming' | null; // (예: 'current' -> 현재 상영작, 'upcoming' -> 개봉 예정작, null -> 해당없음)
    };
    correctedKeywords?: { original: string; corrected: string }[];
}

@Injectable()
export class MovieQueryAnalysisService {
    private openai: OpenAI;
    private readonly logger = new Logger(MovieQueryAnalysisService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {  
        throw new Error('OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
        }
        this.openai = new OpenAI({ apiKey });
    }

    async analyzeQuery(userQuestion: string): Promise<MovieQueryAnalysisResult> {
        // 프롬프트: DB 쿼리가 아니라, '정보 추출'에 집중합니다.
        const systemPrompt = `
        당신은 영화 검색 챗봇의 '쿼리 분석가'입니다.
        사용자의 자연어 질문을 분석하여 JSON 형식으로 의도(intent)와 키워드(keywords)를 추출하세요.

        [Intent(의도) 분류 규칙 - 우선순위 순]

        1. recommendation_search (유사 영화 추천):
        - **필수 조건**: 사용자가 **특정 영화 제목**을 언급하며, 그와 **비슷한(유사한)** 영화를 찾을 때만 선택합니다.
        - **핵심 키워드**: "~같은", "~비슷한", "~류의", "~스타일의", "~느낌의"
        - 예시:
            - "인셉션 같은 영화 추천해줘" (O)
            - "기생충이랑 비슷한 거 뭐 있어?" (O)
            - "범죄도시 스타일의 영화 보여줘" (O)
        - **주의**: 단순히 "재밌는 영화 추천해줘"나 "액션 영화 추천해줘"는 여기에 해당하지 않습니다.

        2. condition_search (조건 기반 검색):
        - 특정 **조건(장르, 배우, 감독, 시기 등)**을 포함하여 영화를 찾거나 추천을 요청할 때 선택합니다.
        - "추천해줘"라는 말이 있어도, '기준 영화' 없이 조건만 있다면 이것입니다.
        - 예시:
            - "마동석 나오는 액션 영화 추천해줘" (배우+장르 조건)
            - "2023년에 나온 로맨스 영화" (시기+장르 조건)
            - "봉준호 감독 영화 다 찾아줘" (감독 조건)
            - "웃긴 영화 추천해줘" (장르: 코미디)
            - "최신 영화 알려줘" (시기 조건)

        3. exact_search (단일 정보 검색):
        - 특정 영화, 특정 인물에 대한 **사실 정보**나 **줄거리** 등을 물어볼 때 선택합니다.
        - 조건이나 추천 요청 없이, 대상을 콕 집어서 물어보는 경우입니다.
        - 예시:
            - "범죄도시 감독이 누구야?"
            - "인셉션 줄거리 알려줘"
            - "기생충 언제 개봉했어?"
            - "아이언 맨 보여줘"

        [추출 및 변환 절대 규칙 - 최우선 순위]
        1. 모든 영화 제목 중 '맨'으로 끝나는 단어는 **반드시** 그 앞에 공백을 넣습니다.
        - 예: "아이언맨" -> "아이언 맨", "체인소맨" -> "체인소 맨"
        2. 이 규칙은 "오타를 수정하지 마세요"라는 규칙보다 **더 높은 우선순위**를 가집니다. '맨' 앞의 공백 추가는 오타 수정이 아니라 '포맷팅'으로 간주합니다.

        [Keywords(키워드) 추출 규칙]
        - 사용자가 언급한 고유명사(배우, 감독, 영화제목)는 **오타가 있어도 수정하지 말고 들리는 대로** 적으세요. (예: "머동석" -> "머동석")
        - title: 영화 제목이 명시된 경우
        - actors: 배우 이름
        - directors: 감독 이름
        - timeframe: 시점 관련 단어가 있으면 추출해.
            - "현재 상영중", "요즘 영화", "최신 영화", "극장 동시 상영": "current"
            - "개봉 예정", "다음달 영화", "기대작": "upcoming"
            - 특별한 시점 언급이 없으면: null
        - genres: 영화 장르
            질문에 장르명이 직접 없더라도, 아래 단어가 포함되면 해당 장르를 'genres'에 반드시 추가하세요.
            - "여자친구", "남자친구", "여친", "남친", "데이트", "연인", "사랑", "썸": -> "로맨스"
            - "가족", "아이", "애들", "부모님": -> "가족"
            - "우울해", "눈물", "슬픈": -> "드라마"
            - "웃긴", "재밌는", "킬링타임", "생각 없이": -> "코미디"
            - "무서운", "오싹한", "여름": -> "공포"
            - "긴장감", "심장": -> "스릴러"
            
        **[중요] 배우/감독 추출 제외 대상 (Blacklist)**:
            - 다음 단어들은 절대로 actors나 directors에 넣지 마세요:
            - "여자친구", "남자친구", "여친", "남친", "애인", "가족", "부모님", "엄마", "아빠", "친구", "아이", "애들", "할머니", "할아버지", "배우", "감독", "사람", "주인공"

        [출력 형식 (JSON)]
        {
        "intent": "exact_search" | "recommendation_search" | "condition_search",
        "keywords": {
            "title": string | null,
            "genres": string[],
            "actors": string[],
            "directors": string[]
        }
        }

        [예시]
        질문: "범죄도시 감독이 누구야?"
        응답: {
            "intent": "exact_search",
            "keywords": {
                "title": "범죄도시",
                "genres": [],
                "actors": [],
                "directors": []
                "timeframe": null
            }
        }

        질문: "머동석 나오는 액션 영화 추천해줘"
        응답: {
            "intent": "condition_search",
            "keywords": {
                "title": "",
                "genres": ["액션"],
                "actors": ["머동석"],
                "directors": []
                "timeframe": null
            }
        }

        질문: "인셉션 영화 소개해줘"
        응답: {
            "intent": "exact_search",
            "keywords": {
                "title": "인셉션",
                "genres": [],
                "actors": [],
                "directors": []
                "timeframe": null
            }
        }

        질문: "지금 개봉 중인 로맨스 영화 있어?"
        응답: {
            "intent": "exact_search",
            "keywords": {
                "title": "",
                "genres": ["로맨스"],
                "actors": [],
                "directors": []
                "timeframe": "current"
            }
        }

        질문: "체인소맨 언제 개봉해?"
        응답: {
            "intent": "exact_search",
            "keywords": {
                "title": "체인소 맨",
                "genres": [],
                "actors": [],
                "directors": [],
                "timeframe": null
            }
        }
        `;

        const userPrompt = `질문: "${userQuestion}"`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini', // 또는 gpt-3.5-turbo, gpt-4
                messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
                ],
                temperature: 0.1, // 분석은 창의성이 필요 없으므로 낮게 설정
                response_format: { type: 'json_object' },
            });

            const jsonResponse = completion.choices[0].message.content;
            if (!jsonResponse) {
                throw new Error('OpenAI 응답이 비어있습니다.');
            }

            const parsedResult = JSON.parse(jsonResponse) as MovieQueryAnalysisResult;
            
            this.logger.log(`분석 결과: ${JSON.stringify(parsedResult)}`);
            
            return parsedResult;
        } catch (error) {
        this.logger.error('쿼리 분석 실패', error);
        // 실패 시 기본값 반환
        return {
            intent: 'recommendation_search',
            keywords: {
                title: userQuestion,
                genres: [],
                actors: [],
                directors: [],
                timeframe: null
            },
        };
        }
    }
}