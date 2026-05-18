// js/app.js
import React, { useContext, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { AppStateContext, AppDispatchContext, AppProvider } from './core/AppContext.js';
import { DAYS } from './config/constants.js';
import Modal from './ui/components/Modal.js';

const TodayPage = lazy(() => import('./ui/pages/TodayPage.js'));
const RehabPage = lazy(() => import('./ui/pages/RehabPage.js'));
const LogPage = lazy(() => import('./ui/pages/LogPage.js'));
const InfoPage = lazy(() => import('./ui/pages/InfoPage.js'));
const NutritionPage = lazy(() => import('./ui/pages/NutritionPage.js'));
const AnalyticsPage = lazy(() => import('./ui/pages/AnalyticsPage.js'));

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

  return React.createElement(
    React.Fragment,
    null,
    // Tab bar
    React.createElement(
      'div',
      { className: 'tabbar' },
      React.createElement('button', {
        className: activeTab === 0 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(0),
      }, '\uD83C\uDFC3\uFE0F Сегодня'),
      React.createElement('button', {
        className: activeTab === 1 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(1),
      }, '\uD83E\uDDD8\u200D\u2642\uFE0F Реабил'),
      React.createElement('button', {
        className: activeTab === 2 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(2),
      }, '\uD83D\uDCDD Дневник'),
      React.createElement('button', {
        className: activeTab === 3 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(3),
      }, '\uD83D\uDCD6 Справка'),
      React.createElement('button', {
        className: activeTab === 4 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(4),
      }, '\uD83C\uDF7D\uFE0F Питание'),
      React.createElement('button', {
        className: activeTab === 5 ? 'tab active' : 'tab',
        onClick: () => setActiveTab(5),
      }, '\uD83D\uDCCA Аналитика'),
      React.createElement('button', {
        className: 'tab tab-settings',
        onClick: openSettings,
        title: 'Настройки',
      }, '\u2699\uFE0F')
    ),
    // Pages — no prop-drilling, each page reads from context
    React.createElement(
      Suspense,
      { fallback: React.createElement('div', { className: 'card' }, 'Загрузка...') },
      activeTab === 0 && React.createElement(TodayPage, null),
      activeTab === 1 && React.createElement(RehabPage, null),
      activeTab === 2 && React.createElement(LogPage, null),
      activeTab === 3 && React.createElement(InfoPage, null),
      activeTab === 4 && React.createElement(NutritionPage, null),
      activeTab === 5 && React.createElement(AnalyticsPage, null)
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
