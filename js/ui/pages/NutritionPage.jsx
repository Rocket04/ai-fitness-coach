import React, { } from 'react';
import { AlertTriangle, Star } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { NUTRITION } from '../../config/constants.js';

export default function NutritionPage() {
  const state = useAppStore();
  const { lastCheckin: checkin, recoveryScore, readiness, trainType, sessionPlan } = state;

  // Build personalized tips
  const tips = [];

  if (trainType && sessionPlan) {
    tips.push('Сегодня тренировка — увеличь потребление белка до 130–140 г');
  } else {
    tips.push('Сегодня день отдыха — поддерживай белок на уровне 100–120 г для восстановления');
  }

  if (typeof recoveryScore === 'number' && recoveryScore < 60) {
    tips.push('Восстановление снижено — удели внимание магнию и D3');
  }

  const soreness = checkin?.muscleSoreness ? Number(checkin.muscleSoreness) : 0;
  if (soreness >= 4) {
    tips.push('Мышечная болезненность повышена — белок в приоритете');
  }

  const energy = checkin?.energy ? Number(checkin.energy) : 0;
  if (energy > 0 && energy <= 2) {
    tips.push('Энергия низкая — проверь достаточно ли калорий (2500–2800 ккал)');
  }

  const sleepQ = checkin?.sleepQuality ? Number(checkin.sleepQuality) : 0;
  if (sleepQ > 0 && sleepQ <= 2) {
    tips.push('Качество сна низкое — принимай магний цитрат 200 мг вечером');
  }

  // Determine which rows to highlight
  const highlightIndices = [];
  if (trainType && sessionPlan) {
    highlightIndices.push(1);
    highlightIndices.push(2);
    highlightIndices.push(5);
  }
  if (typeof recoveryScore === 'number' && recoveryScore < 60) {
    highlightIndices.push(6);
    highlightIndices.push(7);
  }
  if (soreness >= 3) {
    highlightIndices.push(1);
  }
  if (!trainType || !sessionPlan) {
    highlightIndices.push(3);
  }

  const rows = NUTRITION.map((item, i) => {
    const isHighlighted = highlightIndices.includes(i);
    return React.createElement(
      'tr',
      {
        key: i,
        style: isHighlighted ? { backgroundColor: 'var(--surface2)', fontWeight: 600 } : {},
      },
      React.createElement(
        'td',
        { style: { padding: 'var(--spacing-sm) var(--spacing-sm)', fontWeight: isHighlighted ? 700 : 400, fontSize: 'var(--font-size-body)' } },
        isHighlighted ? React.createElement(Star, { size: 14, style: { display: 'inline-block', marginRight: '4px' } }) : null,
        item.label
      ),
      React.createElement(
        'td',
        { style: { padding: 'var(--spacing-sm) var(--spacing-sm)', fontSize: 'var(--font-size-body)', fontFamily: 'var(--font-mono)' } },
        item.val
      ),
      React.createElement(
        'td',
        { style: { padding: 'var(--spacing-sm) var(--spacing-sm)', fontSize: 'var(--font-size-body)', color: 'var(--text2)' } },
        item.note
      )
    );
  });

  return React.createElement(
    'div',
    { className: 'page-enter' },
    React.createElement('h2', null, 'Питание'),
    React.createElement(
      'p',
      { className: 'text-sm', style: { color: 'var(--text2)', marginBottom: 'var(--spacing-md)' } },
      'Рекомендации по питанию для набора массы'
    ),

    // ── Personalized tips ──
    tips.length > 0 && React.createElement(
      'div',
      { className: 'coach-advice-card', style: { borderColor: 'rgba(79, 124, 68, 0.3)' } },
      React.createElement('h4', null, 'Рекомендации на сегодня'),
      tips.map((t, i) =>
        React.createElement(
          'div',
          { key: i, className: 'coach-advice-item' },
          t
        )
      )
    ),

    // ── Nutrition table ──
    React.createElement(
      'div',
      { className: 'card', style: { overflowX: 'auto', padding: 0 } },
      React.createElement(
        'table',
        { style: { width: '100%', borderCollapse: 'collapse' } },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            { style: { borderBottom: '1px solid var(--border)', textAlign: 'left' } },
            React.createElement('th', { style: { marginTop: 'var(--spacing-sm)', padding: '0.5rem', fontSize: 'var(--font-size-caption)', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text2)' } }, 'Параметр'),
            React.createElement('th', { style: { marginTop: 'var(--spacing-sm)', padding: '0.5rem', fontSize: 'var(--font-size-caption)', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text2)' } }, 'Значение'),
            React.createElement('th', { style: { marginTop: 'var(--spacing-sm)', padding: '0.5rem', fontSize: 'var(--font-size-caption)', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text2)' } }, 'Примечание')
          )
        ),
        React.createElement('tbody', null, rows)
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        'p',
        { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)', margin: 0, lineHeight: 1.6 } },
        React.createElement('span', { style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-xs)' } },
          React.createElement(AlertTriangle, { size: 16, style: { flexShrink: 0, marginTop: '2px' } }),
          'При астме важно получать достаточно белка и магния. Дефицит магния усугубляет бронхоспазм.'
        )
      )
    )
  );
}