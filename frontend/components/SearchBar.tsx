'use client';

import { useState } from 'react';
import { SearchFilters } from '@/types';
import { genres, years, ratings } from '@/data/mockData';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    genre: '전체',
    year: '전체',
    rating: '전체',
    sortBy: 'popularity',
  });

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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E5E5]">
      {/* 검색 입력 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-4 py-3">
          <SearchIcon className="text-[#8A9A8A]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="영화 제목, 감독, 배우로 검색..."
            className="flex-1 bg-transparent focus:outline-none text-[#2A3A2A]"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <CloseIcon className="text-[#8A9A8A] hover:text-[#4A5D4A]" fontSize="small" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl transition-colors ${
            showFilters ? 'bg-[#4A5D4A] text-white' : 'bg-[#F5F5F5] text-[#6A7D6A] hover:bg-[#E5E5E5]'
          }`}
        >
          <FilterListIcon />
        </button>
        <button
          onClick={handleSearch}
          className="bg-[#4A5D4A] hover:bg-[#5A6D5A] text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          검색
        </button>
      </div>

      {/* 필터 옵션 */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-[#E5E5E5] grid grid-cols-4 gap-4">
          {/* 장르 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#6A7D6A] mb-2">장르</label>
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#2A3A2A] focus:outline-none focus:ring-2 focus:ring-[#B8D4A8]"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* 개봉년도 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#6A7D6A] mb-2">개봉년도</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#2A3A2A] focus:outline-none focus:ring-2 focus:ring-[#B8D4A8]"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* 평점 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#6A7D6A] mb-2">평점</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#2A3A2A] focus:outline-none focus:ring-2 focus:ring-[#B8D4A8]"
            >
              {ratings.map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          {/* 정렬 옵션 */}
          <div>
            <label className="block text-sm font-medium text-[#6A7D6A] mb-2">정렬</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
              className="w-full bg-[#F5F5F5] border-none rounded-lg px-3 py-2 text-[#2A3A2A] focus:outline-none focus:ring-2 focus:ring-[#B8D4A8]"
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