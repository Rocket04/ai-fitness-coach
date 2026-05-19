// js/app.tsx
import { useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { useAppStore } from './stores/useAppStore.js';
import { DAYS, DAYS_TO_DOW } from './config/constants.js';
import Modal from './ui/components/Modal.jsx';
import ErrorBoundary from './ui/components/ErrorBoundary.jsx';
import { SkeletonCard } from './ui/components/Skeleton.jsx';

const TodayPage = lazy(() => import('./ui/pages/TodayPage.jsx'));
const LogPage = lazy(() => import('./ui/pages/LogPage.jsx'));
const AnalyticsPage = lazy(() => import('./ui/pages/AnalyticsPage.jsx'));
const ProfilePage = lazy(() => import('./ui/pages/ProfilePage.jsx'));
const MethodologyPage = lazy(() => import('./ui/pages/MethodologyPage.jsx'));

interface BottomNavProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { idx: 0, label: 'Сегодня', icon: '🏃️' },
    { idx: 1, label: 'Дневник', icon: '📝' },
    { idx: 2, label: 'Аналитика', icon: '📊' },
    { idx: 3, label: 'Профиль', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav" aria-label="Главное меню">
      {tabs.map(t => (
        <button
          key={t.idx}
          className={`bottom-nav__item${activeTab === t.idx ? ' active' : ''}`}
          onClick={() => setActiveTab(t.idx)}
          aria-label={t.label}
          aria-current={activeTab === t.idx ? 'page' : undefined}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{t.icon}</span>
          <span className="bottom-nav__label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

function AppContent() {
  const {
    dataLoaded, toast, showSettings, editStartDate, editTrainDays, activeTab,
    setActiveTab, setShowSettings, setEditStartDate, toggleDay, handleSaveSettings,
    initApp,
  } = useAppStore();

  useEffect(() => { initApp(); }, []);

  if (!dataLoaded) {
    return (
      <div className="skeleton-page">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={4} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  const pages = [
    { component: TodayPage, key: 'today' },
    { component: LogPage, key: 'log' },
    { component: AnalyticsPage, key: 'analytics' },
    { component: ProfilePage, key: 'profile' },
    { component: MethodologyPage, key: 'methodology' },
  ];

  return (
    <>
      {/* Main content area */}
      <main className="app-content">
        <Suspense fallback={<div className="skeleton-page"><SkeletonCard rows={3} /></div>}>
          <div className="pages-container">
            {pages.map((p, i) => (
              <div
                key={p.key}
                className={`page-wrapper page-${i}${activeTab === i ? ' page-active' : ''}`}
                hidden={activeTab !== i}
              >
                <p.component />
              </div>
            ))}
          </div>
        </Suspense>
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Settings modal */}
      {showSettings && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettings(false)}
          title="Настройки"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <span>Дата старта</span>
              <input
                type="date"
                value={editStartDate}
                onChange={e => setEditStartDate(e.target.value)}
              />
            </label>
            <div>
              <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Дни тренировок</span>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {DAYS.map((day: string, i: number) => (
                  <button
                    key={i}
                    className={`chip ${editTrainDays.includes(DAYS_TO_DOW[i]) ? 'active' : ''}`}
                    onClick={() => toggleDay(DAYS_TO_DOW[i])}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              Данные вводятся вручную. Алгоритмы не сертифицированы, продукт в стадии тестирования.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                className="btn"
                onClick={() => setShowSettings(false)}
              >
                Отмена
              </button>
              <button
                className="btn btn-accent"
                onClick={handleSaveSettings}
              >
                Сохранить
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast notification */}
      {toast.visible && (
        <div className={`toast ${toast.type === 'error' ? 'error' : 'success'}`}>
          <span className="toast-icon">
            {toast.type === 'error' ? '❌' : '✅'}
          </span>
          {toast.message}
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;

document.addEventListener('DOMContentLoaded', () => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(<App />);
  }
});
