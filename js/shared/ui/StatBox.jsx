// js/ui/components/StatBox.js
// Переиспользуемый компонент отображения статистики (метка + значение + опциональный тренд)

import React from 'react';
import styles from './StatBox.module.css';

/**
 * @param {{ value: string|number, label: string, color?: string, trend?: 'up'|'down'|'flat' }} props
 */
export default function StatBox({ value, label, color, trend }) {
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : null;
  const trendClass = trend === 'up' ? 'text-green' : trend === 'down' ? 'text-red' : 'text-muted';

  return (
    <div className={styles['stat-box']}>
      <div className={styles['stat-value']} style={color ? { color } : undefined}>
        {value}
        {trendArrow && (
          <span className={`stat-trend font-caption ${trendClass}`}>
            {trendArrow}
          </span>
        )}
      </div>
      <div className={styles['stat-label']}>{label}</div>
    </div>
  );
}
