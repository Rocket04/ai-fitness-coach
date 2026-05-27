// js/ui/components/OnboardingWizard.jsx
// 5-step onboarding: Value → Goal → Sports → Gadgets → Recovery
// Focus: immediate action, minimal input, value-first

import React, { useState } from 'react';
import { Dumbbell, Zap, Flame, Check, Rocket, X } from 'lucide-react';
import { DAYS, DAYS_TO_DOW, SPORT_CATEGORIES, GADGETS, deriveTierFromGadgets } from '../../config/constants.js';

const STEPS = {
  VALUE: 0,
  GOAL: 1,
  SPORTS: 2,
  GADGETS: 3,
  RECOVERY: 4,
};

/** GOAL OPTIONS with auto-selected APRE protocols */
const GOALS = [
  {
    key: 'strength',
    title: 'Стать сильнее',
    subtitle: 'Максимальная сила и мышечная масса',
    apreProtocol: 'APRE_3',
    icon: React.createElement(Dumbbell, { size: 20 }),
    color: '#ef4444',
  },
  {
    key: 'fitness',
    title: 'Набрать форму',
    subtitle: 'Сила + выносливость в балансе',
    apreProtocol: 'APRE_6',
    icon: React.createElement(Zap, { size: 20 }),
    color: '#f59e0b',
  },
  {
    key: 'fatloss',
    title: 'Похудеть и рельеф',
    subtitle: 'Жиросжигание и мышечный тонус',
    apreProtocol: 'APRE_10',
    icon: React.createElement(Flame, { size: 20 }),
    color: '#10b981',
  },
];

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

/** STEP 1: Value & Immediate Action */
function ValueStep({ onNext }) {
  return React.createElement('div', { className: 'onboarding-content onboarding-content--value', 'data-testid': 'onboarding-step-1' },
    React.createElement('h1', { className: 'onboarding-headline' },
      'Твой умный тренер готов к работе'
    ),
    React.createElement('p', { className: 'onboarding-tagline' },
      'Recovery Score • Авторегуляция APRE • Приватность'
    ),
    React.createElement('div', { className: 'onboarding-value-cta' },
      React.createElement('button', {
        className: 'btn btn-accent onboarding-btn--primary',
        onClick: onNext,
      }, 'Начать первую тренировку')
    )
  );
}

/** STEP 2: Goal Selection + Training Days */
function GoalStep({ selectedGoal, onSelectGoal, selectedDays, onToggleDay, onNext, onBack }) {
  const canProceed = selectedGoal && selectedDays.length > 0;

  return React.createElement('div', { className: 'onboarding-content onboarding-content--goal', 'data-testid': 'onboarding-step-2' },
    React.createElement('h2', { className: 'onboarding-title' }, 'Выбери свою цель'),

    // Goal Cards
    React.createElement('div', { className: 'onboarding-goal-cards' },
      GOALS.map(goal =>
        React.createElement('button', {
          key: goal.key,
          className: `onboarding-goal-card${selectedGoal === goal.key ? ' onboarding-goal-card--selected' : ''}`,
          'data-testid': 'goal-option',
          onClick: () => onSelectGoal(goal.key),
          style: { '--goal-color': goal.color },
        },
          React.createElement('span', { className: 'onboarding-goal-icon' }, goal.icon),
          React.createElement('span', { className: 'onboarding-goal-title' }, goal.title),
          React.createElement('span', { className: 'onboarding-goal-subtitle' }, goal.subtitle),
          selectedGoal === goal.key && React.createElement('span', { className: 'onboarding-goal-check' }, React.createElement(Check, { size: 20 }))
        )
      )
    ),

    // Training Days Chips
    React.createElement('div', { className: 'onboarding-days-section' },
      React.createElement('p', { className: 'onboarding-section-label' }, 'Дни тренировок'),
      React.createElement('div', { className: 'onboarding-days-chips' },
        DAYS.map((day, i) => {
          const dow = DAYS_TO_DOW[i];
          const isSelected = selectedDays.includes(dow);
          return React.createElement('button', {
            key: i,
            className: `onboarding-day-chip${isSelected ? ' onboarding-day-chip--selected' : ''}`,
            'data-testid': 'training-days-toggle',
            onClick: () => onToggleDay(dow),
            disabled: !isSelected && selectedDays.length >= 3,
          }, day);
        })
      ),
      React.createElement('p', { className: 'onboarding-hint' },
        selectedDays.length === 0
          ? 'Выбери хотя бы один день'
          : `Выбрано: ${selectedDays.length} из 3 дней`
      )
    ),

    // Actions
    React.createElement('div', { className: 'onboarding-actions' },
      React.createElement('button', {
        className: 'btn btn-outline',
        onClick: onBack,
      }, '←'),
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: onNext,
        disabled: !canProceed,
      }, 'Далее →')
    )
  );
}

