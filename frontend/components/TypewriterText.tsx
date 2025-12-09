'use client';

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number; // 타자 속도 (기본값 30ms)
    }

    // 아까 만드신 굵게 표시하기 함수를 여기로 가져오거나, props로 로직을 처리해야 합니다.
    // 편의상 여기서 렌더링 로직을 포함하겠습니다.
    const parseBoldText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-[#2A3A2A]">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
    };

    export default function TypewriterText({ text, speed = 30 }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let index = 0;
        
        // 이미 다 출력된 상태라면(예: 이전 대화 기록) 바로 보여주기
        // (이 로직이 없으면 새로고침 할때마다 모든 대화가 다시 타닥타닥거립니다)
        // 여기서는 간단하게 구현하기 위해 항상 타이핑 효과를 주되, 
        // 실제로는 isNew 같은 prop을 받아서 제어하는 게 좋습니다.
        
        const timer = setInterval(() => {
        if (index < text.length) {
            setDisplayedText((prev) => prev + text.charAt(index));
            index++;
        } else {
            clearInterval(timer);
        }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <span className="text-sm leading-relaxed whitespace-pre-wrap text-[#2A3A2A]">
        {parseBoldText(displayedText)}
        </span>
    );
}