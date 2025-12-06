import { Movie } from '@/types';

// 기존 mockMovies 유지
export const mockMovies: Movie[] = [
  {
    id: 1,
    title: '인셉션',
    originalTitle: 'Inception',
    posterPath: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Ber.jpg',
    releaseDate: '2010-07-16',
    rating: 8.8,
    genre: ['액션', 'SF', '스릴러'],
    overview: '타인의 꿈에 들어가 생각을 훔치는 특수 보안요원 코브. 그에게 불가능한 미션이 주어진다.',
    director: '크리스토퍼 놀란',
    cast: ['레오나르도 디카프리오', '조셉 고든-레빗', '엘렌 페이지'],
  },
  {
    id: 2,
    title: '인터스텔라',
    originalTitle: 'Interstellar',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    releaseDate: '2014-11-06',
    rating: 8.6,
    genre: ['SF', '드라마', '모험'],
    overview: '식량난으로 멸망 위기에 처한 인류를 구하기 위해 우주로 떠나는 탐험대의 이야기.',
    director: '크리스토퍼 놀란',
    cast: ['매튜 맥커너히', '앤 해서웨이', '제시카 차스테인'],
  },
  {
    id: 3,
    title: '파라사이트',
    originalTitle: 'Parasite',
    posterPath: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    releaseDate: '2019-05-30',
    rating: 8.5,
    genre: ['드라마', '스릴러', '코미디'],
    overview: '전원 백수인 기택 가족이 부유한 박 사장 가족에게 기생하면서 벌어지는 이야기.',
    director: '봉준호',
    cast: ['송강호', '이선균', '조여정', '최우식'],
  },
  {
    id: 4,
    title: '어바웃 타임',
    originalTitle: 'About Time',
    posterPath: 'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg',
    releaseDate: '2013-11-07',
    rating: 7.8,
    genre: ['로맨스', '코미디', '판타지'],
    overview: '시간 여행 능력을 가진 청년이 사랑을 찾아가는 과정을 그린 로맨틱 코미디.',
    director: '리처드 커티스',
    cast: ['돔놀 글리슨', '레이첼 맥아담스', '빌 나이'],
  },
  {
    id: 5,
    title: '듄',
    originalTitle: 'Dune',
    posterPath: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    releaseDate: '2021-10-20',
    rating: 8.0,
    genre: ['SF', '모험', '드라마'],
    overview: '아라키스라는 사막 행성에서 펼쳐지는 우주 대서사시.',
    director: '드니 빌뇌브',
    cast: ['티모시 샬라메', '레베카 퍼거슨', '젠데이아'],
  },
  {
    id: 6,
    title: '라라랜드',
    originalTitle: 'La La Land',
    posterPath: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    releaseDate: '2016-12-09',
    rating: 8.0,
    genre: ['로맨스', '뮤지컬', '드라마'],
    overview: '재즈 피아니스트와 배우 지망생의 꿈과 사랑을 그린 뮤지컬 영화.',
    director: '데이미언 셔젤',
    cast: ['라이언 고슬링', '엠마 스톤'],
  },
  {
    id: 7,
    title: '다크 나이트',
    originalTitle: 'The Dark Knight',
    posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    releaseDate: '2008-07-18',
    rating: 9.0,
    genre: ['액션', '범죄', '드라마'],
    overview: '조커의 등장으로 고담시가 혼란에 빠지고, 배트맨은 그를 막기 위해 고군분투한다.',
    director: '크리스토퍼 놀란',
    cast: ['크리스찬 베일', '히스 레저', '아론 에크하트'],
  },
  {
    id: 8,
    title: '위대한 쇼맨',
    originalTitle: 'The Greatest Showman',
    posterPath: 'https://image.tmdb.org/t/p/w500/b9CeobVwOHBCDWU1LhvDqrAxCDw.jpg',
    releaseDate: '2017-12-20',
    rating: 7.6,
    genre: ['뮤지컬', '드라마', '전기'],
    overview: '서커스의 창시자 P.T. 바넘의 일대기를 그린 뮤지컬 영화.',
    director: '마이클 그레이시',
    cast: ['휴 잭맨', '잭 에프론', '미셸 윌리엄스'],
  },
];

