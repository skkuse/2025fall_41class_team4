'use client';

interface LoadingSpinnerProps {
  category?: 'movie' | 'performance';
}

export default function LoadingSpinner({ category = 'movie' }: LoadingSpinnerProps) {
  const message = category === 'movie' 
    ? 'AI가 영화를 찾고 있어요...' 
    : 'AI가 공연을 찾고 있어요...';

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-[#9E9E9E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#9E9E9E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#9E9E9E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-[#616161] text-sm">{message}</span>
    </div>
  );
}