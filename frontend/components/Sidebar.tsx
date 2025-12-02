'use client';

import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { ChatSession } from '@/types'; // 타입 import 확인 필요

interface SidebarProps {
  currentView: 'chat' | 'search';
  onViewChange: (view: 'chat' | 'search') => void;
  // [New] 세션 관련 Props 추가
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void; // 기존과 동일 (새 채팅 생성)
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession
}: SidebarProps) {

  const handleLogoClick = () => {
    onNewChat();
    onViewChange('chat');
  };
  return (
    <div 
      className="flex flex-col h-screen"
      style={{ width: '224px', backgroundColor: '#4A5D4A' }}
    >
      {/* Logo - 클릭 가능 */}
      <div 
        onClick={handleLogoClick}
        style={{ padding: '20px', paddingBottom: '12px', cursor: 'pointer' }}
        className="hover:opacity-80 transition-opacity"
      >
        <h1 
          className="font-bold"
          style={{ color: '#F5F1E8', fontSize: '20px' }}
        >
          LLMUSE
        </h1>
        <p style={{ color: '#B8D4A8', fontSize: '12px', marginTop: '2px' }}>
          AI 영화 추천 서비스
        </p>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '0 12px', marginBottom: '12px' }}>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center font-medium transition-colors"
          style={{
            backgroundColor: '#B8D4A8',
            color: '#2A3A2A',
            borderRadius: '8px',
            padding: '10px 16px',
            gap: '8px',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <AddIcon fontSize="small" />
          새 대화
        </button>
      </div>

      {/* 3. Session List (채팅 기록) - 추가 부분 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '0 12px' }}>
        <p style={{ color: '#B8D4A8', fontSize: '11px', marginBottom: '8px', paddingLeft: '4px', fontWeight: 600 }}>
          최근 대화
        </p>
        
        <div className="flex flex-col gap-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                onSelectSession(session.id);
                onViewChange('chat');
              }}
              className="group flex items-center justify-between transition-colors"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: session.id === currentSessionId ? '#3A4D3A' : 'transparent',
                color: session.id === currentSessionId ? '#F5F1E8' : '#B8D4A8',
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ChatBubbleOutlineIcon style={{ fontSize: 14 }} />
                <span className="text-sm truncate w-[120px]">
                  {session.title}
                </span>
              </div>

              {/* 삭제 버튼 (호버 시 표시) */}
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <DeleteOutlineIcon style={{ fontSize: 14 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1" style={{ padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => onViewChange('chat')}
            className="w-full flex items-center transition-colors"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              gap: '12px',
              fontSize: '14px',
              backgroundColor: currentView === 'chat' ? '#3A4D3A' : 'transparent',
              color: currentView === 'chat' ? '#F5F1E8' : '#B8D4A8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChatIcon fontSize="small" />
            <span>채팅 모드</span>
          </button>
          
          <button
            onClick={() => onViewChange('search')}
            className="w-full flex items-center transition-colors"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              gap: '12px',
              fontSize: '14px',
              backgroundColor: currentView === 'search' ? '#3A4D3A' : 'transparent',
              color: currentView === 'search' ? '#F5F1E8' : '#B8D4A8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <SearchIcon fontSize="small" />
            <span>영화 검색</span>
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <div style={{ padding: '12px' }}>
        <button 
          className="w-full flex items-center justify-center font-medium transition-colors"
          style={{
            backgroundColor: '#F5F1E8',
            borderRadius: '9999px',
            padding: '10px 16px',
            gap: '8px',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <SettingsIcon fontSize="small" />
          <span style={{ color: '#4A5D4A' }}>Setting</span>
        </button>
      </div>
    </div>
  );
}
// --------------------------------------------------------------------------------------------------------------------

// 'use client';

// import SettingsIcon from '@mui/icons-material/Settings';
// import ChatIcon from '@mui/icons-material/Chat';
// import SearchIcon from '@mui/icons-material/Search';
// import AddIcon from '@mui/icons-material/Add';

// interface SidebarProps {
//   currentView: 'chat' | 'search';
//   onViewChange: (view: 'chat' | 'search') => void;
//   onNewChat: () => void;
// }

// export default function Sidebar({ currentView, onViewChange, onNewChat }: SidebarProps) {
//   // 로고 클릭 시 홈(새 대화)으로 이동
//   const handleLogoClick = () => {
//     onNewChat();
//     onViewChange('chat');
//   };

//   return (
//     <div 
//       className="flex flex-col h-screen"
//       style={{ width: '224px', backgroundColor: '#4A5D4A' }}
//     >
//       {/* Logo - 클릭 가능 */}
//       <div 
//         onClick={handleLogoClick}
//         style={{ padding: '20px', paddingBottom: '12px', cursor: 'pointer' }}
//         className="hover:opacity-80 transition-opacity"
//       >
//         <h1 
//           className="font-bold"
//           style={{ color: '#F5F1E8', fontSize: '20px' }}
//         >
//           LLMUSE
//         </h1>
//         <p style={{ color: '#B8D4A8', fontSize: '12px', marginTop: '2px' }}>
//           AI 영화 추천 서비스
//         </p>
//       </div>

//       {/* New Chat Button */}
//       <div style={{ padding: '0 12px', marginBottom: '12px' }}>
//         <button
//           onClick={onNewChat}
//           className="w-full flex items-center justify-center font-medium transition-colors"
//           style={{
//             backgroundColor: '#B8D4A8',
//             color: '#2A3A2A',
//             borderRadius: '8px',
//             padding: '10px 16px',
//             gap: '8px',
//             fontSize: '14px',
//             border: 'none',
//             cursor: 'pointer',
//           }}
//         >
//           <AddIcon fontSize="small" />
//           새 대화
//         </button>
//       </div>

//       {/* Navigation */}
//       <div className="flex-1" style={{ padding: '0 12px' }}>
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
//           <button
//             onClick={() => onViewChange('chat')}
//             className="w-full flex items-center transition-colors"
//             style={{
//               padding: '10px 12px',
//               borderRadius: '8px',
//               gap: '12px',
//               fontSize: '14px',
//               backgroundColor: currentView === 'chat' ? '#3A4D3A' : 'transparent',
//               color: currentView === 'chat' ? '#F5F1E8' : '#B8D4A8',
//               border: 'none',
//               cursor: 'pointer',
//             }}
//           >
//             <ChatIcon fontSize="small" />
//             <span>채팅</span>
//           </button>
          
//           <button
//             onClick={() => onViewChange('search')}
//             className="w-full flex items-center transition-colors"
//             style={{
//               padding: '10px 12px',
//               borderRadius: '8px',
//               gap: '12px',
//               fontSize: '14px',
//               backgroundColor: currentView === 'search' ? '#3A4D3A' : 'transparent',
//               color: currentView === 'search' ? '#F5F1E8' : '#B8D4A8',
//               border: 'none',
//               cursor: 'pointer',
//             }}
//           >
//             <SearchIcon fontSize="small" />
//             <span>영화 검색</span>
//           </button>
//         </div>
//       </div>

//       {/* Settings Button */}
//       <div style={{ padding: '12px' }}>
//         <button 
//           className="w-full flex items-center justify-center font-medium transition-colors"
//           style={{
//             backgroundColor: '#F5F1E8',
//             borderRadius: '9999px',
//             padding: '10px 16px',
//             gap: '8px',
//             fontSize: '14px',
//             border: 'none',
//             cursor: 'pointer',
//           }}
//         >
//           <SettingsIcon fontSize="small" />
//           <span style={{ color: '#4A5D4A' }}>Setting</span>
//         </button>
//       </div>
//     </div>
//   );
// }