import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { MovieData } from '../search/movie-search.service';
import { MovieQueryAnalysisResult } from '../query-analysis/movie-query-analysis.service';

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

    async generateAnswer(
        userQuestion: string, 
        movieData: MovieData[],
        analysisResult?: MovieQueryAnalysisResult,
        history: any[] = []
    ): Promise<MovieResponse> {
        this.logger.log(`📝 답변 생성 시작 (검색된 영화: ${movieData.length}개)`);
        const corrections = analysisResult?.correctedKeywords || [];
        const correctionNotice = corrections.length > 0 
            ? corrections.map(c => `'${c.original}' -> '${c.corrected}'`).join(', ')
            : null;

        const systemPrompt = `
        너는 영화 전문 AI 큐레이터 'LLMuse'야.
        사용자의 질문과 이전 대화 기록 그리고 관련 영화 데이터(JSON)를 줄 테니, **전문가로서 자연스럽게 답변해줘.**

        [핵심 행동 지침]
        1. **형식의 자유**: 
            - 딱딱한 템플릿(항목 나열)에 얽매이지 마.
            - 질문의 의도에 맞춰서 **술술 읽히는 줄글(Narrative)** 형태로 답변해도 좋아
            - 단, 포스터는 사용하지마.
        
        2. **가독성 (필수)**:
            - 대신 가독성을 위해 **Markdown 문법**은 적극적으로 써줘.
            - 영화 제목은 반드시 **굵게(**제목**)** 처리해.
            - 문단 사이에는 빈 줄을 넣어서 시원하게 보이게 해.
            - 중요한 문구는 인용구(>)나 이탤릭(_) 등을 적절히 섞어서 강조해.
            - 이모지를 사용해도 좋아

        3. **데이터 활용**:
            - 제공된 JSON 데이터를 기반으로 사실을 말해.
            - 태그라인이 있다면, 답변 중간에 자연스럽게 녹여서 설명해. (예: "관객들은 특히 ~점에 열광했어요.")
            - 태그라인을 쓸 땐 "태그라인"이라는 단어는 쓰지 말고, 자연스럽게 문장에 포함시켜.
            - 태그라인을 쓸 떈 "_"는 절대 사용하지마.
            - 평점이나 흥행 성적, 리뷰 수치 등을 언급할 땐, 구체적인 숫자를 활용해서 신뢰감을 높여줘.
            - 영화의 키워드는 사용하지마.

        4. **개봉 상태 처리**:
            - **[날짜 처리 절대 규칙]**:
                - 너는 날짜를 직접 계산하지 마. **무조건 데이터의 'release_status' 필드를 따라야 해.**
                - 데이터에 **'개봉됨'**이라고 적혀있으면, 날짜가 미래처럼 보여도 무조건 **"개봉했습니다"**라고 말해.
                - 데이터에 **'미개봉'**이라고 적혀있으면, 무조건 **"개봉 예정입니다"**라고 말해.
                - 연도(예: 2025년)가 네 학습 시점보다 미래라도, **'release_status'가 우선**이야.
            - **[날짜 처리 작성법]**:
                - "~[release_date]에 개봉한 영화로 ~" 또는 "~[release_date]에 개봉 예정인 영화로 ~"처럼 자연스럽게 문장에 녹여서 말해.

        4. **의도에 따른 태도**:
            - **추천 요청**이면: 1위 영화를 메인으로 강력 추천하고, 나머지는 "그 외에도 ~가 있습니다" 식으로 가볍게 언급해.
            - **단순 정보 질문**이면: 묻는 말에 정확하고 간결하게 대답해. (TMI 남발 금지)

        5. **말투**:
            - 친절하고, 영화를 잘 아는 '영화광 친구'가 신나서 설명하는 듯한 톤을 유지해.

        6. **[중요] 오타 교정 안내 (센스 발휘)**:
            - 사용자 질문에 오타가 있어서 시스템이 자동으로 교정한 경우, 정보를 별도로 줄 거야.
            - 단 '체인소맨'의 경우 이 부분을 생략해 
            - 교정 정보가 있다면, 답변의 **가장 첫 문장**에 자연스럽게 언급해줘.
            - 예시: "혹시, '마동식'이 아니라 **'마동석'** 배우님을 찾으시나요? 배우 **'마동석' 배우님의 영화들로 추천해볼게요!" 
            - 사용자를 무안하게 하지 말고, "제가 찰떡같이 알아들었어요"라는 뉘앙스로 센스 있게 말해.
            - 오타가 없다면 이 부분은 생략해줘.
        `;

        // 2. 유저 프롬프트: 질문 + 데이터 결합
        const userPrompt = `
        [사용자 질문]
        "${userQuestion}"

        [검색된 영화 데이터 (우선순위 1)]
        ${JSON.stringify(movieData, null, 2)}

        [오타 교정 정보]
        ${correctionNotice ? `시스템이 다음 단어를 교정했습니다: ${correctionNotice}` : '교정된 단어 없음.'}

        [영화 데이터 출력 방법]
        (각 영화 설명이 끝나면 **반드시 빈 줄을 추가**하여 읽기 편하게 말해줘.)
        가능한 한 **많은 영화 정보를 활용**해서 답변해줘.
        영화가 개봉 중인지, 개봉 예정인지 반드시 구분해서 설명해줘.
        
        (데이터가 비어있다면([]), 네 지식을 활용해서 질문에 답변해줘.)
        `;

        try {
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini', // [수정] 올바른 모델명
            messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
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