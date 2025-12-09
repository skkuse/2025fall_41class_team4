'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage, Movie, Performance } from '@/types';
import MovieCard from './MovieCard';
import PerformanceCard from './PerformanceCard';
import LoadingSpinner from './LoadingSpinner';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TypewriterText from './TypewriterText';

interface ChatMainProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPromptClick: (prompt: string) => void;
}

const suggestedPrompts = [
  { title: 'SF 영화 추천', description: '우주와 미래를 배경으로 한 영화' },
  { title: '로맨스 영화 추천', description: '감동적인 사랑 이야기' },
  { title: '크리스토퍼 놀란', description: '놀란 감독의 명작들' },
  { title: '평점 높은 영화', description: '8.5점 이상의 명작들' },
  { title: '뮤지컬 영화', description: '음악이 아름다운 영화' },
  { title: '스릴러 추천', description: '긴장감 넘치는 영화들' },
];

export default function ChatMain({ messages, isLoading, onPromptClick }: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 스크롤 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseBoldText = (text: string) => {
    if (!text) return null;
    // 줄바꿈(\n)을 기준으로 문단 나누기
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
    <div className="flex-1 overflow-y-auto bg-[#FAF8F5]">
      {messages.length === 0 ? (
        // [A] Empty State (채팅 기록이 없을 때)
        <div className="h-full flex flex-col items-center justify-center px-8 py-12">
          <div className="text-center mb-10">
            <h1 className="text-[#D5E5C5] text-6xl font-bold mb-3 opacity-50">
              LLMUSE
            </h1>
            <p className="text-[#8A9A8A] text-base mb-1">
              AI 기반 영화 & 공연 추천 서비스
            </p>
            <p className="text-[#5A8D4A] text-sm font-medium">
              원하는 콘텐츠를 자연어로 물어보세요!
            </p>
          </div>

          {/* 추천 질문 버튼들 */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl w-full">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => onPromptClick(prompt.title)}
                className="bg-white border border-[#E5E5E5] rounded-xl p-4 text-left hover:border-[#B8D4A8] hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-2">
                  <AutoAwesomeIcon 
                    className="text-[#B8D4A8] mt-0.5 flex-shrink-0" 
                    style={{ fontSize: 18 }} 
                  />
                  <div>
                    <h3 className="text-[#4A5D4A] font-semibold text-sm mb-0.5 group-hover:text-[#3A4D3A]">
                      {prompt.title}
                    </h3>
                    <p className="text-[#8A9A8A] text-xs leading-relaxed">
                      {prompt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // [B] Chat Messages (채팅 기록이 있을 때)
        <div className="px-8 py-6 space-y-12">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {/* 메시지 버블 (User: 우측 / AI: 좌측) */}
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-full px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#4A5D4A] text-white'
                      : 'bg-white border border-[#E5E5E5] text-[#2A3A2A] shadow-sm'
                  }`}
                >
                  {/* [핵심] 직접 파싱 함수를 사용하여 **굵게** 처리 (타자 효과 없음) */}
                  {parseBoldText(message.content)}
                </div>
              </div>

              {/* 영화/공연 카드 리스트 렌더링 */}
              {message.items && message.items.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 px-1">
                  {message.items.map((item: any) => {
                    // eventSite 필드가 있으면 공연(Performance), 없으면 영화(Movie)로 판단
                    if (item.eventSite) {
                      return <PerformanceCard key={item.id} data={item as Performance} />;
                    } else {
                      return <MovieCard key={item.id} movie={item as Movie} />;
                    }
                  })}
                </div>
              )}
            </div>
          ))}

          {/* 로딩 스피너 (답변 생성 중일 때) */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm">
                <LoadingSpinner />
              </div>
            </div>
          )}
          
          {/* 자동 스크롤을 위한 빈 div */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
  // return (
  //   <div className="flex-1 overflow-y-auto bg-[#FAF8F5]">
  //     {messages.length === 0 ? (
  //       // Empty State
  //       <div className="h-full flex flex-col items-center justify-center px-8 py-12">
  //         <div className="text-center mb-10">
  //           <h1 className="text-[#D5E5C5] text-6xl font-bold mb-3 opacity-50">
  //             LLMUSE
  //           </h1>
  //           <p className="text-[#8A9A8A] text-base mb-1">
  //             AI 기반 영화 추천 서비스
  //           </p>
  //           <p className="text-[#5A8D4A] text-sm font-medium">
  //             원하는 영화를 자연어로 물어보세요!
  //           </p>
  //         </div>

  //         {/* Suggested Prompts */}
  //         <div className="grid grid-cols-3 gap-4 max-w-3xl w-full">
  //           {suggestedPrompts.map((prompt, index) => (
  //             <button
  //               key={index}
  //               onClick={() => onPromptClick(prompt.title)}
  //               className="bg-white border border-[#E5E5E5] rounded-xl p-4 text-left hover:border-[#B8D4A8] hover:shadow-lg transition-all group"
  //             >
  //               <div className="flex items-start gap-2">
  //                 <AutoAwesomeIcon 
  //                   className="text-[#B8D4A8] mt-0.5 flex-shrink-0" 
  //                   style={{ fontSize: 18 }} 
  //                 />
  //                 <div>
  //                   <h3 className="text-[#4A5D4A] font-semibold text-sm mb-0.5 group-hover:text-[#3A4D3A]">
  //                     {prompt.title}
  //                   </h3>
  //                   <p className="text-[#8A9A8A] text-xs leading-relaxed">
  //                     {prompt.description}
  //                   </p>
  //                 </div>
  //               </div>
  //             </button>
  //           ))}
  //         </div>
  //       </div>
  //     ) : (
  //       // Chat Messages
  //       <div className="px-8 py-6 space-y-12">
  //         {messages.map((message) => (
  //           <div key={message.id} className="space-y-4">
  //             {/* 메시지 버블 */}
  //             <div
  //               className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
  //             >
  //               <div
  //                 className={`max-w-full px-4 py-3 rounded-2xl ${
  //                   message.role === 'user'
  //                     ? 'bg-[#4A5D4A] text-white'
  //                     : 'bg-white border border-[#E5E5E5] text-[#2A3A2A] shadow-sm'
  //                 }`}
  //               >
  //                 <ReactMarkdown 
  //                   remarkPlugins={[remarkGfm]}
  //                   components={{
  //                     // 문단(p) 스타일: 줄 간격을 넓히고(leading-relaxed), 문단 사이에 여백(mb-2)을 줌
  //                     p: ({node, ...props}) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
  //                     // 굵은 글씨(strong) 스타일
  //                     strong: ({node, ...props}) => <span className="font-bold" {...props} />,
  //                     // 리스트 스타일
  //                     ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-1" {...props} />,
  //                     ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-1" {...props} />,
  //                     li: ({node, ...props}) => <li className="mb-1" {...props} />
  //                   }}
  //                 >
  //                   {message.content}
  //                 </ReactMarkdown>
  //               </div>
  //             </div>

  //             {/* 영화 결과 카드들 */}
  //             {message.items && message.items.length > 0 && (
  //               <div className="flex gap-3 mt-4 overflow-x-auto pb-2 px-1">
  //                 {message.items.map((item: any) => {
  //                   // 구분 로직: eventSite가 있으면 공연, 없으면 영화로 간주
  //                   if (item.eventSite) {
  //                     return <PerformanceCard key={item.id} data={item as Performance} />;
  //                   } else {
  //                     return <MovieCard key={item.id} movie={item as Movie} />;
  //                   }
  //                 })}
  //               </div>
  //             )}
  //           </div>
  //         ))}

  //         {/* 로딩 상태 */}
  //         {isLoading && (
  //           <div className="flex justify-start">
  //             <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm">
  //               <LoadingSpinner />
  //             </div>
  //           </div>
  //         )}
          
  //         <div ref={messagesEndRef} />
  //       </div>
  //     )}
  //   </div>
  // );
}