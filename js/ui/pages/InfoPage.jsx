// js/ui/pages/InfoPage.js
// Справочная страница — зоны, HRV-гайд, расшифровка готовности

import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import { ZONES, HRV_GUIDE } from '../../config/constants.js';
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';

/* ---------- helpers ---------- */

function findHrvRange(hrv, guide) {
  if (!hrv || hrv <= 0) return null;
  for (const item of guide) {
    const r = item.range;
    if (r.startsWith('<')) {
      const max = parseInt(r.match(/\d+/)?.[0] || '0', 10);
      if (hrv < max) return item;
    } else if (r.startsWith('>')) {
      const min = parseInt(r.match(/\d+/)?.[0] || '999', 10);
      if (hrv > min) return item;
    } else {
      const nums = r.match(/\d+/g);
      if (nums && nums.length >= 2) {
        const lo = parseInt(nums[0], 10);
        const hi = parseInt(nums[1], 10);
        if (hrv >= lo && hrv <= hi) return item;
      }
    }
  }
  return guide[2] || null;
}

/* ---------- sub-components ---------- */

function ZoneCard({ zone, isRecommended }) {
  return React.createElement(
    'div',
    {
      className: 'card',
      style: {
        borderLeft: `3px solid ${zone.color}`,
        outline: isRecommended ? `2px solid ${zone.color}` : 'none',
        outlineOffset: '2px',
      },
    },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' } },
      React.createElement('strong', { style: { fontSize: 'var(--font-size-body)' } }, `${zone.zone} — ${zone.name}`),
      React.createElement('span', { className: 'badge', style: { backgroundColor: zone.color, color: '#fff', border: 'none' } }, zone.bpm)
    ),
    React.createElement(
      'div',
      { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)', marginBottom: 'var(--spacing-xs)' } },
      `Темп: ${zone.pace}`
    ),
    React.createElement('p', { style: { fontSize: 'var(--font-size-body)', margin: 'var(--spacing-xs) 0', color: 'var(--text)' } }, zone.desc),
    React.createElement(
      'p',
      { style: { fontSize: 'var(--font-size-body)', color: 'var(--accent)', margin: 'var(--spacing-xs) 0', fontWeight: 500 } },
      zone.use
    ),
    isRecommended && React.createElement(
      'p',
      { style: { fontSize: 'var(--font-size-caption)', color: zone.color, marginTop: 'var(--spacing-xs)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' } },
      '⭐ Рекомендована для сегодняшней тренировки'
    )
  );
}

function HrvCard({ item, isActive }) {
  return React.createElement(
    'div',
    {
      className: 'card',
      style: {
        borderLeft: `3px solid ${item.color}`,
        outline: isActive ? `2px solid ${item.color}` : 'none',
        outlineOffset: '2px',
        backgroundColor: isActive ? 'var(--surface2)' : undefined,
      },
    },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' } },
      React.createElement('strong', { style: { fontSize: 'var(--font-size-body)' } }, item.range),
      React.createElement(
        'span',
        {
          className: 'badge',
          style: {
            backgroundColor: item.color,
            color: '#fff',
            border: 'none',
          }
        },
        item.label
      )
    ),
    React.createElement('p', { style: { fontSize: 'var(--font-size-body)', margin: 'var(--spacing-xs) 0', color: 'var(--text)' } }, item.action),
    React.createElement(
      'p',
      { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', margin: 'var(--spacing-xs) 0' } },
      item.why
    ),
    isActive && React.createElement(
      'p',
      { style: { fontSize: 'var(--font-size-caption)', color: item.color, marginTop: 'var(--spacing-xs)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' } },
      '⭐ Ваш текущий показатель'
    )
  );
}

/* ---------- main component ---------- */

