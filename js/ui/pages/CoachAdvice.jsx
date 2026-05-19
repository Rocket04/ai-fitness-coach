// js/ui/pages/CoachAdvice.js
// Умный сворачиваемый блок советов тренера (Вариант 3)

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import { detectNegativeTrends } from '../../core/analytics.js';
import Collapsible from '../components/Collapsible.jsx';
import HelpIcon from '../components/HelpIcon.jsx';

export default function CoachAdvice() {
  const [open, setOpen] = useState(true);
  const {
    sessions, checkins,
    trendData30,
    trendWarnings, overtrainingWarning,
    lastCheckin, readiness, recoveryScore,
    apreReasons, sessionPlan,
    recoveryDebt,
  } = useAppStore();

  // ════════════════════════════════════════════════════════════
  // 1. Предиктивные предупреждения
  // ════════════════════════════════════════════════════════════
  const predictive = useMemo(() => {
    const items = [];
    if (overtrainingWarning) {
      items.push({
        icon: '\uD83D\uDEA8',
        color: 'red',
        title: overtrainingWarning.title,
        text: overtrainingWarning.message,
        action: overtrainingWarning.recommendation,
      });
    } else if (trendWarnings && trendWarnings.length > 0) {
      const w = trendWarnings[0];
      items.push({
        icon: '\u26A0\uFE0F',
        color: 'yellow',
        title: `\u0422\u0440\u0435\u043D\u0434: ${w.metric}`,
        text: w.message,
        action: w.recommendation,
      });
    }
    if (trendData30 && trendData30.length >= 3) {
      const direct = detectNegativeTrends(trendData30);
      for (const w of direct) {
        if (items.some(x => x.title.includes(w.metric))) continue;
        items.push({
          icon: w.severity === 'high' ? '\uD83D\uDD34' : '\uD83D\uDFE1',
          color: w.severity === 'high' ? 'red' : 'yellow',
          title: `\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435: ${w.metric}`,
          text: w.message,
          action: w.recommendation,
        });
      }
    }
    return items;
  }, [overtrainingWarning, trendWarnings, trendData30]);

  // ════════════════════════════════════════════════════════════
  // 2. Персонализированные советы
  // ════════════════════════════════════════════════════════════
  const personalized = useMemo(() => {
    const items = [];
    const recentSessions = [...(sessions || [])]
      .filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);

    // \u0411\u043E\u043B\u044C \u043F\u043E\u0441\u043B\u0435 \u0442\u0438\u043F\u0430 B
    const bSessions = recentSessions.filter(s => s.type === 'B');
    const bWithPain = bSessions.filter(s => {
      const c = (checkins || []).find(ch => ch.date === s.date);
      if (!c) return false;
      return (Number(c.hipPain) >= 3) || (Number(c.shoulderPain) >= 3);
    });
    if (bWithPain.length >= 2 && bSessions.length > 0) {
      items.push({
        icon: '\uD83C\uDFD0',
        title: 'Foam rolling \u043F\u043E\u0441\u043B\u0435 \u0442\u0438\u043F\u0430 B',
        text: `\u041F\u043E\u0441\u043B\u0435 ${bWithPain.length} \u0438\u0437 ${bSessions.length} \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u043A \u0442\u0438\u043F\u0430 B \u043E\u0442\u043C\u0435\u0447\u0430\u043B\u0430\u0441\u044C \u0431\u043E\u043B\u044C. \u0414\u043E\u0431\u0430\u0432\u044C \u043C\u0424\u0420 \u0432 \u0432\u0435\u0447\u0435\u0440\u043D\u044E\u044E \u0440\u0443\u0442\u0438\u043D\u0443.`,
      });
    }

    // \u041D\u0438\u0437\u043A\u0430\u044F \u044D\u043D\u0435\u0440\u0433\u0438\u044F \u043F\u043E \u0434\u043D\u044F\u043C \u043D\u0435\u0434\u0435\u043B\u0438
    const dayEnergy = {};
    for (const c of (checkins || [])) {
      if (!c.date || Number(c.energy) <= 0) continue;
      const d = new Date(c.date + 'T12:00:00');
      const day = d.getDay();
      if (!dayEnergy[day]) dayEnergy[day] = [];
      dayEnergy[day].push(Number(c.energy));
    }
    const dayNames = ['\u0412\u0441','\u041F\u043D','\u0412\u0442','\u0421\u0440','\u0427\u0442','\u041F\u0442','\u0421\u0431'];
    for (const [day, values] of Object.entries(dayEnergy)) {
      if (values.length >= 2) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        if (avg <= 2) {
          items.push({
            icon: '\uD83C\uDF7D\uFE0F',
            title: `\u041D\u0438\u0437\u043A\u0430\u044F \u044D\u043D\u0435\u0440\u0433\u0438\u044F \u043F\u043E ${dayNames[Number(day)]}`,
            text: `\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u044D\u043D\u0435\u0440\u0433\u0438\u044F \u2014 ${avg.toFixed(1)}/5. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u043A\u0430\u043B\u043E\u0440\u0438\u0438 \u0432 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C.`,
          });
        }
      }
    }

    // \u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0441\u043E \u0441\u043D\u043E\u043C
    const recentCheckins = [...(checkins || [])]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 5);
    const poorSleep = recentCheckins.filter(c => Number(c.sleepQuality) > 0 && Number(c.sleepQuality) <= 2);
    if (poorSleep.length >= 3) {
      items.push({
        icon: '\uD83C\uDF19',
        title: '\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0441\u043E \u0441\u043D\u043E\u043C',
        text: `${poorSleep.length} \u0438\u0437 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0445 5 \u0447\u0435\u043A\u0438\u043D\u043E\u0432 \u2014 \u043F\u043B\u043E\u0445\u043E\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u043D\u0430. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0433\u0438\u0433\u0438\u0435\u043D\u0443 \u0441\u043D\u0430.`,
      });
    }

    return items;
  }, [sessions, checkins]);

  // ════════════════════════════════════════════════════════════
  // 3. \u041A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438
  // ════════════════════════════════════════════════════════════
  const concrete = useMemo(() => {
    const items = [];

    // Последняя нагрузка
    const lastTraining = [...(sessions || [])]
      .filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    if (lastTraining && typeof lastTraining.sessionLoad === 'number') {
      const loadItem = {
        icon: '\uD83D\uDCAA',
        text: [`Последняя нагрузка: ${lastTraining.sessionLoad} у.е.`, React.createElement(HelpIcon, { term: 'Session Load', definition: 'Внутренняя тренировочная нагрузка = RPE × длительность (мин). Позволяет сравнивать тренировки разной интенсивности.' })],
      };
      if (lastTraining.sessionLoad > 400) {
        loadItem.subtext = 'высокая нагрузка';
      }
      items.push(loadItem);
    }

    if (apreReasons && apreReasons.length > 0) {
      for (const r of apreReasons) {
        items.push({
          icon: '\uD83C\uDFAF',
          text: [r, React.createElement(HelpIcon, { term: 'APRE', definition: 'Метод автоматической регулировки нагрузки по субъективной интенсивности (RPE).' })]
        });
      }
    }

    if (sessionPlan) {
      if (readiness === 'red') {
        items.push({
          icon: '\u274C',
          text: ['\u0417\u0430\u043C\u0435\u043D\u0438 \u0431\u0435\u0433 Z3 \u043D\u0430 Z2 (\u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 130\u2013140 \u0443\u0434/\u043C\u0438\u043D). \u0423\u0431\u0435\u0440\u0438 \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u044B \u0438 \u0442\u0435\u043C\u043F\u043E\u0432\u044B\u0435 \u043E\u0442\u0440\u0435\u0437\u043A\u0438.', React.createElement(HelpIcon, { term: 'Recovery Score', definition: 'Комплексный индекс восстановления (0-100%), основанный на HRV, сне, ЧСС покоя и субъективных ощущениях.' })],
        });
      } else if (readiness === 'yellow') {
        items.push({
          icon: '\u2796',
          text: ['\u0421\u0434\u0435\u043B\u0430\u0439 \u043D\u0430 1 \u043F\u043E\u0434\u0445\u043E\u0434 \u043C\u0435\u043D\u044C\u0448\u0435 \u0432 \u043A\u0430\u0436\u0434\u043E\u043C \u0441\u0438\u043B\u043E\u0432\u043E\u043C \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0438. \u0411\u0435\u0433 \u2014 \u0442\u043E\u043B\u044C\u043A\u043E Zone 1\u20132.', React.createElement(HelpIcon, { term: 'RPE', definition: 'Rating of Perceived Exertion — шкала субъективной интенсивности от 0 (отдых) до 10 (максимум усилий).' })],
        });
      }
      if (recoveryDebt) {
        items.push({
          icon: '\u23F8\uFE0F',
          text: ['\u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u0430 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u043D\u0430\u044F \u0443\u0441\u0442\u0430\u043B\u043E\u0441\u0442\u044C (Recovery Debt). \u0414\u043E\u0431\u0430\u0432\u044C 1 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0434\u0435\u043D\u044C \u043E\u0442\u0434\u044B\u0445\u0430.', React.createElement(HelpIcon, { term: 'Recovery Debt', definition: 'Накопленная усталость от нескольких дней недостаточного восстановления. Требует дополнительного отдыха для предотвращения перетренированности.' })],
        });
      }
    }

    if (lastCheckin) {
      const stress = Number(lastCheckin.stress);
      if (stress >= 4) {
        items.push({
          icon: '\uD83E\uDECC',
          text: 'Box breathing: 4-4-4-4. 5\u20138 \u043C\u0438\u043D\u0443\u0442 \u043F\u0435\u0440\u0435\u0434 \u0441\u043D\u043E\u043C.',
        });
      }
      const soreness = Number(lastCheckin.muscleSoreness);
      if (soreness >= 4) {
        items.push({
          icon: '\uD83E\uDDD8',
          text: '\u041C\u044B\u0448\u0435\u0447\u043D\u0430\u044F \u0431\u043E\u043B\u0435\u0437\u043D\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0432\u044B\u0441\u043E\u043A\u0430\u044F. 10 \u043C\u0438\u043D \u0440\u0430\u0441\u0442\u044F\u0436\u043A\u0438 + \u041C\u0424\u0420.',
        });
      }
    }

    return items;
  }, [apreReasons, sessionPlan, readiness, recoveryDebt, lastCheckin]);

  const hasContent = predictive.length > 0 || personalized.length > 0 || concrete.length > 0;

  if (!hasContent) {
    return React.createElement(
      'div',
      { className: 'card', style: { borderLeft: '3px solid var(--green)' } },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' } },
        React.createElement('span', { style: { fontSize: '1.3rem' } }, '✓'),
        React.createElement(
          'div',
          null,
          React.createElement('strong', { style: { fontSize: 'var(--font-size-body)' } }, 'Отличное восстановление'),
          React.createElement(
            'p',
            { style: { margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--font-size-body)', color: 'var(--text2)', lineHeight: 1.5 } },
            'Сегодня можно работать в полную силу. Следи за техникой в последних подходах — именно там накапливается качество.'
          )
        )
      )
    );
  }

  const toggle = () => setOpen(o => !o);

  return React.createElement(
    Collapsible,
    {
      open,
      onToggle: toggle,
      title: '\uD83E\uDDE0 \u0421\u043E\u0432\u0435\u0442\u044B \u0442\u0440\u0435\u043D\u0435\u0440\u0430',
      summary: `${predictive.length + personalized.length + concrete.length} \u0441\u043E\u0432\u0435\u0442\u043E\u0432`,
      contentStyle: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' },
    },

    // 1. \u041F\u0440\u0435\u0434\u0438\u043A\u0442\u0438\u0432\u043D\u044B\u0435
    predictive.length > 0 && React.createElement(
      'div',
      null,
      React.createElement(
        'h5',
        { style: { margin: '0 0 var(--spacing-xs)', color: 'var(--yellow)', fontSize: 'var(--font-size-body)' } },
        '\uD83D\uDD2E \u041F\u0440\u0435\u0434\u0438\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F'
      ),
      ...predictive.map((w, i) => React.createElement(
        'div',
        {
          key: `p-${i}`,
          className: 'coach-advice-item',
          style: { borderLeft: `3px solid var(--${w.color})`, paddingLeft: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' },
        },
        React.createElement('strong', null, `${w.icon} ${w.title}`),
        React.createElement(
          'div',
          { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)' } },
          w.text
        ),
        w.action && React.createElement(
          'div',
          { style: { fontSize: 'var(--font-size-caption)', color: 'var(--green)', marginTop: 'var(--spacing-xs)' } },
          `\u2192 ${w.action}`
        )
      ))
    ),

    // 2. \u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435
    personalized.length > 0 && React.createElement(
      'div',
      null,
      React.createElement(
        'h5',
        { style: { margin: 'var(--spacing-sm) 0 var(--spacing-xs)', color: 'var(--blue)', fontSize: 'var(--font-size-body)' } },
        '\uD83D\uDCCA \u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0441\u043E\u0432\u0435\u0442\u044B'
      ),
      ...personalized.map((t, i) => React.createElement(
        'div',
        {
          key: `t-${i}`,
          className: 'coach-advice-item',
          style: { borderLeft: '3px solid var(--blue)', paddingLeft: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' },
        },
        React.createElement('strong', null, `${t.icon} ${t.title}`),
        React.createElement(
          'div',
          { style: { fontSize: 'var(--font-size-body)', color: 'var(--text2)' } },
          t.text
        )
      ))
    ),

    // 3. \u041A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435
    concrete.length > 0 && React.createElement(
      'div',
      null,
      React.createElement(
        'h5',
        { style: { margin: 'var(--spacing-sm) 0 var(--spacing-xs)', color: 'var(--green)', fontSize: 'var(--font-size-body)' } },
        '\uD83C\uDFAF \u041A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438'
      ),
      ...concrete.map((r, i) => React.createElement(
        'div',
        {
          key: `r-${i}`,
          className: 'coach-advice-item',
          style: { borderLeft: '3px solid var(--green)', paddingLeft: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' },
        },
        React.createElement(
          'div',
          { style: { fontSize: 'var(--font-size-body)', color: 'var(--text)' } },
          r.icon,
          ' ',
          Array.isArray(r.text)
            ? React.createElement(React.Fragment, null, ...r.text)
            : r.text,
          r.subtext && React.createElement(
            'span',
            { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginLeft: 'var(--spacing-xs)' } },
            r.subtext
          )
        )
      ))
    )
  );
}
