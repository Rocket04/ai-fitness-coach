// js/ui/components/ExerciseCard.jsx
// Карточка упражнения с поддержкой режима APRE (4 сета).
// Фаза 3 — полная реализация.

import React, { useState, useEffect } from 'react';
import { Settings, Dumbbell } from 'lucide-react';
import { calcApreSets, calcNextWeekRM, CALISTHENICS_PROGRESSIONS } from '../../core/apre/engine.js';
import { useTranslation } from 'react-i18next';
import HelpIcon from './HelpIcon.jsx';

/* ─────────────────────────────────────────────────────────────────────────────
 * Вспомогательные компоненты
 * ────────────────────────────────────────────────────────────────────────────*/

/** Читаемое название уровня калистеники */
function levelLabel(level) {
  return CALISTHENICS_PROGRESSIONS[level] ?? `Уровень ${level}`;
}

/** Строка одного сета в таблице */
function SetRow({ number, weightLabel, repsLabel, isReadonly, isDisabled, isAmrap, value, onChange, t }) {
  return React.createElement('div', {
    className: `apre-set-row${isDisabled ? ' apre-set-row--disabled' : ''}${isAmrap ? ' apre-set-row--amrap' : ''}`,
  },
    React.createElement('span', { className: 'apre-set-number' }, t('exercise.set', { number })),
    React.createElement('span', { className: 'apre-set-weight' }, weightLabel),
    isReadonly || isDisabled
      ? React.createElement('span', { className: 'apre-set-reps' }, repsLabel)
      : React.createElement('input', {
          type: 'number',
          className: 'apre-set-reps-input',
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
    return React.createElement('div', { className: 'apre-recovery-banner apre-recovery-banner--red' },
      t('exercise.recoveryBanner.red', { reduction: recoveryReduction, unit: label })
    );
  }

  return React.createElement('div', { className: 'apre-recovery-banner apre-recovery-banner--yellow' },
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

  // ── Локальный state для AMRAP-повторений ────────────────────────────────
  const [set3Reps, setSet3Reps] = useState(null);
  const [set4Reps, setSet4Reps] = useState(null);
  const [completedSets, setCompletedSets] = useState([]);

  // Сбрасываем при смене упражнения
  useEffect(() => {
    setSet3Reps(null);
    setSet4Reps(null);
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
        calisthenicLevel: ex.isCalisthenics ? nextRM : undefined,
      });
    }
  }, [set4Reps, isApre, ex.protocol, ex.currentRM, ex.unit, ex.isCalisthenics, set3Reps, onApreResult, ex.n]);

  // ── Оверлей не настроенного упражнения ─────────────────────────────────
  if (isApre && !isConfigured) {
    return React.createElement('div', { className: 'exercise-row exercise-row--apre exercise-row--unconfigured' },
      React.createElement('div', { className: 'apre-header' },
        React.createElement('span', { className: 'exercise-name' }, ex.n),
        React.createElement('span', { className: 'apre-badge apre-badge--muted' }, 'APRE')
      ),
      React.createElement('div', { className: 'unconfigured-overlay' },
        React.createElement('div', { className: 'unconfigured-icon' }, React.createElement(Settings, { size: 20 })),
        React.createElement('p', { className: 'unconfigured-text' },
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
    const setsArray = Array.from({ length: numSets }, (_, i) => i + 1);

    return React.createElement('div', { className: 'exercise-row' },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
        React.createElement('span', { className: 'exercise-name' }, ex.n),
        React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } }, `${ex.s || '3'} × ${repsLabel}`)
      ),
      ...setsArray.map(setNum => {
        const isChecked = completedSets.includes(setNum);
        return React.createElement('label', {
          key: setNum,
          style: {
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 8px', borderRadius: 'var(--radius-sm)',
            background: isChecked ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
            border: `1px solid ${isChecked ? 'var(--green)' : 'var(--border)'}`,
            marginBottom: '4px', cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          },
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: isChecked,
            onChange: () => {
              if (isChecked) {
                setCompletedSets(prev => prev.filter(s => s !== setNum));
              } else {
                setCompletedSets(prev => [...prev, setNum]);
                if (typeof onSetComplete === 'function') {
                  onSetComplete(ex.n, setNum, parseInt(ex.r, 10) || 0);
                }
              }
            },
            style: { accentColor: 'var(--green)' },
          }),
          React.createElement('span', { style: { fontSize: '0.85rem', color: isChecked ? 'var(--green)' : 'var(--text2)' } },
            `Подход ${setNum}: ${repsLabel} повт.${weightNote ? ` • ${weightNote}` : ''}`
          )
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
      const lvl = Math.max(1, Math.min(5, Math.round(w)));
      return readonlySet ? levelLabel(lvl) : levelLabel(lvl);
    }
    const unitLabel = unit === 'lbs' ? t('units.lbs') : t('units.kg');
    return `${w} ${unitLabel}`;
  }

  return React.createElement('div', { className: 'exercise-row exercise-row--apre' },
    // Заголовок карточки
    React.createElement('div', { className: 'apre-header' },
      React.createElement('span', { className: 'exercise-name' }, ex.n),
      React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        React.createElement('span', { className: 'apre-badge' }, ex.protocol?.replace('_', ' ') ?? 'APRE'),
        React.createElement(HelpIcon, {
          term: 'APRE (Auto-regulatory)',
          definition: t('exercise.apreTooltip')
        })
      )
    ),

    // Recovery-предупреждение
    React.createElement(RecoveryBanner, { recoveryScore, recoveryReduction, unit, t }),

    // Таблица 4 сетов
    React.createElement('div', { className: 'apre-sets' },
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
    set4Reps !== null && React.createElement('div', { className: 'apre-next-week' },
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
          const lvl = Math.max(1, Math.min(5, Math.round(nextRM)));
          return t('exercise.nextWeekProgress', { value: levelLabel(lvl), reason });
        }
        const unitLabel = unit === 'lbs' ? t('units.lbs') : t('units.kg');
        return t('exercise.nextWeekProgress', { value: `${nextRM} ${unitLabel}`, reason });
      })()
    )
  );
}
