'use client';

import { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;

  category: 'movie' | 'performance';
  setCategory: (category: 'movie' | 'performance') => void;
}

export default function MessageInput({ onSendMessage, disabled, category, setCategory }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const placeholderText = category === 'movie'
    ? "영화 추천을 요청해보세요... (예: SF 영화 추천해줘)"
    : "공연 추천을 요청해보세요... (예: 주말에 볼만한 뮤지컬 있어?)";

  return (
    <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E5E5]">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        
        {/* [New] 카테고리 선택 드롭다운 */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as 'movie' | 'performance')}
          className="bg-white border border-[#D5D5D5] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#B8D4A8]"
          disabled={disabled}
        >
          <option value="movie">🎬 영화</option>
          <option value="performance">🎭 공연/전시</option>
        </select>

        <div className="flex-1 flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-xl px-4 py-3 focus-within:border-[#B8D4A8] focus-within:shadow-sm transition-all">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholderText}
            disabled={disabled}
            className="flex-1 bg-transparent focus:outline-none text-[#2A3A2A] placeholder-[#A8B8A8] text-sm"
          />
          <button
            type="button"
            className="p-1.5 text-[#8A9A8A] hover:text-[#4A5D4A] transition-colors rounded-full hover:bg-[#F5F5F5]"
          >
            <MicIcon fontSize="small" />
          </button>
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="bg-[#4A5D4A] hover:bg-[#5A6D5A] disabled:bg-[#C5D4B5] text-white rounded-xl p-3 transition-colors"
        >
          <SendIcon fontSize="small" />
        </button>
      </form>
    </div>
  );
}