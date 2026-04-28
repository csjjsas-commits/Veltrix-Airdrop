import { useEffect, useState } from 'react';

interface Props {
  endDate?: string | null;
  className?: string;
}

export const CountdownBadge = ({ endDate, className = '' }: Props) => {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!endDate) {
      setCountdown('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const remaining = end - now;

      if (remaining <= 0) {
        setCountdown('Finalizado');
        clearInterval(interval);
      } else {
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setCountdown(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m`);
        } else {
          setCountdown(`${minutes}m`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!countdown) return null;

  return (
    <span className={`inline-block text-xs font-semibold text-brand-amber-400 ${className}`}>
      ⏱ {countdown}
    </span>
  );
};
