'use client';

import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { ChatSession } from '@/types';

interface SidebarProps {
  currentView: 'chat' | 'search';
  onViewChange: (view: 'chat' | 'search') => void;
  onLogoClick: () => void;  // 👈 추가
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export default function Sidebar({ 
  onViewChange,
  onLogoClick,  // 👈 추가
  onNewChat,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession
}: SidebarProps) {

  return (
    <div 
      className="flex flex-col h-screen"
      style={{ 
        width: '280px', 
        backgroundColor: '#FAFAFA',
        borderRight: '1px solid #E0E0E0',
      }}
    >
      {/* Logo */}
      <div 
        onClick={onLogoClick}  // 👈 변경
        style={{ 
          padding: '24px 20px 16px', 
          cursor: 'pointer',
          borderBottom: '1px solid #E0E0E0',
        }}
        className="hover:opacity-80 transition-opacity"
      >
        <h1 
          className="font-bold"
          style={{ 
            color: '#212121',
            fontSize: '22px',
            letterSpacing: '-0.5px',
          }}
        >
          LLMUSE
        </h1>
        <p style={{ 
          color: '#616161',
          fontSize: '12px', 
          marginTop: '4px',
        }}>
          AI 영화 & 공연 추천
        </p>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '16px 12px' }}>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center font-medium transition-all"
          style={{
            backgroundColor: '#E0E0E0',
            color: '#212121',
            borderRadius: '8px',
            padding: '10px 16px',
            gap: '8px',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D0D0D0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
        >
          <AddIcon fontSize="small" />
          새 대화
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '0 12px' }}>
        <p style={{ 
          color: '#757575', 
          fontSize: '11px', 
          marginBottom: '8px', 
          paddingLeft: '4px', 
          fontWeight: 600,
        }}>
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
                backgroundColor: session.id === currentSessionId 
                  ? '#ECECEC'
                  : 'transparent',
                color: session.id === currentSessionId ? '#212121' : '#616161',
              }}
              onMouseEnter={(e) => {
                if (session.id !== currentSessionId) {
                  e.currentTarget.style.backgroundColor = '#F0F0F0';
                }
              }}
              onMouseLeave={(e) => {
                if (session.id !== currentSessionId) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ChatBubbleOutlineIcon style={{ fontSize: 14 }} />
                <span className="text-sm truncate w-[180px]">
                  {session.title}
                </span>
              </div>

              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: 0, 
                  display: 'flex',
                  color: '#9E9E9E',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#424242'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9E9E9E'}
              >
                <DeleteOutlineIcon style={{ fontSize: 14 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Button */}
      {/* <div style={{ padding: '12px' }}>
        <button 
          className="w-full flex items-center justify-center font-medium transition-all"
          style={{
            backgroundColor: '#E0E0E0',
            borderRadius: '8px',
            padding: '10px 16px',
            gap: '8px',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            color: '#212121',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D0D0D0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
        >
          <SettingsIcon fontSize="small" />
          <span>Settings</span>
        </button>
      </div> */}
    </div>
  );
}