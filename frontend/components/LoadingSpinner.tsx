'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-[#4A5D4A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#4A5D4A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#4A5D4A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-[#6A7D6A] text-sm">AI가 영화를 찾고 있어요...</span>
    </div>
  );
}