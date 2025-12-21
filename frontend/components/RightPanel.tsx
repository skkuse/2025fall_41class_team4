'use client';

import { Movie, Performance, RecommendationTab, BoxOfficeMovie } from '@/types';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { TheaterComedy } from '@mui/icons-material';

interface RightPanelProps {
  recommendationTabs: RecommendationTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string | null) => void;
  onTabClose: (tabId: string) => void;
  onMovieSelect: (movie: Movie) => void;
  boxOfficeList: BoxOfficeMovie[];
  category: 'movie' | 'performance'; 
}

type DisplayItem = BoxOfficeMovie | Movie | Performance;

export default function RightPanel({ 
  recommendationTabs, 
  activeTabId, 
  onTabSelect, 
  onTabClose,
  onMovieSelect, 
  boxOfficeList,
  category
}: RightPanelProps) {
  
  const renderRankInten = (inten: string) => {
    const value = parseInt(inten, 10);
    
    if (isNaN(value) || value === 0) {
      return (
        <div className="flex items-center" style={{ color: '#9E9E9E', gap: '2px' }}>
          <RemoveIcon style={{ fontSize: 14 }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>0</span>
        </div>
      );
    }

    if (value > 0) {
      return (
        <div className="flex items-center" style={{ color: '#D32F2F', gap: '1px' }}>
          <TrendingUpIcon style={{ fontSize: 14 }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>↑{value}</span>
        </div>
      );
    }

    if (value < 0) {
      return (
        <div className="flex items-center" style={{ color: '#1976D2', gap: '1px' }}>
          <TrendingDownIcon style={{ fontSize: 14 }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>↓{Math.abs(value)}</span>
        </div>
      );
    }

    return null;
  };

  const activeTab = recommendationTabs.find(tab => tab.id === activeTabId);
  const isBoxOffice = activeTabId === null;

  const displayItems: DisplayItem[] = isBoxOffice ? (boxOfficeList || []) : (activeTab?.items || []);

  const handleMovieClick = (item: DisplayItem) => {
    if (isBoxOffice) {
      const boxOfficeItem = item as BoxOfficeMovie;
      onMovieSelect({ title: boxOfficeItem.title } as Movie);
    } else {
      if ('eventSite' in item) {
        const perfItem = item as Performance;
        const url = perfItem.booking_url || `https://search.naver.com/search.naver?query=${encodeURIComponent(perfItem.title)}`;
        window.open(url, '_blank');
        return;
      }
      const movieItem = item as Movie;
      const url = `https://search.naver.com/search.naver?query=영화 ${encodeURIComponent(movieItem.title)}`;
      window.open(url, '_blank');
    }
  };

  const getPosterSrc = (item: DisplayItem): string => {
    if ('poster_url' in item && item.poster_url) {
      return item.poster_url.startsWith('http') 
        ? item.poster_url 
        : `https://image.tmdb.org/t/p/w200${item.poster_url}`;
    }
    if ('image_url' in item && item.image_url) {
      return item.image_url;
    }
    return '/MovingCastle.jpg';
  };

  // 공연 모드에서 추천 탭도 없을 때
  const showEmptyState = category === 'performance' && recommendationTabs.length === 0;

  return (
    <div 
      className="flex flex-col h-screen"
      style={{ 
        width: '280px', 
        backgroundColor: '#FAFAFA', 
        borderLeft: '1px solid #E0E0E0' 
      }}
    >
      {/* 탭 영역 */}
      <div 
        style={{ 
          borderBottom: '1px solid #E0E0E0',
          backgroundColor: '#F5F5F5',
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
          {/* 박스오피스 탭 - 영화 모드일 때만 표시 */}
          {category === 'movie' && (
            <button
              onClick={() => onTabSelect(null)}
              className="flex items-center transition-all"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isBoxOffice ? '#424242' : 'white',
                color: isBoxOffice ? 'white' : '#424242',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                gap: '4px',
                border: isBoxOffice ? 'none' : '1px solid #E0E0E0',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <EmojiEventsIcon style={{ fontSize: 14 }} />
              <span>박스오피스</span>
            </button>
          )}

          {/* 추천 결과 탭들 */}
          {recommendationTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className="flex items-center cursor-pointer transition-all"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: activeTabId === tab.id ? '#424242' : 'white',
                color: activeTabId === tab.id ? 'white' : '#424242',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                gap: '6px',
                border: activeTabId === tab.id ? 'none' : '1px solid #E0E0E0',
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

      {/* 공연 모드에서 추천 탭 없을 때 */}
      {showEmptyState ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <TheaterComedy style={{ fontSize: 48, color: '#E0E0E0', marginBottom: '16px' }} />
            <p style={{ color: '#616161', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
              공연 추천을 받아보세요!
            </p>
            <p style={{ color: '#9E9E9E', fontSize: '12px' }}>
              왼쪽 채팅에서 공연이나 전시를 물어보세요
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 헤더 */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
            <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
              {isBoxOffice ? (
                <EmojiEventsIcon style={{ color: '#FFD700', fontSize: 20 }} />
              ) : (
                activeTab?.category === 'performance' ? (
                  <TheaterComedy style={{ color: '#616161', fontSize: 20 }} />
                ) : (
                  <LocalMoviesIcon style={{ color: '#616161', fontSize: 20 }} />
                )
              )}
              <h2 style={{ color: '#424242', fontWeight: 'bold', fontSize: '14px' }}>
                {isBoxOffice ? '박스오피스 TOP 5' : activeTab?.title}
              </h2>
            </div>
            <p style={{ color: '#9E9E9E', fontSize: '12px' }}>
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
                <div className="text-center py-10 text-[#9E9E9E] text-xs">
                  추천 결과가 없습니다.
                </div>
              ) : (
                displayItems.map((item: DisplayItem, index: number) => {
                  const isPerformance = 'eventSite' in item;
                  const isMovie = 'poster_url' in item;

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
                        border: '1px solid #E0E0E0',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      {/* 왼쪽: 순위 (박스오피스) 또는 포스터 (추천) */}
                      {isBoxOffice ? (
                        <div 
                          className="flex items-center justify-center font-bold"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: 
                              String((item as BoxOfficeMovie).rank) === '1' ? '#FFD700' : 
                              String((item as BoxOfficeMovie).rank) === '2' ? '#C0C0C0' : 
                              String((item as BoxOfficeMovie).rank) === '3' ? '#CD7F32' : '#EEEEEE',
                            color: 
                              ['1', '2', '3'].includes(String((item as BoxOfficeMovie).rank)) ? 'white' : '#424242',
                            fontSize: '14px',
                            flexShrink: 0,
                          }}
                        >
                          {(item as BoxOfficeMovie).rank}
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
                            alt={(item as Movie | Performance).title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/MovingCastle.jpg';
                            }}
                          />
                        </div>
                      )}

                      {/* 중앙: 정보 */}
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <h4 
                          className="font-semibold truncate"
                          style={{ color: '#212121', fontSize: '13px', marginBottom: '2px' }}
                        >
                          {(item as Movie | Performance | BoxOfficeMovie).title}
                        </h4>

                        {/* 박스오피스 정보 */}
                        {isBoxOffice && (
                          <>
                            <p 
                              className="truncate"
                              style={{ color: '#9E9E9E', fontSize: '11px', marginBottom: '2px' }}
                            >
                              누적 {Number((item as BoxOfficeMovie).audiAcc).toLocaleString()}명
                            </p>
                            <div className="flex items-center gap-2">
                              {renderRankInten((item as BoxOfficeMovie).rankInten)}
                              <span style={{ color: '#BDBDBD', fontSize: '11px' }}>
                                {(item as BoxOfficeMovie).openDt?.slice(0, 4)}년
                              </span>
                            </div>
                          </>
                        )}

                        {/* 추천 영화 정보 */}
                        {!isBoxOffice && isMovie && !isPerformance && (
                          <>
                            <div className="flex items-center gap-1 mb-1">
                              <StarIcon style={{ fontSize: 12, color: '#F5C518' }} />
                              <span style={{ fontSize: '11px', color: '#616161', fontWeight: 600 }}>
                                {(item as Movie).vote_average ? (item as Movie).vote_average.toFixed(1) : 'N/A'}
                              </span>
                              <span style={{ fontSize: '10px', color: '#BDBDBD' }}>
                                • {(item as Movie).release_date?.slice(0, 4)}
                              </span>
                            </div>
                            {(item as Movie).genres && (
                              <div className="flex gap-1 overflow-hidden">
                                {(item as Movie).genres.slice(0, 2).map((g: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-[#F5F5F5] text-[#757575] px-1 rounded">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* 추천 공연 정보 */}
                        {!isBoxOffice && isPerformance && (
                          <>
                            <p className="truncate" style={{ color: '#757575', fontSize: '11px', marginBottom: '2px' }}>
                              {(item as Performance).eventSite} ({(item as Performance).city})
                            </p>
                            <p style={{ color: '#9E9E9E', fontSize: '10px' }}>
                              {(item as Performance).start_date} ~ {(item as Performance).end_date}
                            </p>
                          </>
                        )}
                      </div>

                      {/* 오른쪽: 외부 링크 아이콘 (추천 탭만) */}
                      {!isBoxOffice && (
                        <OpenInNewIcon 
                          className="group-hover:opacity-100"
                          style={{ 
                            fontSize: 16, 
                            color: '#BDBDBD',
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
        </>
      )}

      {/* 하단 안내 */}
      <div 
        style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #E0E0E0',
          backgroundColor: '#F5F5F5',
        }}
      >
        <p style={{ color: '#757575', fontSize: '11px', textAlign: 'center' }}>
          {showEmptyState
            ? '🎭 AI에게 공연을 물어보세요'
            : isBoxOffice 
              ? '💡 영화를 선택하면 채팅으로 정보를 물어봐요'
              : '🔗 클릭하면 더 자세한 정보를 볼 수 있어요'
          }
        </p>
      </div>
    </div>
  );
}