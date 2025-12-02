'use client';

import { Movie } from '@/types';
import StarIcon from '@mui/icons-material/Star';

interface MovieCardProps {
  movie: Movie;
  onClick?: (movie: Movie) => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const genres = movie.genres || [];
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : 'Unknown';

  return (
    <div
      onClick={() => onClick?.(movie)}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-[#E5E5E5]"
    >
      {/* 포스터 이미지 */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image';
          }}
        />
        {/* 평점 배지 */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
          <StarIcon className="text-yellow-400" style={{ fontSize: 14 }} />
          <span className="text-xs font-semibold">{movie.vote_average.toFixed(1)}</span>
        </div>
      </div>

      {/* 영화 정보 */}
      <div className="p-3">
        <h3 className="font-bold text-[#2A3A2A] text-sm mb-0.5 truncate">{movie.title}</h3>
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