// 박스오피스 Mock 데이터 (순위 포함)
export const boxOfficeMovies: Movie[] = [
  {
    id: 101,
    title: '글래디에이터 2',
    originalTitle: 'Gladiator II',
    posterPath: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    releaseDate: '2024-11-14',
    rating: 8.2,
    genre: ['액션', '드라마', '역사'],
    overview: '로마 제국의 영광과 복수의 서사시가 다시 펼쳐진다.',
    director: '리들리 스콧',
    cast: ['폴 메스칼', '덴젤 워싱턴', '페드로 파스칼'],
    rank: 1,
  },
  {
    id: 102,
    title: '위키드',
    originalTitle: 'Wicked',
    posterPath: 'https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg',
    releaseDate: '2024-11-22',
    rating: 8.0,
    genre: ['뮤지컬', '판타지', '드라마'],
    overview: '오즈의 마법사 이전, 두 마녀의 우정과 운명을 그린 뮤지컬.',
    director: '존 추',
    cast: ['신시아 에리보', '아리아나 그란데'],
    rank: 2,
  },
  {
    id: 103,
    title: '모아나 2',
    originalTitle: 'Moana 2',
    posterPath: 'https://image.tmdb.org/t/p/w500/4YZpsylmjHbqeWzjKpUEF8gcLNW.jpg',
    releaseDate: '2024-11-27',
    rating: 7.8,
    genre: ['애니메이션', '모험', '가족'],
    overview: '모아나가 새로운 모험을 떠나 먼 바다의 비밀을 밝힌다.',
    director: '데이비드 더릭 주니어',
    cast: ['아울리이 크라발류'],
    rank: 3,
  },
  {
    id: 104,
    title: '청설',
    originalTitle: 'Hear Me: Our Summer',
    posterPath: 'https://image.tmdb.org/t/p/w500/dNplLniTHwoyLT7VdjLQrMfyjxw.jpg',
    releaseDate: '2024-10-02',
    rating: 8.1,
    genre: ['로맨스', '드라마'],
    overview: '말없이도 통하는 두 사람의 아름다운 여름 이야기.',
    director: '조선호',
    cast: ['홍경', '노윤서', '김민주'],
    rank: 4,
  },
  {
    id: 105,
    title: '베놈: 라스트 댄스',
    originalTitle: 'Venom: The Last Dance',
    posterPath: 'https://image.tmdb.org/t/p/w500/k42Owka8v91Fw3HVezbFNgpj2dp.jpg',
    releaseDate: '2024-10-22',
    rating: 7.5,
    genre: ['액션', 'SF', '스릴러'],
    overview: '에디 브록과 베놈의 마지막 여정이 시작된다.',
    director: '켈리 마셜',
    cast: ['톰 하디', '치웨텔 에지오포'],
    rank: 5,
  },
];

export const genres = [
  '전체', '액션', 'SF', '드라마', '코미디', '로맨스', 
  '스릴러', '공포', '판타지', '애니메이션', '뮤지컬', '모험'
];

export const years = [
  '전체', '2024', '2023', '2022', '2021', '2020', 
  '2019', '2018', '2017', '2016', '2015', '2010년대', '2000년대'
];

export const ratings = [
  '전체', '9점 이상', '8점 이상', '7점 이상', '6점 이상'
];

