// js/ui/pages/ProfilePage.js
import React, { useContext, useState } from 'react';
import { AppStateContext, AppDispatchContext } from '../../core/AppContext.js';
import { ZONES, HRV_GUIDE, NUTRITION, MORNING_ROUTINE, EVENING_ROUTINE } from '../../config/constants.js';
import Modal from '../components/Modal.js';

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
  const state = useContext(AppStateContext);
  const dispatch = useContext(AppDispatchContext);

  const {
    showSettings, editStartDate, editTrainDays,
    setShowSettings, setEditStartDate, setEditTrainDays,
    toggleDay, handleSaveSettings,
    handleExportData, handleImportData, handleResetAll,
    lastCheckin, recoveryScore, readiness,
  } = state;

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
            style: { backgroundColor: activeHrvRange.color, color: '#000', fontSize: '0.7rem', marginTop: '0.25rem' }
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
      React.createElement('p', null, 'Утренняя и вечерняя программы восстановления.'),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowRehab(true),
      }, 'Открыть программу')
    ),

    // ── Info section ──
    React.createElement(ProfileSection, { title: '\uD83D\uDCD6 Справка' },
      React.createElement('p', null, 'Пульсовые зоны, HRV-гайд, расшифровка готовности.'),
      React.createElement('button', {
        className: 'btn',
        onClick: () => setShowInfo(true),
      }, 'Открыть справку')
    ),

    // ── Nutrition section ──
    React.createElement(ProfileSection, { title: '\uD83C\uDF7D\uFE0F Питание' },
      React.createElement('p', null, 'Рекомендации по питанию для набора массы.'),
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
      React.createElement('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
        React.createElement('button', {
          className: 'btn',
          onClick: handleExportData,
        }, '\uD83D\uDCBE Экспорт'),
        React.createElement('button', {
          className: 'btn',
          onClick: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (file) handleImportData(file);
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
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
        React.createElement('label', { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 500 } },
          React.createElement('span', null, 'Дата старта'),
          React.createElement('input', {
            type: 'date',
            value: editStartDate,
            onChange: e => setEditStartDate(e.target.value),
          })
        ),
        React.createElement('div', null,
          React.createElement('span', { style: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 } }, 'Дни тренировок'),
          React.createElement('div', { style: { display: 'flex', gap: '0.375rem', flexWrap: 'wrap' } },
            DAYS.map((day, i) =>
              React.createElement('button', {
                key: i,
                className: `chip ${editTrainDays.includes(i) ? 'active' : ''}`,
                onClick: () => toggleDay(i),
              }, day)
            )
          )
        ),
        React.createElement('div', { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' } },
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
        React.createElement('h4', { style: { color: 'var(--yellow)', marginTop: '0' } }, '\u2600\uFE0F Утренняя активация'),
        React.createElement('ul', null,
          MORNING_ROUTINE.map((item, i) =>
            React.createElement('li', { key: i },
              React.createElement('strong', null, item.name),
              ` \u2014 ${item.reps}: ${item.why}`
            )
          )
        ),
        React.createElement('h4', { style: { color: 'var(--blue)' } }, '\uD83C\uDF19 Вечернее расслабление'),
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
            style: { borderLeft: `3px solid ${zone.color}`, paddingLeft: '0.75rem', marginBottom: '0.75rem' }
          },
            React.createElement('strong', null, `${zone.zone} \u2014 ${zone.name}`),
            React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--text2)' } }, zone.bpm),
            React.createElement('div', { style: { fontSize: '0.85rem' } }, zone.desc)
          )
        ),
        React.createElement('h4', null, 'HRV-гайд'),
        HRV_GUIDE.map((item, i) =>
          React.createElement('div', {
            key: i,
            style: {
              borderLeft: `3px solid ${item.color}`,
              paddingLeft: '0.75rem',
              marginBottom: '0.75rem',
              backgroundColor: activeHrvRange === item ? 'var(--surface2)' : undefined,
            }
          },
            React.createElement('strong', null, item.range),
            ` \u2014 ${item.label}`,
            React.createElement('div', { style: { fontSize: '0.85rem' } }, item.action),
            activeHrvRange === item && React.createElement('div', { style: { color: item.color, fontWeight: 600 } }, '\u2B50 Ваш текущий показатель')
          )
        ),
        React.createElement('h4', null, 'Расшифровка готовности'),
        React.createElement('div', { style: { fontSize: '0.85rem' } },
          React.createElement('p', null, React.createElement('span', { className: 'pill green' }, 'Зелёный'), ' \u2014 все показатели в норме, полный план'),
          React.createElement('p', null, React.createElement('span', { className: 'pill yellow' }, 'Жёлтый'), ' \u2014 один из показателей ниже нормы: -1 подход'),
          React.createElement('p', null, React.createElement('span', { className: 'pill red' }, 'Красный'), ' \u2014 критические показатели: только мобильность/растяжка/дыхание')
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
        React.createElement('p', { style: { color: 'var(--text2)' } }, 'Рекомендации по питанию для набора массы'),
        React.createElement(
          'table',
          { style: { width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' } },
          React.createElement('thead', null,
            React.createElement('tr', { style: { borderBottom: '1px solid var(--border)' } },
              React.createElement('th', { style: { textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text2)' } }, 'Параметр'),
              React.createElement('th', { style: { textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text2)' } }, 'Значение'),
              React.createElement('th', { style: { textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text2)' } }, 'Примечание')
            )
          ),
          React.createElement('tbody', null,
            NUTRITION.map((item, i) =>
              React.createElement('tr', { key: i, style: { borderBottom: '1px solid var(--border)' } },
                React.createElement('td', { style: { padding: '0.5rem', fontWeight: 500 } }, item.label),
                React.createElement('td', { style: { padding: '0.5rem' } }, item.val),
                React.createElement('td', { style: { padding: '0.5rem', color: 'var(--text2)', fontSize: '0.85rem' } }, item.note)
              )
            )
          )
        ),
        React.createElement('p', { style: { fontSize: '0.85rem', color: 'var(--text2)', marginTop: '0.75rem' } },
          '\u26A0\uFE0F При астме важно получать достаточно белка и магния. Дефицит магния усугубляет бронхоспазм.'
        )
      )
    )
  );
}
