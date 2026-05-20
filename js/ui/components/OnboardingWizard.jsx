// js/ui/components/OnboardingWizard.jsx
// 3-step onboarding wizard: Welcome → Training Days → First Check-in → Recovery Explained

import React, { useState } from 'react';
import { DAYS, DAYS_TO_DOW } from '../../config/constants.js';

const STEPS = {
  WELCOME: 0,
  TRAINING_DAYS: 1,
  FIRST_CHECKIN: 2,
  RECOVERY_EXPLAINED: 3,
};

function StepIndicator({ current, total }) {
  return React.createElement('div', { className: 'onboarding-steps' },
    Array.from({ length: total }, (_, i) =>
      React.createElement('div', {
        key: i,
        className: `onboarding-step${i === current ? ' onboarding-step--active' : ''}${i < current ? ' onboarding-step--completed' : ''}`,
      })
    )
  );
}

function WelcomeStep({ onNext }) {
  return React.createElement('div', { className: 'onboarding-content' },
    React.createElement('div', { className: 'onboarding-icon' }, '🎯'),
    React.createElement('h2', { className: 'onboarding-title' }, 'Добро пожаловать!'),
    React.createElement('p', { className: 'onboarding-text' },
      'Smart Fitness Coach — персональный тренер, который адаптирует нагрузку под ваше состояние.'
    ),
    React.createElement('ul', { className: 'onboarding-features' },
      React.createElement('li', null, '📊 Recovery Score — комплексная оценка восстановления'),
      React.createElement('li', null, '🤖 Автоматическая корректировка тренировок'),
      React.createElement('li', null, '📈 APRE — научная прогрессия весов'),
      React.createElement('li', null, '🔒 Все данные на устройстве, без облака')
    ),
    React.createElement('button', {
      className: 'btn btn-accent onboarding-btn',
      onClick: onNext,
    }, 'Начать настройку →')
  );
}

function TrainingDaysStep({ selectedDays, onToggleDay, onNext, onBack }) {
  return React.createElement('div', { className: 'onboarding-content' },
    React.createElement('div', { className: 'onboarding-icon' }, '📅'),
    React.createElement('h2', { className: 'onboarding-title' }, 'Выберите дни тренировок'),
    React.createElement('p', { className: 'onboarding-text' },
      'Рекомендуем 3 дня в неделю с перерывом между тренировками. Порядок: A → B → C.'
    ),
    React.createElement('div', { className: 'onboarding-days' },
      DAYS.map((day, i) => {
        const dow = DAYS_TO_DOW[i];
        const isSelected = selectedDays.includes(dow);
        return React.createElement('button', {
          key: i,
          className: `onboarding-day${isSelected ? ' onboarding-day--selected' : ''}`,
          onClick: () => onToggleDay(dow),
        },
          day,
          isSelected && React.createElement('span', { className: 'onboarding-day-check' }, '✓')
        );
      })
    ),
    React.createElement('p', { className: 'onboarding-hint' },
      selectedDays.length === 0
        ? 'Выберите хотя бы один день'
        : `Выбрано: ${selectedDays.length} дня(дней)`
    ),
    React.createElement('div', { className: 'onboarding-actions' },
      React.createElement('button', {
        className: 'btn btn-outline',
        onClick: onBack,
      }, '← Назад'),
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: onNext,
        disabled: selectedDays.length === 0,
      }, 'Далее →')
    )
  );
}

function FirstCheckinStep({ checkinData, onUpdate, onNext, onBack, onSkip }) {
  const fields = [
    { key: 'weight', label: 'Вес', unit: 'кг', min: 30, max: 200, step: 0.1 },
    { key: 'restHR', label: 'ЧСС покоя', unit: 'уд/мин', min: 30, max: 120 },
    { key: 'hrv', label: 'HRV', unit: 'мс', min: 20, max: 150 },
    { key: 'sleepHours', label: 'Сон', unit: 'ч', min: 0, max: 14, step: 0.5 },
  ];

  return React.createElement('div', { className: 'onboarding-content' },
    React.createElement('div', { className: 'onboarding-icon' }, '💤'),
    React.createElement('h2', { className: 'onboarding-title' }, 'Первый чек-ин'),
    React.createElement('p', { className: 'onboarding-text' },
      'Эти данные нужны для расчёта Recovery Score. Можно заполнить позже.'
    ),
    React.createElement('div', { className: 'onboarding-fields' },
      fields.map(field =>
        React.createElement('label', { key: field.key, className: 'onboarding-field' },
          React.createElement('span', { className: 'onboarding-field-label' }, field.label),
          React.createElement('input', {
            type: 'number',
            className: 'onboarding-field-input',
            min: field.min,
            max: field.max,
            step: field.step || 1,
            value: checkinData[field.key] || '',
            placeholder: '—',
            onChange: e => onUpdate(field.key, parseFloat(e.target.value) || 0),
          }),
          React.createElement('span', { className: 'onboarding-field-unit' }, field.unit)
        )
      )
    ),
    React.createElement('div', { className: 'onboarding-actions' },
      React.createElement('button', {
        className: 'btn btn-outline',
        onClick: onBack,
      }, '← Назад'),
      React.createElement('button', {
        className: 'btn',
        onClick: onSkip,
      }, 'Пропустить'),
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: onNext,
      }, 'Далее →')
    )
  );
}

