import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { MovieData } from '../search/movie-search.service';

// [NEW] 반환 타입 정의 (Performance와 통일)
export interface MovieResponse {
    answer: string;
    items: MovieData[];
}

@Injectable()
export class MovieLlmResponseService {
    private openai: OpenAI;
    private readonly logger = new Logger(MovieLlmResponseService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.openai = new OpenAI({ apiKey });
    }

    async generateAnswer(userQuestion: string, movieData: MovieData[]): Promise<MovieResponse> {
        this.logger.log(`📝 답변 생성 시작 (검색된 영화: ${movieData.length}개)`);

        const systemPrompt = `
        너는 영화 추천 AI 챗봇 'LLMuse'야.
        사용자의 질문과, 그 질문에 대해 검색된 영화 데이터(JSON)가 주어질 거야.

        [답변 생성 우선순위 및 규칙]
        
        1. **제공된 영화 데이터(JSON)**가 있다면, **무조건 그 데이터를 최우선**으로 사용하여 답변해.
            - 데이터에 있는 내용에서 original_language가 "zh", "cn", "hi" 즉 중국어, 광동어, 힌디어인 데이터는 제외하고 답변해.
            - 데이터에 있는 내용(평점, 개봉일, 줄거리 등)은 사실 그대로 전달해.
            - 포스터에 대한 내용은 전달하지 마.
        
        2. **만약 제공된 영화 데이터가 비어있거나 부족하다면**, 포기하지 말고 **너의 사전 지식(Internal Knowledge)**을 활용해서 답변해.
            - 예: 사용자가 "고전 명작 추천해줘"라고 했는데 검색 결과가 없다면, 네가 알고 있는 명작들(바람과 함께 사라지다, 시민 케인 등)을 추천해줘.
            - 단, 네 지식으로 답변할 때는 **"검색 결과에는 없지만, 제 지식을 바탕으로 말씀드리면..."** 같은 문구를 **반드시** 붙여서 답변해줘.
            - 네 지식으로 답변할 때는 **가짜 URL이나 가짜 ID를 절대로 만들어내지 마.** (이미지나 링크는 생략해).

        3. **말투 및 형식**:
            - 친절하고 전문적인 '해요체' (~입니다, ~해요).
            - 영화 제목은 굵게 표시하거나 강조해줘.
            - 추천 리스트는 번호(1. 2.)를 매겨줘.
            - 각 영화 설명이 끝나면 **반드시 빈 줄을 추가**하여 읽기 편하게 말해줘.

        `;

        // 2. 유저 프롬프트: 질문 + 데이터 결합
        const userPrompt = `
        [사용자 질문]
        "${userQuestion}"

        [검색된 영화 데이터 (우선순위 1)]
        ${JSON.stringify(movieData, null, 2)}

        [영화 데이터 출력 방법]
        (추천 리스트는 번호(1. 2.)를 매겨줘.)
        (각 영화 설명이 끝나면 **반드시 빈 줄을 추가**하여 읽기 편하게 말해줘.)
        
        (데이터가 비어있다면([]), 네 지식을 활용해서 질문에 답변해줘.)
        (만약 너의 지식으로 답변을 한다면, **"검색 결과에는 없지만, 제 지식을 바탕으로 말씀드리면..."** 같은 문구를 **반드시** 붙여서 답변해줘.)
        `;

        try {
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini', // [수정] 올바른 모델명
            messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
        });

        const answer = completion.choices[0].message.content || '죄송합니다. 답변 생성 실패.';
        
        return {
            answer: answer,
            items: movieData // 검색된 데이터를 그대로 반환 (프론트에서 카드 렌더링용)
        };

        } catch (error) {
        this.logger.error('답변 생성 실패', error);
        return { answer: '오류가 발생했습니다.', items: [] };
        }
    }
}