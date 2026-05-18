// js/app.js
import React, { useContext, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { AppStateContext, AppDispatchContext, AppProvider } from './core/AppContext.js';
import { DAYS } from './config/constants.js';
import Modal from './ui/components/Modal.js';

const TodayPage = lazy(() => import('./ui/pages/TodayPage.js'));
const LogPage = lazy(() => import('./ui/pages/LogPage.js'));
const AnalyticsPage = lazy(() => import('./ui/pages/AnalyticsPage.js'));
const ProfilePage = lazy(() => import('./ui/pages/ProfilePage.js'));

function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { idx: 0, label: 'Сегодня', icon: '\uD83C\uDFC3\uFE0F' },
    { idx: 1, label: 'Дневник', icon: '\uD83D\uDCDD' },
    { idx: 2, label: 'Аналитика', icon: '\uD83D\uDCCA' },
    { idx: 3, label: 'Профиль', icon: '\uD83D\uDC64' },
  ];

  return React.createElement(
    'nav',
    { className: 'bottom-nav' },
    tabs.map(t =>
      React.createElement('button', {
        key: t.idx,
        className: `bottom-nav__item${activeTab === t.idx ? ' active' : ''}`,
        onClick: () => setActiveTab(t.idx),
      },
        React.createElement('span', { className: 'bottom-nav__icon' }, t.icon),
        React.createElement('span', { className: 'bottom-nav__label' }, t.label)
      )
    )
  );
}

function AppContent() {
  const state = useContext(AppStateContext);
  const dispatch = useContext(AppDispatchContext);

  const {
    dataLoaded, toast, showSettings, editStartDate, editTrainDays, activeTab,
  } = state;

  const {
    setActiveTab, setShowSettings, setEditStartDate, setEditTrainDays,
    openSettings, toggleDay, handleSaveSettings,
  } = dispatch;

  if (!dataLoaded) {
    return React.createElement('div', { className: 'card' }, 'Загрузка...');
  }

  const pages = [
    React.createElement(TodayPage, { key: 'today' }),
    React.createElement(LogPage, { key: 'log' }),
    React.createElement(AnalyticsPage, { key: 'analytics' }),
    React.createElement(ProfilePage, { key: 'profile' }),
  ];

  return React.createElement(
    React.Fragment,
    null,
    // Main content area
    React.createElement(
      'div',
      { className: 'app-content' },
      React.createElement(
        Suspense,
        { fallback: React.createElement('div', { className: 'card' }, 'Загрузка...') },
        React.createElement(
          'div',
          { className: `page-wrapper page-${activeTab}` },
          pages[activeTab]
        )
      )
    ),
    // Bottom navigation
    React.createElement(BottomNav, { activeTab, setActiveTab }),
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
    // ── Toast notification ──
    toast.visible && React.createElement('div', {
      className: `toast ${toast.type === 'error' ? 'error' : 'success'}`,
    },
      React.createElement('span', { className: 'toast-icon' },
        toast.type === 'error' ? '\u274C' : '\u2705'
      ),
      toast.message
    )
  );
}

function App() {
  return React.createElement(
    AppProvider,
    null,
    React.createElement(AppContent, null)
  );
}

export default App;

document.addEventListener('DOMContentLoaded', () => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(React.createElement(App, null));
  }
});