// Mock AI 응답 생성
export const generateMockResponse = (userMessage: string): { content: string; movies: Movie[] } => {
  const lowerMessage = userMessage.toLowerCase();
  
  let responseMovies: Movie[] = [];
  let responseText = '';

  // 박스오피스 영화 정보 요청 체크
  const boxOfficeMovie = boxOfficeMovies.find(m => 
    userMessage.includes(m.title) || 
    (m.originalTitle && userMessage.toLowerCase().includes(m.originalTitle.toLowerCase()))
  );

  if (boxOfficeMovie) {
    responseMovies = [boxOfficeMovie];
    responseText = `**${boxOfficeMovie.title}** (${boxOfficeMovie.originalTitle})

📅 개봉일: ${boxOfficeMovie.releaseDate}
⭐ 평점: ${boxOfficeMovie.rating}
🎬 감독: ${boxOfficeMovie.director}
🎭 출연: ${boxOfficeMovie.cast?.join(', ')}

📖 줄거리: ${boxOfficeMovie.overview}

현재 박스오피스 ${boxOfficeMovie.rank}위를 기록 중이에요! 🎉`;
    return { content: responseText, movies: responseMovies };
  }

  // 기존 영화 정보 요청 체크
  const existingMovie = mockMovies.find(m => 
    userMessage.includes(m.title) || 
    (m.originalTitle && userMessage.toLowerCase().includes(m.originalTitle.toLowerCase()))
  );

  if (existingMovie) {
    responseMovies = [existingMovie];
    responseText = `**${existingMovie.title}** (${existingMovie.originalTitle})

📅 개봉일: ${existingMovie.releaseDate}
⭐ 평점: ${existingMovie.rating}
🎬 감독: ${existingMovie.director}
🎭 출연: ${existingMovie.cast?.join(', ')}

📖 줄거리: ${existingMovie.overview}`;
    return { content: responseText, movies: responseMovies };
  }

  // 장르별 추천
  if (lowerMessage.includes('sf') || lowerMessage.includes('공상과학') || lowerMessage.includes('우주')) {
    responseMovies = mockMovies.filter(m => m.genre.includes('SF'));
    responseText = 'SF 영화를 찾고 계시군요! 다음 영화들을 추천드립니다. 🚀';
  } else if (lowerMessage.includes('로맨스') || lowerMessage.includes('사랑') || lowerMessage.includes('연애')) {
    responseMovies = mockMovies.filter(m => m.genre.includes('로맨스'));
    responseText = '로맨틱한 영화를 추천해드릴게요! 💕';
  } else if (lowerMessage.includes('액션') || lowerMessage.includes('스릴러')) {
    responseMovies = mockMovies.filter(m => m.genre.includes('액션') || m.genre.includes('스릴러'));
    responseText = '스릴 넘치는 액션 영화들입니다! 🔥';
  } else if (lowerMessage.includes('뮤지컬') || lowerMessage.includes('음악')) {
    responseMovies = mockMovies.filter(m => m.genre.includes('뮤지컬'));
    responseText = '음악이 아름다운 뮤지컬 영화들이에요! 🎵';
  } else if (lowerMessage.includes('놀란') || lowerMessage.includes('nolan')) {
    responseMovies = mockMovies.filter(m => m.director === '크리스토퍼 놀란');
    responseText = '크리스토퍼 놀란 감독의 명작들입니다! 🎬';
  } else if (lowerMessage.includes('평점') || lowerMessage.includes('명작') || lowerMessage.includes('추천')) {
    responseMovies = mockMovies.filter(m => m.rating >= 8.5);
    responseText = '평점이 높은 명작 영화들을 추천드려요! ⭐';
  } else if (lowerMessage.includes('박스오피스') || lowerMessage.includes('순위') || lowerMessage.includes('현재 상영')) {
    responseMovies = boxOfficeMovies;
    responseText = '현재 박스오피스 순위입니다! 🏆';
  } else {
    responseMovies = mockMovies.slice(0, 4);
    responseText = '다음 인기 영화들을 추천드립니다! 어떤 장르나 분위기를 원하시는지 말씀해주시면 더 맞춤 추천을 해드릴게요. 🎬';
  }

  return {
    content: responseText,
    movies: responseMovies,
  };
};