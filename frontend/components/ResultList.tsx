'use client';

import { useState, useEffect } from 'react';
import { Movie, SearchFilters } from '@/types';
import MovieCard from './MovieCard';
import SearchBar from './SearchBar';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface ResultListProps {
  onMovieClick?: (movie: Movie) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ResultList({ onMovieClick }: ResultListProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMovies, setTotalMovies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    genre: '전체',
    year: '전체',
    rating: '전체',
    sortBy: 'popularity',
  });

  useEffect(() => {
    fetchMovies();
  }, [searchQuery, filters, currentPage]);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: filters.sortBy,
      });

      if (searchQuery) params.append('query', searchQuery);
      if (filters.genre !== '전체') params.append('genre', filters.genre);
      if (filters.year !== '전체') params.append('year', filters.year);
      if (filters.rating !== '전체') params.append('rating', filters.rating);

      console.log('🔍 영화 검색:', `${API_URL}/movies/search?${params}`);
      const response = await fetch(`${API_URL}/movies/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 검색 결과:', data);
        setMovies(data.movies || []);
        setTotalMovies(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('❌ 영화 검색 실패:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string, newFilters: SearchFilters) => {
    setSearchQuery(query);
    setFilters(newFilters);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#8A9A8A]">영화를 검색하는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SearchBar onSearch={handleSearch} />

      <div className="flex items-center justify-between">
        <p className="text-[#6A7D6A]">
          총 <span className="font-semibold text-[#4A5D4A]">{totalMovies}</span>개의 영화
        </p>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#8A9A8A] text-lg">검색 결과가 없습니다.</p>
          <p className="text-[#A8B8A8] text-sm mt-2">다른 검색어나 필터를 시도해보세요.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] transition-colors"
          >
            <NavigateBeforeIcon />
          </button>
          
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
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