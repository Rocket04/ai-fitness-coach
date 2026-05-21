// js/ui/pages/MethodologyPage.js
// Научная база приложения — формулы и объяснения

import React, { useMemo, useEffect } from 'react';
import { BarChart3, Target, Scale, AlertTriangle, TrendingUp, Activity, Circle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { RECOVERY_WEIGHTS, SUBJECTIVE_THRESHOLDS } from '../../config/constants.js';
import HelpIcon from '../components/HelpIcon.jsx';

export default function MethodologyPage() {
  const state = useAppStore();
  const dispatch = useAppStore();
  const { setActiveTab } = dispatch;

  const {
    recoveryScore, readiness, lastCheckin, sessions,
  } = state;

  const hrv = lastCheckin?.hrv ? Number(lastCheckin.hrv) : 0;
  const restHR = lastCheckin?.restHR ? Number(lastCheckin.restHR) : 0;
  const sleepHours = lastCheckin?.sleepHours ? Number(lastCheckin.sleepHours) : 0;

  const lastTraining = useMemo(() => {
    if (!sessions || !sessions.length) return null;
    return [...sessions]
      .filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
  }, [sessions]);

  const lastRpe = lastTraining?.rpe ? Number(lastTraining.rpe) : 0;
  const lastSessionLoad = lastTraining?.sessionLoad ? Number(lastTraining.sessionLoad) : 0;
  const lastDuration = lastTraining?.durationMinutes ? Number(lastTraining.durationMinutes) : 0;

  const readinessIcon = readiness === 'green'
    ? React.createElement(Circle, { size: 16, fill: 'var(--green)', color: 'var(--green)' })
    : readiness === 'yellow'
      ? React.createElement(Circle, { size: 16, fill: 'var(--yellow)', color: 'var(--yellow)' })
      : React.createElement(Circle, { size: 16, fill: 'var(--red)', color: 'var(--red)' });

  /* ---------- Scroll to hash on mount ---------- */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, []);

  /* ---------- Reusable card builder ---------- */
  function SectionCard({ icon, title, id, children }) {
    return React.createElement(
      'div',
      { id, className: 'card', style: { marginBottom: '0.75rem', scrollMarginTop: '1rem' } },
      React.createElement(
        'h3',
        { style: { margin: '0 0 var(--spacing-sm) 0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-body)' } },
        React.createElement('span', null, icon),
        title
      ),
      children
    );
  }

  function FormulaBlock({ text }) {
    return React.createElement(
      'div',
      {
        style: {
          backgroundColor: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-body)',
          color: 'var(--accent)',
          marginBottom: 'var(--spacing-sm)',
          overflowX: 'auto',
        },
      },
      text
    );
  }

  function WhyText({ children }) {
    return React.createElement(
      'p',
      { className: 'text-sm', style: { color: 'var(--text2)', lineHeight: 1.55, margin: 'var(--spacing-xs) 0 0 0' } },
      React.createElement('strong', { style: { color: 'var(--text)' } }, '\u2192 Почему это важно: '),
      children
    );
  }

  /* ---------- Current values header ---------- */
  const headerStats = [
    { label: 'Recovery', value: typeof recoveryScore === 'number' ? `${recoveryScore}%` : '\u2014' },
    { label: 'Готовность', value: readinessIcon },
    { label: 'HRV', value: hrv > 0 ? `${hrv} мс` : '\u2014' },
    { label: 'ЧСС покоя', value: restHR > 0 ? `${restHR} уд/мин` : '\u2014' },
    { label: 'Сон', value: sleepHours > 0 ? `${sleepHours} ч` : '\u2014' },
    { label: 'Последний RPE', value: lastRpe > 0 ? lastRpe : '\u2014' },
    { label: 'Session Load', value: lastSessionLoad > 0 ? `${lastSessionLoad} у.е.` : '\u2014', title: 'Training Load (sRPE) = RPE × длительность (мин)' },
  ];

  return React.createElement(
    'div',
    { className: 'page-enter', style: { paddingBottom: 'var(--spacing-lg)' } },

    // Back button
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' } },
      React.createElement(
        'button',
        {
          className: 'btn btn-sm',
          onClick: () => setActiveTab(3),
          style: { fontSize: 'var(--font-size-caption)' },
        },
        '\u2190 Назад'
      ),
      React.createElement('h2', { style: { margin: 0, fontSize: '1.15rem' } }, '\uD83E\uDDE0 Методология')
    ),

    React.createElement(
      'p',
      { className: 'text-sm', style: { color: 'var(--text2)', marginBottom: '1rem', lineHeight: 1.55 } },
      'Прозрачность вместо чёрного ящика: каждое решение Smart Coach объяснено формулой и научным источником. Ниже — твои текущие значения и то, как они влияют на результат.'
    ),

    // Current values
    React.createElement(
      'div',
      {
        className: 'card',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
        },
      },
      headerStats.map((s, i) =>
        React.createElement(
          'div',
          {
            key: i,
            ...(s.title ? { title: s.title } : {}),
            style: {
              textAlign: 'center',
              padding: 'var(--spacing-xs)',
              backgroundColor: 'var(--surface2)',
              borderRadius: '0.375rem',
            },
          },
          React.createElement('div', { style: { fontWeight: 600, fontSize: 'var(--font-size-body)' } }, s.value),
          React.createElement('div', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.03em' } }, s.label)
        )
      )
    ),

    // ── 1. Recovery Score ──
    React.createElement(SectionCard, { icon: React.createElement(BarChart3, { size: 18 }), title: React.createElement('span', null, 'Recovery Score', React.createElement(HelpIcon, { term: 'Recovery Score', definition: 'Комплексный индекс восстановления (0-100%), основанный на HRV, сне, ЧСС покоя и субъективных ощущениях.' })), id: 'recovery-score' },
      React.createElement(FormulaBlock, {
        text: 'Score = (hrvScore\u00D70.4 + sleepScore\u00D70.3 + rhrScore\u00D70.1 + subjectiveScore\u00D70.2) \u00D7 10',
      }),
      hrv > 0 || sleepHours > 0 ? React.createElement(
        'div',
        { style: { backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs) var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-caption)', color: 'var(--text2)' } },
        `\u0422\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435: HRV ${hrv > 0 ? hrv + ' \u043C\u0441' : '\u2014'} \u00B7 \u0421\u043E\u043D ${sleepHours > 0 ? sleepHours + ' \u0447' : '\u2014'} \u00B7 \u0427\u0421\u0421 \u043F\u043E\u043A\u043E\u044F ${restHR > 0 ? restHR + ' \u0443\u0434/\u043C\u0438\u043D' : '\u2014'} \u00B7 Recovery ${recoveryScore ? recoveryScore + '%' : '\u2014'}`
      ) : null,
      React.createElement('div', { className: 'text-sm', style: { color: 'var(--text2)' } },
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          '\u041A\u0430\u0436\u0434\u044B\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u043D\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u0432 \u0448\u043A\u0430\u043B\u0443 0\u201310:'
        ),
        React.createElement('ul', { style: { margin: '0.25rem 0', paddingLeft: '1.2rem' } },
          React.createElement('li', null, 'HRV: z-score \u043E\u0442 14-\u0434\u043D\u0435\u0432\u043D\u043E\u0433\u043E \u0431\u0435\u0439\u0437\u043B\u0430\u0439\u043D\u0430. \u0427\u0435\u043C \u0432\u044B\u0448\u0435 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0441\u0432\u043E\u0435\u0439 \u043D\u043E\u0440\u043C\u044B \u2014 \u0442\u0435\u043C \u043B\u0443\u0447\u0448\u0435.'),
          React.createElement('li', null, '\u0421\u043E\u043D: \u043B\u0438\u043D\u0435\u0439\u043D\u0430\u044F \u0448\u043A\u0430\u043B\u0430, 8 \u0447 = 10 \u0431\u0430\u043B\u043B\u043E\u0432.'),
          React.createElement('li', null, '\u0427\u0421\u0421 \u043F\u043E\u043A\u043E\u044F: \u0438\u043D\u0432\u0435\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 z-score. \u0420\u043E\u0441\u0442 \u043D\u0430 5+ \u0443\u0434/\u043C\u0438\u043D \u0432\u044B\u0448\u0435 \u0431\u0430\u0437\u043E\u0432\u043E\u0433\u043E \u2014 \u0442\u0440\u0435\u0432\u043E\u0436\u043D\u044B\u0439 \u0441\u0438\u0433\u043D\u0430\u043B.'),
          React.createElement('li', null, '\u0421\u0430\u043C\u043E\u0447\u0443\u0432\u0441\u0442\u0432\u0438\u0435: \u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F \u0438 \u0438\u043D\u0432\u0435\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0441\u0442\u0440\u0435\u0441\u0441 \u2014 \u0432\u044B\u0441\u043E\u043A\u0438\u0439 \u0441\u0442\u0440\u0435\u0441\u0441 \u0441\u043D\u0438\u0436\u0430\u0435\u0442 \u0441\u043A\u043E\u0440\u0438\u043D\u0433.')
        )
      ),
      React.createElement(WhyText, null,
        '\u041A\u043E\u043C\u043F\u043E\u0437\u0438\u0442\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u043D\u0430\u0434\u0451\u0436\u043D\u0435\u0435 \u043B\u044E\u0431\u043E\u0433\u043E \u043E\u0434\u0438\u043D\u043E\u0447\u043D\u043E\u0433\u043E \u043C\u0430\u0440\u043A\u0435\u0440\u0430. HRV \u0438 \u0441\u043E\u043D \u043E\u0431\u044A\u044F\u0441\u043D\u044F\u044E\u0442 ~70% \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u0438 \u2014 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043E\u043D\u0438 \u043F\u043E\u043B\u0443\u0447\u0430\u044E\u0442 \u043D\u0430\u0438\u0431\u043E\u043B\u044C\u0448\u0438\u0439 \u0432\u0435\u0441 (0.4 + 0.3 = 0.7).'
      )
    ),

    // ── 2. APRE ──
    React.createElement(SectionCard, { icon: React.createElement(Target, { size: 18 }), title: React.createElement('span', null, 'APRE (Auto-regulation by Performance)', React.createElement(HelpIcon, { term: 'APRE', definition: 'Метод автоматической регулировки нагрузки по субъективной интенсивности (RPE). При лёгкой нагрузке — увеличиваем объём, при тяжёлой — снижаем.' })), id: 'apre' },
      React.createElement(FormulaBlock, { text: 'RPE \u2264 4 \u2192 +1 повтор  |  RPE \u2265 8 \u2192 \u22121 повтор' }),
      React.createElement('div', { className: 'text-sm', style: { color: 'var(--text2)' } },
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Корректировка применяется к полю повторений (r) в плане тренировки на основе субъективной интенсивности (RPE, 0\u201310) последней сессии того же типа.'
        ),
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Если последняя тренировка казалась лёгкой (RPE \u2264 4), организм адаптировался \u2014 добавляем объём. Если тяжёлой (RPE \u2265 8), значит, ещё не восстановились \u2014 снижаем.'
        )
      ),
      React.createElement(WhyText, null,
        'Авторегуляция персонализирует план лучше, чем жёсткие проценты от 1ПМ, потому что учитывает не только силу, но и текущее восстановление ЦНС и мышц.'
      )
    ),

    // ── 3. Session Load ──
    React.createElement(SectionCard, { icon: React.createElement(Scale, { size: 18 }), title: React.createElement('span', null, 'Session Load (Фостер, 2001)', React.createElement(HelpIcon, { term: 'Session Load', definition: 'Внутренняя тренировочная нагрузка = RPE × длительность (мин). Позволяет сравнивать тренировки разной интенсивности и длительности.' })), id: 'session-load' },
      React.createElement(FormulaBlock, { text: 'Session Load = RPE \u00D7 durationMinutes' }),
      React.createElement('div', { className: 'text-sm', style: { color: 'var(--text2)' } },
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Внутренняя тренировочная нагрузка = субъективная интенсивность \u00D7 длительность в минутах.'
        ),
        lastSessionLoad > 0 && React.createElement('p', { style: { margin: 'var(--spacing-xs) 0', color: 'var(--accent)' } },
          `Ваше последнее значение: ${lastSessionLoad} у.е. (RPE ${lastRpe} \u00D7 ${lastDuration} мин)`
        )
      ),
      React.createElement(WhyText, null,
        'Два тренировочных дня могут выглядеть одинаково по упражнениям, но отличаться в 2\u20133 раза по внутренней нагрузке. Без этой метрики невозможно отследить перетренированность.'
      )
    ),

    // ── 4. Субъективные пороги ──
    React.createElement(SectionCard, { icon: React.createElement(AlertTriangle, { size: 18 }), title: 'Субъективные пороги', id: 'subjective-thresholds' },
      React.createElement(FormulaBlock, {
        text: `muscleSoreness \u2265 ${SUBJECTIVE_THRESHOLDS.muscleSorenessHigh}  |  energy \u2264 ${SUBJECTIVE_THRESHOLDS.energyLow}  |  mood \u2264 ${SUBJECTIVE_THRESHOLDS.moodLow}  |  sleepQuality \u2264 ${SUBJECTIVE_THRESHOLDS.sleepQualityLow}  |  stress \u2265 ${SUBJECTIVE_THRESHOLDS.stressHigh}`,
      }),
      React.createElement('div', { className: 'text-sm', style: { color: 'var(--text2)' } },
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Превышение любого из порогов влияет на статус готовности (yellow/red) и накопленную усталость (recovery debt).'
        ),
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Источник: Simonelli et al. (2025) \u2014 корреляция субъективных шкал с HRV и риском травмы у любителей бега.'
        )
      ),
      React.createElement(WhyText, null,
        'Самочувствие предсказывает перетренированность раньше, чем объективные метрики. Мышечная болезненность \u2265 4/5 увеличивает риск травмы на 2.3\u00D7 по данным исследований.'
      )
    ),

    // ── 5. HRV-бейзлайн ──
    React.createElement(SectionCard, { icon: React.createElement(Activity, { size: 18 }), title: React.createElement('span', null, 'HRV-бейзлайн (14 дней)', React.createElement(HelpIcon, { term: 'HRV', definition: 'Вариабельность сердечного ритма — показатель баланса автономной нервной системы. Высокий HRV обычно означает лучшее восстановление и адаптацию к стрессу.' })), id: 'hrv-baseline' },
      React.createElement(FormulaBlock, { text: 'z = (value \u2212 mean) / std  \u2192  score = 5 + z \u00D7 2.5' }),
      React.createElement('div', { className: 'text-sm', style: { color: 'var(--text2)' } },
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Бейзлайн строится из всех чекинов за последние 14 дней. Если записей < 3, применяются фиксированные пороги (70 мс = хорошо, 55 мс = средне, 40 мс = плохо).'
        ),
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Положительный z-score (HRV выше своей нормы) = 7\u201310 баллов. Отрицательный = 0\u20137 баллов.'
        )
      ),
      React.createElement(WhyText, null,
        'HRV сильно варьирует между людьми (40\u2013120 мс). Сравнение с собственным бейзлайном в 2\u20133 раза точнее, чем с популяционными нормами.'
      )
    ),

    // ── 6. Статусы готовности ──
    React.createElement(SectionCard, { icon: React.createElement(React.Fragment, null, React.createElement(Circle, { size: 14, fill: 'var(--green)', color: 'var(--green)' }), React.createElement(Circle, { size: 14, fill: 'var(--yellow)', color: 'var(--yellow)' }), React.createElement(Circle, { size: 14, fill: 'var(--red)', color: 'var(--red)' })), title: 'Статусы готовности', id: 'readiness-statuses' },
      React.createElement('div', { className: 'text-sm', style: { color: 'var(--text2)' } },
        React.createElement('p', { style: { margin: 'var(--spacing-xs) 0' } },
          'Алгоритм оценивает показатели чекина по двум уровням:'
        ),
        React.createElement('ul', { style: { margin: '0.25rem 0', paddingLeft: '1.2rem' } },
          React.createElement('li', null,
            React.createElement('strong', { style: { color: 'var(--red)' } }, 'Red: '),
            'сон < 6 ч, ЧСС \u2265 76, HRV < 40, боль \u2265 5/5, дыхание = bad, субъективные критические.'
          ),
          React.createElement('li', null,
            React.createElement('strong', { style: { color: 'var(--yellow)' } }, 'Yellow: '),
            'сон < 7 ч, ЧСС \u2265 71, HRV < 55, боль \u2265 3/5, дыхание \u2260 ok, субъективные пониженные.'
          ),
          React.createElement('li', null,
            React.createElement('strong', { style: { color: 'var(--green)' } }, 'Green: '),
            'все показатели в допустимом диапазоне.'
          )
        )
      ),
      React.createElement(WhyText, null,
        'Светофорная система даёт мгновенное решение: зелёный \u2014 полный план, жёлтый \u2014 минус 1 подход, красный \u2014 только мобильность и растяжка. Это снижает когнитивную нагрузку спортсмена.'
      )
    )
  );
}
