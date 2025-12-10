'use client';

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
    if (!path) return DEFAULT_POSTER;
    return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w500${path}`;
  };

  const imgSrc = getPosterUrl(movie.poster_url);

  const handleCardClick = () => {
    if (onClick) {
      onClick(movie);
      return;
    }
    const query = encodeURIComponent(`${movie.title} 영화`);
    const naverSearchUrl = `https://search.naver.com/search.naver?query=${query}`;
    window.open(naverSearchUrl, '_blank');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DEFAULT_POSTER;
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer border border-[#DEE2E6] min-w-40 w-40 shrink-0"
    >
      {/* 포스터 */}
      <div className="relative h-60 w-full bg-gray-100 overflow-hidden">
        <img
          src={imgSrc} 
          alt={movie.title} 
          className="w-full h-full object-cover transition-transform duration-300" 
          onError={handleImageError}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        {/* 평점 */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: '#FFFFFF',
          padding: '4px 8px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backdropFilter: 'blur(4px)',
        }}>
          <StarIcon style={{ fontSize: 14, color: '#FFD700' }} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
      </div>

      {/* 정보 */}
      <div style={{ padding: '12px' }}>
        <h3 
          className="font-bold truncate"
          style={{ 
            color: '#212529', 
            fontSize: '14px', 
            marginBottom: '4px',
          }}
        >
          {movie.title}
        </h3>
        <p 
          className="truncate"
          style={{ 
            color: '#6C757D', 
            fontSize: '12px', 
            marginBottom: '8px',
          }}
        >
          {releaseYear}
        </p>

        {/* 장르 */}
        <div className="flex flex-wrap gap-1">
          {genres.slice(0, 2).map((g, index) => (
            <span
              key={index}
              style={{
                backgroundColor: '#E9ECEF',
                color: '#495057',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '500',
              }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}