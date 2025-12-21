import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatSession, RecommendationTab, BoxOfficeMovie } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'llmuse_sessions';

export const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [boxOfficeList, setBoxOfficeList] = useState<BoxOfficeMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const recommendationTabs = currentSession?.recommendationTabs || [];
  const activeRecommendationTabId = currentSession?.activeTabId || null;

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

  // [수정] 초기 로드 (Local Storage에서 불러오기)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedSessions = JSON.parse(saved);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          // 저장된 세션이 있으면 첫 번째 세션을 선택
          setCurrentSessionId(parsedSessions[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("세션 복구 실패:", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
    fetchBoxOffice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const createNewSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: '새 대화',
      messages: [],
      recommendationTabs: [],
      activeTabId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // setSessions(prev => [newSession, ...prev]);
    // setCurrentSessionId(newSessionId);

    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setCurrentSessionId(newSessionId);
  }, []);

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
        // [수정] 새 세션 자동 생성 시 저장
        setSessions(prev => {
        const updated = [newSession]; // 기존 세션이 없었으므로 새 배열
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
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

    // [수정] 사용자 메시지 추가 시 저장
    setSessions(prev => {
      const updated = prev.map(session => {
        if (session.id === sessionId) {
          
          // [핵심 로직] 메시지가 하나도 없을 때(=첫 질문) 제목 변경
          const newTitle = session.messages.length === 0 
            ? (content.length > 15 ? content.slice(0, 15) + '...' : content) 
            : session.title;

          return { 
            ...session, 
            title: newTitle, // 변경된 제목 적용
            messages: [...session.messages, userMessage], 
            updatedAt: new Date() 
          };
        }
        return session;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setIsLoading(true);

    try {

      const historyForBackend = messages.map(msg => ({
          // 프론트엔드의 'sender'가 'user'면 'user', 아니면 'assistant'로 변환
          role: msg.role,      // sender 대신 role일 수 있습니다.
          content: msg.content // text 대신 content일 수 있습니다.
      }));
      const limitedHistory = historyForBackend.slice(-10);


      const allRelevantMovies = currentSession?.recommendationTabs?.flatMap(tab => tab.items) || [];
      // 너무 길면 최신 10개만 전달 (토큰 절약)
      const uniqueMoviesMap = new Map();
      allRelevantMovies.forEach(movie => {
          if (movie && movie.id) {
              uniqueMoviesMap.set(movie.id, movie);
          }
      });
      
      const limitedRelevantMovies = Array.from(uniqueMoviesMap.values()).slice(-10);

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, question: content, history: limitedHistory, relevantMovies: limitedRelevantMovies}),
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

      // [수정] AI 초기 메시지(빈 내용) 추가 시 저장
      setSessions(prev => {
        const updated = prev.map(session =>
          session.id === sessionId
            ? { ...session, messages: [...session.messages, initialMessage], updatedAt: new Date() }
            : session
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

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
          
          // [수정] 타이핑이 끝난 후 최종 상태 저장
          setSessions(latestSessions => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(latestSessions));
            return latestSessions;
          });
        }
      }, 20);

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

        // [수정] 추천 탭 추가 시 저장
        setSessions(prev => {
          const updated = prev.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  recommendationTabs: [...(session.recommendationTabs || []), newTab],
                  activeTabId: newTab.id,
                  updatedAt: new Date(),
                }
              : session
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        }); 
      }

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      setIsLoading(false);
    }
  }, [currentSessionId, messages]);


  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // [수정] 세션 삭제 시 저장
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
      return newSessions;
    });
  }, [currentSessionId]);

  const selectRecommendationTab = useCallback((tabId: string | null) => {
    // [수정] 탭 선택 상태 저장
    setSessions(prev => {
      const updated = prev.map(session =>
        session.id === currentSessionId
          ? { ...session, activeTabId: tabId }
          : session
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [currentSessionId]);

  const closeRecommendationTab = useCallback((tabId: string) => {
    // [수정] 탭 닫기 시 저장
    setSessions(prev => {
      const updated = prev.map(session => {
        if (session.id !== currentSessionId) return session;
        
        const newTabs = (session.recommendationTabs || []).filter(tab => tab.id !== tabId);
        const newActiveId = session.activeTabId === tabId
          ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
          : session.activeTabId;
        
        return {
          ...session,
          recommendationTabs: newTabs,
          activeTabId: newActiveId,
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [currentSessionId]);

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