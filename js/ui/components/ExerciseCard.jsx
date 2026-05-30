// js/ui/components/ExerciseCard.jsx
// Карточка упражнения с поддержкой режима APRE (4 сета).
// Фаза 3 — полная реализация.
// Mobile-friendly layout + per-set RPE for non-APRE exercises.

import React, { useState, useEffect } from 'react';
import { Settings, Dumbbell } from 'lucide-react';
import { calcApreSets, calcNextWeekRM, CALISTHENICS_PROGRESSIONS } from '../../domains/training/apre/engine.js';
import { useTranslation } from 'react-i18next';
import HelpIcon from './HelpIcon.jsx';
import styles from './ExerciseCard.module.css';

/* ─────────────────────────────────────────────────────────────────────────────
 * Вспомогательные компоненты
 * ────────────────────────────────────────────────────────────────────────────*/

/** Читаемое название уровня калистеники */
function levelLabel(level) {
  return CALISTHENICS_PROGRESSIONS[level] ?? `Уровень ${level}`;
}

/** RPE шкала 1–10 для одного подхода */
function RpeSlider({ value, onChange }) {
  const displayValue = value ?? 0;
  const zoneColor = displayValue <= 3 ? 'var(--green)' : displayValue <= 6 ? 'var(--yellow)' : displayValue <= 8 ? 'var(--orange)' : 'var(--red)';
  return React.createElement('div', {
    className: styles['set-rpe-slider'],
  },
    React.createElement('span', {
      className: styles['set-rpe-label'],
      style: { color: zoneColor, fontWeight: 600 },
    }, `RPE ${displayValue}`),
    React.createElement('input', {
      type: 'range',
      min: 1,
      max: 10,
      step: 1,
      value: displayValue,
      onChange: e => onChange(parseInt(e.target.value, 10)),
      className: styles['set-rpe-input'],
      'aria-label': 'RPE slider',
    })
  );
}

