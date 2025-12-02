// 영화 타입
export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_url: string;
  genres?: string[];
}

export interface Performance {
  id: string;
  title: string;
  type: '연극' | '뮤지컬' | '오페라' | '음악' | '콘서트' | '국악' | '무용' | '전시' | '기타' | null;
  eventSite: string;
  imageObject: string; //poster_url
  description: string;
}

export interface ChatMessage {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  items? : Movie[] | Performance[];
}

export interface BoxOfficeMovie {
  rank: string;
  title: string;
  openDt: string;
  audiAcc: string;
  rankInten: string;
  poster_url?: string; 
}

export interface ChatSession {
  id: string;      
  title: string;   
  messages: ChatMessage[]; 
  createdAt: string;
  tabs: RecommendationTab[]; 
  activeTabId: string | null; 
}

// 검색 필터 타입
export interface SearchFilters {
  genre: string;
  year: string;
  rating: string;
  sortBy: 'popularity' | 'latest' | 'rating';
}

// 추천 결과 탭 타입
export interface RecommendationTab {
  id: string;
  title: string;        // 질문 내용 요약
  query: string;        // 원래 질문
  movies: Movie[];      // 추천된 영화들
  createdAt: Date;
}