/** STEP 3: Sport Selection */
function SportsStep({ selectedSports, onToggleSport, onNext, onBack }) {
  const canProceed = selectedSports.length > 0;

  return React.createElement('div', { className: 'onboarding-content onboarding-content--sports', 'data-testid': 'onboarding-step-3' },
    React.createElement('h2', { className: 'onboarding-title' }, 'Каким спортом занимаешься?'),
    React.createElement('p', { className: 'onboarding-hint' }, 'Можно выбрать несколько'),

    React.createElement('div', { className: 'onboarding-sports-categories' },
      SPORT_CATEGORIES.map(category =>
        React.createElement('div', { key: category.key, className: 'onboarding-sports-category' },
          React.createElement('div', { className: 'onboarding-sports-category__header' },
            React.createElement('span', { className: 'onboarding-sports-category__emoji' }, category.emoji),
            React.createElement('span', { className: 'onboarding-sports-category__label' }, category.label)
          ),
          React.createElement('div', { className: 'onboarding-sports-chips' },
            category.sports.map(sport => {
              const isSelected = selectedSports.includes(sport.key);
              return React.createElement('button', {
                key: sport.key,
                className: `onboarding-sport-chip${isSelected ? ' onboarding-sport-chip--selected' : ''}`,
                'data-testid': 'sport-selector',
                onClick: () => onToggleSport(sport.key),
              }, sport.label);
            })
          )
        )
      )
    ),

    React.createElement('div', { className: 'onboarding-actions' },
      React.createElement('button', {
        className: 'btn btn-outline',
        onClick: onBack,
      }, '←'),
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: onNext,
        disabled: !canProceed,
      }, 'Далее →')
    )
  );
}

/** STEP 4: Gadget Selection */
function GadgetsStep({ selectedGadgets, onToggleGadget, derivedTier, onNext, onBack }) {
  const canProceed = selectedGadgets.length > 0;

  const tierLabels = { full: 'Полный (HRV + ЧСС + Сон)', medium: 'Средний (ЧСС + Сон)', light: 'Лёгкий (субъективный)' };
  const tierColors = { full: 'var(--green)', medium: 'var(--yellow)', light: 'var(--text3)' };

  return React.createElement('div', { className: 'onboarding-content onboarding-content--gadgets', 'data-testid': 'onboarding-step-4' },
    React.createElement('h2', { className: 'onboarding-title' }, 'Какие устройства используешь?'),
    React.createElement('p', { className: 'onboarding-hint' }, 'Определяет точность Recovery Score'),

    React.createElement('div', { className: 'onboarding-gadgets-list' },
      GADGETS.map(gadget => {
        const isSelected = selectedGadgets.includes(gadget.key);
        return React.createElement('button', {
          key: gadget.key,
          className: `onboarding-gadget-card${isSelected ? ' onboarding-gadget-card--selected' : ''}`,
          'data-testid': 'gadget-selector',
          onClick: () => onToggleGadget(gadget.key),
        },
          React.createElement('div', { className: 'onboarding-gadget-info' },
            React.createElement('span', { className: 'onboarding-gadget-label' }, gadget.label),
            React.createElement('span', { className: 'onboarding-gadget-desc' }, gadget.desc)
          ),
          isSelected && React.createElement('span', { className: 'onboarding-gadget-check' }, React.createElement(Check, { size: 18 }))
        );
      })
    ),

    // Tier recommendation
    derivedTier && React.createElement('div', { className: 'onboarding-tier-recommendation' },
      React.createElement('span', { className: 'onboarding-tier-label' }, 'Уровень чек-ина:'),
      React.createElement('span', {
        className: 'onboarding-tier-value',
        style: { color: tierColors[derivedTier] },
      }, tierLabels[derivedTier])
    ),

    React.createElement('div', { className: 'onboarding-actions' },
      React.createElement('button', {
        className: 'btn btn-outline',
        onClick: onBack,
      }, '←'),
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: onNext,
        disabled: !canProceed,
      }, 'Далее →')
    )
  );
}

/** STEP 5: Recovery Score with Personal Ring */
function RecoveryStep({ onFinish }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const color = 'var(--accent)';

  return React.createElement('div', { className: 'onboarding-content onboarding-content--recovery', 'data-testid': 'onboarding-step-5' },
    React.createElement('h2', { className: 'onboarding-title' }, 'Recovery Score'),

    React.createElement('div', { className: 'onboarding-recovery-ring' },
      React.createElement('svg', { width: '140', height: '140', viewBox: '0 0 140 140' },
        React.createElement('circle', {
          cx: 70, cy: 70, r: radius,
          fill: 'none',
          stroke: 'var(--surface3)',
          strokeWidth: 6,
        }),
        React.createElement('circle', {
          cx: 70, cy: 70, r: radius,
          fill: 'none',
          stroke: color,
          strokeWidth: 6,
          strokeDasharray: circumference,
          strokeDashoffset: circumference,
          strokeLinecap: 'round',
          transform: `rotate(-90 70 70)`,
          opacity: 0.3,
        }),
        React.createElement('text', {
          x: 70, y: 65,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fill: 'var(--text2)',
          fontSize: '14',
          fontWeight: '600',
        }, '—'),
        React.createElement('text', {
          x: 70, y: 85,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          fill: 'var(--text3)',
          fontSize: '10',
        }, 'Ваш показатель')
      )
    ),

    React.createElement('p', { className: 'onboarding-recovery-message' },
      'Мы будем анализировать твоё состояние и подсказывать, когда тренироваться, а когда восстанавливаться.',
      React.createElement('br'),
      React.createElement('strong', null, 'Вся магия будет здесь.')
    ),

    React.createElement('button', {
      className: 'btn btn-accent onboarding-btn--primary',
      'data-testid': 'onboarding-complete',
      onClick: onFinish,
    }, React.createElement(Rocket, { size: 20 }), ' Перейти к тренировке')
  );
}

