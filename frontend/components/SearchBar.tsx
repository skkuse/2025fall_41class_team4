'use client';

import { useState, useEffect } from 'react';
import { SearchFilters } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    genre: '전체',
    year: '전체',
    rating: '전체',
    sortBy: 'popularity',
  });

  // 백엔드에서 받아온 필터 옵션
  const [genres, setGenres] = useState<string[]>(['전체']);
  const [years, setYears] = useState<string[]>(['전체']);
  const [ratings, setRatings] = useState<string[]>(['전체']);

  // 필터 옵션 불러오기
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      console.log('🔍 필터 옵션 조회:', `${API_URL}/movies/filters`);
      const response = await fetch(`${API_URL}/movies/filters`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 필터 옵션:', data);
        setGenres(['전체', ...(data.genres || [])]);
        setYears(['전체', ...(data.years || [])]);
        setRatings(['전체', ...(data.ratings || [])]);
      }
    } catch (error) {
      console.error('❌ 필터 옵션 조회 실패:', error);
    }
  };

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-4 py-3">
          <SearchIcon className="text-[#9E9E9E]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="영화 제목, 감독, 배우로 검색..."
            className="flex-1 bg-transparent focus:outline-none text-[#212121]"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <CloseIcon className="text-[#9E9E9E] hover:text-[#616161]" fontSize="small" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl transition-colors ${
            showFilters ? 'bg-[#424242] text-white' : 'bg-[#F5F5F5] text-[#757575] hover:bg-[#E0E0E0]'
          }`}
        >
          <FilterListIcon />
        </button>
        <button
          onClick={handleSearch}
          className="bg-[#424242] hover:bg-[#616161] text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          검색
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-[#E0E0E0] grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-2">장르</label>
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#9E9E9E]"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#757575] mb-2">개봉년도</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#9E9E9E]"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#757575] mb-2">평점</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#9E9E9E]"
            >
              {ratings.map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#757575] mb-2">정렬</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#9E9E9E]"
            >
              <option value="popularity">인기순</option>
              <option value="latest">최신순</option>
              <option value="rating">평점순</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}