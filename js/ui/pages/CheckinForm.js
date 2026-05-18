// js/ui/pages/CheckinForm.js
// Форма ежедневного чек-ина

import React, { useState, useContext } from 'react';
import { AppStateContext, AppDispatchContext } from '../../core/AppContext.js';
import ScaleSelector from '../components/ScaleSelector.js';

/* ---------- labels ---------- */
const SORENESS_LABELS = { 1: 'Нет', 2: 'Слабая', 3: 'Умеренная', 4: 'Сильная', 5: 'Очень сильная' };
const ENERGY_LABELS = { 1: 'Упадок сил', 2: 'Низкая', 3: 'Средняя', 4: 'Хорошая', 5: 'Отличная' };
const MOOD_LABELS = { 1: 'Подавленное', 2: 'Плохое', 3: 'Нейтральное', 4: 'Хорошее', 5: 'Отлично' };
const SLEEPQ_LABELS = { 1: 'Ужасное', 2: 'Плохое', 3: 'Среднее', 4: 'Хорошее', 5: 'Отличное' };
const STRESS_LABELS = { 1: 'Нет', 2: 'Минимальный', 3: 'Умеренный', 4: 'Высокий', 5: 'Очень высокий' };

export default function CheckinForm() {
  const state = useContext(AppStateContext);
  const dispatch = useContext(AppDispatchContext);
  const [showCheckin, setShowCheckin] = useState(true);

  const {
    weight, restHR, hrv, sleepHours, hipPain, shoulderPain, breathing, notes,
    muscleSoreness, energy, mood, sleepQuality, stress,
  } = state;

  const {
    setWeight, setRestHR, setHrv, setSleepHours,
    setHipPain, setShoulderPain, setBreathing, setNotes,
    setMuscleSoreness, setEnergy, setMood, setSleepQuality, setStress,
    handleSaveCheckin,
  } = dispatch;

  return React.createElement(
    'div',
    { className: 'collapsible' },
    React.createElement(
      'div',
      {
        className: 'collapsible-header',
        onClick: () => setShowCheckin(!showCheckin),
      },
      React.createElement('span', null, 'Ежедневный чек-ин'),
      React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } }, showCheckin ? '▲' : '▼')
    ),
    showCheckin &&
      React.createElement(
        'div',
        { className: 'collapsible-content' },
        // Row 1: Sleep + HR + HRV
        React.createElement(
          'div',
          { className: 'grid-3', style: { marginBottom: '0.75rem', gap: '0.5rem' } },
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'Сон (ч)',
            React.createElement('input', {
              type: 'number',
              value: sleepHours,
              onChange: e => setSleepHours(Number(e.target.value)),
              min: 0, max: 16, step: 0.5,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'ЧСС покоя',
            React.createElement('input', {
              type: 'number',
              value: restHR,
              onChange: e => setRestHR(Number(e.target.value)),
              min: 30, max: 120,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'HRV',
            React.createElement('input', {
              type: 'number',
              value: hrv,
              onChange: e => setHrv(Number(e.target.value)),
              min: 0, max: 200,
            })
          )
        ),
        // Row 2: Pain + Weight
        React.createElement(
          'div',
          { className: 'grid-3', style: { marginBottom: '0.75rem', gap: '0.5rem' } },
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'Боль бедро (0-10)',
            React.createElement('input', {
              type: 'number',
              value: hipPain,
              onChange: e => setHipPain(Number(e.target.value)),
              min: 0, max: 10,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'Боль плечо (0-10)',
            React.createElement('input', {
              type: 'number',
              value: shoulderPain,
              onChange: e => setShoulderPain(Number(e.target.value)),
              min: 0, max: 10,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'Вес (кг)',
            React.createElement('input', {
              type: 'number',
              value: weight,
              onChange: e => setWeight(Number(e.target.value)),
              min: 0, max: 300, step: 0.5,
            })
          )
        ),
        // Divider
        React.createElement('div', { className: 'divider' }),
        // Subjective header
        React.createElement('div', { style: { fontSize: '0.78rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.625rem' } }, 'Субъективные метрики'),
        // Row 3: Soreness, Energy, Mood
        React.createElement(
          'div',
          { className: 'grid-3', style: { marginBottom: '0.75rem', gap: '0.5rem' } },
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 500 } },
            'Болезненность',
            React.createElement(ScaleSelector, {
              value: muscleSoreness,
              onChange: setMuscleSoreness,
              labels: SORENESS_LABELS,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 500 } },
            'Энергия',
            React.createElement(ScaleSelector, {
              value: energy,
              onChange: setEnergy,
              labels: ENERGY_LABELS,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 500 } },
            'Настроение',
            React.createElement(ScaleSelector, {
              value: mood,
              onChange: setMood,
              labels: MOOD_LABELS,
            })
          )
        ),
        // Row 4: Sleep Quality, Stress, Breathing
        React.createElement(
          'div',
          { className: 'grid-3', style: { marginBottom: '0.75rem', gap: '0.5rem' } },
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 500 } },
            'Качество сна',
            React.createElement(ScaleSelector, {
              value: sleepQuality,
              onChange: setSleepQuality,
              labels: SLEEPQ_LABELS,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 500 } },
            'Стресс',
            React.createElement(ScaleSelector, {
              value: stress,
              onChange: setStress,
              labels: STRESS_LABELS,
            })
          ),
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 500 } },
            'Дыхание',
            React.createElement('select', {
              value: breathing,
              onChange: e => setBreathing(e.target.value),
              style: { fontSize: '0.82rem', minHeight: '36px' },
            },
              React.createElement('option', { value: 'good' }, 'Хорошо'),
              React.createElement('option', { value: 'mild' }, 'Лёгкий дискомфорт'),
              React.createElement('option', { value: 'bad' }, 'Плохо')
            )
          )
        ),
        // Notes
        React.createElement(
          'div',
          { style: { marginBottom: '0.75rem' } },
          React.createElement(
            'label',
            { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 500 } },
            'Заметки',
            React.createElement('textarea', {
              value: notes,
              onChange: e => setNotes(e.target.value),
              rows: 2,
              placeholder: 'Самочувствие, стресс, питание...',
            })
          )
        ),
        // Save button
        React.createElement(
          'button',
          {
            className: 'btn btn-accent',
            onClick: handleSaveCheckin,
            style: { width: '100%' },
          },
          'Сохранить чек-ин'
        )
      )
  );
}
