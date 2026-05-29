// js/ui/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, User, BarChart, Circle, Sun, Moon, Star, AlertTriangle, Dumbbell, Play, Trophy, Flame } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { useTourStore } from '../../stores/useTourStore.js';
import { changeLanguage, getCurrentLanguage } from '../../i18n/index.js';
import { ZONES, HRV_GUIDE, NUTRITION, MORNING_ROUTINE, EVENING_ROUTINE, DAYS, DAYS_TO_DOW, TRAINING_PLANS } from '../../config/constants.js';
import { useFitnessData, isExerciseConfigured, DEFAULT_EXERCISES } from '../../hooks/useFitnessData.js';
import Modal from '../components/Modal.jsx';
import { parseLocalDate, formatISO, mondayOfWeek } from '../../core/helpers.js';
import { exerciseLibrary } from '../../core/exerciseDatabase.js';
import { getProtocolsForIssues } from '../../core/rehabProtocol.js';
import ExerciseConfigModal from '../components/ExerciseConfigModal.jsx';
import { getUnlockedAchievements } from '../../core/achievements.js';
import { saveCheckin, getAllCheckins, saveSetting } from '../../core/storage.js';
import { parseHealthSyncCSV, mergeImportedBiometrics } from '../../core/import/csvParser.js';

function findHrvRange(hrv, guide) {
  if (!hrv || hrv <= 0) return null;
  for (const item of guide) {
    const r = item.range;
    if (r.startsWith('<')) {
      const max = parseInt(r.match(/\d+/)?.[0] || '0', 10);
      if (hrv < max) return item;
    } else if (r.startsWith('>')) {
      const min = parseInt(r.match(/\d+/)?.[0] || '999', 10);
      if (hrv > min) return item;
    } else {
      const nums = r.match(/\d+/g);
      if (nums && nums.length >= 2) {
        const lo = parseInt(nums[0], 10);
        const hi = parseInt(nums[1], 10);
        if (hrv >= lo && hrv <= hi) return item;
      }
    }
  }
  return guide[2] || null;
}

function ProfileSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return React.createElement(
    'div',
    { className: 'profile-section' },
    React.createElement('button', {
      className: 'profile-section__header',
      onClick: () => setOpen(o => !o),
    },
      React.createElement('span', null, title),
      React.createElement('span', { className: 'profile-section__chevron' },
        open ? '\u25B2' : '\u25BC'
      )
    ),
    open && React.createElement('div', { className: 'profile-section__body' }, children)
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const {
    showSettings, showResetConfirm, editStartDate, editTrainDays,
    lastCheckin, recoveryScore, readiness,
    setShowSettings, setShowResetConfirm, setEditStartDate, setEditTrainDays,
    toggleDay, handleSaveSettings, setActiveTab,
    handleExportData, handleImportData, handleResetAll, confirmResetData,
    showToast,
    checkinTier, setCheckinTier,
    virtualTodayOffset,
    demoMode,
    sessions,
    checkins,
    trainDays,
    startDate,
    streak,
    rehabIssues,
    rehabExercises,
    selectedSports,
  } = useAppStore();

  // Exercise configuration
  const { exercises, updateExerciseById, resetAllConfigs, loaded } = useFitnessData();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [showRehab, setShowRehab] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showExerciseConfigurator, setShowExerciseConfigurator] = useState(false);
  const [showExerciseResetConfirm, setShowExerciseResetConfirm] = useState(false);
  const [integrationModal, setIntegrationModal] = useState(null);
  const [integrationEmail, setIntegrationEmail] = useState('');

  const handleOpenConfig = (ex) => {
    setSelectedExercise(ex);
    setConfigModalOpen(true);
  };

  const handleSaveConfig = ({ id, protocol, currentRM, currentLevel }) => {
    updateExerciseById(id, { protocol, currentRM, currentLevel });
  };

  const hrv = lastCheckin?.hrv ? Number(lastCheckin.hrv) : 0;
  const restHr = lastCheckin?.restHR ? Number(lastCheckin.restHR) : 0;
  const activeHrvRange = findHrvRange(hrv, HRV_GUIDE);

  // ── Achievements state ──
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getUnlockedAchievements().then(list => {
      if (!cancelled) {
        setUnlockedAchievements(list);
        setAchievementsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setAchievementsLoading(false);
    });
    return () => { cancelled = true; };
  }, [sessions, checkins, trainDays, startDate]);

  return React.createElement(
    'div',
    { className: 'profile-page' },
    React.createElement('h2', { className: 'profile-page__title' }, React.createElement(User, { size: 24 }), ' ', t('profile.title')),

    // ── Personal stats card ──
    lastCheckin && React.createElement(
      'div',
      { className: 'card card--stats' },
      React.createElement('h3', { className: 'card__title' }, React.createElement(BarChart, { size: 20 }), ' ', t('profile.stats.title')),
      React.createElement(
        'div',
        { className: 'stat-grid' },
        hrv > 0 && React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, `${hrv} ms`),
          React.createElement('div', { className: 'stat-label' }, t('profile.stats.hrv')),
          activeHrvRange && React.createElement('span', {
            className: 'pill',
            style: { backgroundColor: activeHrvRange.color, color: '#000', fontSize: 'var(--font-size-caption)', marginTop: 'var(--spacing-xs)' }
          }, activeHrvRange.label)
        ),
        restHr > 0 && React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, `${restHr}`),
          React.createElement('div', { className: 'stat-label' }, t('profile.stats.restHR'))
        ),
        typeof recoveryScore === 'number' && recoveryScore > 0 && React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, `${recoveryScore}%`),
          React.createElement('div', { className: 'stat-label' }, t('profile.stats.recovery'))
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, readiness === 'green' ? React.createElement(Circle, { size: 20, fill: 'currentColor' }) : readiness === 'yellow' ? React.createElement(Circle, { size: 20, fill: 'currentColor' }) : React.createElement(Circle, { size: 20, fill: 'currentColor' })),
          React.createElement('div', { className: 'stat-label' }, t('profile.stats.readiness'))
        )
      )
    ),

    // ── Rehab section ──
    React.createElement(ProfileSection, { title: '🩹 ' + t('profile.rehab.title') },
      React.createElement('p', null, t('profile.rehab.description')),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, t('profile.rehab.subtitle')),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowRehab(true),
      }, t('profile.rehab.open'))
    ),

    // ── Info section ──
    React.createElement(ProfileSection, { title: t('profile.info.title') },
      React.createElement('p', null, t('profile.info.description')),
      activeHrvRange && React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, `${t('profile.stats.hrv')}: ${activeHrvRange.label} — ${activeHrvRange.action}`),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowInfo(true),
      }, t('profile.info.open'))
    ),

    // ── Methodology section ──
    React.createElement(ProfileSection, { title: '📚 ' + t('profile.methodology.title') },
      React.createElement('p', null, t('profile.methodology.description')),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, t('profile.methodology.subtitle')),
      React.createElement('button', {
        className: 'btn',
        onClick: () => { window.location.hash = ''; setActiveTab(4); },
      }, t('profile.methodology.open'))
    ),

    // ── Nutrition section ──
    React.createElement(ProfileSection, { title: t('profile.nutrition.title') },
      React.createElement('p', null, t('profile.nutrition.description')),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, t('profile.nutrition.subtitle')),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowNutrition(true),
      }, t('profile.nutrition.open'))
    ),

    // ── Settings section ──
    React.createElement(ProfileSection, { title: t('profile.settings.title') },
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: () => setShowSettings(true),
      }, t('profile.settings.open'))
    ),

    // ── Training Plans section ──
    React.createElement(ProfileSection, { title: '📋 Готовые планы' },
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginBottom: 'var(--spacing-sm)' } },
        'Выберите готовый план или настройте вручную'
      ),
      React.createElement('div', { className: 'training-plan-cards', style: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' } },
        TRAINING_PLANS.map(plan => {
          const isActive = selectedSports.join(',') === plan.sports.join(',');
          return React.createElement('button', {
            key: plan.key,
            className: `training-plan-card ${isActive ? 'training-plan-card--active' : ''}`,
            style: {
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              border: isActive ? '2px solid var(--accent-green)' : '1px solid var(--border)',
              backgroundColor: isActive ? 'var(--surface-2)' : 'var(--surface)',
              cursor: 'pointer',
              textAlign: 'left',
            },
onClick: async () => {
               const s = useAppStore.getState();
               await s.setSelectedSports(plan.sports);
               if (plan.rehabIssues) {
                 await s.setRehabIssues(plan.rehabIssues);
               }
               if (plan.goals) {
                 await s.setProfileGoals(plan.goals);
               }
               if (plan.level) {
                 await s.setProfileLevel(plan.level);
               }
if (plan.template) {
                  const trainDays = plan.template.days
                    .map((d, i) => d ? DAYS_TO_DOW[i] : null)
                    .filter(d => d !== null);
                  await s.setEditTrainDays(trainDays);
                  await s.handleSaveSettings();
                }
               const { initApp } = useAppStore.getState();
               await initApp();
               s.showToast(`План "${plan.name}" активирован`);
             },
          },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('span', { style: { fontWeight: 600, fontSize: 'var(--font-size-sm)' } }, plan.name),
              isActive && React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--green)' } }, '✓')
            ),
            React.createElement('div', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, plan.label)
          );
        })
      ),
      React.createElement('button', {
        className: 'btn btn-outline',
        style: { marginTop: 'var(--spacing-sm)' },
        onClick: () => setShowSettings(true),
      }, 'Настроить вручную')
    ),

    // ── Language section ──
    React.createElement(ProfileSection, { title: t('profile.language.title') },
      React.createElement('div', { className: 'flex gap-sm flex-wrap' },
        React.createElement('button', {
          className: `btn ${getCurrentLanguage() === 'ru' ? 'btn-accent' : ''}`,
          onClick: async () => {
            await changeLanguage('ru');
          },
        }, t('profile.language.ru')),
        React.createElement('button', {
          className: `btn ${getCurrentLanguage() === 'en' ? 'btn-accent' : ''}`,
          onClick: async () => {
            await changeLanguage('en');
          },
        }, t('profile.language.en'))
      )
    ),

    // ── Check-in Tier section ──
    React.createElement(ProfileSection, { title: '🎯 Уровень чек-ина' },
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginBottom: 'var(--spacing-sm)' } },
        'Определяет, какие данные собираются для Recovery Score'
      ),
      React.createElement('div', { className: 'flex gap-sm flex-wrap', 'data-testid': 'profile-tier-selector' },
        React.createElement('button', {
          className: `btn ${checkinTier === 'light' ? 'btn-accent' : ''}`,
          onClick: () => setCheckinTier('light'),
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 14px' },
        },
          React.createElement('span', { style: { fontWeight: 600 } }, 'Лёгкий'),
          React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, 'Субъективные')
        ),
        React.createElement('button', {
          className: `btn ${checkinTier === 'medium' ? 'btn-accent' : ''}`,
          onClick: () => setCheckinTier('medium'),
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 14px' },
        },
          React.createElement('span', { style: { fontWeight: 600 } }, 'Средний'),
          React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, 'ЧСС + сон')
        ),
        React.createElement('button', {
          className: `btn ${checkinTier === 'full' ? 'btn-accent' : ''}`,
          onClick: () => setCheckinTier('full'),
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 14px' },
        },
          React.createElement('span', { style: { fontWeight: 600 } }, 'Полный'),
          React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, 'HRV + ЧСС + сон')
        )
      )
    ),

    // ── Developer Testing ──
    React.createElement(ProfileSection, { title: '🛠 Тестирование', defaultOpen: false },
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginBottom: 'var(--spacing-sm)' } },
        'Виртуальная дата и демо-режим для тестирования'
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' } },
        React.createElement('button', { className: 'btn', style: { minWidth: '40px' },
          onClick: () => { useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) - 7); },
        }, '−7'),
        React.createElement('button', { className: 'btn', style: { minWidth: '40px' },
          onClick: () => { useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) - 1); },
        }, '−1'),
        React.createElement('button', { className: 'btn', style: { minWidth: '60px' },
          onClick: () => { useAppStore.getState().setVirtualTodayOffset(0); },
        }, 'Сегодня'),
        React.createElement('button', { className: 'btn', style: { minWidth: '40px' },
          onClick: () => { useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) + 1); },
        }, '+1'),
        React.createElement('button', { className: 'btn', style: { minWidth: '40px' },
          onClick: () => { useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) + 7); },
        }, '+7'),
      ),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginBottom: 'var(--spacing-sm)' } },
        'Сдвиг: ' + (virtualTodayOffset || 0) + ' дн.'
      ),
      React.createElement('div', { style: { display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' } },
        React.createElement('button', {
          className: 'btn' + (demoMode ? ' btn-red' : ' btn-accent'),
          onClick: async () => {
            const s = useAppStore.getState();
            if (s.demoMode) {
              await s.deactivateDemoMode();
            } else {
              await s.activateDemoMode();
            }
          },
        }, demoMode ? '✕ Выйти из демо' : '▶ Демо-режим'),
        demoMode && React.createElement('button', {
          className: 'btn btn-blue',
          onClick: () => {
            let currentOffset = useAppStore.getState().virtualTodayOffset || -15;
            const interval = setInterval(() => {
              currentOffset += 1;
              useAppStore.getState().setVirtualTodayOffset(currentOffset);
              if (currentOffset >= 15) {
                clearInterval(interval);
              }
            }, 500);
          },
        }, 'Симуляция')
      ),

      // ── Demo Profiles ──
      !demoMode && React.createElement('div', { style: { marginTop: 'var(--spacing-sm)' } },
        React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginBottom: 'var(--spacing-xs)' } },
          'Профиль демо-данных:'
        ),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' } },
          ['marathoner', 'yogi', 'crossfitter', 'rehab'].map(profile => {
            const icons = { marathoner: '🏃', yogi: '🧘', crossfitter: '🏋️', rehab: '🩹' };
            const names = { marathoner: 'Марафонец', yogi: 'Йог', crossfitter: 'КФ', rehab: 'Рехаб' };
            return React.createElement('button', {
              key: profile,
              className: 'btn btn-sm',
              style: { fontSize: 'var(--font-size-caption)' },
              onClick: async () => {
                const s = useAppStore.getState();
                await s.activateDemoModeWithProfile(profile);
              },
            }, `${icons[profile]} ${names[profile]}`);
          })
        )
      )
    ),

    // ── Achievements ──
    React.createElement(ProfileSection, { title: '🏆 Достижения', defaultOpen: false, testId: 'achievement-list' },
      React.createElement('div', { style: { marginBottom: 'var(--spacing-sm)' } },
        React.createElement('span', { style: { fontSize: 'var(--font-size-sm)', color: 'var(--text2)' } },
          achievementsLoading ? 'Загрузка...' : `${unlockedAchievements.length} разблокировано`
        )
      ),
      !achievementsLoading && unlockedAchievements.length > 0 && React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' } },
        unlockedAchievements.map(a =>
          React.createElement('span', {
            key: a.achievementKey,
            style: {
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '9999px',
              background: 'var(--surface2)', fontSize: 'var(--font-size-sm)',
            },
            title: a.achievementKey,
          }, '🏅 ', a.achievementKey)
        )
      ),
      !achievementsLoading && unlockedAchievements.length === 0 && React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } },
        'Выполняйте чек-ины и тренировки для получения достижений'
      ),
      React.createElement('div', { style: { marginTop: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' } },
        React.createElement(Flame, { size: 16, color: 'var(--warning)' }),
        React.createElement('span', { style: { fontSize: 'var(--font-size-sm)', color: 'var(--text2)' } },
          `Текущая серия: ${streak || 0} дн.`
        )
      )
    ),

    // ── Integrations ──
    React.createElement(ProfileSection, { title: '🔗 Интеграции', defaultOpen: false },
      React.createElement('div', { className: 'integration-cards' },
        React.createElement('div', { className: 'integration-card' },
          React.createElement('span', { className: 'integration-icon' }, '⌚'),
          React.createElement('span', { className: 'integration-name' }, 'Garmin'),
          React.createElement('button', { className: 'btn btn-sm', onClick: () => setIntegrationModal('Garmin') } , 'Подключить →')
        ),
        React.createElement('div', { className: 'integration-card' },
          React.createElement('span', { className: 'integration-icon' }, '🍎'),
          React.createElement('span', { className: 'integration-name' }, 'Apple Health'),
          React.createElement('button', { className: 'btn btn-sm', onClick: () => setIntegrationModal('Apple Health') }, 'Подключить →')
        ),
        React.createElement('div', { className: 'integration-card' },
          React.createElement('span', { className: 'integration-icon' }, '🔵'),
          React.createElement('span', { className: 'integration-name' }, 'Google Fit'),
          React.createElement('button', { className: 'btn btn-sm', onClick: () => setIntegrationModal('Google Fit') }, 'Подключить →')
        ),
        React.createElement('div', { className: 'integration-card' },
          React.createElement('span', { className: 'integration-icon' }, '🔴'),
          React.createElement('span', { className: 'integration-name' }, 'Huawei Health'),
          React.createElement('button', { className: 'btn btn-sm', onClick: () => setIntegrationModal('Huawei Health') }, 'Подключить →')
        ),
      )
    ),

    // ── Tour section ──
    React.createElement(ProfileSection, { title: t('profile.tour.title') },
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginBottom: 'var(--spacing-sm)' } },
        t('profile.tour.description')
      ),
      React.createElement('button', {
        className: 'tour-start-btn',
        onClick: () => {
          setActiveTab(0);
          useTourStore.getState().startTour();
        },
      },
        React.createElement('span', { className: 'tour-start-btn__icon' }, React.createElement(Target, { size: 20 })),
        t('profile.tour.start')
      )
    ),

    // ── Exercise Configurator section ──
    React.createElement(ProfileSection, { title: t('profile.exercises.title') },
      React.createElement('p', null, t('profile.exercises.description')),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } },
        t('profile.exercises.configured', { count: exercises.filter(e => isExerciseConfigured(e)).length, total: exercises.length })
      ),
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: () => setShowExerciseConfigurator(true),
      }, t('profile.exercises.open'))
    ),

    // ── Data section ──
    React.createElement(ProfileSection, { title: t('profile.data.title') },
      React.createElement('div', { className: 'flex gap-sm flex-wrap' },
        React.createElement('button', {
          className: 'btn',
          onClick: async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const records = parseHealthSyncCSV(text);
                if (records.length === 0) {
                  alert('CSV файл пуст или имеет неверный формат');
                  return;
                }
                const allCheckins = await getAllCheckins();
                const result = mergeImportedBiometrics(records, allCheckins);
                for (const c of result.checkins) {
                  const orig = allCheckins.find(oc => oc.date === c.date);
                  if (!orig) continue;
                  const wasModified = c.sleepHours !== orig.sleepHours || c.restHR !== orig.restHR || c.hrv !== orig.hrv;
                  if (wasModified) await saveCheckin(c);
                }
                showToast(t('profile.data.importCSVSuccess', { merged: result.merged, skipped: result.skipped }), 'success');
                await useAppStore.getState().initApp();
              } catch (err) {
                console.error('CSV import failed:', err);
                alert(t('profile.importError', { error: err instanceof Error ? err.message : 'Неверный формат' }));
              }
            };
            input.click();
          },
        }, t('profile.data.importCSV')),
        React.createElement('button', {
          className: 'btn',
          onClick: handleExportData,
        }, t('profile.data.export')),
        React.createElement('button', {
          className: 'btn',
          onClick: async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await handleImportData(file);
              } catch (err) {
                console.error('Import failed:', err);
                alert(t('profile.importError', { error: err instanceof Error ? err.message : 'Invalid file format' }));
              }
            };
            input.click();
          },
        }, t('profile.data.import')),
        React.createElement('button', {
          className: 'btn btn-red',
          onClick: handleResetAll,
        }, t('profile.data.reset'))
      )
    ),

    // ── Settings modal ──
    showSettings && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowSettings(false),
      title: t('profile.settings.title'),
    },
      React.createElement('div', { className: 'flex flex-column gap-md' },
        React.createElement('label', { className: 'flex flex-column gap-xs font-body font-weight-500' },
          React.createElement('span', null, t('profile.settings.startDate')),
          React.createElement('input', {
            type: 'date',
            value: editStartDate,
            onChange: e => setEditStartDate(e.target.value),
          })
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'block mb-sm font-body font-weight-500' }, t('profile.settings.trainingDays')),
          React.createElement('div', { className: 'flex gap-xs flex-wrap' },
            DAYS.map((day, i) =>
              React.createElement('button', {
                key: i,
                className: `chip ${editTrainDays.includes(DAYS_TO_DOW[i]) ? 'active' : ''}`,
                onClick: () => toggleDay(DAYS_TO_DOW[i]),
              }, day)
            )
          )
        ),
        React.createElement('div', { className: 'flex gap-sm justify-end mt-sm' },
          React.createElement('button', {
            className: 'btn',
            onClick: () => setShowSettings(false),
          }, t('profile.settings.cancel')),
          React.createElement('button', {
            className: 'btn btn-accent',
            onClick: handleSaveSettings,
          }, t('profile.settings.save'))
        )
      )
    ),

    // ── Rehab modal ──
    showRehab && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowRehab(false),
      title: '🩹 ' + t('profile.rehab.title'),
    },
      React.createElement('div', { className: 'flex flex-column gap-md' },
        React.createElement('p', null, t('profile.rehab.description')),
        React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)' } }, t('profile.rehab.subtitle')),

        // Rehab issues multi-select
        React.createElement('div', null,
          React.createElement('h4', { className: 'rehab-section-title' }, t('profile.rehab.issuesTitle')),
          React.createElement('div', { className: 'grid-2 gap-sm' },
            ['hips', 'shoulder', 'back', 'knees', 'neck', 'elbow', 'wrist'].map(issue =>
              React.createElement('label', { key: issue, className: 'rehab-checkbox' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: (rehabIssues || []).includes(issue),
                  onChange: (e) => {
                    const current = rehabIssues || [];
                    const updated = e.target.checked
                      ? [...current, issue]
                      : current.filter(i => i !== issue);
                    setRehabIssues(updated);
                    saveSetting('rehabIssues', updated);
                  }
                }),
                React.createElement('span', null, t('profile.rehab.' + issue))
              )
            )
          )
        ),

        // Rehab exercises list from protocol
        React.createElement('div', null,
          React.createElement('h4', { className: 'rehab-section-title' }, 'Ежедневные реабилитационные упражнения'),
          rehabIssues && rehabIssues.length > 0
            ? React.createElement('div', { className: 'rehab-exercise-list', style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                (() => {
                  const protocols = getProtocolsForIssues(rehabIssues || []);
                  const seen = new Set();
                  const rows = [];
                  for (const p of protocols) {
                    for (const pe of p.exercises) {
                      if (pe.frequency === 'pre-workout') continue;
                      if (seen.has(pe.exerciseId)) continue;
                      seen.add(pe.exerciseId);
                      rows.push(
                        React.createElement('div', {
                          key: pe.exerciseId,
                          style: {
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-2)', fontSize: '0.8rem'
                          }
                        },
                          React.createElement('span', { style: { flex: 1 } },
                            (exerciseLibrary[pe.exerciseId]?.name || pe.exerciseId) + (pe.perSide ? ' (на каждую сторону)' : '')
                          ),
                          React.createElement('span', { style: { color: 'var(--text2)', fontSize: '0.75rem' } },
                            `${pe.sets}×${pe.reps}`
                          ),
                          React.createElement('span', { style: { color: 'var(--text3)', fontSize: '0.7rem', marginLeft: '8px' } },
                            pe.frequency
                          )
                        )
                      );
                    }
                  }
                  return rows.length > 0 ? rows : React.createElement('p', { style: { fontSize: '0.8rem', color: 'var(--text3)' } }, 'Выберите проблемные зоны выше');
                })()
              )
            : React.createElement('p', { style: { fontSize: '0.8rem', color: 'var(--text3)' } }, 'Выберите проблемные зоны выше')
        ),

        // Current adaptation status
        rehabIssues && rehabIssues.length > 0 && React.createElement('div', {
          className: 'rehab-status'
        },
          React.createElement('p', { style: { margin: 0, fontSize: 'var(--font-size-caption)' } },
            '✅ ' + t('profile.rehab.active') + ': ' + rehabIssues.map(i => t('profile.rehab.' + i)).join(', ')
          )
        ),

        // Close button
        React.createElement('div', { className: 'flex justify-end' },
          React.createElement('button', {
            className: 'btn',
            onClick: () => setShowRehab(false),
          }, t('profile.close'))
        )
      )
    ),

    // ── Info modal ──
    showInfo && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowInfo(false),
      title: t('profile.info.title'),
    },
      React.createElement('div', null,
        React.createElement('h4', null, 'Пульсовые зоны'),
        ZONES.map((zone, i) =>
          React.createElement('div', {
            key: i,
            className: 'mb-sm',
            style: { borderLeft: `3px solid ${zone.color}`, paddingLeft: '0.75rem' }
          },
            React.createElement('strong', null, `${zone.zone} — ${zone.name}`),
            React.createElement('div', { className: 'font-caption text-secondary' }, zone.bpm),
            React.createElement('div', { className: 'font-body' }, zone.desc)
          )
        ),
        React.createElement('h4', null, 'HRV-гайд'),
        HRV_GUIDE.map((item, i) =>
          React.createElement('div', {
            key: i,
            className: 'mb-sm',
            style: {
              borderLeft: `3px solid ${item.color}`,
              paddingLeft: '0.75rem',
              backgroundColor: activeHrvRange === item ? 'var(--surface2)' : undefined,
            }
          },
            React.createElement('strong', null, item.range),
            ` \u2014 ${item.label}`,
            React.createElement('div', { className: 'font-body' }, item.action),
            activeHrvRange === item && React.createElement('div', { className: 'font-weight-600', style: { color: item.color } }, React.createElement(Star, { size: 16 }), ' Ваш текущий показатель')
          )
        ),
        React.createElement('h4', null, '\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u043e\u0432\u043a\u0430 \u0433\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u0438'),
        React.createElement('div', { className: 'font-body' },
          React.createElement('p', null, React.createElement('span', { className: 'pill green' }, '\u0417\u0435\u043b\u0451\u043d\u044b\u0439'), ' \u2014 \u0432\u0441\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u0432 \u043d\u043e\u0440\u043c\u0435'),
          React.createElement('p', null, React.createElement('span', { className: 'pill yellow' }, '\u0416\u0451\u043b\u0442\u044b\u0439'), ' \u2014 \u043e\u0434\u0438\u043d \u0438\u0437 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0435\u0439 \u043d\u0438\u0436\u0435 \u043d\u043e\u0440\u043c\u044b'),
          React.createElement('p', null, React.createElement('span', { className: 'pill red' }, '\u041a\u0440\u0430\u0441\u043d\u044b\u0439'), ' \u2014 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438')
        )
      )
    ),

    // ── Nutrition modal ──
    showNutrition && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowNutrition(false),
      title: t('profile.nutrition.title'),
    },
      React.createElement('div', null,
        React.createElement('p', { className: 'text-secondary' }, t('profile.recommendations')),
        React.createElement(
          'div',
          { style: { overflowX: 'auto' } },
        React.createElement(
          'table',
          { className: 'w-full mt-sm', style: { borderCollapse: 'collapse', minWidth: '400px' } },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'border-bottom' },
              React.createElement('th', { className: 'text-left p-sm font-caption text-secondary' }, t('profile.table.parameter')),
              React.createElement('th', { className: 'text-left p-sm font-caption text-secondary' }, t('profile.table.value')),
              React.createElement('th', { className: 'text-left p-sm font-caption text-secondary' }, t('profile.table.note'))
            )
          ),
          React.createElement('tbody', null,
            NUTRITION.map((item, i) =>
              React.createElement('tr', { key: i, className: 'border-bottom' },
                React.createElement('td', { className: 'p-sm font-weight-500' }, item.label),
                React.createElement('td', { className: 'p-sm' }, item.val),
                React.createElement('td', { className: 'p-sm text-secondary font-body' }, item.note)
              )
            )
          )
        )
        ),
        React.createElement('p', { className: 'font-body text-secondary mt-sm' },
          React.createElement(AlertTriangle, { size: 16 }), ' При астме важно получать достаточно белка и магния. Дефицит магния усугубляет бронхоспазм.'
        )
      )
    ),

    // ── Reset confirmation modal ──
    showResetConfirm && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowResetConfirm(false),
      title: t('profile.confirmDelete'),
    },
      React.createElement('div', { className: 'flex flex-column gap-md' },
        React.createElement('p', null, t('profile.confirmDeleteDesc')),
        React.createElement('div', { className: 'flex gap-sm justify-end' },
          React.createElement('button', {
            className: 'btn',
            onClick: () => setShowResetConfirm(false),
          }, t('profile.settings.cancel')),
          React.createElement('button', {
            className: 'btn btn-red',
            onClick: confirmResetData,
          }, t('profile.data.delete'))
        )
      )
    ),

    // ── Exercise Configurator modal ──
    showExerciseConfigurator && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowExerciseConfigurator(false),
      title: t('profile.exercises.title'),
    },
      React.createElement('div', { className: 'exercise-configurator' },
        // Strength exercises
        React.createElement('h4', { style: { margin: '0 0 0.5rem' } }, React.createElement(Dumbbell, { size: 20 }), ' Силовые'),
        exercises.filter(e => !e.isCalisthenics).map(ex => {
          const configured = isExerciseConfigured(ex);
          return React.createElement('div', {
            key: ex.id,
            className: `exercise-config-item ${configured ? 'exercise-config-item--configured' : 'exercise-config-item--unconfigured'}`
          },
            React.createElement('span', { className: 'exercise-config-name' }, ex.name),
            configured && React.createElement('span', { className: 'exercise-config-value' },
              `${ex.protocol} | ${ex.currentRM}${ex.unit}`
            ),
            React.createElement('button', {
              className: 'exercise-config-btn',
              onClick: () => handleOpenConfig(ex),
            }, configured ? t('profile.edit') : t('profile.configure'))
          );
        }),
        // Calisthenics
        React.createElement('h4', { style: { margin: '1rem 0 0.5rem' } }, React.createElement(Play, { size: 20 }), ' Калистеника'),
        exercises.filter(e => e.isCalisthenics).map(ex => {
          const configured = isExerciseConfigured(ex);
const levelNames = { 1: 'Лёгкий', 2: 'Средний', 3: 'Сложный', 4: 'Элита', 5: 'Мастер' };
          return React.createElement('div', {
            key: ex.id,
            className: `exercise-config-item ${configured ? 'exercise-config-item--configured' : 'exercise-config-item--unconfigured'}`
          },
            React.createElement('span', { className: 'exercise-config-name' }, ex.name),
            configured && React.createElement('span', { className: 'exercise-config-value' },
              `${ex.protocol} | ${levelNames[ex.currentLevel] || ex.currentLevel}`
            ),
            React.createElement('button', {
              className: 'exercise-config-btn',
              onClick: () => handleOpenConfig(ex),
            }, configured ? t('profile.edit') : t('profile.configure'))
          );
        }),
        // Actions
        React.createElement('div', { className: 'configurator-actions' },
          React.createElement('button', {
            className: 'btn',
            onClick: () => setShowExerciseConfigurator(false),
          }, t('profile.close')),
          React.createElement('button', {
            className: 'btn btn-red',
            onClick: () => setShowExerciseResetConfirm(true),
          }, t('profile.resetAll'))
        )
      )
    ),

    // ── Integration Modal ──
    integrationModal && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setIntegrationModal(null),
      title: integrationModal + ' — Интеграция',
    },
      React.createElement('p', null, 'Интеграция с ' + integrationModal + ' в разработке.'),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginTop: 'var(--spacing-sm)' } },
        'Оставьте email, чтобы узнать о готовности:'
      ),
      React.createElement('input', {
        type: 'email', placeholder: 'your@email.com',
        style: { width: '100%', padding: '0.5rem', marginTop: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
        onChange: (e) => setIntegrationEmail(e.target.value),
      }),
      React.createElement('div', { style: { display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' } },
        React.createElement('button', { className: 'btn', onClick: () => setIntegrationModal(null) }, 'Закрыть'),
        React.createElement('button', { className: 'btn btn-accent', onClick: async () => {
          if (integrationEmail) {
            const { saveWaitlistEntry } = await import('../../core/storage.js');
            await saveWaitlistEntry(integrationEmail, integrationModal);
            setIntegrationModal(null);
            setIntegrationEmail('');
          }
        }}, 'Сохранить')
      )
    ),

    // ── Exercise Config Modal (shared) ──
    React.createElement(ExerciseConfigModal, {
      isOpen: configModalOpen,
      onClose: () => setConfigModalOpen(false),
      exercise: selectedExercise,
      onSave: handleSaveConfig,
    }),

    // ── Exercise Reset Confirmation Modal ──
    showExerciseResetConfirm && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowExerciseResetConfirm(false),
      title: t('profile.confirmReset'),
    },
      React.createElement('div', { className: 'flex flex-column gap-md' },
        React.createElement('p', null, t('profile.confirmResetDesc')),
        React.createElement('div', { className: 'flex gap-sm justify-end' },
          React.createElement('button', {
            className: 'btn',
            onClick: () => setShowExerciseResetConfirm(false),
          }, t('profile.settings.cancel')),
          React.createElement('button', {
            className: 'btn btn-red',
            onClick: () => {
              resetAllConfigs();
              setShowExerciseResetConfirm(false);
            },
          }, t('profile.reset'))
        )
      )
    )
  );
}


