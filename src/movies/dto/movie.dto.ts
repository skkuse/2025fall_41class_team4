// src/movies/dto/movie.dto.ts

export interface Movie {
    id: string;          // 우리 시스템의 고유 ID (예: 'kobis-20231234')
    title: string;       // 영화 제목 (from KOBIS)
    overview: string;    // 줄거리 (from TMDB)
    posterUrl: string;   // 포스터 이미지 URL (from TMDB)
    releaseDate: string; // 개봉일 (from KOBIS)
    rating: number;      // 평점 (from TMDB)
    // genres: string[];    // 장르 (from TMDB)
    // typeName: string; // 영화 유형 (from KOBIS)
    // genreName: string; // 영화 장르 (from KOBIS)
    // dailyRank?: number;  // 일별 박스오피스 순위 (from KOBIS, optional)
    // audiAcc?: number;    // 누적 관객수 (from KOBIS, optional)
    // scrnCnt?: number;   // 해당일자에 상영한 스크린 수 (from KOBIS, optional)
    // showCnt?: number;   // 해당일자에 상영된 횟수 (from KOBIS, optional)
    // showTime?: number; // 해당일자에 상영된 총 시간 (from KOBIS, optional)
    // nationName?: string; // 제작 국가 (from KOBIS)
    // directors?: string[]; // 감독 이름들 (from KOBIS)
    // actors?: string[];    // 배우 이름들 (from KOBIS)
    // audits?: string[];   // 심의 정보 (from KOBIS)
    // watchGradeName?: string; // 관람 등급 (from KOBIS)
}

// AI 답변의 출처(Source) 데이터 형식을 위한 인터페이스
export interface Source {
    id: string;
    title: string;
    posterUrl: string;
}