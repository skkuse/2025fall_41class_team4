'use client';

import { Movie, RecommendationTab, BoxOfficeMovie } from '@/types';
// import { boxOfficeMovies } from '@/data/mockData';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface RightPanelProps {
  recommendationTabs: RecommendationTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string | null) => void;
  onTabClose: (tabId: string) => void;
  onMovieSelect: (movie: Movie) => void;  // 박스오피스용
  boxOfficeList: BoxOfficeMovie[];
}

export default function RightPanel({ 
  recommendationTabs, 
  activeTabId, 
  onTabSelect, 
  onTabClose,
  onMovieSelect, 
  boxOfficeList
}: RightPanelProps) {
  
  const activeTab = recommendationTabs.find(tab => tab.id === activeTabId);
  // const displayMovies = activeTab ? activeTab.movies : (boxOfficeList || []);
  // const isBoxOffice = !activeTab;
  const displayMovies = boxOfficeList || [];
  const isBoxOffice = true;

  const handleMovieClick = (movie: any) => {
    // 박스오피스 데이터(BoxOfficeMovie)를 Movie 타입으로 변환해서 전달
    onMovieSelect({ 
        title: movie.title 
    } as Movie);
  };
  // 영화 클릭 핸들러
  // const handleMovieClick = (movie: Movie) => {
  //   if (isBoxOffice) {
  //     // 박스오피스 → 챗봇 질문
  //     onMovieSelect({ title: movie.title } as Movie);
  //   } else {
  //     // 추천 결과 → 외부 링크 (TMDB 또는 네이버 영화)
  //     const searchQuery = encodeURIComponent(movie.title);
  //     // 옵션 1: TMDB
  //     // window.open(`https://www.themoviedb.org/search?query=${searchQuery}`, '_blank');
      
  //     // 옵션 2: 네이버 영화 (한국 사용자용)
  //     window.open(`https://search.naver.com/search.naver?where=nexearch&query=${searchQuery}+영화`, '_blank');
      
  //     // 옵션 3: 구글 검색
  //     // window.open(`https://www.google.com/search?q=${searchQuery}+movie`, '_blank');
  //   }
  // };

  return (
    <div 
      className="flex flex-col h-screen"
      style={{ 
        width: '280px', 
        backgroundColor: '#F0F5EC', 
        borderLeft: '1px solid #D5E5D5' 
      }}
    >
      {/* 탭 영역 */}
      <div 
        style={{ 
          borderBottom: '1px solid #D5E5D5',
          backgroundColor: '#E8F0E0',
        }}
      >
        <div 
          style={{ 
            padding: '8px 12px', 
            overflowX: 'auto',
            display: 'flex',
            gap: '4px',
          }}
        >
          {/* 박스오피스 탭 */}
          <button
            onClick={() => onTabSelect(null)}
            className="flex items-center transition-all"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: isBoxOffice ? '#4A5D4A' : 'white',
              color: isBoxOffice ? 'white' : '#4A5D4A',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              gap: '4px',
              border: isBoxOffice ? 'none' : '1px solid #D5E5D5',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <EmojiEventsIcon style={{ fontSize: 14 }} />
            <span>박스오피스</span>
          </button>

          {/* 추천 결과 탭들 */}
          {recommendationTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className="flex items-center cursor-pointer transition-all"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: activeTabId === tab.id ? '#4A5D4A' : 'white',
                color: activeTabId === tab.id ? 'white' : '#4A5D4A',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                gap: '6px',
                border: activeTabId === tab.id ? 'none' : '1px solid #D5E5D5',
                flexShrink: 0,
              }}
            >
              <LocalMoviesIcon style={{ fontSize: 14 }} />
              <span style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="hover:opacity-70"
                style={{ 
                  marginLeft: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <CloseIcon style={{ fontSize: 12 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 헤더 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #D5E5D5' }}>
        <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
          {isBoxOffice ? (
            <EmojiEventsIcon style={{ color: '#FFD700', fontSize: 20 }} />
          ) : (
            <LocalMoviesIcon style={{ color: '#4A5D4A', fontSize: 20 }} />
          )}
          <h2 style={{ color: '#4A5D4A', fontWeight: 'bold', fontSize: '14px' }}>
            {isBoxOffice ? '박스오피스 TOP 5' : activeTab?.title}
          </h2>
        </div>
        <p style={{ color: '#8A9A8A', fontSize: '12px' }}>
          {isBoxOffice 
            ? '영화를 클릭하면 정보를 알려드려요!' 
            : '클릭하면 상세 정보 페이지로 이동해요 🔗'
          }
        </p>
      </div>

      {/* 영화 목록 */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayMovies.map((movie: any, index: number) => (
            <div
              key={index}
              onClick={() => handleMovieClick(movie)}
              className="cursor-pointer transition-all group"
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #E5E5E5',
              }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                {/* 순위 또는 번호 */}
                <div 
                  className="flex items-center justify-center font-bold"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: isBoxOffice 
                      ? (movie.rank === 1 ? '#FFD700' : movie.rank === 2 ? '#C0C0C0' : movie.rank === 3 ? '#CD7F32' : '#E8F0E0')
                      : '#E8F0E0',
                    color: isBoxOffice && movie.rank && movie.rank <= 3 ? 'white' : '#4A5D4A',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {isBoxOffice ? movie.rank : index + 1}
                </div>

                {/* 포스터 */}
                {/* <div 
                  style={{
                    width: '40px',
                    height: '56px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={movie.poster_url || 'https://via.placeholder.com/40x56?text=No+Img'}
                    alt={movie.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x56?text=No';
                    }}
                  />
                </div> */}

                {/* 정보 */}
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <h4 
                    className="font-semibold truncate"
                    style={{ color: '#2A3A2A', fontSize: '13px', marginBottom: '2px' }}
                  >
                    {movie.title}
                  </h4>
                  <p 
                    className="truncate"
                    style={{ color: '#8A9A8A', fontSize: '11px', marginBottom: '4px' }}
                  >
                    누적 {Number(movie.audiAcc).toLocaleString()}명
                  </p>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <span className="flex items-center" style={{ color: '#5A8D4A', fontSize: '11px', fontWeight: '600', gap: '2px' }}>
                      <StarIcon style={{ fontSize: 12, color: '#FFD700' }} />
                      {movie.rankInten}
                    </span>
                    <span style={{ color: '#A8B8A8', fontSize: '11px' }}>
                      {movie.openDt.slice(0, 4)}
                    </span>
                  </div>
                </div>

                {/* 외부 링크 아이콘 (추천 결과만) */}
                {!isBoxOffice && (
                  <OpenInNewIcon 
                    className="group-hover:opacity-100"
                    style={{ 
                      fontSize: 16, 
                      color: '#B8D4A8',
                      opacity: 0.5,
                      transition: 'opacity 0.2s',
                    }} 
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 안내 */}
      <div 
        style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #D5E5D5',
          backgroundColor: '#E8F0E0',
        }}
      >
        <p style={{ color: '#6A7D6A', fontSize: '11px', textAlign: 'center' }}>
          {isBoxOffice 
            ? '💡 영화를 선택하면 자세한 정보를 알려드려요'
            : '🔗 클릭하면 네이버 영화로 이동해요'
          }
        </p>
      </div>
    </div>
  );
}