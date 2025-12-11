'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage, Movie, Performance } from '@/types';
import MovieCard from './MovieCard';
import PerformanceCard from './PerformanceCard';
import LoadingSpinner from './LoadingSpinner';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface ChatMainProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPromptClick: (prompt: string) => void;
  category: 'movie' | 'performance';
}


export default function ChatMain({ messages, isLoading, onPromptClick, category }: ChatMainProps) {
  
  const suggestedPrompts = category === 'movie' ? [
    { title: 'SF 영화 추천', description: '우주와 미래를 배경으로 한 영화' },
    { title: '로맨스 영화 추천', description: '감동적인 사랑 이야기' },
    { title: '크리스토퍼 놀란', description: '놀란 감독의 명작들' },
    { title: '평점 높은 영화', description: '8.5점 이상의 명작들' },
    { title: '액션 영화', description: '박진감 넘치는 영화들' },
    { title: '스릴러 추천', description: '긴장감 넘치는 영화들' },
  ] : [
    { title: '뮤지컬 공연', description: '음악이 아름다운 공연들' },
    { title: '주말 공연 추천', description: '주말에 볼만한 공연' },
    { title: '전시회 추천', description: '가볼만한 전시 정보' },
    { title: '클래식 공연', description: '오케스트라와 클래식' },
    { title: '연극 추천', description: '감동적인 연극 작품' },
    { title: '가족 공연', description: '온 가족이 함께 즐기는 공연' },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseBoldText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <p key={i} className="leading-relaxed mb-2 last:mb-0"> 
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center px-8 py-12">
          <div className="text-center mb-10">
            <h1 className="text-[#BDBDBD] text-6xl font-bold mb-3 opacity-50">
              LLMUSE
            </h1>
            <p className="text-[#757575] text-sm font-medium">
              {category === 'movie' 
                ? '원하는 영화를 자연어로 물어보세요!' 
                : '원하는 공연을 자연어로 물어보세요!'
              }
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-3xl w-full">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptClick(prompt.title)}
                className="bg-white border border-[#E0E0E0] rounded-xl p-4 text-left hover:border-[#9E9E9E] hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-2">
                  <AutoAwesomeIcon 
                    className="text-[#9E9E9E] mt-0.5 flex-shrink-0" 
                    style={{ fontSize: 18 }} 
                  />
                  <div>
                    <h3 className="text-[#424242] font-semibold text-sm mb-0.5 group-hover:text-[#212121]">
                      {prompt.title}
                    </h3>
                    <p className="text-[#757575] text-xs leading-relaxed">
                      {prompt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-8 py-6 space-y-12">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-full px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#424242] text-white'
                      : 'bg-white border border-[#E0E0E0] text-[#212121] shadow-sm'
                  }`}
                >
                  {parseBoldText(message.content)}
                </div>
              </div>

              {message.items && message.items.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 px-1">
                  {message.items.map((item: Movie | Performance) => {
                    if ('eventSite' in item) {
                      return <PerformanceCard key={item.id} data={item} />;
                    }
                    return <MovieCard key={item.id} movie={item} />;
                  })}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E0E0E0] rounded-2xl shadow-sm">
                <LoadingSpinner category={category}/>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}