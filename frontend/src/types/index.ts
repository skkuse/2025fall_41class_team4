// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  items?: (Movie | Performance)[];
}

// 영화 타입
export interface Movie {
  rating: number;
  id: number;
  title: string;
  poster_url: string | null;
  release_date: string;
  vote_average: number;
  genres: string[];
  overview?: string;
  original_title?: string;
  backdrop_path?: string | null;
}

// 공연 타입
export interface Performance {
  id: number;
  title: string;
  type: string;
  eventSite: string;
  city: string;
  start_date: string;
  end_date: string;
  image_url: string;
  booking_url?: string;
  summary: string;
}

// 박스오피스 영화 타입
export interface BoxOfficeMovie {
  rank: number | string;
  title: string;
  audiAcc: string;
  rankInten: string;
  openDt: string;
  poster_url?: string;
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
  title: string;
  query: string;
  category: 'movie' | 'performance';
  items: (Movie | Performance)[];
  createdAt: Date;
}

// 채팅 세션 타입
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  recommendationTabs?: RecommendationTab[];
  activeTabId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}