// js/ui/pages/CheckinForm.js
// Форма ежедневного чек-ина — premium ленточный стиль
// Быстрый режим (3 поля) vs полный режим (при редактировании)

import React, { useState, useMemo } from 'react';
import { Moon, Clock, Sparkles, Heart, Activity, Scale, Wind, Brain, Zap, Smile, Dumbbell, AlertTriangle, Armchair, Check } from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import { useTranslation } from 'react-i18next';
import { validate } from '../../domains/checkin/validation.js';
import ScaleSelector from '../components/ScaleSelector.jsx';
import Collapsible from '../components/Collapsible.jsx';
import MiniSparkline from '../components/MiniSparkline.jsx';
import TrendIndicator from '../components/TrendIndicator.jsx';

/* ---------- labels ---------- */
const SORENESS_LABELS = { 1: 'Нет', 2: 'Слабая', 3: 'Умеренная', 4: 'Сильная', 5: 'Очень сильная' };
const ENERGY_LABELS = { 1: 'Упадок сил', 2: 'Низкая', 3: 'Средняя', 4: 'Хорошая', 5: 'Отличная' };
const MOOD_LABELS = { 1: 'Подавленное', 2: 'Плохое', 3: 'Нейтральное', 4: 'Хорошее', 5: 'Отлично' };
const SLEEPQ_LABELS = { 1: 'Ужасное', 2: 'Плохое', 3: 'Среднее', 4: 'Хорошее', 5: 'Отличное' };
const STRESS_LABELS = { 1: 'Нет', 2: 'Мин', 3: 'Умеренный', 4: 'Высокий', 5: 'Очень высокий' };
const PAIN_LABELS = { 1: 'Нет', 2: 'Слабая', 3: 'Умеренная', 4: 'Сильная', 5: 'Острая' };

const ENERGY_EMOJIS = ['😴','😫','😐','🙂','🤩'];

function getLast7Values(checkins, key) {
  return [...checkins]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(c => (typeof c[key] === 'number' ? c[key] : 0));
}

function SparklineRow({ data, label, color }) {
  if (!data || data.length < 2) return null;
  return React.createElement(
    'div',
    { className: 'checkin-sparkline-row' },
    React.createElement(MiniSparkline, { data, width: 120, height: 28, color }),
    React.createElement('span', { className: 'checkin-sparkline-row__label' }, label)
  );
}

/* ---------- вспомогательные компоненты ---------- */

function NumberRow({ icon, label, sublabel, value, onChange, min, max, step, filled, pain, trend, testId }) {
  const cls = ['checkin-row', filled ? 'checkin-row--filled' : '', pain ? 'checkin-row--pain' : ''].filter(Boolean).join(' ');
  return React.createElement(
    'div',
    { className: cls },
    React.createElement('span', { className: 'checkin-row__icon' }, icon),
    React.createElement(
      'span',
      { className: 'checkin-row__label' },
      label,
      sublabel && React.createElement('span', { className: 'checkin-row__sublabel' }, sublabel)
    ),
    React.createElement(
      'div',
      { className: 'checkin-row__control' },
      trend || null,
      React.createElement('input', {
        type: 'number',
        className: 'checkin-number-input',
        value: value || '',
        placeholder: '—',
        onChange: e => onChange(Number(e.target.value)),
        min, max, step,
        ...(testId ? { 'data-testid': testId } : {}),
      })
    )
  );
}

function ScaleRow({ icon, label, sublabel, value, onChange, labels, filled, pain, inverse, testId }) {
  const cls = ['checkin-row', 'checkin-row--scale', filled ? 'checkin-row--filled' : '', pain ? 'checkin-row--pain' : ''].filter(Boolean).join(' ');
  return React.createElement(
    'div',
    { className: cls, ...(testId ? { 'data-testid': testId } : {}) },
    React.createElement(
      'div',
      { className: 'checkin-row__top' },
      React.createElement('span', { className: 'checkin-row__icon' }, icon),
      React.createElement(
        'span',
        { className: 'checkin-row__label' },
        label,
        sublabel && React.createElement('span', { className: 'checkin-row__sublabel' }, sublabel)
      )
    ),
    React.createElement(
      'div',
      { className: 'checkin-row__bottom' },
      React.createElement(
        'div',
        { className: 'checkin-row__scale' },
        React.createElement(ScaleSelector, { value, onChange, labels, inverse })
      )
    )
  );
}

