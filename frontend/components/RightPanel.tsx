'use client';

import { Movie, RecommendationTab, BoxOfficeMovie } from '@/types';
// import { boxOfficeMovies } from '@/data/mockData';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';   // 상승
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // 하락
import RemoveIcon from '@mui/icons-material/Remove';             // 변동 없음
import { TheaterComedy } from '@mui/icons-material';

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
  
  const renderRankInten = (inten: string) => {
    const value = parseInt(inten, 10);
    
    // 1. 변동 없음 또는 데이터 없음 (회색)
    if (isNaN(value) || value === 0) {
      return (
        <div className="flex items-center" style={{ color: '#8A9A8A', gap: '2px' }}>
          <RemoveIcon style={{ fontSize: 14 }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>0</span>
        </div>
      );
    }

    // 2. 순위 상승 (빨간색 - 볼드체 강조)
    if (value > 0) {
      return (
        <div className="flex items-center" style={{ color: '#D32F2F', gap: '1px' }}>
          <TrendingUpIcon style={{ fontSize: 14 }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{value}</span>
        </div>
      );
    }

    // 3. 순위 하락 (파란색 - 깔끔한 느낌)
    if (value < 0) {
      return (
        <div className="flex items-center" style={{ color: '#1976D2', gap: '1px' }}>
          <TrendingDownIcon style={{ fontSize: 14 }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{Math.abs(value)}</span>
        </div>
      );
    }

    return null;
  };

  const activeTab = recommendationTabs.find(tab => tab.id === activeTabId);
  const isBoxOffice = activeTabId === null;

  const displayItems = isBoxOffice ? (boxOfficeList || []) : (activeTab?.items || []);

  const handleMovieClick = (item: any) => {
    // 박스오피스 데이터(BoxOfficeMovie)를 Movie 타입으로 변환해서 전달
    if (isBoxOffice) {
      onMovieSelect({ title: item.title } as Movie);
    } else {
      if (item.eventSite) {
        const url = item.booking_url || `https://search.naver.com/search.naver?query=${encodeURIComponent(item.title)}`;
        window.open(url, '_blank');
        return;
      }
      const url = `https://search.naver.com/search.naver?query=영화 ${encodeURIComponent(item.title)}`;
      window.open(url, '_blank');
    }
  };

  const getPosterSrc = (item: any) => {
      if (item.poster_url) { // 영화
          return item.poster_url.startsWith('http') ? item.poster_url : `https://image.tmdb.org/t/p/w200${item.poster_url}`;
      }
      if (item.image_url) { // 공연
          return item.image_url;
      }
      return '/MovingCastle.jpg';
    };

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
          className="custom-scrollbar"
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
              {tab.category === 'performance' ? (
                <TheaterComedy style={{ fontSize: 14 }} />
              ) : (
                <LocalMoviesIcon style={{ fontSize: 14 }} />
              )}

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

      {/* 리스트 목록 */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayItems.length === 0 ? (
            <div className="text-center py-10 text-[#8A9A8A] text-xs">
              추천 결과가 없습니다.
            </div>
          ) : (
            displayItems.map((item: any, index: number) => {
              const isPerformance = !!item.eventSite;
              return (
                <div
                  key={index}
                  onClick={() => handleMovieClick(item)}
                  className="cursor-pointer transition-all group flex"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #E5E5E5',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  {/* 1. 왼쪽: 순위 (박스오피스) 또는 포스터 추천*/}
                  {isBoxOffice ? (
                    <div 
                      className="flex items-center justify-center font-bold"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : item.rank === 3 ? '#CD7F32' : '#E8F0E0',
                        color: item.rank && item.rank <= 3 ? 'white' : '#4A5D4A',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {item.rank}
                    </div>
                  ) : (
                    <div 
                      style={{
                        width: '40px',
                        height: '56px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#f0f0f0'
                      }}
                    >
                      <img
                        src={getPosterSrc(item)}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/MovingCastle.jpg';
                        }}
                      />
                    </div>
                  )}

                  {/* 2. 중앙: 정보 */}
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <h4 
                      className="font-semibold truncate"
                      style={{ color: '#2A3A2A', fontSize: '13px', marginBottom: '2px' }}
                    >
                      {item.title}
                    </h4>

                    {isBoxOffice && (
                    <>
                      <p 
                        className="truncate"
                        style={{ color: '#8A9A8A', fontSize: '11px', marginBottom: '2px' }}>
                        누적 {Number(item.audiAcc).toLocaleString()}명
                        </p>
                        <div className="flex items-center gap-2">
                                {renderRankInten(item.rankInten)}
                                <span style={{ color: '#A8B8A8', fontSize: '11px' }}>
                                    {item.openDt?.slice(0, 4)}년
                                </span>
                            </div>
                        </>
                        )}
                        {/* 추천 영화인 경우 (!isBoxOffice && !isPerformance) */}
                        {!isBoxOffice && !isPerformance && (
                        <>
                            <div className="flex items-center gap-1 mb-1">
                                <StarIcon style={{ fontSize: 12, color: '#F5C518' }} />
                                <span style={{ fontSize: '11px', color: '#4A5D4A', fontWeight: 600 }}>
                                    {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                                </span>
                                <span style={{ fontSize: '10px', color: '#A8B8A8' }}>
                                    • {item.release_date?.slice(0, 4)}
                                </span>
                            </div>
                            {item.genres && (
                                <div className="flex gap-1 overflow-hidden">
                                    {item.genres.slice(0, 2).map((g: string, i: number) => (
                                        <span key={i} className="text-[10px] bg-[#F0F5EC] text-[#6A7D6A] px-1 rounded">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                        )}

                        {/* 추천 공연인 경우 (!isBoxOffice && isPerformance) */}
                        {!isBoxOffice && isPerformance && (
                        <>
                            <p className="truncate" style={{ color: '#6A7D6A', fontSize: '11px', marginBottom: '2px' }}>
                                {item.eventSite} ({item.city})
                            </p>
                            <p style={{ color: '#8A9A8A', fontSize: '10px' }}>
                                {item.start_date} ~ {item.end_date}
                            </p>
                        </>
                        )}
                    </div>

                    {/* 3. 오른쪽: 외부 링크 아이콘 (추천 탭만) */}
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
                );
            })
          )}
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
            ? '💡 영화를 선택하면 채팅으로 정보를 물어봐요'
            : '🔗 클릭하면 더 자세한 정보를 볼 수 있어요'
          }
        </p>
      </div>
    </div>
  );
}
          