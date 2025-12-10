'use client';

import { Performance } from '@/types';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface PerformanceCardProps {
    data: Performance;
}

const DEFAULT_POSTER = '/MovingCastle.jpg';

export default function PerformanceCard({ data }: PerformanceCardProps) {
    const imgSrc = data.image_url || DEFAULT_POSTER;

    const formatDate = (dateValue: number | string) => {
        const str = String(dateValue);
        return `${str.slice(0, 4)}.${str.slice(4, 6)}.${str.slice(6, 8)}`;
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = DEFAULT_POSTER;
    };

    return (
        <div 
          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-[#DEE2E6] w-[220px] shrink-0 flex flex-col"
        >
        {/* 포스터 */}
        <div className="relative h-[280px] bg-gray-100 overflow-hidden">
            <img
                src={imgSrc} 
                alt={data.title} 
                className="w-full h-full object-cover transition-transform duration-300"
                onError={handleImageError}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
            />
            {/* 장르 배지 */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#FFFFFF',
              fontSize: '10px',
              padding: '4px 8px',
              borderRadius: '12px',
              backdropFilter: 'blur(4px)',
            }}>
            {data.type}
            </div>
        </div>

        {/* 정보 */}
        <div className="p-3 flex flex-col flex-1">
            <h3 
              className="font-bold line-clamp-1" 
              title={data.title}
              style={{ color: '#212529', fontSize: '14px', marginBottom: '4px' }}
            >
            {data.title}
            </h3>
            
            {/* 장소 & 날짜 */}
            <div className="space-y-1 mb-3">
            <div className="flex items-center" style={{ color: '#6C757D', fontSize: '12px' }}>
                <LocationOnIcon style={{ fontSize: 12, marginRight: 4 }} />
                <span className="truncate">{data.eventSite} ({data.city})</span>
            </div>
            <div className="flex items-center" style={{ color: '#ADB5BD', fontSize: '12px' }}>
                <CalendarTodayIcon style={{ fontSize: 12, marginRight: 4 }} />
                <span>{formatDate(data.start_date)} ~</span>
            </div>
            </div>

            {/* AI 추천 이유 */}
            {data.reason && (
            <div style={{ backgroundColor: '#F8F9FA', padding: '8px', borderRadius: '8px', marginBottom: '12px' }}>
                <p className="line-clamp-2" style={{ color: '#495057', fontSize: '12px', lineHeight: '1.4' }}>
                💡 {data.reason}
                </p>
            </div>
            )}

            {/* 예매 버튼 */}
            <div className="mt-auto">
            {data.booking_url ? (
                <a 
                href={data.booking_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center transition-colors font-medium"
                style={{
                  backgroundColor: '#343A40',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  padding: '8px',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#495057'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#343A40'}
                >
                상세정보
                </a>
            ) : (
                <button 
                  disabled 
                  style={{
                    width: '100%',
                    backgroundColor: '#E9ECEF',
                    color: '#ADB5BD',
                    fontSize: '12px',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'not-allowed',
                    border: 'none',
                  }}
                >
                예매 정보 없음
                </button>
            )}
            </div>
        </div>
        </div>
    );
}