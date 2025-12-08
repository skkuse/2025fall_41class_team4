'use client';

import { useState, useEffect } from 'react';
import { Performance } from '@/types';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface PerformanceCardProps {
    data: Performance;
}

const DEFAULT_POSTER = '/MovingCastle.jpg';

export default function PerformanceCard({ data }: PerformanceCardProps) {
    const [imgSrc, setImgSrc] = useState(data.image_url || DEFAULT_POSTER);

    useEffect(() => {
        setImgSrc(data.image_url || DEFAULT_POSTER);
    }, [data.image_url]);

    // 날짜 포맷팅 (20251225 -> 2025.12.25)
    const formatDate = (dateValue: number | string) => {
        const str = String(dateValue);
        return `${str.slice(0, 4)}.${str.slice(4, 6)}.${str.slice(6, 8)}`;
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-[#E5E5E5] w-[220px] flex-shrink-0 flex flex-col">
        {/* 1. 포스터 이미지 */}
        <div className="relative h-[280px] bg-gray-100 overflow-hidden">
            <img
                src={imgSrc} 
                alt={data.title} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                // 이미지 로드 실패 시 실행되는 이벤트 
                onError={() => setImgSrc(DEFAULT_POSTER)} 
            />
            {/* 장르 배지 */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
            {data.type}
            </div>
        </div>

        {/* 2. 상세 정보 */}
        <div className="p-3 flex flex-col flex-1">
            <h3 className="font-bold text-[#2A3A2A] text-sm mb-1 line-clamp-1" title={data.title}>
            {data.title}
            </h3>
            
            {/* 장소 & 날짜 */}
            <div className="space-y-1 mb-3">
            <div className="flex items-center text-[#6A7D6A] text-xs">
                <LocationOnIcon style={{ fontSize: 12, marginRight: 4 }} />
                <span className="truncate">{data.eventSite} ({data.city})</span>
            </div>
            <div className="flex items-center text-[#8A9A8A] text-xs">
                <CalendarTodayIcon style={{ fontSize: 12, marginRight: 4 }} />
                <span>{formatDate(data.start_date)} ~</span>
            </div>
            </div>

            {/* AI 추천 사유 (말풍선 스타일) */}
            {data.reason && (
            <div className="bg-[#F5F1E8] p-2 rounded-lg mb-3">
                <p className="text-[#4A5D4A] text-xs leading-snug line-clamp-2">
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
                className="block w-full text-center bg-[#4A5D4A] hover:bg-[#3A4D3A] text-white text-xs py-2 rounded-lg transition-colors font-medium"
                >
                상세정보
                </a>
            ) : (
                <button disabled className="w-full bg-gray-200 text-gray-400 text-xs py-2 rounded-lg cursor-not-allowed">
                예매 정보 없음
                </button>
            )}
            </div>
        </div>
        </div>
    );
}