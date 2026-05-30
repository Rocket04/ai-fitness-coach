// js/ui/pages/TrendChart.jsx
// Reusable SVG trend chart with multi-metric support, tooltips, legend, animations

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// ── Metric definition for multi-line support ──
interface MetricConfig {
  yKey: string;
  color: string;
  label: string;
  unit?: string;
}

/**
 * Enhanced TrendChart with:
 * - Hover tooltips with exact values and deltas
 * - Clickable legend to toggle metrics
 * - Smooth CSS/SVG animations
 * - Responsive container-based width
 * - Touch support for mobile
 */
export default function TrendChart({
  data,
  yKey,
  color,
  label,
  unit = '',
  height = 160,
  metrics: externalMetrics,
  animated = true,
  showLegend = true,
  showStats = true,
}: {
  data: any[];
  yKey: string;
  color: string;
  label?: string;
  unit?: string;
  height?: number;
  metrics?: MetricConfig[];
  animated?: boolean;
  showLegend?: boolean;
  showStats?: boolean;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(animated);

  // Build metrics array: external multi-metric or single from props
  const metrics: MetricConfig[] = useMemo(() => {
    if (externalMetrics && externalMetrics.length > 0) return externalMetrics;
    return [{ yKey, color, label: label || yKey, unit }];
  }, [externalMetrics, yKey, color, label, unit]);

  // Filter visible metrics
  const visibleMetrics = metrics.filter(m => !hiddenMetrics.has(m.yKey));

  // Measure container for responsive width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Trigger animation on mount / data change
  useEffect(() => {
    if (animated) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [data, animated]);

  // Need at least 2 data points
  if (!data || data.length < 2) {
    return React.createElement(
      'div',
      { className: 'text-center p-lg text-muted font-body' },
      t('log.insufficientDataChart')
    );
  }

  // Collect all valid points across visible metrics
  const allValues: number[] = [];
  const metricPoints: Record<string, { index: number; value: number; date: string }[]> = {};

  for (const metric of visibleMetrics) {
    const pts = data
      .map((d, i) => ({ index: i, value: Number(d[metric.yKey]) || 0, date: d.date }))
      .filter(p => p.value > 0);
    metricPoints[metric.yKey] = pts;
    allValues.push(...pts.map(p => p.value));
  }

  if (allValues.length < 2) {
    return React.createElement(
      'div',
      { className: 'text-center p-lg text-muted font-body' },
      t('log.insufficientDataChart')
    );
  }

  // Chart dimensions — responsive
  const pt = 18;
  const pb = 28;
  const pl = 40;
  const pr = 12;
  // Use measured container width, with a minimum
  const chartW = Math.max(containerWidth || 300, 260);
  const chartH = height;

  const values = allValues;
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  const padding = range * 0.15;
  const yMax = maxVal + padding;
  const yMin = Math.max(0, minVal - padding);
  const yRange = yMax - yMin || 1;

  // Scale functions
  const xOf = (i: number) => pl + (i / Math.max(data.length - 1, 1)) * (chartW - pl - pr);
  const yOf = (v: number) => pt + (1 - (v - yMin) / yRange) * (chartH - pt - pb);

  // Grid lines
  const refValues = [];
  for (let i = 0; i <= 4; i++) {
    refValues.push(yMin + (yRange * i) / 4);
  }

  // X-axis labels
  const maxLabels = Math.min(data.length, Math.floor(chartW / 60));
  const labelInterval = Math.max(1, Math.floor(data.length / maxLabels));

  // Stats
  const baseline = values.reduce((a, b) => a + b, 0) / values.length;
  const minStat = Math.round(minVal);
  const maxStat = Math.round(maxVal);
  const avgStat = Math.round(baseline);

  // Per-metric stats for the legend
  const metricStats = visibleMetrics.map(m => {
    const pts = metricPoints[m.yKey] || [];
    const vals = pts.map(p => p.value);
    const mMin = vals.length > 0 ? Math.round(Math.min(...vals)) : 0;
    const mMax = vals.length > 0 ? Math.round(Math.max(...vals)) : 0;
    const mAvg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const lastVal = pts.length > 0 ? pts[pts.length - 1].value : 0;
    const firstVal = pts.length > 1 ? pts[0].value : lastVal;
    const trend = lastVal > firstVal ? 'up' : lastVal < firstVal ? 'down' : 'flat';
    const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text3)';
    const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
    return { mMin, mMax, mAvg, lastVal: Math.round(lastVal), trend, trendColor, trendArrow };
  });

  // Tooltip data for hovered index
  const tooltipData = hoveredIndex !== null ? data[hoveredIndex] : null;

  const toggleMetric = useCallback((yKey: string) => {
    setHiddenMetrics(prev => {
      const next = new Set(prev);
      if (next.has(yKey)) {
        next.delete(yKey);
      } else {
        // Don't hide last metric
        if (visibleMetrics.length <= 1) return prev;
        next.add(yKey);
      }
      return next;
    });
  }, [visibleMetrics.length]);

  // Handle touch outside to clear tooltip
  const handleTouchOutside = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  return React.createElement(
    'div',
    { className: 'trend-chart-wrapper' },
    // ── Clickable Legend ──
    showLegend && visibleMetrics.length > 1 && React.createElement(
      'div',
      {
        className: 'trend-legend',
        role: 'group',
        'aria-label': 'Метрики графика',
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-xs)',
          marginBottom: 'var(--spacing-sm)',
        },
      },
      metrics.map((m, idx) => {
        const isHidden = hiddenMetrics.has(m.yKey);
        const stats = metricStats[idx];
        return React.createElement(
          'button',
          {
            key: m.yKey,
            className: `trend-legend__item${isHidden ? ' trend-legend--hidden' : ''}`,
            onClick: () => toggleMetric(m.yKey),
            role: 'switch',
            'aria-checked': !isHidden,
            'aria-label': `${m.label}: ${isHidden ? 'скрыта' : 'отображается'}`,
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '100px',
              border: `1px solid ${isHidden ? 'var(--border)' : m.color}`,
              backgroundColor: isHidden ? 'transparent' : `${m.color}18`,
              color: isHidden ? 'var(--text3)' : m.color,
              fontSize: 'var(--font-size-caption)',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: isHidden ? 0.5 : 1,
              textDecoration: isHidden ? 'line-through' : 'none',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
            },
          },
          React.createElement('span', {
            style: {
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isDisabled(m.color, isHidden),
              flexShrink: 0,
            },
          }),
          m.label,
          stats && React.createElement('span', {
            style: { fontWeight: 400, color: 'var(--text3)', marginLeft: '2px' },
          }, `${stats.lastVal}${m.unit || unit}`)
        );
      })
    ),

    // ── Stats summary (single metric mode only) ──
    showStats && visibleMetrics.length === 1 && React.createElement(
      'div',
      { className: 'chart-stats', style: { display: 'flex', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-caption)', color: 'var(--text3)', flexWrap: 'wrap' } },
      React.createElement('span', null,
        'Мин: ', React.createElement('span', { className: 'chart-stat-value', style: { color: 'var(--text)', fontWeight: 600 } }, minStat), ' ', unit
      ),
      React.createElement('span', null,
        'Ср: ', React.createElement('span', { className: 'chart-stat-value', style: { color: 'var(--text)', fontWeight: 600 } }, avgStat), ' ', unit
      ),
      React.createElement('span', null,
        'Макс: ', React.createElement('span', { className: 'chart-stat-value', style: { color: 'var(--text)', fontWeight: 600 } }, maxStat), ' ', unit
      ),
      metricStats[0] && React.createElement('span', { style: { color: metricStats[0].trendColor, fontWeight: 600 } },
        metricStats[0].trendArrow, ' ', metricStats[0].lastVal, unit
      )
    ),

    // ── SVG Chart ──
    React.createElement(
      'div',
      {
        ref: containerRef,
        className: 'trend-chart-container',
        style: { overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', position: 'relative' },
        onTouchEnd: handleTouchOutside,
      },
      React.createElement(
        'div',
        { style: { display: 'inline-block', position: 'relative', minWidth: '100%' } },
        React.createElement(
          'svg',
          {
            width: chartW,
            height: chartH,
            viewBox: `0 0 ${chartW} ${chartH}`,
            style: { display: 'block' },
            className: animated ? 'trend-chart-svg trend-chart-svg--animated' : 'trend-chart-svg',
            role: 'img',
            'aria-label': `График тренда: ${visibleMetrics.map(m => m.label).join(', ')}`,
          },
          // Grid
          refValues.map((v, i) =>
            React.createElement('line', {
              key: 'grid-' + i,
              x1: pl, y1: yOf(v), x2: chartW - pr, y2: yOf(v),
              stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3,3',
            })
          ),
          // Baseline
          visibleMetrics.length === 1 && React.createElement('line', {
            x1: pl, y1: yOf(baseline), x2: chartW - pr, y2: yOf(baseline),
            stroke: color, strokeWidth: 1, strokeDasharray: '4,4', strokeOpacity: 0.4,
          }),
          // Y-axis labels
          refValues.map((v, i) =>
            React.createElement('text', {
              key: 'yl-' + i,
              x: pl - 6, y: yOf(v) + 4,
              textAnchor: 'end', fill: 'var(--text3)', fontSize: '10', fontFamily: 'var(--font-mono)',
            }, Math.round(v))
          ),
          // Lines and areas for each visible metric
          visibleMetrics.map((m) => {
            const pts = metricPoints[m.yKey] || [];
            if (pts.length < 2) return null;

            // Map from data index to value for x positioning
            const sortedPts = [...pts].sort((a, b) => a.index - b.index);
            const firstX = xOf(sortedPts[0].index);
            const lastX = xOf(sortedPts[sortedPts.length - 1].index);
            const bottomY = yOf(yMin);

            const lineParts = sortedPts.map(p => `${xOf(p.index)},${yOf(p.value)}`);
            const lineD = 'M' + lineParts.join(' L');
            const areaD = `M${firstX},${bottomY} L${lineD.slice(1)} L${lastX},${bottomY} Z`;

            return React.createElement(
              'g',
              { key: m.yKey },
              // Area fill
              React.createElement('path', {
                d: areaD, fill: m.color, fillOpacity: 0.08,
                style: animated ? { transition: 'd 0.6s ease-out' } : undefined,
              }),
              // Line
              React.createElement('path', {
                d: lineD, fill: 'none', stroke: m.color, strokeWidth: 2,
                strokeLinejoin: 'round', strokeLinecap: 'round',
                style: animated && isAnimating ? {
                  strokeDasharray: '1000',
                  strokeDashoffset: '1000',
                  animation: 'drawLine 0.8s ease-out forwards',
                } : undefined,
              }),
              // Dots
              sortedPts.map((p, i) =>
                React.createElement('circle', {
                  key: 'dot-' + m.yKey + '-' + i,
                  cx: xOf(p.index), cy: yOf(p.value),
                  r: 3.5, fill: m.color, stroke: 'var(--bg)', strokeWidth: 1.5,
                  style: animated ? {
                    opacity: 0,
                    animation: `fadeDot 0.3s ease-out ${0.4 + i * 0.05}s forwards`,
                  } : undefined,
                })
              ),
            );
          }),
          // Hit areas + X labels (use all data indices)
          data.map((d, i) => {
            const date = d.date ? d.date.slice(5) : '';
            const isLabelVisible = i % labelInterval === 0 || i === data.length - 1;
            return React.createElement(
              'g',
              { key: 'x-' + i },
              // Hit area — spans full height at this x position
              React.createElement('rect', {
                x: xOf(i) - 15, y: 0, width: 30, height: chartH,
                fill: 'transparent', className: 'cursor-pointer',
                onMouseEnter: () => setHoveredIndex(i),
                onMouseLeave: () => setHoveredIndex(null),
                onTouchStart: (e: any) => { e.stopPropagation(); setHoveredIndex(i); },
                onTouchEnd: () => setHoveredIndex(null),
              }),
              // Vertical hover line
              hoveredIndex === i && React.createElement('line', {
                x1: xOf(i), y1: pt, x2: xOf(i), y2: chartH - pb,
                stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '2,2', pointerEvents: 'none',
              }),
              // X label
              isLabelVisible && React.createElement('text', {
                x: xOf(i), y: chartH - 6,
                textAnchor: 'middle', fill: 'var(--text3)', fontSize: '9', fontFamily: 'var(--font-mono)',
              }, date)
            );
          })
        ),

        // ── Enhanced Tooltip ──
        hoveredIndex !== null && tooltipData && React.createElement(
          'div',
          {
            className: 'trend-tooltip',
            role: 'tooltip',
            style: {
              position: 'absolute',
              left: Math.min(
                Math.max(xOf(hoveredIndex), 60),
                chartW - 60
              ),
              top: (() => {
                // Find the highest point at this index to position tooltip above
                let minY = chartH;
                for (const m of visibleMetrics) {
                  const v = Number(tooltipData[m.yKey]);
                  if (v > 0) minY = Math.min(minY, yOf(v));
                }
                return minY - 12;
              })(),
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 20,
              boxShadow: 'var(--shadow-md)',
              minWidth: '80px',
              textAlign: 'center',
            },
          },
          // Date header
          React.createElement('div', {
            style: { fontWeight: 600, fontSize: 'var(--font-size-caption)', color: 'var(--text)', marginBottom: '2px' },
          }, formatDate(tooltipData.date)),
          // Values for each visible metric
          visibleMetrics.map((m) => {
            const val = Number(tooltipData[m.yKey]);
            if (val <= 0) return null;
            const prevVal = hoveredIndex > 0 ? Number(data[hoveredIndex - 1]?.[m.yKey]) : null;
            const delta = prevVal !== null && prevVal > 0 ? val - prevVal : null;
            const deltaColor = delta !== null ? (delta > 0 ? 'var(--green)' : delta < 0 ? 'var(--red)' : 'var(--text3)') : null;
            return React.createElement(
              'div',
              {
                key: m.yKey,
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-caption)' },
              },
              React.createElement('span', { style: { color: m.color, fontWeight: 600 } }, m.label),
              React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
                React.createElement('span', { style: { color: 'var(--text)', fontWeight: 600, fontFamily: 'var(--font-mono)' } },
                  m.unit === '%' || m.unit === '' ? Math.round(val) : val.toFixed(1), m.unit || unit
                ),
                delta !== null && React.createElement('span', {
                  style: { color: deltaColor, fontSize: '10px', fontFamily: 'var(--font-mono)' },
                }, delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1))
              )
            );
          })
        )
      )
    )
  );
}

// Helper functions
function isDisabled(color: string, disabled: boolean): string {
  return disabled ? 'var(--text3)' : color;
}

function formatDate(date: string): string {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length < 3) return date;
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${months[monthIdx] || parts[1]}`;
}