function RecoveryExplainedStep({ onFinish }) {
  return React.createElement('div', { className: 'onboarding-content' },
    React.createElement('div', { className: 'onboarding-icon' }, '💚'),
    React.createElement('h2', { className: 'onboarding-title' }, 'Recovery Score'),
    React.createElement('p', { className: 'onboarding-text' },
      'Комплексный индекс восстановления (0–100%), основанный на:'
    ),
    React.createElement('div', { className: 'onboarding-recovery-grid' },
      React.createElement('div', { className: 'onboarding-recovery-item' },
        React.createElement('div', { className: 'onboarding-recovery-icon', style: { color: 'var(--blue)' } }, '💓'),
        React.createElement('div', { className: 'onboarding-recovery-label' }, 'HRV'),
        React.createElement('div', { className: 'onboarding-recovery-value' }, '40%')
      ),
      React.createElement('div', { className: 'onboarding-recovery-item' },
        React.createElement('div', { className: 'onboarding-recovery-icon', style: { color: 'var(--green)' } }, '😴'),
        React.createElement('div', { className: 'onboarding-recovery-label' }, 'Сон'),
        React.createElement('div', { className: 'onboarding-recovery-value' }, '30%')
      ),
      React.createElement('div', { className: 'onboarding-recovery-item' },
        React.createElement('div', { className: 'onboarding-recovery-icon', style: { color: 'var(--yellow)' } }, '💓'),
        React.createElement('div', { className: 'onboarding-recovery-label' }, 'ЧСС'),
        React.createElement('div', { className: 'onboarding-recovery-value' }, '10%')
      ),
      React.createElement('div', { className: 'onboarding-recovery-item' },
        React.createElement('div', { className: 'onboarding-recovery-icon', style: { color: 'var(--purple)' } }, '😊'),
        React.createElement('div', { className: 'onboarding-recovery-label' }, 'Субъективно'),
        React.createElement('div', { className: 'onboarding-recovery-value' }, '20%')
      )
    ),
    React.createElement('div', { className: 'onboarding-status-legend' },
      React.createElement('div', { className: 'onboarding-status-item' },
        React.createElement('span', { className: 'pill green' }, 'Зелёный'),
        React.createElement('span', null, '— готов к полной нагрузке')
      ),
      React.createElement('div', { className: 'onboarding-status-item' },
        React.createElement('span', { className: 'pill yellow' }, 'Жёлтый'),
        React.createElement('span', null, '— умеренная нагрузка')
      ),
      React.createElement('div', { className: 'onboarding-status-item' },
        React.createElement('span', { className: 'pill red' }, 'Красный'),
        React.createElement('span', null, '— восстановление')
      )
    ),
    React.createElement('button', {
      className: 'btn btn-accent onboarding-btn',
      onClick: onFinish,
    }, 'Начать тренироваться 🚀')
  );
}

/**
 * @param {{ isOpen: boolean, onComplete: (data: { trainDays: number[], checkin: object }) => void, onClose?: () => void }} props
 */
export default function OnboardingWizard({ isOpen, onComplete, onClose }) {
  const [step, setStep] = useState(STEPS.WELCOME);
  const [trainDays, setTrainDays] = useState([1, 3, 5]); // Default Mon/Wed/Fri
  const [checkinData, setCheckinData] = useState({
    weight: 0,
    restHR: 0,
    hrv: 0,
    sleepHours: 0,
  });

  if (!isOpen) return null;

  const handleToggleDay = (dow) => {
    setTrainDays(prev =>
      prev.includes(dow)
        ? prev.filter(d => d !== dow)
        : [...prev, dow].sort((a, b) => a - b)
    );
  };

  const handleUpdateCheckin = (key, value) => {
    setCheckinData(prev => ({ ...prev, [key]: value }));
  };

  const handleFinish = () => {
    onComplete({
      trainDays,
      checkin: checkinData,
    });
  };

  const totalSteps = 4;

  return React.createElement('div', { className: 'onboarding-overlay', onClick: onClose },
    React.createElement('div', { className: 'onboarding-modal', onClick: e => e.stopPropagation() },
      onClose && React.createElement('button', {
        className: 'onboarding-close',
        onClick: onClose,
        'aria-label': 'Close',
      }, '✕'),
      React.createElement(StepIndicator, { current: step, total: totalSteps }),

      step === STEPS.WELCOME && React.createElement(WelcomeStep, {
        onNext: () => setStep(STEPS.TRAINING_DAYS),
      }),

      step === STEPS.TRAINING_DAYS && React.createElement(TrainingDaysStep, {
        selectedDays: trainDays,
        onToggleDay: handleToggleDay,
        onNext: () => setStep(STEPS.FIRST_CHECKIN),
        onBack: () => setStep(STEPS.WELCOME),
      }),

      step === STEPS.FIRST_CHECKIN && React.createElement(FirstCheckinStep, {
        checkinData,
        onUpdate: handleUpdateCheckin,
        onNext: () => setStep(STEPS.RECOVERY_EXPLAINED),
        onBack: () => setStep(STEPS.TRAINING_DAYS),
        onSkip: () => setStep(STEPS.RECOVERY_EXPLAINED),
      }),

      step === STEPS.RECOVERY_EXPLAINED && React.createElement(RecoveryExplainedStep, {
        onFinish: handleFinish,
      })
    )
  );
}