/** Строка одного сета в таблице */
function SetRow({ number, weightLabel, repsLabel, isReadonly, isDisabled, isAmrap, value, onChange, t }) {
  return React.createElement('div', {
    className: `${styles['apre-set-row']}${isDisabled ? ` ${styles['apre-set-row--disabled']}` : ''}${isAmrap ? ` ${styles['apre-set-row--amrap']}` : ''}`,
  },
    React.createElement('span', { className: styles['apre-set-number'] }, t('exercise.set', { number })),
    React.createElement('span', { className: styles['apre-set-weight'] }, weightLabel),
    isReadonly || isDisabled
      ? React.createElement('span', { className: styles['apre-set-reps'] }, repsLabel)
      : React.createElement('input', {
          type: 'number',
          className: styles['apre-set-reps-input'],
          min: 0,
          max: 99,
          placeholder: '—',
          value: value ?? '',
          onChange: e => {
            const v = e.target.value;
            onChange(v === '' ? null : Math.max(0, parseInt(v, 10)));
          },
          'aria-label': `${t('exercise.set', { number })} — ${t('exercise.reps')}`,
        })
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Recovery banner
 * ────────────────────────────────────────────────────────────────────────────*/

function RecoveryBanner({ recoveryScore, recoveryReduction, unit, t }) {
  if (recoveryScore >= 70) return null;

  if (recoveryScore < 40) {
    const label = unit === 'lbs' ? 'lbs' : 'kg';
    return React.createElement('div', { className: `${styles['apre-recovery-banner']} ${styles['apre-recovery-banner--red']}` },
      t('exercise.recoveryBanner.red', { reduction: recoveryReduction, unit: label })
    );
  }

  return React.createElement('div', { className: `${styles['apre-recovery-banner']} ${styles['apre-recovery-banner--yellow']}` },
    t('exercise.recoveryBanner.yellow')
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Основная карточка упражнения
 * ────────────────────────────────────────────────────────────────────────────*/

/**
 * @param {{ ex: import('../../core/types.js').Exercise, recoveryScore: number, onApreResult: function, onConfigure: function, isConfigured: boolean }} props
 *   ex             — объект упражнения из sessionPlan.exercises
 *   recoveryScore  — Recovery Score 0–100 из store (влияет на вес и предупреждения)
 *   onApreResult   — callback(result: ApreExerciseResult) вызывается при вводе set4Reps
 *   onConfigure    — callback() открывает модал настройки упражнения
 *   isConfigured   — флаг: настроено ли упражнение (currentRM !== null или currentLevel !== null)
 */
export default function ExerciseCard({ ex, recoveryScore = 100, onApreResult, onConfigure, isConfigured = true, onSetComplete }) {
  const { t } = useTranslation();
  const isApre = Boolean(ex?.isApre);

  // ── Локальный state для AMRAP-повторений и RPE ───────────────────────────
  const [set3Reps, setSet3Reps] = useState(null);
  const [set4Reps, setSet4Reps] = useState(null);
  const [completedSets, setCompletedSets] = useState([]);
  const [setRpeValues, setSetRpeValues] = useState({}); // { [setNum]: rpe }
  const [setRepsValues, setSetRepsValues] = useState({}); // { [setNum]: actualReps }

  // Сбрасываем при смене упражнения
  useEffect(() => {
    setSet3Reps(null);
    setSet4Reps(null);
    setCompletedSets([]);
    setSetRpeValues({});
    setSetRepsValues({});
  }, [ex?.n]);

  // ── Уведомление родителя о результате set4 ──────────────────────────────
  useEffect(() => {
    if (!isApre || set4Reps === null) return;

    const nextRM = calcNextWeekRM(
      ex.protocol,
      ex.currentRM,
      set4Reps,
      ex.unit ?? 'kg',
      ex.isCalisthenics ?? false
    );

    if (typeof onApreResult === 'function') {
      onApreResult({
        exerciseName: ex.n,
        protocol: ex.protocol,
        nextRM,
        unit: ex.unit ?? 'kg',
        isCalisthenics: ex.isCalisthenics ?? false,
        lastSet3Reps: set3Reps ?? 0,
        lastSet4Reps: set4Reps,
        usesWeight: ex.usesWeight ?? false,
        calisthenicLevel: ex.isCalisthenics && !ex.usesWeight ? nextRM : undefined,
      });
    }
  }, [set4Reps, isApre, ex.protocol, ex.currentRM, ex.unit, ex.isCalisthenics, set3Reps, onApreResult, ex.n]);

  // ── Оверлей не настроенного упражнения ─────────────────────────────────
  if (isApre && !isConfigured) {
    return React.createElement('div', { className: `${styles['exercise-row']} ${styles['exercise-row--apre']} ${styles['exercise-row--unconfigured']}` },
      React.createElement('div', { className: styles['apre-header'] },
        React.createElement('span', { className: styles['exercise-name'] }, ex.n),
        React.createElement('span', { className: `${styles['apre-badge']} ${styles['apre-badge--muted']}` }, 'APRE')
      ),
      React.createElement('div', { className: styles['unconfigured-overlay'] },
        React.createElement('div', { className: styles['unconfigured-icon'] }, React.createElement(Settings, { size: 20 })),
        React.createElement('p', { className: styles['unconfigured-text'] },
          t('exercise.unconfigured')
        ),
        React.createElement('button', {
          className: 'btn btn-accent',
          onClick: onConfigure,
        }, t('exercise.configure'))
      )
    );
  }

  // ── Пересчёт сетов ──────────────────────────────────────────────────────
  const sets = isApre
    ? calcApreSets({
        protocol: ex.protocol,
        currentRM: ex.currentRM,
        unit: ex.unit ?? 'kg',
        isCalisthenics: ex.isCalisthenics ?? false,
        usesWeight: ex.usesWeight ?? false,
        set3Reps,
        recoveryScore,
      })
    : null;

  // ── Обычная карточка (не APRE) ──────────────────────────────────────────
  if (!isApre || !sets) {
    let numSets = 3;
    if (ex.s) {
      const match = ex.s.match(/(\d+)/);
      if (match) numSets = parseInt(match[1], 10);
    }
    const repsLabel = ex.r || '—';
    const weightNote = ex.w || ex.c || '';
    const plannedReps = parseInt(ex.r, 10) || 0;
    const setsArray = Array.from({ length: numSets }, (_, i) => i + 1);

    return React.createElement('div', { className: `${styles['exercise-row']} ${styles['exercise-row--regular']}` },
      React.createElement('div', { className: styles['exercise-row-header'] },
        React.createElement('span', { className: styles['exercise-name'] }, ex.n),
        React.createElement('span', { className: styles['exercise-sets-meta'] }, `${ex.s || '3'} × ${repsLabel}`)
      ),
      ...setsArray.map(setNum => {
        const isChecked = completedSets.includes(setNum);
        const rpe = setRpeValues[setNum];
        const repsValue = setRepsValues[setNum] !== undefined ? setRepsValues[setNum] : plannedReps;
        return React.createElement('div', {
          key: setNum,
          className: `${styles['exercise-set-row']}${isChecked ? ` ${styles['exercise-set-row--completed']}` : ''}`,
        },
          React.createElement('label', {
            className: styles['exercise-set-label'],
          },
            React.createElement('input', {
              type: 'checkbox',
              className: styles['exercise-set-checkbox'],
              checked: isChecked,
              onChange: () => {
                const nowChecked = !isChecked;
                if (nowChecked) {
                  setCompletedSets(prev => [...prev, setNum]);
                } else {
                  setCompletedSets(prev => prev.filter(s => s !== setNum));
                  setSetRpeValues(prev => {
                    const next = { ...prev };
                    delete next[setNum];
                    return next;
                  });
                }
                if (typeof onSetComplete === 'function') {
                  onSetComplete(ex.n, setNum, nowChecked, nowChecked ? repsValue : 0, nowChecked ? rpe : undefined);
                }
              },
            }),
            React.createElement('span', { className: styles['exercise-set-text'] },
              `Подход ${setNum}: ${repsLabel} повт.${weightNote ? ` • ${weightNote}` : ''}`
            )
          ),
          isChecked && React.createElement('input', {
            type: 'number',
            className: styles['exercise-set-reps-input'],
            min: 0,
            max: 999,
            value: repsValue,
            onChange: e => {
              const newReps = parseInt(e.target.value, 10) || 0;
              setSetRepsValues(prev => ({ ...prev, [setNum]: newReps }));
              if (typeof onSetComplete === 'function') {
                onSetComplete(ex.n, setNum, true, newReps, rpe);
              }
            },
            'aria-label': `Подход ${setNum} — повторения`,
          }),
          isChecked && React.createElement(RpeSlider, {
            value: rpe,
            onChange: newRpe => {
              setSetRpeValues(prev => ({ ...prev, [setNum]: newRpe }));
              if (typeof onSetComplete === 'function') {
                onSetComplete(ex.n, setNum, true, repsValue, newRpe);
              }
            },
          })
        );
      })
    );
  }

  // ── APRE-карточка ───────────────────────────────────────────────────────
  const { set1, set2, set3, set4, recoveryReduction } = sets;
  const unit = ex.unit ?? 'kg';
  const isCalisthenics = ex.isCalisthenics ?? false;

  function weightLabel(w, readonlySet) {
    if (w === null || w === undefined) return '—';
    if (isCalisthenics) {
      // w is added weight in kg (from calcApreSets)
      // Map to level for backward compatibility with display
      const addedWeight = Math.max(0, Math.round(w * 10) / 10);
      if (addedWeight === 0) return 'Тело';
      if (addedWeight === 2.5) return '+2.5 кг';
      if (addedWeight === 5) return '+5 кг';
      if (addedWeight === 7.5) return '+7.5 кг';
      if (addedWeight === 10) return '+10 кг';
      return `+${addedWeight} кг`;
    }
    const unitLabel = unit === 'lbs' ? t('units.lbs') : t('units.kg');
    return `${w} ${unitLabel}`;
  }

  return React.createElement('div', { className: `${styles['exercise-row']} ${styles['exercise-row--apre']}` },
    // Заголовок карточки
    React.createElement('div', { className: styles['apre-header'] },
      React.createElement('span', { className: styles['exercise-name'] }, ex.n),
      React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        React.createElement('span', { className: styles['apre-badge'] }, ex.protocol?.replace('_', ' ') ?? 'APRE'),
        React.createElement(HelpIcon, {
          term: 'APRE (Auto-regulatory)',
          definition: t('exercise.apreTooltip')
        })
      )
    ),

    // Recovery-предупреждение
    React.createElement(RecoveryBanner, { recoveryScore, recoveryReduction, unit, t }),

    // Таблица 4 сетов
    React.createElement('div', { className: styles['apre-sets'] },
      React.createElement(SetRow, {
        number: 1,
        weightLabel: weightLabel(set1.weight, true),
        repsLabel: `${set1.reps} ${t('exercise.reps')}`,
        isReadonly: true,
        isDisabled: false,
        isAmrap: false,
        t
      }),
      React.createElement(SetRow, {
        number: 2,
        weightLabel: weightLabel(set2.weight, true),
        repsLabel: `${set2.reps} ${t('exercise.reps')}`,
        isReadonly: true,
        isDisabled: false,
        isAmrap: false,
        t
      }),
      React.createElement(SetRow, {
        number: 3,
        weightLabel: weightLabel(set3.weight, false),
        repsLabel: t('exercise.amrap'),
        isReadonly: false,
        isDisabled: false,
        isAmrap: true,
        value: set3Reps,
        onChange: setSet3Reps,
        t
      }),
      React.createElement(SetRow, {
        number: 4,
        weightLabel: set4.disabled
          ? '—'
          : `${weightLabel(set4.weight, false)}${set3Reps !== null && set4.adjustmentReason ? ` ${set4.adjustmentReason}` : ''}`,
        repsLabel: 'AMRAP',
        isReadonly: false,
        isDisabled: set4.disabled,
        isAmrap: true,
        value: set4Reps,
        onChange: setSet4Reps,
        t
      })
    ),

    // Подсказка про следующую неделю (после ввода set4)
    set4Reps !== null && React.createElement('div', { className: styles['apre-next-week'] },
      (() => {
        const nextRM = calcNextWeekRM(ex.protocol, ex.currentRM, set4Reps, unit, isCalisthenics);
        const diff = Number((nextRM - ex.currentRM).toFixed(1));
        const diffText = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
        const reason = t('exercise.adjustmentReason', {
          sign: diff > 0 ? '+' : diff < 0 ? '' : '',
          amount: diffText,
          unit: unit === 'lbs' ? t('units.lbs') : t('units.kg'),
          reps: set4Reps
        });
        if (isCalisthenics) {
          const addedWeight = Math.max(0, Math.round(nextRM * 10) / 10);
          const displayWeight = addedWeight === 0 ? 'Тело' : `+${addedWeight} кг`;
          return t('exercise.nextWeekProgress', { value: displayWeight, reason });
        }
        const unitLabel = unit === 'lbs' ? t('units.lbs') : t('units.kg');
        return t('exercise.nextWeekProgress', { value: `${nextRM} ${unitLabel}`, reason });
      })()
    )
  );
}