export default function InfoPage() {
  const state = useAppStore();
  const dispatch = useAppStore();

  const { lastCheckin: checkin, recoveryScore, readiness, autoReadiness, trainType, sessionPlan, weekNumber, showReadiness } = state;
  const { setShowReadiness } = dispatch;

  const [showZones, setShowZones] = useState(false);
  const [showHrv, setShowHrv] = useState(true);

  const hrv = checkin?.hrv ? Number(checkin.hrv) : 0;
  const restHr = checkin?.restHR ? Number(checkin.restHR) : 0;
  const activeHrvRange = findHrvRange(hrv, HRV_GUIDE);

  // Determine recommended zone
  let recommendedZone = null;
  if (trainType && sessionPlan) {
    const label = (sessionPlan.label || '').toLowerCase();
    if (label.includes('z3') || label.includes('темп')) {
      recommendedZone = 3;
    } else if (label.includes('z4') || label.includes('порог')) {
      recommendedZone = 4;
    } else {
      recommendedZone = 2;
    }
  }

  const readinessColor = readiness === 'red' ? 'var(--red)' : readiness === 'yellow' ? 'var(--yellow)' : 'var(--green)';

  return React.createElement(
    'div',
    { className: 'page-enter' },
    React.createElement('h2', null, 'Справка'),

    // ── Персонализированные данные ──
    checkin && Object.keys(checkin).length > 1 && React.createElement(
      'div',
      { className: 'card', style: { border: `1px solid ${readinessColor}`, backgroundColor: 'var(--surface2)' } },
      React.createElement(
        'h4',
        { style: { margin: '0 0 0.75rem 0', fontSize: 'var(--font-size-body)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' } },
        'Персональные показатели'
      ),
      // HRV
      hrv > 0 && React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-body)' } },
        React.createElement('span', { style: { color: 'var(--text2)' } }, 'HRV'),
        React.createElement(
          'span',
          { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' } },
          React.createElement('strong', { style: { fontFamily: 'var(--font-mono)' } }, `${hrv} мс`),
          activeHrvRange && React.createElement(
            'span',
            { className: 'badge', style: { backgroundColor: activeHrvRange.color, color: '#fff', border: 'none' } },
            activeHrvRange.label
          )
        )
      ),
      // Rest HR
      restHr > 0 && React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-body)' } },
        React.createElement('span', { style: { color: 'var(--text2)' } }, 'ЧСС покоя'),
        React.createElement(
          'span',
          { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' } },
          React.createElement('strong', { style: { fontFamily: 'var(--font-mono)' } }, `${restHr} уд/мин`),
          React.createElement(
            'span',
            {
              className: 'badge',
              style: {
                backgroundColor: restHr > 70 ? 'var(--red)' : restHr > 65 ? 'var(--yellow)' : 'var(--green)',
                color: '#000',
                border: 'none',
              }
            },
            restHr > 70 ? 'выше нормы' : restHr > 65 ? 'граница' : 'норма'
          )
        )
      ),
      // Recovery Score
      typeof recoveryScore === 'number' && recoveryScore > 0 && React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-body)' } },
        React.createElement('span', { style: { color: 'var(--text2)' } }, 'Recovery Score'),
        React.createElement(
          'strong',
          { style: { fontFamily: 'var(--font-mono)', color: recoveryScore >= 80 ? 'var(--green)' : recoveryScore >= 60 ? 'var(--yellow)' : 'var(--red)' } },
          `${recoveryScore}%`
        )
      ),
      // Readiness
      React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-body)' } },
        React.createElement('span', { style: { color: 'var(--text2)' } }, 'Готовность'),
        React.createElement(
          'span',
          { className: `pill ${readiness}`, style: { fontSize: 'var(--font-size-caption)', padding: '0.15rem 0.6rem' } },
          { green: 'Зелёный', yellow: 'Жёлтый', red: 'Красный' }[readiness] || readiness
        )
      ),
      // Today's recommended zone
      trainType && sessionPlan && React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-body)' } },
        React.createElement('span', { style: { color: 'var(--text2)' } }, 'Рекомендованная зона'),
        React.createElement(
          'strong',
          { style: { color: ZONES[recommendedZone ? recommendedZone - 1 : 1]?.color || 'var(--text)' } },
          `Z${recommendedZone || 2} — ${ZONES[recommendedZone ? recommendedZone - 1 : 1]?.name || ''}`
        )
      )
    ),

    // Readiness explanation (collapsible)
    React.createElement(
      CollapsiblePrimitive.Root,
      { className: 'collapsible', open: showReadiness, onOpenChange: (open) => setShowReadiness(open) },
      React.createElement(
        CollapsiblePrimitive.Trigger,
        { className: 'collapsible-header' },
        React.createElement('span', null, 'Расшифровка готовности'),
        React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, showReadiness ? '▲' : '▼')
      ),
      React.createElement(
        CollapsiblePrimitive.Panel,
        { className: 'collapsible-content' },
        React.createElement(
          'div',
          { style: { marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' } },
          React.createElement('span', { className: 'pill green', style: { flexShrink: 0 } }, 'Зелёный'),
          React.createElement('span', { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)' } }, '— все показатели в норме, полный план')
        ),
        React.createElement(
          'div',
          { style: { marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' } },
          React.createElement('span', { className: 'pill yellow', style: { flexShrink: 0 } }, 'Жёлтый'),
          React.createElement('span', { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)' } }, '— один из показателей ниже нормы: -1 подход в упражнениях')
        ),
        React.createElement(
          'div',
          { style: { marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' } },
          React.createElement('span', { className: 'pill red', style: { flexShrink: 0 } }, 'Красный'),
          React.createElement('span', { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)' } }, '— критические показатели: только мобильность/растяжка/дыхание')
        ),
        React.createElement(
          'div',
          { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-sm)', padding: '0.625rem', backgroundColor: 'var(--surface2)', borderRadius: 'var(--radius-sm)' } },
          'Пороги: сон < 6ч или ЧСС ≥ 76 или HRV < 40 или боль ≥ 5 → красный. Сон < 7ч или ЧСС ≥ 71 или HRV < 55 или боль ≥ 3 → жёлтый.'
        )
      )
    ),

    // HRV guide
    React.createElement(
      CollapsiblePrimitive.Root,
      { className: 'collapsible', open: showHrv, onOpenChange: (open) => setShowHrv(open) },
      React.createElement(
        CollapsiblePrimitive.Trigger,
        { className: 'collapsible-header' },
        React.createElement('span', null, 'HRV-гайд'),
        React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, showHrv ? '▲' : '▼')
      ),
      React.createElement(
        CollapsiblePrimitive.Panel,
        { className: 'collapsible-content' },
        HRV_GUIDE.map((item, i) => React.createElement(HrvCard, {
          key: i,
          item,
          isActive: activeHrvRange === item,
        }))
      )
    ),

    // Zones
    React.createElement(
      CollapsiblePrimitive.Root,
      { className: 'collapsible', style: { marginBottom: 0 }, open: showZones, onOpenChange: (open) => setShowZones(open) },
      React.createElement(
        CollapsiblePrimitive.Trigger,
        { className: 'collapsible-header' },
        React.createElement('span', null, 'Пульсовые зоны'),
        React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, showZones ? '▲' : '▼')
      ),
      React.createElement(
        CollapsiblePrimitive.Panel,
        { className: 'collapsible-content' },
        ZONES.map((zone, i) => React.createElement(ZoneCard, {
          key: i,
          zone,
          isRecommended: recommendedZone !== null && (i + 1) === recommendedZone,
        }))
      )
    )
  );
}