/**
 * @param {{ isOpen: boolean, onComplete: (data: { trainDays: number[], selectedGoal: string, apreProtocol: string, selectedSports: string[], selectedGadgets: string[], checkinTier: string }) => void, onClose?: () => void }} props
 */
export default function OnboardingWizard({ isOpen, onComplete, onClose }) {
  const [step, setStep] = useState(STEPS.VALUE);
  const [trainDays, setTrainDays] = useState([1, 3, 5]); // Default Mon/Wed/Fri
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedGadgets, setSelectedGadgets] = useState([]);

  if (!isOpen) return null;

  const derivedTier = deriveTierFromGadgets(selectedGadgets);

  const handleToggleDay = (dow) => {
    setTrainDays(prev => {
      const isSelected = prev.includes(dow);
      if (isSelected) {
        return prev.filter(d => d !== dow).sort((a, b) => a - b);
      }
      if (prev.length >= 3) return prev;
      return [...prev, dow].sort((a, b) => a - b);
    });
  };

  const handleToggleSport = (sportKey) => {
    setSelectedSports(prev =>
      prev.includes(sportKey)
        ? prev.filter(s => s !== sportKey)
        : [...prev, sportKey]
    );
  };

  const handleToggleGadget = (gadgetKey) => {
    setSelectedGadgets(prev => {
      const gadget = GADGETS.find(g => g.key === gadgetKey);
      if (gadget?.exclusive) {
        // Manual is exclusive — deselect all others
        return prev.includes(gadgetKey) ? [] : [gadgetKey];
      }
      // If manual was selected, remove it when selecting a real gadget
      const withoutManual = prev.filter(g => g !== 'manual');
      if (withoutManual.includes(gadgetKey)) {
        return withoutManual.filter(g => g !== gadgetKey);
      }
      return [...withoutManual, gadgetKey];
    });
  };

  const handleFinish = () => {
    const goal = GOALS.find(g => g.key === selectedGoal);
    onComplete({
      trainDays,
      selectedGoal: selectedGoal || 'fitness',
      apreProtocol: goal?.apreProtocol || 'APRE_6',
      selectedSports,
      selectedGadgets,
      checkinTier: derivedTier,
    });
  };

  const totalSteps = 5;

  return React.createElement('div', { className: 'onboarding-overlay', onClick: onClose },
    React.createElement('div', { className: 'onboarding-modal', onClick: e => e.stopPropagation() },
      onClose && React.createElement('button', {
        className: 'onboarding-close',
        'data-testid': 'onboarding-close',
        onClick: onClose,
        'aria-label': 'Закрыть',
      },
        React.createElement('span', { className: 'sr-only' }, 'Закрыть'),
        React.createElement(X, { size: 20, 'aria-hidden': 'true' }),
      ),
      React.createElement(StepIndicator, { current: step, total: totalSteps }),

      step === STEPS.VALUE && React.createElement(ValueStep, {
        onNext: () => setStep(STEPS.GOAL),
      }),

      step === STEPS.GOAL && React.createElement(GoalStep, {
        selectedGoal,
        onSelectGoal: setSelectedGoal,
        selectedDays: trainDays,
        onToggleDay: handleToggleDay,
        onNext: () => setStep(STEPS.SPORTS),
        onBack: () => setStep(STEPS.VALUE),
      }),

      step === STEPS.SPORTS && React.createElement(SportsStep, {
        selectedSports,
        onToggleSport: handleToggleSport,
        onNext: () => setStep(STEPS.GADGETS),
        onBack: () => setStep(STEPS.GOAL),
      }),

      step === STEPS.GADGETS && React.createElement(GadgetsStep, {
        selectedGadgets,
        onToggleGadget: handleToggleGadget,
        derivedTier,
        onNext: () => setStep(STEPS.RECOVERY),
        onBack: () => setStep(STEPS.SPORTS),
      }),

      step === STEPS.RECOVERY && React.createElement(RecoveryStep, {
        onFinish: handleFinish,
      })
    )
  );
}
