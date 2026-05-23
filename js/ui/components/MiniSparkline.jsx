// js/ui/components/MiniSparkline.jsx
// Tiny SVG sparkline chart — no dependencies, pure React.createElement
// Props: data (number[]), width (number), height (number), color (string)

export default function MiniSparkline({ data, width = 120, height = 28, color = 'var(--accent)' }) {
  if (!data || data.length < 2) return null;

  const values = data.filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((v - min) / range) * innerHeight;
    return `${x},${y}`;
  }).join(' ');

  const pathD = `M ${points.replace(/,/g, ' ').replace(/(\d+) (\d+) (\d+) (\d+)/g, (_, x1, y1, x2, y2) => `L ${x2} ${y2}`)}`.replace(/^M/, 'M');

  return React.createElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      className: 'mini-sparkline',
      'aria-hidden': 'true',
    },
    // Area fill
    React.createElement('path', {
      d: `${pathD} L ${padding + innerWidth},${padding + innerHeight} L ${padding},${padding + innerHeight} Z`,
      fill: color,
      opacity: '0.1',
    }),
    // Line
    React.createElement('polyline', {
      points: points,
      fill: 'none',
      stroke: color,
      strokeWidth: '1.5',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  );
}
