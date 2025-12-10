'use client';

import { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MovieIcon from '@mui/icons-material/Movie';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';

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

  const toggleCategory = () => {
    setCategory(category === 'movie' ? 'performance' : 'movie');
  };

  const placeholderText = category === 'movie'
    ? "영화 추천을 요청해보세요... (예: SF 영화 추천해줘)"
    : "공연 추천을 요청해보세요... (예: 주말에 볼만한 뮤지컬 있어?)";

  return (
    <div className="px-6 py-4 bg-[#ECECEC] border-t border-[#E0E0E0]">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#E0E0E0] rounded-xl px-4 py-3 focus-within:border-[#9E9E9E] focus-within:shadow-sm transition-all">
          
          {/* 카테고리 선택 버튼 (input 안) */}
          <button
            type="button"
            onClick={toggleCategory}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E0E0E0] transition-colors text-sm font-medium text-[#424242]"
            style={{ flexShrink: 0 }}
          >
            {category === 'movie' ? (
              <>
                <MovieIcon style={{ fontSize: 16 }} />
                <span>영화</span>
              </>
            ) : (
              <>
                <TheaterComedyIcon style={{ fontSize: 16 }} />
                <span>공연</span>
              </>
            )}
          </button>

          {/* 구분선 */}
          <div style={{ 
            width: '1px', 
            height: '20px', 
            backgroundColor: '#E0E0E0',
            flexShrink: 0,
          }} />

          {/* 입력창 */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholderText}
            disabled={disabled}
            className="flex-1 bg-transparent focus:outline-none text-[#212121] placeholder-[#BDBDBD] text-sm"
          />

          {/* 마이크 버튼 */}
          <button
            type="button"
            className="p-1.5 text-[#9E9E9E] hover:text-[#616161] transition-colors rounded-full hover:bg-[#F5F5F5]"
          >
            <MicIcon fontSize="small" />
          </button>
        </div>

        {/* 전송 버튼 */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="bg-[#424242] hover:bg-[#616161] disabled:bg-[#E0E0E0] disabled:text-[#9E9E9E] text-white rounded-xl p-3 transition-colors"
        >
          <SendIcon fontSize="small" />
        </button>
      </form>
    </div>
  );
}