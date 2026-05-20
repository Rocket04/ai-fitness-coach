// js/ui/pages/CheckinForm.js
// Форма ежедневного чек-ина — premium ленточный стиль

import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import { useTranslation } from 'react-i18next';
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

function validate(fields) {
  const { sleepHours, restHR, hrv, weight, muscleSoreness, energy, mood, sleepQuality, stress } = fields;
  const hasData = sleepHours > 0 || restHR > 0 || hrv > 0 || weight > 0 ||
    muscleSoreness > 0 || energy > 0 || mood > 0 || sleepQuality > 0 || stress > 0;
  if (!hasData) return 'Заполните хотя бы одно поле чтобы сохранить чек-ин';
  if (sleepHours > 0 && (sleepHours < 1 || sleepHours > 16)) return 'Сон: введите значение от 1 до 16 часов';
  if (restHR > 0 && (restHR < 30 || restHR > 120)) return 'ЧСС покоя: введите значение 30–120';
  if (hrv > 0 && (hrv < 10 || hrv > 200)) return 'HRV: введите значение 10–200 мс';
  if (hrv > 0 && hrv < 20) return 'HRV ниже 20 — проверьте измерение (обычно 40-100 мс)';
  if (weight > 0 && (weight < 30 || weight > 300)) return 'Вес: реалистичный диапазон 30–300 кг';
  if (muscleSoreness > 0 && (muscleSoreness < 1 || muscleSoreness > 5)) return 'Мышечная боль: оценка от 1 до 5';
  if (energy > 0 && (energy < 1 || energy > 5)) return 'Энергия: оценка от 1 до 5';
  if (mood > 0 && (mood < 1 || mood > 5)) return 'Настроение: оценка от 1 до 5';
  if (sleepQuality > 0 && (sleepQuality < 1 || sleepQuality > 5)) return 'Качество сна: оценка от 1 до 5';
  if (stress > 0 && (stress < 1 || stress > 5)) return 'Стресс: оценка от 1 до 5';
  return null;
}

/* ---------- вспомогательные компоненты ---------- */

function NumberRow({ icon, label, sublabel, value, onChange, min, max, step, filled, pain, trend }) {
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
      })
    )
  );
}

