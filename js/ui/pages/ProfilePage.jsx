// js/ui/pages/ProfilePage.js
import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import { ZONES, HRV_GUIDE, NUTRITION, MORNING_ROUTINE, EVENING_ROUTINE, DAYS, DAYS_TO_DOW } from '../../config/constants.js';
import Modal from '../components/Modal.jsx';

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
  const {
    showSettings, editStartDate, editTrainDays,
    lastCheckin, recoveryScore, readiness,
    setShowSettings, setEditStartDate, setEditTrainDays,
    toggleDay, handleSaveSettings, setActiveTab,
    handleExportData, handleImportData, handleResetAll,
  } = useAppStore();

  const [showRehab, setShowRehab] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  const hrv = lastCheckin?.hrv ? Number(lastCheckin.hrv) : 0;
  const restHr = lastCheckin?.restHR ? Number(lastCheckin.restHR) : 0;
  const activeHrvRange = findHrvRange(hrv, HRV_GUIDE);

  return React.createElement(
    'div',
    { className: 'profile-page' },
    React.createElement('h2', { className: 'profile-page__title' }, '\uD83D\uDC64 Профиль'),

    // ── Personal stats card ──
    lastCheckin && React.createElement(
      'div',
      { className: 'card card--stats' },
      React.createElement('h3', { className: 'card__title' }, '\uD83D\uDCCA Ваши показатели'),
      React.createElement(
        'div',
        { className: 'stat-grid' },
        hrv > 0 && React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, `${hrv} мс`),
          React.createElement('div', { className: 'stat-label' }, 'HRV'),
          activeHrvRange && React.createElement('span', {
            className: 'pill',
            style: { backgroundColor: activeHrvRange.color, color: '#000', fontSize: 'var(--font-size-caption)', marginTop: 'var(--spacing-xs)' }
          }, activeHrvRange.label)
        ),
        restHr > 0 && React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, `${restHr}`),
          React.createElement('div', { className: 'stat-label' }, 'ЧСС покоя')
        ),
        typeof recoveryScore === 'number' && recoveryScore > 0 && React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, `${recoveryScore}%`),
          React.createElement('div', { className: 'stat-label' }, 'Recovery')
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, readiness === 'green' ? '\uD83D\uDFE2' : readiness === 'yellow' ? '\uD83D\uDFE1' : '\uD83D\uDD34'),
          React.createElement('div', { className: 'stat-label' }, 'Готовность')
        )
      )
    ),

    // ── Rehab section ──
    React.createElement(ProfileSection, { title: '\uD83E\uDDD8\u200D\u2642\uFE0F Реабилитация' },
      React.createElement('p', null, '7 упражнений утром (15 мин) + 8 вечером (20 мин). Снижают риск травм и ускоряют восстановление после нагрузок.'),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, 'Мобильность позвоночника, T-spine, ТБС, плечо, дыхательные техники.'),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowRehab(true),
      }, 'Открыть программу')
    ),

    // ── Info section ──
    React.createElement(ProfileSection, { title: '\uD83D\uDCD6 Справка' },
      React.createElement('p', null, 'Пульсовые зоны (Z1–Z5), HRV-гайд и расшифровка статусов — что означает каждый цвет готовности и как действовать.'),
      activeHrvRange && React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, `Твой HRV сейчас: ${activeHrvRange.label} — ${activeHrvRange.action}`),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowInfo(true),
      }, 'Открыть справку')
    ),

    // ── Methodology section ──
    React.createElement(ProfileSection, { title: '\uD83E\uDDE0 Методология' },
      React.createElement('p', null, 'Открытые формулы: как считается Recovery Score, почему нагрузка меняется и откуда берутся весовые коэффициенты.'),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, 'Научная база: APRE (meta-analysis 2021), Oura Readiness, Firstbeat методология.'),
      React.createElement('button', {
        className: 'btn',
        onClick: () => { window.location.hash = ''; setActiveTab(4); },
      }, 'Открыть методологию')
    ),

    // ── Nutrition section ──
    React.createElement(ProfileSection, { title: '\uD83C\uDF7D\uFE0F Питание' },
      React.createElement('p', null, 'Персональные нормы КБЖУ и план добавок с обоснованием под текущий тренировочный блок.'),
      React.createElement('p', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginTop: 'var(--spacing-xs)' } }, 'Советы меняются в зависимости от дня (тренировка/отдых), Recovery Score и мышечной болезненности.'),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowNutrition(true),
      }, 'Открыть питание')
    ),

    // ── Settings section ──
    React.createElement(ProfileSection, { title: '\u2699\uFE0F Настройки' },
      React.createElement('button', {
        className: 'btn btn-accent',
        onClick: () => setShowSettings(true),
      }, 'Открыть настройки')
    ),

    // ── Data section ──
    React.createElement(ProfileSection, { title: '\uD83D\uDCBE Данные' },
      React.createElement('div', { className: 'flex gap-sm flex-wrap' },
        React.createElement('button', {
          className: 'btn',
          onClick: handleExportData,
        }, '\uD83D\uDCBE Экспорт'),
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
                alert('Ошибка импорта: ' + (err instanceof Error ? err.message : 'Неверный формат файла'));
              }
            };
            input.click();
          },
        }, '\uD83D\uDCC2 Импорт'),
        React.createElement('button', {
          className: 'btn btn-red',
          onClick: handleResetAll,
        }, '\uD83D\uDDD1\uFE0F Сброс')
      )
    ),

    // ── Settings modal ──
    showSettings && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowSettings(false),
      title: 'Настройки',
    },
      React.createElement('div', { className: 'flex flex-column gap-md' },
        React.createElement('label', { className: 'flex flex-column gap-xs font-body font-weight-500' },
          React.createElement('span', null, 'Дата старта'),
          React.createElement('input', {
            type: 'date',
            value: editStartDate,
            onChange: e => setEditStartDate(e.target.value),
          })
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'block mb-sm font-body font-weight-500' }, 'Дни тренировок'),
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
          }, 'Отмена'),
          React.createElement('button', {
            className: 'btn btn-accent',
            onClick: handleSaveSettings,
          }, 'Сохранить')
        )
      )
    ),

    // ── Rehab modal ──
    showRehab && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowRehab(false),
      title: '\uD83E\uDDD8\u200D\u2642\uFE0F Программа реабилитации',
    },
      React.createElement('div', null,
        React.createElement('h4', { className: 'text-yellow mt-0' }, '\u2600\uFE0F Утренняя активация'),
        React.createElement('ul', null,
          MORNING_ROUTINE.map((item, i) =>
            React.createElement('li', { key: i },
              React.createElement('strong', null, item.name),
              ` \u2014 ${item.reps}: ${item.why}`
            )
          )
        ),
        React.createElement('h4', { className: 'text-blue' }, '\uD83C\uDF19 Вечернее расслабление'),
        React.createElement('ul', null,
          EVENING_ROUTINE.map((item, i) =>
            React.createElement('li', { key: i },
              React.createElement('strong', null, item.name),
              ` \u2014 ${item.reps}: ${item.why}`
            )
          )
        )
      )
    ),

    // ── Info modal ──
    showInfo && React.createElement(Modal, {
      isOpen: true,
      onClose: () => setShowInfo(false),
      title: '\uD83D\uDCD6 Справка',
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
            activeHrvRange === item && React.createElement('div', { className: 'font-weight-600', style: { color: item.color } }, '\u2B50 Ваш текущий показатель')
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
      title: '\uD83C\uDF7D\uFE0F Питание',
    },
      React.createElement('div', null,
        React.createElement('p', { className: 'text-secondary' }, 'Рекомендации по питанию для набора массы'),
        React.createElement(
          'div',
          { style: { overflowX: 'auto' } },
        React.createElement(
          'table',
          { className: 'w-full mt-sm', style: { borderCollapse: 'collapse', minWidth: '400px' } },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'border-bottom' },
              React.createElement('th', { className: 'text-left p-sm font-caption text-secondary' }, 'Параметр'),
              React.createElement('th', { className: 'text-left p-sm font-caption text-secondary' }, 'Значение'),
              React.createElement('th', { className: 'text-left p-sm font-caption text-secondary' }, 'Примечание')
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
          '\u26A0\uFE0F При астме важно получать достаточно белка и магния. Дефицит магния усугубляет бронхоспазм.'
        )
      )
    )
  );
}
