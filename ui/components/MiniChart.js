import React from 'react';

/**
 * Мини-столбчатая диаграмма для трендов.
 * @param {{data: number[], maxValue: number, height?: number}} props
 * @returns {JSX.Element}
 */
export default function MiniChart({ data, maxValue, height = 60 }) {
  if (!data.length) return null;

  const barWidth = Math.max(20, 100 / data.length); // минимальная ширина 20px
  return (
    <div className="mini-chart" style={{ height: `${height}px`, display: 'flex', gap: '2px' }}>
      {data.map((value, index) => {
        const percent = Math.min((value / maxValue) * 100, 100);
        return (
          <div
            key={index}
            className="bar"
            style={{
              flex: `0 0 ${barWidth}px`,
              backgroundColor: '#4caf50',
              height: `${percent}%`,
            }}
          />
        );
      })}
    </div>
  );
}