function SelectRow({ icon, label, sublabel, value, onChange, options, filled, testId }) {
  const cls = ['checkin-row', filled ? 'checkin-row--filled' : ''].filter(Boolean).join(' ');
  return React.createElement(
    'div',
    { className: cls },
    React.createElement('span', { className: 'checkin-row__icon' }, icon),
    React.createElement(
      'span',
      { className: 'checkin-row__label' },
      label,
      sublabel && React.createElement('span', { className: 'checkin-row__sublabel' }, sublabel)
    ),
    React.createElement(
      'div',
      { className: 'checkin-row__control' },
      React.createElement(
        'select',
        { className: 'checkin-select', value, onChange: e => onChange(e.target.value), ...(testId ? { 'data-testid': testId } : {}) },
        options.map(o => React.createElement('option', { key: o.value, value: o.value }, o.label))
      )
    )
  );
}

function SectionTitle({ icon, title }) {
  return React.createElement(
    'div',
    { className: 'checkin-section__title' },
    React.createElement('span', null, icon),
    title
  );
}

/* ── Quick stepper row (— value + ) ── */
function StepperRow({ icon, label, value, onChange, step, min, max, format, testId }) {
  return React.createElement('div', {
    className: 'quick-checkin-row',
    ...(testId ? { 'data-testid': testId } : {}),
  },
    React.createElement('span', { className: 'checkin-row__icon' }, icon),
    React.createElement('span', { className: 'checkin-row__label' }, label),
    React.createElement('div', { className: 'stepper-control' },
      React.createElement('button', {
        className: 'stepper-btn',
        'aria-label': 'Decrease',
        onClick: () => onChange(Math.max(min, Number(value || 0) - step)),
        disabled: (value || 0) <= min,
        type: 'button',
      }, '−'),
      React.createElement('span', { className: 'stepper-value' }, format ? format(value) : value),
      React.createElement('button', {
        className: 'stepper-btn',
        'aria-label': 'Increase',
        onClick: () => onChange(Math.min(max, Number(value || 0) + step)),
        disabled: (value || 0) >= max,
        type: 'button',
      }, '+')
    )
  );
}

/* ---------- main component ---------- */

