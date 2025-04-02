import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

/**
 * Custom hook to create a countdown timer
 * @param targetDate The date to countdown to
 * @returns Countdown values and expiration status
 */
export const useCountdown = (targetDate: Date): CountdownResult => {
  const calculateTimeLeft = (): CountdownResult => {
    const now = new Date().getTime();
    const targetTime = targetDate.getTime();
    const difference = targetTime - now;
    
    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }
    
    // Calculate time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false
    };
  };
  
  const [countdown, setCountdown] = useState<CountdownResult>(calculateTimeLeft());
  
  useEffect(() => {
    // Update the countdown every second
    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 1000);
    
    // Clear the interval when component unmounts
    return () => clearInterval(timer);
  }, [targetDate]);
  
  return countdown;
};

/**
 * Format a countdown to a readable string
 * @param countdown Countdown result object
 * @returns Formatted countdown string
 */
export const formatCountdown = (countdown: CountdownResult): string => {
  const { days, hours, minutes, seconds, isExpired } = countdown;
  
  if (isExpired) {
    return 'Expired';
  }
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};
