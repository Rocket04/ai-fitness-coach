// js/ui/components/ScaleSelector.js
// Переиспользуемый компонент выбора шкалы 1–5 (для RPE, боли и т.д.)

import React from 'react';
import styles from './ScaleSelector.module.css';

/**
 * @param {{ value: number, onChange: (v: number) => void, labels?: Object, max?: number }} props
 */
function scaleColor(v, max, inverse) {
  const t = (v - 1) / (max - 1);
  const pos = inverse ? t : 1 - t;
  if (pos <= 0.33) return 'var(--green)';
  if (pos <= 0.66) return 'var(--yellow)';
  return 'var(--red)';
}

export default function ScaleSelector({ value, onChange, labels, max = 5, inverse = false }) {
  const options = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={styles['scale-selector']}>
      <div className={styles['scale-selector__buttons']}>
        {options.map(v => {
          const isActive = value === v;
          const color = isActive ? scaleColor(v, max, inverse) : undefined;
          return (
            <button
              key={v}
              className={`chip chip-scale${isActive ? ' active' : ''}`}
              onClick={() => onChange(v)}
              aria-label={labels && labels[v] ? `${v} — ${labels[v]}` : `Значение ${v}`}
              aria-pressed={isActive}
              style={isActive ? { background: color, boxShadow: `0 0 10px ${color}` } : undefined}
            >
              {String(v)}
            </button>
          );
        })}
      </div>
      <div className={styles['scale-selector__label']}>
        {value > 0 && labels ? (labels[value] || '') : '—'}
      </div>
    </div>
  );
}