export default function CheckinForm() {
  const { t } = useTranslation();
  const store = useAppStore();
  const {
    weight, restHR, hrv, sleepHours, hipPain, shoulderPain, breathing, notes,
    muscleSoreness, energy, mood, sleepQuality, stress,
    setWeight, setRestHR, setHrv, setSleepHours,
    setHipPain, setShoulderPain, setBreathing, setNotes,
    setMuscleSoreness, setEnergy, setMood, setSleepQuality, setStress,
    handleSaveCheckin,
    checkins,
    showToast,
    todayISO,
    checkinTier,
  } = store;

  const [showCheckin, setShowCheckin] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isTodayFilled = checkins.some(c => c.date === todayISO);
  const quickMode = !isTodayFilled;

  // Pre-fill from last check-in (exclude today's)
  const lastCheckin = useMemo(() => {
    return [...checkins]
      .filter(c => c.date !== todayISO)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [checkins, todayISO]);

  const defaultSleep = lastCheckin?.sleepHours || 7.5;
  const defaultRHR = lastCheckin?.restHR || 65;
  const defaultEnergy = lastCheckin?.energy || 3;

  const collapsibleTitle = t('checkin.daily') + (isTodayFilled ? ` (${t('checkin.filled')})` : '');
  const breathingFilled = breathing && breathing !== 'good';

  const submitLabel = quickMode ? t('quickCheckin.submit') : (saveSuccess ? '⏳ Сохранение...' : 'Сохранить чек-ин');

  const fullSubmit = React.createElement('div', { className: 'checkin-save-row' },
    validationError && React.createElement('div', { className: 'validation-error', role: 'alert' }, validationError),
    saveSuccess && React.createElement('div', { className: 'validation-success', role: 'status' },
      React.createElement(Check, { size: 20 }), ' Чек-ин сохранён'),
    React.createElement('button', {
      className: 'btn btn-accent',
      'data-testid': 'checkin-submit',
      style: { width: '100%' },
      onClick: async () => {
        const s = store;
        const err = validate({ sleepHours, restHR, hrv, weight, muscleSoreness, energy, mood, sleepQuality, stress });
        if (err) { setValidationError(err); setSaveSuccess(false); return; }
        setValidationError(null);
        if (quickMode) {
          if (s.mood <= 0) s.setMood(3);
          if (s.muscleSoreness <= 0) s.setMuscleSoreness(3);
          if (s.sleepQuality <= 0) s.setSleepQuality(3);
          if (s.stress <= 0) s.setStress(3);
        }
        await handleSaveCheckin();
        setSaveSuccess(true);
        showToast(React.createElement(Check, { size: 20 }), ' Чек-ин сохранён!', 'success');
        setTimeout(() => setSaveSuccess(false), 3000);
        setTimeout(() => setShowCheckin(false), 500);
      },
    }, submitLabel)
  );

  // ── Full form sections (used in both full mode and quick details) ──

  const fullFormContent = [
    /* ── Сон ── */
    React.createElement('div', { key: 'sleep', className: 'checkin-section' },
      React.createElement(SectionTitle, { icon: React.createElement(Moon, { size: 20 }), title: quickMode ? 'Сон (детали)' : 'Сон' }),
      React.createElement(NumberRow, {
        icon: React.createElement(Clock, { size: 20 }), label: 'Длительность', sublabel: 'часов',
        value: sleepHours, onChange: setSleepHours,
        min: 0, max: 16, step: 0.5,
        filled: sleepHours > 0,
        testId: 'checkin-sleep',
      }),
      React.createElement(ScaleRow, {
        icon: React.createElement(Sparkles, { size: 20 }), label: 'Качество', sublabel: 'как спалось',
        value: sleepQuality, onChange: setSleepQuality,
        labels: SLEEPQ_LABELS, filled: sleepQuality > 0,
      }),
      React.createElement(SparklineRow, { data: getLast7Values(checkins, 'sleepHours'), label: 'Сон, 7 дней', color: 'var(--blue)' })
    ),

    /* ── Биометрика ── */
    React.createElement('div', { key: 'bio', className: 'checkin-section' },
      React.createElement(SectionTitle, { icon: React.createElement(Heart, { size: 20 }), title: 'Биометрика' }),
      checkinTier !== 'light' && React.createElement(NumberRow, {
        icon: React.createElement(Heart, { size: 20 }), label: 'ЧСС покоя', sublabel: 'уд/мин',
        value: restHR, onChange: setRestHR,
        min: 30, max: 120,
        filled: restHR > 0,
        trend: React.createElement(TrendIndicator, { current: restHR, history: getLast7Values(checkins, 'restHR'), unit: 'уд/мин', inverse: true }),
        testId: 'checkin-rhr',
      }),
      checkinTier === 'full' && React.createElement(NumberRow, {
        icon: React.createElement(Activity, { size: 20 }), label: 'HRV', sublabel: 'мс',
        value: hrv, onChange: setHrv,
        min: 0, max: 200,
        filled: hrv > 0,
        trend: React.createElement(TrendIndicator, { current: hrv, history: getLast7Values(checkins, 'hrv'), unit: 'мс' }),
        testId: 'checkin-hrv',
      }),
      React.createElement(NumberRow, {
        icon: React.createElement(Scale, { size: 20 }), label: 'Вес', sublabel: 'кг',
        value: weight, onChange: setWeight,
        min: 0, max: 300, step: 0.5,
        filled: weight > 0,
        trend: React.createElement(TrendIndicator, { current: weight, history: getLast7Values(checkins, 'weight'), unit: 'кг' }),
        testId: 'checkin-weight',
      }),
      React.createElement(SelectRow, {
        icon: React.createElement(Wind, { size: 20 }), label: 'Дыхание', sublabel: 'самочувствие',
        value: breathing, onChange: setBreathing,
        filled: breathingFilled,
        options: [
          { value: 'good', label: 'Хорошо' },
          { value: 'mild', label: 'Лёгкий дискомфорт' },
          { value: 'bad', label: 'Плохо' },
        ],
      })
    ),

    /* ── Самочувствие ── */
    React.createElement('div', { key: 'feeling', className: 'checkin-section' },
      React.createElement(SectionTitle, { icon: React.createElement(Brain, { size: 20 }), title: 'Самочувствие' }),
      !quickMode && React.createElement(ScaleRow, {
        icon: React.createElement(Zap, { size: 20 }), label: 'Энергия', sublabel: 'уровень сил',
        value: energy, onChange: setEnergy,
        labels: ENERGY_LABELS, filled: energy > 0,
      }),
      React.createElement(ScaleRow, {
        icon: React.createElement(Smile, { size: 20 }), label: 'Настроение',
        value: mood, onChange: setMood,
        labels: MOOD_LABELS, filled: mood > 0,
      }),
      React.createElement(ScaleRow, {
        icon: React.createElement(Dumbbell, { size: 20 }), label: 'Болезненность', sublabel: 'мышц',
        value: muscleSoreness, onChange: setMuscleSoreness,
        labels: SORENESS_LABELS, filled: muscleSoreness > 0, inverse: true,
        testId: 'checkin-soreness',
      }),
      React.createElement(ScaleRow, {
        icon: React.createElement(Activity, { size: 20 }), label: 'Стресс',
        value: stress, onChange: setStress,
        labels: STRESS_LABELS, filled: stress > 0, inverse: true,
      }),
      React.createElement(ScaleRow, {
        icon: React.createElement(AlertTriangle, { size: 20 }), label: 'Боль в бедре',
        value: hipPain, onChange: setHipPain,
        labels: PAIN_LABELS, filled: hipPain > 0, pain: true, inverse: true,
      }),
      React.createElement(ScaleRow, {
        icon: React.createElement(Armchair, { size: 20 }), label: 'Боль в плече',
        value: shoulderPain, onChange: setShoulderPain,
        labels: PAIN_LABELS, filled: shoulderPain > 0, pain: true, inverse: true,
      }),
      React.createElement(SparklineRow, { data: getLast7Values(checkins, 'energy'), label: 'Энергия, 7 дней', color: 'var(--yellow)' }),
      React.createElement(SparklineRow, { data: getLast7Values(checkins, 'muscleSoreness'), label: 'Болезненность, 7 дней', color: 'var(--red)' })
    ),

    /* ── Заметки ── */
    React.createElement('div', { key: 'notes', className: 'checkin-section checkin-notes-row' },
      React.createElement('textarea', {
        value: notes,
        onChange: e => setNotes(e.target.value),
        rows: 2,
        placeholder: 'Самочувствие, стресс, питание...',
      })
    ),
  ];

  // ── Quick mode content ──
  const quickContent = React.createElement('div', { className: 'quick-checkin' },
    // Energy emoji row
    React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: '12px', padding: '8px 0 16px' } },
      ENERGY_EMOJIS.map((emoji, idx) => {
        const val = idx + 1;
        const isActive = energy === val || (energy === 0 && val === defaultEnergy);
        return React.createElement('button', {
          key: val,
          type: 'button',
          'aria-label': ENERGY_LABELS[val],
          onClick: () => setEnergy(val),
          style: {
            fontSize: '2rem',
            background: isActive ? 'var(--surface3)' : 'transparent',
            border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            borderRadius: '12px',
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            opacity: isActive ? 1 : 0.5,
          },
        }, emoji);
      })
    ),

    // Sleep stepper
    React.createElement(StepperRow, {
      icon: React.createElement(Clock, { size: 20 }),
      label: t('quickCheckin.sleep'),
      value: sleepHours > 0 ? sleepHours : defaultSleep,
      onChange: setSleepHours,
      step: 0.5,
      min: 1,
      max: 16,
      format: v => `${v}h`,
      testId: 'quick-sleep',
    }),

    // RHR stepper (hidden for light tier)
    checkinTier !== 'light' && React.createElement(StepperRow, {
      icon: React.createElement(Heart, { size: 20 }),
      label: t('quickCheckin.rhr'),
      value: restHR > 0 ? restHR : defaultRHR,
      onChange: setRestHR,
      step: 1,
      min: 30,
      max: 120,
      format: v => `${v}`,
      testId: 'quick-rhr',
    }),

    // Submit button
    React.createElement('div', { style: { paddingTop: '16px' } },
      validationError && React.createElement('div', { className: 'validation-error', role: 'alert', style: { marginBottom: '8px' } }, validationError),
      saveSuccess && React.createElement('div', { className: 'validation-success', role: 'status', style: { marginBottom: '8px' } },
        React.createElement(Check, { size: 20 }), ' Чек-ин сохранён'),
      React.createElement('button', {
        className: 'btn btn-accent',
        'data-testid': 'checkin-submit',
        style: { width: '100%', minHeight: '48px', fontSize: '1.05rem' },
        onClick: async () => {
          const s = store;
          // Ensure sleepHours is set from stepper (the stepper calls setSleepHours directly)
          const sh = s.sleepHours;
          const rh = s.restHR;
          const en = s.energy;
          const err = validate({ sleepHours: sh || defaultSleep, restHR: rh || defaultRHR, hrv: s.hrv, weight: s.weight, muscleSoreness: s.muscleSoreness || 3, energy: en || defaultEnergy, mood: s.mood || 3, sleepQuality: s.sleepQuality || 3, stress: s.stress || 3 });
          if (err) { setValidationError(err); setSaveSuccess(false); return; }
          setValidationError(null);
          // Set defaults for hidden fields
          if (s.sleepHours <= 0) s.setSleepHours(defaultSleep);
          if (s.restHR <= 0) s.setRestHR(defaultRHR);
          if (s.energy <= 0) s.setEnergy(defaultEnergy);
          if (s.mood <= 0) s.setMood(3);
          if (s.muscleSoreness <= 0) s.setMuscleSoreness(3);
          if (s.sleepQuality <= 0) s.setSleepQuality(3);
          if (s.stress <= 0) s.setStress(3);
          await handleSaveCheckin();
          setSaveSuccess(true);
          showToast(React.createElement(Check, { size: 20 }), ' Чек-ин сохранён!', 'success');
          setTimeout(() => setSaveSuccess(false), 3000);
          setTimeout(() => setShowCheckin(false), 500);
        },
      }, submitLabel)
    ),

    // "Add details" expandable
    React.createElement('div', { style: { textAlign: 'center', paddingTop: '12px' } },
      React.createElement('button', {
        type: 'button',
        className: 'btn btn-outline',
        'data-testid': 'quick-add-details',
        style: { fontSize: '0.85rem' },
        onClick: () => setShowDetails(!showDetails),
      },
        t('quickCheckin.addDetails'),
        React.createElement('span', { style: { marginLeft: '4px', display: 'inline-block', transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' } }, '▾')
      )
    ),

    showDetails && React.createElement('div', { style: { paddingTop: '12px' } }, ...fullFormContent, fullSubmit),
  );

  return React.createElement(
    Collapsible,
    { open: showCheckin, onToggle: (open) => setShowCheckin(open), title: collapsibleTitle },

    React.createElement(
      'div',
      { className: 'checkin-form', 'data-testid': 'checkin-form' },
      quickMode ? quickContent : [
        ...fullFormContent,
        fullSubmit,
      ]
    )
  );
}
