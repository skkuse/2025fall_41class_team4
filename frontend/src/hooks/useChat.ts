import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, Movie, BoxOfficeMovie, ChatSession, RecommendationTab } from '@/types';

const STORAGE_KEY = 'llmuse_sessions';

export const useChat = () => {
  // [1] 상태 관리
  const [sessions, setSessions] = useState<ChatSession[]>([]); // 전체 채팅방 목록
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // 현재 보고 있는 방 ID
  const [isLoading, setIsLoading] = useState(false);
  const [boxOfficeList, setBoxOfficeList] = useState<BoxOfficeMovie[]>([]);

  //   // 질문에서 탭 제목 추출
  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

  // [2] 초기 로드 (Local Storage에서 불러오기)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsedSessions = JSON.parse(saved);
      setSessions(parsedSessions);
      // 저장된 방이 있으면 첫 번째 방을 엽니다.
      if (parsedSessions.length > 0) {
        setCurrentSessionId(parsedSessions[0].id);
      } else {
        createNewSession(); // 없으면 새 방 생성
      }
    } else {
      createNewSession();
    }
    fetchBoxOffice();
  }, []);

// 2. 현재 세션 찾기 (여기서 탭 정보를 꺼냄)
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const recommendationTabs = currentSession?.tabs || [];
  const activeRecommendationTabId = currentSession?.activeTabId || null;

  // [3] 새 채팅방 만들기
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '새로운 대화',
      messages: [],
      createdAt: new Date().toISOString(),
      tabs: [],           // [New] 빈 탭 목록
      activeTabId: null,  // [New] 선택된 탭 없음
    };
    
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setCurrentSessionId(newSession.id);
  }, []);

  // 4. 메시지 전송 (답변 오면 탭 추가 로직)
  const sendMessage = useCallback(async (content: string, category: 'movie' | 'performance') => {
    if (!content.trim() || !currentSessionId) return;

    // (1) 유저 메시지 생성
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
    };

    // 유저 메시지 저장
    setSessions(prev => {
      const updated = prev.map(session => {
        if (session.id === currentSessionId) {
          // 첫 질문이면 제목을 변경
          const newTitle = session.messages.length === 0 
            ? (content.length > 15 ? content.slice(0, 15) + '...' : content)
            : session.title;
            
          return {
            ...session,
            title: newTitle,
            messages: [...session.messages, userMessage]
          };
        }
        return session;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); // 저장
      return updated;
    });

    setIsLoading(true);

    try {
      // (3) 백엔드 API 호출
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, question: content }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();

      // (4) AI 응답 데이터 가공
      const items = (data.items || []).map((item: any) => ({
        ...item,
        poster_url: item.poster_url, 
      }));

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        items: data.items
      };

      // (5) 상태 업데이트 (AI 답변 추가)
      setSessions(prev => {
        const updated = prev.map(session => {
          if (session.id === currentSessionId) {
            let newTabs = session.tabs;
            let newActiveId = session.activeTabId;

            if (items.length > 0) {
              const newTab: RecommendationTab = {
                id: `rec-${Date.now()}`,
                title: content.length > 8 ? content.slice(0, 8) + '...' : content,
                query: content,
                category: category,
                items: items,
                createdAt: new Date(),
              };
              newTabs = [...session.tabs, newTab];
              newActiveId = newTab.id; // 새 탭 자동 활성화
            }

            return { ...session, messages: [...session.messages, aiMessage], tabs: newTabs, activeTabId: newActiveId };
          }
          return session;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

    } catch (error) {
      console.error(error);
      // 에러 메시지 추가 로직...
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId]);

  // 추천 탭 선택
  const selectRecommendationTab = useCallback((tabId: string | null) => {
    if (!currentSessionId) return;
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === currentSessionId ? { ...s, activeTabId: tabId } : s
      );
      return updated; // (UI 반응 속도를 위해 로컬스토리지 저장은 생략 가능하거나 debounce)
    });
  }, [currentSessionId]);

  // 추천 탭 삭제
  const closeRecommendationTab = useCallback((tabId: string) => {
    if (!currentSessionId) return;
        
        setSessions(prev => {
          const updated = prev.map(s => {
            if (s.id === currentSessionId) {
              const newTabs = s.tabs.filter(t => t.id !== tabId);
              let newActiveId = s.activeTabId;
              
              if (s.activeTabId === tabId) {
                newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
              }
              return { ...s, tabs: newTabs, activeTabId: newActiveId };
            }
            return s;
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }, [currentSessionId]);





  // [4] 채팅방 선택
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  // [5] 채팅방 삭제
  const deleteSession = useCallback((sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // 클릭 이벤트 전파 방지
    
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // 현재 보고 있던 방을 지웠다면?
      if (sessionId === currentSessionId) {
        if (updated.length > 0) setCurrentSessionId(updated[0].id);
        else createNewSession(); // 다 지웠으면 새 방 생성
      }
      return updated;
    });
  }, [currentSessionId, createNewSession]);

  // 박스오피스 API
  const fetchBoxOffice = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/boxoffice`);
      if (res.ok) setBoxOfficeList(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  // 현재 화면에 보여줄 메시지들 (현재 세션의 messages)
  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  // 현재 활성 탭의 영화들
  const activeRecommendationTab = recommendationTabs.find(
    tab => tab.id === activeRecommendationTabId
  );

  return {
    sessions,            // 전체 목록 (Sidebar용)
    currentSessionId,    // 현재 선택된 ID
    messages: currentSession?.messages || [], // 현재 화면용 메시지
    isLoading,
    boxOfficeList,
    sendMessage,
    createNewSession,    // 새 채팅 함수
    selectSession,       // 채팅방 선택 함수
    deleteSession,       // 삭제 함수

    recommendationTabs,
    activeRecommendationTabId,
    selectRecommendationTab,
    activeRecommendationTab,
    closeRecommendationTab,
  };
};

// -------------------------------------------------------------------------------------

// import { useState, useCallback, useEffect } from 'react';
// import { ChatMessage, RecommendationTab, Movie, BoxOfficeMovie } from '@/types';
// // import { generateMockResponse } from '@/data/mockData';

// export const useChat = () => {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
  
//   // 추천 결과 탭 관리
//   const [recommendationTabs, setRecommendationTabs] = useState<RecommendationTab[]>([]);
//   const [activeRecommendationTabId, setActiveRecommendationTabId] = useState<string | null>(null);

//   const [boxOfficeList, setBoxOfficeList] = useState<BoxOfficeMovie[]>([]);

//   // 질문에서 탭 제목 추출
//   const extractTabTitle = (query: string): string => {
//     // 키워드 기반으로 짧은 제목 생성
//     const keywords: { [key: string]: string } = {
//       'sf': 'SF 영화',
//       '공상과학': 'SF 영화',
//       '우주': 'SF 영화',
//       '로맨스': '로맨스 영화',
//       '사랑': '로맨스 영화',
//       '연애': '로맨스 영화',
//       '액션': '액션 영화',
//       '스릴러': '스릴러 영화',
//       '뮤지컬': '뮤지컬 영화',
//       '음악': '뮤지컬 영화',
//       '놀란': '놀란 감독',
//       '봉준호': '봉준호 감독',
//       '평점': '평점 높은 영화',
//       '명작': '명작 영화',
//       '추천': '추천 영화',
//       '박스오피스': '박스오피스',
//       '순위': '박스오피스',
//     };

//     const lowerQuery = query.toLowerCase();
//     for (const [keyword, title] of Object.entries(keywords)) {
//       if (lowerQuery.includes(keyword)) {
//         return title;
//       }
//     }

//     // 키워드가 없으면 질문 앞부분 사용
//     return query.slice(0, 10) + (query.length > 10 ? '...' : '');
//   };

//   // 메시지 전송
//   const sendMessage = useCallback(async (content: string) => {

//     const apiUrl = process.env.NEXT_PUBLIC_API_URL;

//     console.log('API URL:', apiUrl);
//     if (!content.trim()) return;

//     const userMessage: ChatMessage = {
//       id: `user-${Date.now()}`,
//       role: 'user',
//       content,
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setIsLoading(true);

//     try {
//       const res = await fetch(`${apiUrl}/chat`, {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body: JSON.stringify({ 
//           category: 'movie',
//           question: content,
//         }),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         console.error('API Error Response:', errorData);
//         throw new Error(errorData.message || 'API Error');
//       }
      
//       const data = await res.json();

//       const movies = (data.items || []).map((item: any) => ({
//         id: item.id,
//         title: item.title,
//         poster_url: item.poster_url,
//         overview: item.overview,
//         release_date: item.release_date,
//         vote_average: item.vote_average
//       }));

//       const assistantMessage: ChatMessage = {
//         id: `assistant-${Date.now()}`,
//         role: 'assistant',
//         content: data.answer,
//         items: movies,
//       };
//       setMessages(prev => [...prev, assistantMessage]);

//       if (movies.length > 0) {
//         const newTab: RecommendationTab = {
//           id: `rec-${Date.now()}`,
//           title: extractTabTitle(content),
//           query: content,
//           movies,
//           createdAt: new Date(),
//         };

//         setRecommendationTabs(prev => [...prev, newTab]);
//         setActiveRecommendationTabId(newTab.id);
//       }
//     } catch (error) {
//       console.error(error);
//       const errorMessage: ChatMessage = {
//         id: `error-${Date.now()}`,
//         role: 'assistant',
//         content: "죄송합니다. 오류가 발생했습니다.",
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const fetchBoxOffice = useCallback(async () => {
//     try {
//       // 프론트엔드 환경변수 URL 사용
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/boxoffice`);
//       if (!res.ok) throw new Error('Failed to fetch box office');
//       const data = await res.json();
//       setBoxOfficeList(data);
//     } catch (error) {
//       console.error('BoxOffice Error:', error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchBoxOffice();
//   }, [fetchBoxOffice]);

//   // 추천 탭 선택
//   const selectRecommendationTab = useCallback((tabId: string | null) => {
//     setActiveRecommendationTabId(tabId);
//   }, []);

//   // 추천 탭 삭제
//   const closeRecommendationTab = useCallback((tabId: string) => {
//     setRecommendationTabs(prev => {
//       const newTabs = prev.filter(tab => tab.id !== tabId);
      
//       // 삭제된 탭이 활성 탭이면 다른 탭 선택 또는 null
//       if (activeRecommendationTabId === tabId) {
//         if (newTabs.length > 0) {
//           setActiveRecommendationTabId(newTabs[newTabs.length - 1].id);
//         } else {
//           setActiveRecommendationTabId(null);
//         }
//       }
      
//       return newTabs;
//     });
//   }, [activeRecommendationTabId]);

//   // 모든 대화 초기화
//   const clearAllChats = useCallback(() => {
//     setMessages([]);
//     setRecommendationTabs([]);
//     setActiveRecommendationTabId(null);
//     setIsLoading(false);
//   }, []);

//   // 현재 활성 탭의 영화들
//   const activeRecommendationTab = recommendationTabs.find(
//     tab => tab.id === activeRecommendationTabId
//   );

//   return {
//     messages,
//     isLoading,
//     sendMessage,
//     clearAllChats,
//     recommendationTabs,
//     activeRecommendationTabId,
//     activeRecommendationTab,
//     selectRecommendationTab,
//     closeRecommendationTab,
//     boxOfficeList,
//   };
// }