'use client';

import { useState, useMemo } from 'react';
import { Movie, SearchFilters } from '@/types';
import { mockMovies } from '@/data/mockData';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface ResultListProps {
  onMovieClick?: (movie: Movie) => void;
}

export default function ResultList({ onMovieClick }: ResultListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    genre: '전체',
    year: '전체',
    rating: '전체',
    sortBy: 'popularity',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 필터링 및 정렬된 영화 목록
  const filteredMovies = useMemo(() => {
    let result = [...mockMovies];

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query)
          
          
      );
    }

    // 장르 필터
    if (filters.genre !== '전체') {
      result = result.filter((movie) => movie.genre.includes(filters.genre));
    }

    // 평점 필터
    if (filters.rating !== '전체') {
      const minRating = parseInt(filters.rating);
      if (!isNaN(minRating)) {
        result = result.filter((movie) => movie.rating >= minRating);
      }
    }

    // 정렬
    switch (filters.sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // 인기순 (기본)
        break;
    }

    return result;
  }, [searchQuery, filters]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (query: string, newFilters: SearchFilters) => {
    setSearchQuery(query);
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 검색바 */}
      <SearchBar onSearch={handleSearch} />

      {/* 결과 정보 */}
      <div className="flex items-center justify-between">
        <p className="text-[#6A7D6A]">
          총 <span className="font-semibold text-[#4A5D4A]">{filteredMovies.length}</span>개의 영화
        </p>
      </div>

      {/* 영화 그리드 */}
      {paginatedMovies.length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {paginatedMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#8A9A8A] text-lg">검색 결과가 없습니다.</p>
          <p className="text-[#A8B8A8] text-sm mt-2">다른 검색어나 필터를 시도해보세요.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] transition-colors"
          >
            <NavigateBeforeIcon />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-[#4A5D4A] text-white'
                  : 'bg-white border border-[#E5E5E5] text-[#6A7D6A] hover:bg-[#F5F5F5]'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] transition-colors"
          >
            <NavigateNextIcon />
          </button>
        </div>
      )}
    </div>
  );
}