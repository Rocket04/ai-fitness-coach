import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import ExerciseCard from '../components/ExerciseCard.jsx';
import Collapsible from '../components/Collapsible.jsx';

function apreToastMessage(diff, unit, name, nextRM, currentRM, t) {
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : '0';
  const unitLabel = unit === 'lbs' ? t('units.lbs') : t('units.kg');
  if (diff > 0) {
    return {
      text: t('apreToast.progress', { delta: diffStr, unit: unitLabel }),
      subtext: t('apreToast.progressSub', { next: nextRM, current: currentRM }),
      bg: 'var(--green)',
    };
  }
  return {
    text: t('apreToast.maintained'),
    subtext: t('apreToast.maintainedSub', { name }),
    bg: 'var(--surface2)',
  };
}

function rpeZone(value) {
  if (value <= 3) return { color: 'var(--green)', labelKey: 'today.rpeZones.light' };
  if (value <= 6) return { color: 'var(--yellow)', labelKey: 'today.rpeZones.moderate' };
  return { color: 'var(--red)', labelKey: 'today.rpeZones.high' };
}

function rpeDescription(key, t) {
  return t(`today.rpeDescriptions.${key}`);
}

export default function WorkoutMode({
  sessionPlan,
  recoveryScore,
  exercises,
  pendingSetResults,
  setProgress,
  rpe,
  sessionNote,
  durationMinutes,
  postSessionFatigue,
  postSessionPain,
  trainingDone,
  existingSession,
  onSetToggle,
  onApreResult,
  onSetComplete,
  onRpeChange,
  onSessionNoteChange,
  onDurationChange,
  onPostSessionFatigueChange,
  onPostSessionPainChange,
  onSaveWorkout,
  onCancelWorkout,
  findExerciseConfig,
  isExerciseConfigured,
  handleConfigureExercise,
  configModalOpen,
  setConfigModalOpen,
  selectedExercise,
  handleSaveExerciseConfig,
  testPullUps,
  testPushUps,
  testPlank,
  onTestPullUpsChange,
  onTestPushUpsChange,
  onTestPlankChange,
  setShowTrainingDetails,
  showTrainingDetails,
}) {
  const { t } = useTranslation();
  const viewMode = Boolean(existingSession);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [apreToast, setApreToast] = useState(null);

  const handleApreResult = useCallback((result) => {
    onApreResult(result);
    const ex = exercises.find(e => e.n === result.exerciseName);
    const currentRM = ex?.currentRM ?? 0;
    const diff = Number((result.nextRM - currentRM).toFixed(1));
    const unitLabel = result.unit === 'lbs' ? t('units.lbs') : t('units.kg');
    const nextRMVal = result.isCalisthenics
      ? (result.nextRM > 0 ? `+${result.nextRM} ` + unitLabel : t('units.kg'))
      : `${result.nextRM} ${unitLabel}`;
    const toast = {
      visible: true,
      text: '',
      subtext: '',
      bg: 'var(--surface2)',
    };
    if (diff > 0) {
      toast.text = `🔥 ${t('apreToast.progress', { delta: `+${diff.toFixed(1)}`, unit: unitLabel })}`;
      toast.subtext = t('apreToast.progressSub', { next: nextRMVal, current: `${currentRM} ${unitLabel}` });
      toast.bg = 'var(--green)';
    } else if (diff === 0) {
      toast.text = t('apreToast.maintained');
      toast.subtext = t('apreToast.maintainedSub', { name: result.exerciseName });
      toast.bg = 'var(--surface2)';
    } else {
      toast.text = t('apreToast.regression');
      toast.subtext = '';
      toast.bg = 'var(--blue)';
    }
    setApreToast(toast);
    const timeout = setTimeout(() => setApreToast(null), diff > 0 ? 4000 : 3000);
    return () => clearTimeout(timeout);
  }, [onApreResult, exercises, t]);

  const rpeKey = Math.round(rpe);
  const zone = rpeZone(rpe);
  const rpeDesc = rpeDescription(rpeKey, t);

  const handleClose = () => {
    if (viewMode) {
      onCancelWorkout();
      return;
    }
    const hasData = pendingSetResults.some(s => s.completed);
    if (hasData && !showConfirmCancel) {
      setShowConfirmCancel(true);
      return;
    }
    onCancelWorkout();
  };

  return React.createElement('div', {
    className: 'workout-mode-overlay',
    'data-testid': 'workout-mode',
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 200,
      backgroundColor: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
  },
    // Header
    React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      },
    },
      React.createElement('div', null,
        React.createElement('h2', {
          style: { margin: 0, fontSize: 'var(--font-size-h3)', fontWeight: 600 },
        }, viewMode ? t('workout.viewResults') : (sessionPlan?.name || sessionPlan?.sessionType || t('today.workout'))),
        !viewMode && sessionPlan?.sport && React.createElement('span', {
          style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)' },
        }, sessionPlan.sport),
      ),
      React.createElement('button', {
        onClick: handleClose,
        'aria-label': t('today.closeWorkout'),
        'data-testid': 'workout-close-btn',
        style: {
          background: 'var(--surface2)',
          border: 'none',
          color: 'var(--text1)',
          cursor: 'pointer',
          padding: 'var(--spacing-sm)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s ease',
        },
        onMouseEnter: e => e.currentTarget.style.background = 'var(--surface3)',
        onMouseLeave: e => e.currentTarget.style.background = 'var(--surface2)',
      }, React.createElement(X, { size: 24 })),
    ),

    // Confirm cancel dialog
    showConfirmCancel && React.createElement('div', {
      style: {
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        flexShrink: 0,
      },
    },
      React.createElement('p', {
        style: { margin: 0, fontSize: 'var(--font-size-body)', color: 'var(--text)' },
      }, t('today.confirmCancelWorkout') || 'Отменить тренировку? Все несохранённые данные будут потеряны.'),
      React.createElement('div', {
        style: { display: 'flex', gap: 'var(--spacing-sm)' },
      },
        React.createElement('button', {
          className: 'btn btn-outline',
          style: { flex: 1 },
          onClick: () => {
            setShowConfirmCancel(false);
            onCancelWorkout();
          },
        }, t('today.yesCancel') || 'Да, отменить'),
        React.createElement('button', {
          className: 'btn btn-accent',
          style: { flex: 1 },
          onClick: () => setShowConfirmCancel(false),
        }, t('today.continueWorkout') || 'Продолжить тренировку'),
      ),
    ),

    // Scrollable content area
    React.createElement('div', {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--spacing-md)',
        paddingBottom: '120px',
      },
    },
      // Progress bar
      setProgress.total > 0 && React.createElement('div', {
        className: 'set-progress-bar',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          fontSize: 'var(--font-size-caption)',
          color: 'var(--text2)',
          backgroundColor: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--spacing-md)',
        },
      },
        React.createElement('span', { style: { flex: 1 } },
          t('today.setProgress', { completed: setProgress.completed, total: setProgress.total })
        ),
        React.createElement('span', {
          style: {
            display: 'inline-block', width: '80px', height: '6px',
            borderRadius: '3px', background: 'var(--surface3)', overflow: 'hidden',
          },
        },
          React.createElement('span', {
            style: {
              display: 'block', height: '100%',
              width: `${setProgress.total > 0 ? (setProgress.completed / setProgress.total) * 100 : 0}%`,
              borderRadius: '3px',
              background: setProgress.completed >= setProgress.total ? 'var(--green)' : 'var(--yellow)',
              transition: 'width 0.15s ease',
            },
          })
        ),
      ),

      // Exercise list
      viewMode
        ? React.createElement('div', { className: 'exercise-list' },
            existingSession.exerciseResults && existingSession.exerciseResults.map((exResult, idx) => {
              const completedSets = exResult.sets.filter(s => s.completed);
              return React.createElement('div', {
                key: idx,
                style: {
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-sm)',
                  backgroundColor: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)',
                },
              },
                React.createElement('div', { style: { fontWeight: 600, marginBottom: 'var(--spacing-sm)' } }, exResult.exerciseName),
                React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 'var(--spacing-xs)' } },
                  t('workout.completedSets') + `: ${exResult.completedSets}/${exResult.plannedSets}`
                ),
                completedSets.length === 0 && React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--text3)' } }, '—'),
                ...completedSets.map(set =>
                  React.createElement('div', {
                    key: set.setNumber,
                    style: {
                      display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                      padding: '4px 0', fontSize: '0.9rem',
                    },
                  },
                    React.createElement('span', { style: { color: 'var(--green)', fontWeight: 700 } }, '✓'),
                    React.createElement('span', null, `${t('exercise.set', { number: set.setNumber })}: ${set.repsDone || 0} ${t('exercise.reps')}`),
                    set.rpe ? React.createElement('span', { style: { color: 'var(--text2)' } }, `RPE ${set.rpe}`) : null,
                  )
                ),
              );
            })
          )
        : React.createElement('div', { className: 'exercise-list' },
        exercises.map((ex, idx) => {
          const userConfig = findExerciseConfig ? findExerciseConfig(ex) : null;
          const mappedEx = { ...ex };

          if (userConfig) {
            mappedEx.protocol = userConfig.protocol;
            mappedEx.currentRM = userConfig.currentRM;
            mappedEx.currentLevel = userConfig.currentLevel;
            mappedEx.isCalisthenics = userConfig.isCalisthenics;
            mappedEx.unit = userConfig.unit;
            mappedEx.id = userConfig.id;
            mappedEx.usesWeight = userConfig.usesWeight;
          }

          const isConfigured = userConfig ? (isExerciseConfigured ? isExerciseConfigured(userConfig) : true) : true;

          return React.createElement(ExerciseCard, {
            key: `${mappedEx.n}-${idx}`,
            ex: mappedEx,
            recoveryScore: recoveryScore || 0,
            onApreResult: handleApreResult,
            isConfigured,
            onConfigure: () => handleConfigureExercise ? handleConfigureExercise(idx) : null,
            onSetComplete: (exName, setNum, completed, repsDone, rpe) => {
              onSetComplete({ exerciseName: exName, setNumber: setNum, completed, repsDone: repsDone || 0, rpe });
            },
          });
        })
      ),

      // Test inputs if test day
      sessionPlan?.isTestDay && React.createElement('div', {
        className: 'grid-3',
        style: { padding: 'var(--spacing-md) 0', display: 'flex', gap: 'var(--spacing-sm)' },
      },
        React.createElement('label', { className: 'flex flex-column gap-xs font-body', style: { flex: 1 } },
          t('training.pullUps'),
          React.createElement('input', { type: 'number', value: testPullUps, onChange: e => onTestPullUpsChange(Number(e.target.value)), min: 0, style: { padding: '0.5rem', width: '100%' } })
        ),
        React.createElement('label', { className: 'flex flex-column gap-xs font-body', style: { flex: 1 } },
          t('training.pushUps'),
          React.createElement('input', { type: 'number', value: testPushUps, onChange: e => onTestPushUpsChange(Number(e.target.value)), min: 0, style: { padding: '0.5rem', width: '100%' } })
        ),
        React.createElement('label', { className: 'flex flex-column gap-xs font-body', style: { flex: 1 } },
          t('training.plank'),
          React.createElement('input', { type: 'number', value: testPlank, onChange: e => onTestPlankChange(Number(e.target.value)), min: 0, style: { padding: '0.5rem', width: '100%' } })
        ),
      ),

      // Post-session fatigue / pain feedback
      viewMode
        ? React.createElement('div', { style: { padding: 'var(--spacing-md) 0' } },
            React.createElement('h4', { style: { margin: '0 0 var(--spacing-sm)', fontSize: 'var(--font-size-body)', fontWeight: 600 } },
              t('today.postSessionFeedback')
            ),
            React.createElement('div', { style: { fontSize: '0.9rem', color: 'var(--text)' } },
              React.createElement('p', { style: { margin: '4px 0' } },
                `${t('today.fatigue')}: ${existingSession.postSessionFatigue || '—'}/10`
              ),
              React.createElement('p', { style: { margin: '4px 0' } },
                `${t('today.pain')}: ${existingSession.postSessionPain !== undefined ? existingSession.postSessionPain : '—'}/10`
              ),
            )
          )
        : React.createElement(Collapsible, {
        title: t('today.postSessionFeedback') || 'Самочувствие после тренировки',
        defaultOpen: false,
      },
        React.createElement('div', { style: { padding: 'var(--spacing-sm) 0' } },
          React.createElement('label', { style: { display: 'block', marginBottom: 'var(--spacing-sm)' } },
            React.createElement('span', { style: { fontSize: '0.85rem', color: 'var(--text2)', display: 'block', marginBottom: '4px' } },
              t('today.fatigue') || 'Усталость (1-10)'
            ),
            React.createElement('input', {
              type: 'range', min: 1, max: 10,
              value: postSessionFatigue || 1,
              onChange: e => onPostSessionFatigueChange(Number(e.target.value)),
              style: { width: '100%' },
            }),
            React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } },
              postSessionFatigue ? `${postSessionFatigue}/10` : '—'
            ),
          ),
          React.createElement('label', { style: { display: 'block' } },
            React.createElement('span', { style: { fontSize: '0.85rem', color: 'var(--text2)', display: 'block', marginBottom: '4px' } },
              t('today.pain') || 'Боль (0-10)'
            ),
            React.createElement('input', {
              type: 'range', min: 0, max: 10,
              value: postSessionPain || 0,
              onChange: e => onPostSessionPainChange(Number(e.target.value)),
              style: { width: '100%' },
            }),
            React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } },
              postSessionPain !== undefined ? `${postSessionPain}/10` : '—'
            ),
          ),
        ),
      ),

      // RPE Form
      viewMode
        ? React.createElement('div', { style: { padding: 'var(--spacing-md) 0' } },
            React.createElement('div', { className: 'flex justify-between items-center mb-sm' },
              React.createElement('span', { className: 'font-body font-weight-600' }, t('today.howWasWorkout')),
              React.createElement('strong', { className: 'font-mono', style: { fontSize: '1.5rem', color: zone.color } }, existingSession.rpe || '—')
            ),
            React.createElement('div', { className: 'font-body text-secondary mb-sm' },
              existingSession.durationMinutes ? t('workout.durationRecorded', { duration: existingSession.durationMinutes }) : ''
            ),
            existingSession.notes && React.createElement('div', { style: { fontSize: '0.9rem', color: 'var(--text)', marginTop: 'var(--spacing-xs)' } },
              React.createElement('span', { style: { fontWeight: 600 } }, t('today.notes') + ': '),
              existingSession.notes
            ),
          )
        : React.createElement('div', { style: { padding: 'var(--spacing-md) 0' } },
        React.createElement('div', { className: 'flex justify-between items-center mb-sm' },
          React.createElement('span', { className: 'font-body font-weight-600' }, t('today.howWasWorkout')),
          React.createElement('strong', { className: 'font-mono', style: { fontSize: '1.5rem', color: zone.color } }, rpe || '?')
        ),
        React.createElement('div', { className: 'font-body text-secondary mb-sm' }, rpeDesc),
        React.createElement('input', {
          type: 'range', min: 0, max: 10, step: 0.5, value: rpe,
          onChange: e => onRpeChange(Number(e.target.value)),
          className: 'w-full',
          style: { marginBottom: 'var(--spacing-sm)' },
        }),
        React.createElement('div', { className: 'flex gap-sm mb-sm' },
          React.createElement('label', { className: 'flex-1 font-body' },
            t('today.duration'),
            React.createElement('input', {
              type: 'number', min: 0, max: 300, value: durationMinutes,
              onChange: e => onDurationChange(Number(e.target.value)),
              className: 'w-full', style: { padding: '0.5rem', marginTop: '0.25rem' },
            })
          ),
          React.createElement('div', { style: { flex: 2 } },
            React.createElement('label', { className: 'font-body' }, t('today.notes')),
            React.createElement('textarea', {
              value: sessionNote, onChange: e => onSessionNoteChange(e.target.value),
              placeholder: t('today.notesPlaceholder'),
              rows: 2, className: 'w-full', style: { marginTop: '0.25rem' },
            }),
          ),
        ),
      ),
    ),

    // APRE Toast
    apreToast && apreToast.visible && React.createElement('div', {
      'data-testid': 'apre-toast',
      style: {
        position: 'fixed',
        bottom: '80px',
        left: '16px',
        right: '16px',
        zIndex: 300,
        backgroundColor: apreToast.bg,
        color: apreToast.bg === 'var(--green)' ? '#fff' : 'var(--text1)',
        borderRadius: '12px',
        padding: '12px 16px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'apreToastSlideUp 0.3s ease-out',
      },
    },
      React.createElement('div', { style: { fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px' } }, apreToast.text),
      apreToast.subtext && React.createElement('div', { style: { fontSize: '0.8rem', opacity: 0.85 } }, apreToast.subtext),
    ),

    // Bottom buttons (fixed)
    React.createElement('div', {
      style: {
        position: 'sticky',
        bottom: 0,
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        gap: 'var(--spacing-sm)',
      },
    },
      viewMode
        ? React.createElement('button', {
            className: 'btn btn-outline',
            'data-testid': 'workout-view-close-btn',
            onClick: onCancelWorkout,
            style: { minHeight: '48px', flex: 1 },
          }, t('workout.close'))
        : React.createElement(React.Fragment, null,
            React.createElement('button', {
              className: 'btn btn-outline',
              'data-testid': 'workout-cancel-btn',
              onClick: handleClose,
              style: { minHeight: '48px', flex: 1 },
            }, t('app.cancel')),
            React.createElement('button', {
              className: `${trainingDone ? 'btn btn-red' : 'btn btn-accent'}`,
              'data-testid': trainingDone ? 'workout-cancel-save-btn' : 'workout-save-btn',
              onClick: onSaveWorkout,
              style: { minHeight: '48px', flex: 2 },
            }, trainingDone ? t('today.cancelWorkout') : t('today.saveWorkout'))
          )
    ),
  );
}
