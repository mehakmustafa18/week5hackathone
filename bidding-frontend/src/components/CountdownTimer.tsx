'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: string;
  onEnd?: () => void;
  className?: string;
  showEndedText?: boolean;
}

export default function CountdownTimer({ 
  endTime, 
  onEnd, 
  className = '', 
  showEndedText = true 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null); // null = not yet mounted
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      
      if (difference <= 0) {
        setIsEnded(true);
        setTimeLeft('Bid has been end');
        if (onEnd) onEnd();
        return null;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
    };

    // Initial calculation on mount (client-only)
    const initial = calculateTimeLeft();
    if (initial !== null) setTimeLeft(initial);

    if (isEnded) return;

    const timer = setInterval(() => {
      const next = calculateTimeLeft();
      if (next !== null) {
        setTimeLeft(next);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  // Don't render anything during SSR — only show after mount
  if (timeLeft === null) return <span className={className}>-- : -- : --</span>;

  if (isEnded && !showEndedText) return null;

  return (
    <span className={className} suppressHydrationWarning>
      {timeLeft}
    </span>
  );
}
