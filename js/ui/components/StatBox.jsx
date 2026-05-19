// js/ui/components/StatBox.js
// Переиспользуемый компонент отображения статистики (метка + значение + опциональный тренд)

import React from 'react';

/**
 * @param {{ value: string|number, label: string, color?: string, trend?: 'up'|'down'|'flat' }} props
 */
export default function StatBox({ value, label, color, trend }) {
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'flat' ? '→' : null;
  const trendClass = trend === 'up' ? 'text-green' : trend === 'down' ? 'text-red' : 'text-muted';

  return (
    <div className="stat-box">
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
        {trendArrow && (
          <span className={`stat-trend font-caption ${trendClass}`}>
            {trendArrow}
          </span>
        )}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
