import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatSession, RecommendationTab, Movie, Performance, BoxOfficeMovie } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [boxOfficeList, setBoxOfficeList] = useState<BoxOfficeMovie[]>([]);
  const [recommendationTabs, setRecommendationTabs] = useState<RecommendationTab[]>([]);
  const [activeRecommendationTabId, setActiveRecommendationTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // 박스오피스 데이터 가져오기
  const fetchBoxOffice = useCallback(async () => {
    try {
      console.log('🎬 박스오피스 조회 시작:', `${API_URL}/boxoffice`);
      const response = await fetch(`${API_URL}/boxoffice`);
      console.log('✅ 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 박스오피스 데이터:', data);
        setBoxOfficeList(data);
      }
    } catch (error) {
      console.error('❌ 박스오피스 조회 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 박스오피스 자동 조회
  useEffect(() => {
    fetchBoxOffice();
  }, [fetchBoxOffice]);

  const extractTabTitle = (query: string): string => {
    const keywords: { [key: string]: string } = {
      'sf': 'SF 영화',
      '공상과학': 'SF 영화',
      '로맨스': '로맨스 영화',
      '액션': '액션 영화',
      '공연': '공연 추천',
    };

    const lowerQuery = query.toLowerCase();
    for (const [keyword, title] of Object.entries(keywords)) {
      if (lowerQuery.includes(keyword)) {
        return title;
      }
    }

    return query.slice(0, 10) + (query.length > 10 ? '...' : '');
  };

  const sendMessage = useCallback(async (content: string, category: 'movie' | 'performance') => {
    // 세션이 없으면 새로 생성
    let sessionId = currentSessionId;
    
    if (!sessionId) {
      const newSessionId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        title: content.slice(0, 20),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions([newSession]);
      setCurrentSessionId(newSessionId);
      sessionId = newSessionId;
    }

    // 사용자 메시지 즉시 표시
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, messages: [...session.messages, userMessage], updatedAt: new Date() }
        : session
    ));

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, question: content }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const responseContent = data.content || data.message || data.answer || '';
      const items = data.items || data.movies || data.performances || [];

      const assistantMessageId = `assistant-${Date.now()}`;
      const initialMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',  // 빈 상태로 시작
        timestamp: new Date(),
        items: items,
      };

      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, initialMessage], updatedAt: new Date() }
          : session
      ));

      setIsLoading(false);

      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        currentIndex++;
        const typedContent = responseContent.slice(0, currentIndex);

        setSessions(prev => prev.map(session => {
          if (session.id !== sessionId) return session;
          
          return {
            ...session,
            messages: session.messages.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: typedContent }
                : msg
            ),
            updatedAt: new Date(),
          };
        }));

        if (currentIndex >= responseContent.length) {
          clearInterval(typingInterval);
          setIsLoading(false);
        }
      }, 20); // 20ms마다 한 글자 (조절 가능)

      // 추천 탭 생성
      if (items && items.length > 0) {
        const newTab: RecommendationTab = {
          id: `rec-${Date.now()}`,
          title: extractTabTitle(content),
          query: content,
          category: category,
          items: items,
          createdAt: new Date(),
        };

        setRecommendationTabs(prev => [...prev, newTab]);
        setActiveRecommendationTabId(newTab.id);
      }

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      // ... 에러 처리 ...
    }
  }, [currentSessionId]);

  const createNewSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: '새 대화',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setRecommendationTabs([]);
    setActiveRecommendationTabId(null);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
      return newSessions;
    });
  }, [currentSessionId]);

  const selectRecommendationTab = useCallback((tabId: string | null) => {
    setActiveRecommendationTabId(tabId);
  }, []);

  const closeRecommendationTab = useCallback((tabId: string) => {
    setRecommendationTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (activeRecommendationTabId === tabId) {
        setActiveRecommendationTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      }
      return newTabs;
    });
  }, [activeRecommendationTabId]);

  return {
    messages,
    isLoading,
    sendMessage,
    sessions,
    currentSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    recommendationTabs,
    activeRecommendationTabId,
    selectRecommendationTab,
    closeRecommendationTab,
    boxOfficeList,
    fetchBoxOffice,
  };
};