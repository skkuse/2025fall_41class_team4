'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types';
import StarIcon from '@mui/icons-material/Star';

interface MovieCardProps {
  movie: Movie;
  onClick?: (movie: Movie) => void;
}

const DEFAULT_POSTER = '/MovingCastle.jpg';

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const genres = movie.genres || [];
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : 'Unknown';

  const getPosterUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w500${path}`;
  };

  const initialSrc = getPosterUrl(movie.poster_url) || DEFAULT_POSTER;
  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(getPosterUrl(movie.poster_url) || DEFAULT_POSTER);
  }, [movie.poster_url]);

const handleCardClick = () => {
    // 1. 만약 부모에서 별도의 onClick을 내려줬다면 그걸 실행 (확장성 고려)
    if (onClick) {
      onClick(movie);
      return;
    }

    // 2. 아니면 네이버 영화 검색으로 이동 (기본 동작)
    // 검색어: "영화 제목" + " 영화" (정확도를 위해 '영화' 키워드 추가)
    const query = encodeURIComponent(`${movie.title} 영화`);
    const naverSearchUrl = `https://search.naver.com/search.naver?query=${query}`;
    
    // 새 탭에서 열기
    window.open(naverSearchUrl, '_blank');
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-[#E5E5E5] min-w-[160px] w-[160px] flex-shrink-0"
    >
      {/* 포스터 이미지 */}
      <div className="relative h-[240px] w-full bg-gray-100 overflow-hidden">
      <img
          src={imgSrc} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          // 유효하지 않은 URL인 경우 기본 이미지 적용 
          onError={() => setImgSrc(DEFAULT_POSTER)} 
        />
        {/* 평점 배지 */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
          <StarIcon className="text-yellow-400" style={{ fontSize: 14 }} />
          <span className="text-xs font-semibold">{movie.vote_average.toFixed(1)}</span>
        </div>
      </div>

      {/* 영화 정보 */}
      <div className="p-3 h-[90px] flex flex-col justify-between">
        <h3 className="font-bold text-[#2A3A2A] text-sm mb-0.5 line-clamp-1">{movie.title}</h3>
        <p className="text-[#8A9A8A] text-xs mb-2">{releaseYear}</p>

        {/* 장르 태그 */}
        <div className="flex flex-wrap gap-1">
          {genres.slice(0, 2).map((g, index) => (
            <span
              key={index}
              className="bg-[#E8F0E0] text-[#4A5D4A] text-xs px-1.5 py-0.5 rounded"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}