// js/ui/components/StreakBadge.tsx
// Visual badge showing current streak with flame icon

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({ streak, label, size = 'md' }: StreakBadgeProps) {
  if (streak === 0) return null;

  const sizeClasses = {
    sm: 'streak-badge--sm',
    md: 'streak-badge--md',
    lg: 'streak-badge--lg',
  };

  return (
    <div className={`streak-badge ${sizeClasses[size]}`}>
      <Flame className="streak-badge__icon" />
      <span className="streak-badge__count">{streak}</span>
      {label && <span className="streak-badge__label">{label}</span>}
    </div>
  );
}