function ScaleRow({ icon, label, sublabel, value, onChange, labels, filled, pain, inverse }) {
  const cls = ['checkin-row', 'checkin-row--scale', filled ? 'checkin-row--filled' : '', pain ? 'checkin-row--pain' : ''].filter(Boolean).join(' ');
  return React.createElement(
    'div',
    { className: cls },
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

function SelectRow({ icon, label, sublabel, value, onChange, options, filled }) {
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
        { className: 'checkin-select', value, onChange: e => onChange(e.target.value) },
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

/* ---------- main component ---------- */

export default function CheckinForm() {
  const { t } = useTranslation();
  const {
    weight, restHR, hrv, sleepHours, hipPain, shoulderPain, breathing, notes,
    muscleSoreness, energy, mood, sleepQuality, stress,
    setWeight, setRestHR, setHrv, setSleepHours,
    setHipPain, setShoulderPain, setBreathing, setNotes,
    setMuscleSoreness, setEnergy, setMood, setSleepQuality, setStress,
    handleSaveCheckin,
    checkins,
    showToast,
  } = useAppStore();
  const [showCheckin, setShowCheckin] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const breathingFilled = breathing && breathing !== 'good';

  return React.createElement(
    Collapsible,
    { open: showCheckin, onToggle: (open) => setShowCheckin(open), title: t('checkin.daily') },

    React.createElement(
      'div',
      { className: 'checkin-form' },

      /* ── 💤 Сон ─────────────────────────────────────────────── */
      React.createElement(
        'div',
        { className: 'checkin-section' },
        React.createElement(SectionTitle, { icon: '💤', title: 'Сон' }),
        React.createElement(NumberRow, {
          icon: '🕐', label: 'Длительность', sublabel: 'часов',
          value: sleepHours, onChange: setSleepHours,
          min: 0, max: 16, step: 0.5,
          filled: sleepHours > 0,
        }),
        React.createElement(ScaleRow, {
          icon: '✨', label: 'Качество', sublabel: 'как спалось',
          value: sleepQuality, onChange: setSleepQuality,
          labels: SLEEPQ_LABELS, filled: sleepQuality > 0,
        }),
        React.createElement(SparklineRow, { data: getLast7Values(checkins, 'sleepHours'), label: 'Сон, 7 дней', color: 'var(--blue)' })
      ),

      /* ── 💓 Биометрика ──────────────────────────────────────── */
      React.createElement(
        'div',
        { className: 'checkin-section' },
        React.createElement(SectionTitle, { icon: '💓', title: 'Биометрика' }),
        React.createElement(NumberRow, {
          icon: '❤️', label: 'ЧСС покоя', sublabel: 'уд/мин',
          value: restHR, onChange: setRestHR,
          min: 30, max: 120,
          filled: restHR > 0,
          trend: React.createElement(TrendIndicator, { current: restHR, history: getLast7Values(checkins, 'restHR'), unit: 'уд/мин', inverse: true }),
        }),
        React.createElement(NumberRow, {
          icon: '📡', label: 'HRV', sublabel: 'мс',
          value: hrv, onChange: setHrv,
          min: 0, max: 200,
          filled: hrv > 0,
          trend: React.createElement(TrendIndicator, { current: hrv, history: getLast7Values(checkins, 'hrv'), unit: 'мс' }),
        }),
        React.createElement(NumberRow, {
          icon: '⚖️', label: 'Вес', sublabel: 'кг',
          value: weight, onChange: setWeight,
          min: 0, max: 300, step: 0.5,
          filled: weight > 0,
          trend: React.createElement(TrendIndicator, { current: weight, history: getLast7Values(checkins, 'weight'), unit: 'кг' }),
        }),
        React.createElement(SelectRow, {
          icon: '🌬️', label: 'Дыхание', sublabel: 'самочувствие',
          value: breathing, onChange: setBreathing,
          filled: breathingFilled,
          options: [
            { value: 'good', label: 'Хорошо' },
            { value: 'mild', label: 'Лёгкий дискомфорт' },
            { value: 'bad', label: 'Плохо' },
          ],
        })
      ),

      /* ── 🧠 Самочувствие ────────────────────────────────────── */
      React.createElement(
        'div',
        { className: 'checkin-section' },
        React.createElement(SectionTitle, { icon: '🧠', title: 'Самочувствие' }),
        React.createElement(ScaleRow, {
          icon: '⚡', label: 'Энергия', sublabel: 'уровень сил',
          value: energy, onChange: setEnergy,
          labels: ENERGY_LABELS, filled: energy > 0,
        }),
        React.createElement(ScaleRow, {
          icon: '😊', label: 'Настроение',
          value: mood, onChange: setMood,
          labels: MOOD_LABELS, filled: mood > 0,
        }),
        React.createElement(ScaleRow, {
          icon: '💪', label: 'Болезненность', sublabel: 'мышц',
          value: muscleSoreness, onChange: setMuscleSoreness,
          labels: SORENESS_LABELS, filled: muscleSoreness > 0, inverse: true,
        }),
        React.createElement(ScaleRow, {
          icon: '🌀', label: 'Стресс',
          value: stress, onChange: setStress,
          labels: STRESS_LABELS, filled: stress > 0, inverse: true,
        }),
        React.createElement(ScaleRow, {
          icon: '🦵', label: 'Боль в бедре',
          value: hipPain, onChange: setHipPain,
          labels: PAIN_LABELS, filled: hipPain > 0, pain: true, inverse: true,
        }),
        React.createElement(ScaleRow, {
          icon: '🦾', label: 'Боль в плече',
          value: shoulderPain, onChange: setShoulderPain,
          labels: PAIN_LABELS, filled: shoulderPain > 0, pain: true, inverse: true,
        }),
        React.createElement(SparklineRow, { data: getLast7Values(checkins, 'energy'), label: 'Энергия, 7 дней', color: 'var(--yellow)' }),
        React.createElement(SparklineRow, { data: getLast7Values(checkins, 'muscleSoreness'), label: 'Болезненность, 7 дней', color: 'var(--red)' })
      ),

      /* ── 📝 Заметки ─────────────────────────────────────────── */
      React.createElement(
        'div',
        { className: 'checkin-section checkin-notes-row' },
        React.createElement('textarea', {
          value: notes,
          onChange: e => setNotes(e.target.value),
          rows: 2,
          placeholder: '📝  Самочувствие, стресс, питание...',
        })
      ),

      /* ── Сохранение ─────────────────────────────────────────── */
      React.createElement(
        'div',
        { className: 'checkin-save-row' },
        validationError && React.createElement(
          'div',
          { className: 'validation-error', role: 'alert' },
          validationError
        ),
        saveSuccess && React.createElement(
          'div',
          { className: 'validation-success', role: 'status' },
          '✅ Чек-ин сохранён'
        ),
        React.createElement(
          'button',
          {
            className: 'btn btn-accent',
            style: { width: '100%' },
            onClick: async () => {
              const err = validate({ sleepHours, restHR, hrv, weight, muscleSoreness, energy, mood, sleepQuality, stress });
              if (err) { setValidationError(err); setSaveSuccess(false); return; }
              setValidationError(null);
              await handleSaveCheckin();
              setSaveSuccess(true);
              showToast('✅ Чек-ин сохранён!', 'success');
              setTimeout(() => setSaveSuccess(false), 3000);
            },
          },
          'Сохранить чек-ин'
        )
      )
    )
  );
}
