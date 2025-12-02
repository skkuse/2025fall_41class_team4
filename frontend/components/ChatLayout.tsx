'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatMain from './ChatMain';
import MessageInput from './MessageInput';
import RightPanel from './RightPanel';
import ResultList from './ResultList';
import { useChat } from '@/hooks/useChat';
import { Movie } from '@/types';

export default function ChatLayout() {
  const [currentView, setCurrentView] = useState<'chat' | 'search'>('chat');
  const [category, setCategory] = useState<'movie' | 'performance'>('movie');
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    // clearAllChats,

    sessions,
    currentSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    // 추천 탭 관련
    recommendationTabs,
    activeRecommendationTabId,
    selectRecommendationTab,
    closeRecommendationTab,
    
    boxOfficeList
  } = useChat();

  const handleSendMessage = (message: string) => {
    sendMessage(message, category);
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt, category);
  };

  const handleNewChat = () => {
    createNewSession();
  };

  // 영화 클릭 시 자동 질문
  const handleMovieSelect = (movie: Movie) => {
    const question = `${movie.title} 영화 정보를 알려줘`;
    sendMessage(question, category);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F1E8' }}>
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewChat={handleNewChat}

        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {currentView === 'chat' ? (
          <>
            <ChatMain
              messages={messages}
              isLoading={isLoading}
              onPromptClick={handlePromptClick}
            />
            <MessageInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading}
            />
          </>
        ) : (
          <div className="flex-1 overflow-y-auto" style={{ padding: '32px' }}>
            <ResultList />
          </div>
        )}
      </div>

      {/* Right Panel */}
      {currentView === 'chat' && (
        <RightPanel 
          recommendationTabs={recommendationTabs}
          activeTabId={activeRecommendationTabId}
          onTabSelect={selectRecommendationTab}
          onTabClose={closeRecommendationTab}
          onMovieSelect={handleMovieSelect}
          boxOfficeList={boxOfficeList}
        />
      )}
    </div>
  );
}