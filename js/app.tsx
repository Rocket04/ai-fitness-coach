import React, { useEffect, lazy, Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Home, BookOpen, TrendingUp, User, X, Check, RefreshCw } from 'lucide-react';
import i18n from './i18n/index.js';
import { useAppStore } from './store/index.js';
import { DAYS, DAYS_TO_DOW } from './config/constants.js';
import Modal from './ui/components/Modal.jsx';
import ErrorBoundary from './ui/components/ErrorBoundary.jsx';
import { SkeletonCard } from './ui/components/Skeleton.jsx';
import OnboardingWizard from './ui/components/OnboardingWizard.jsx';
import GuidedTour from './ui/components/GuidedTour.jsx';
import AchievementToast from './ui/components/AchievementToast.jsx';
import OnlineStatus from './ui/components/OnlineStatus.jsx';
import UpdateBanner from './ui/components/UpdateBanner.tsx';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate.js';
import { isOnboardingCompleted } from './core/onboardingStorage.js';
import { showDailyReminder, showMondaySummary, getStoredNotifyTime, NOTIFY_ENABLED_KEY } from './domains/notifications/notifications.js';

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
  const { t } = useTranslation();
  const tabs = [
    { idx: 0, label: t('nav.today'), icon: Home },
    { idx: 1, label: t('nav.log'), icon: BookOpen },
    { idx: 2, label: t('nav.analytics'), icon: TrendingUp },
    { idx: 3, label: t('nav.profile'), icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="Главное меню">
      {tabs.map(t => (
        <button
          key={t.idx}
          className={`bottom-nav__item${activeTab === t.idx ? ' active' : ''}`}
          onClick={() => setActiveTab(t.idx)}
          data-testid={['nav-today', 'nav-log', 'nav-analytics', 'nav-profile'][t.idx]}
          aria-label={t.label}
          aria-current={activeTab === t.idx ? 'page' : undefined}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            <t.icon size={24} />
          </span>
          <span className="bottom-nav__label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const {
    dataLoaded, toast, showSettings, editStartDate, editTrainDays, activeTab, demoMode,
    guestMode, showGuestModal, todayISO, checkins,
    setActiveTab, setShowSettings, setEditStartDate, toggleDay, handleSaveSettings,
    initApp, completeOnboarding, startTracking, completeGuestModeOnboarding,
    setShowGuestModal,
  } = useAppStore();

  // Service worker update detection
  const { updateAvailable, activateUpdate, dismissUpdate } = useServiceWorkerUpdate();

  // Onboarding state managed in localStorage (survives i18n remounts)
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Tracks when user clicked "Начать трекинг" to manually trigger onboarding
  const [forceShowOnboarding, setForceShowOnboarding] = useState(false);

  useEffect(() => { initApp(); }, []);

  // Check localStorage after data loads to determine if onboarding should show
  useEffect(() => {
    if (dataLoaded) {
      // Skip onboarding in guest mode unless user explicitly clicked "Начать трекинг"
      if (guestMode && !forceShowOnboarding) return;
      // Only show onboarding if not already completed
      const completed = isOnboardingCompleted();
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [dataLoaded, guestMode, forceShowOnboarding]);

  // Schedule daily reminder notification after data load
  useEffect(() => {
    if (!dataLoaded) return;
    const enabled = (() => { try { return localStorage.getItem(NOTIFY_ENABLED_KEY) === 'true'; } catch { return false; } })();
    if (!enabled) return;
    const checkinDone = checkins.some(c => c.date === todayISO);
    const time = getStoredNotifyTime();
    showDailyReminder(checkinDone, time);
    const now = new Date();
    if (now.getDay() === 1) {
      showMondaySummary();
    }
  }, [dataLoaded]);

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
            {pages.map((p, i) =>
              activeTab === i ? (
                <div
                  key={p.key}
                  className={`page-wrapper page-${i} page-active`}
                >
                  <ErrorBoundary
                    fallback={function (props: { retry?: () => void }) {
                      return (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', margin: 'var(--spacing-md)' }}>
                          <p style={{ color: 'var(--text2)', marginBottom: 'var(--spacing-md)' }}>Ошибка отображения раздела</p>
                          <button className="btn btn-accent" onClick={() => props.retry?.()}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                              <RefreshCw size={16} />
                              Повторить
                            </span>
                          </button>
                        </div>
                      );
                    }}
                  >
                    <p.component />
                  </ErrorBoundary>
                </div>
              ) : null
            )}
          </div>
        </Suspense>
      </main>

      {/* SW Update Banner — appears when new version is available */}
      {updateAvailable && React.createElement(UpdateBanner, { onActivate: activateUpdate, onDismiss: dismissUpdate })}

      {/* Demo Mode Badge (dev mode only) */}
      {demoMode && !guestMode && React.createElement('div', {
        className: 'demo-badge',
        style: {
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
          background: 'var(--accent)', color: '#fff', textAlign: 'center',
          padding: '4px 0', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
        },
      }, '🎮 ДЕМО-РЕЖИМ')}

      {/* Guest Mode Badge */}
      {guestMode && React.createElement('div', {
        className: 'guest-badge',
        style: {
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
          background: '#6366f1', color: '#fff', textAlign: 'center',
          padding: '4px 0', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
        },
      }, '👤 ГОСТЕВОЙ РЕЖИМ')}

      {/* Header: Online Status + Start Tracking button */}
      <div style={{
        position: 'fixed',
        top: (demoMode || guestMode) ? 24 : 'var(--spacing-sm)',
        right: 'var(--spacing-sm)',
        zIndex: 1500,
        transition: 'all var(--transition-normal)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
      }}>
        {guestMode && (
          <button
            className="btn btn-sm btn-accent"
            style={{ fontSize: '12px', padding: '4px 12px', whiteSpace: 'nowrap' }}
            onClick={() => {
              startTracking();
              setForceShowOnboarding(true);
            }}
          >
            Начать трекинг
          </button>
        )}
        <OnlineStatus />
      </div>

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
            {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          </span>
          {toast.message}
        </div>
      )}

      {/* Onboarding Wizard for new users */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onComplete={(data) => {
          if (guestMode) {
            completeGuestModeOnboarding(data as Parameters<typeof completeGuestModeOnboarding>[0]);
          } else {
            completeOnboarding(data as Parameters<typeof completeOnboarding>[0]);
          }
          setShowOnboarding(false);
          setForceShowOnboarding(false);
        }}
        onClose={() => {
          setShowOnboarding(false);
          setForceShowOnboarding(false);
        }}
      />

      {/* Guest Mode Modal — shown when user tries to save in guest mode */}
      {showGuestModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowGuestModal(false)}
          title="Сохранение данных"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
              Чтобы сохранить данные, пройдите быстрый онбординг
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              В гостевом режиме данные хранятся временно и будут потеряны при выходе
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                className="btn"
                onClick={() => setShowGuestModal(false)}
              >
                Позже
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  setShowGuestModal(false);
                  startTracking();
                  setForceShowOnboarding(true);
                }}
              >
                Начать онбординг
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Guided Tour */}
      <GuidedTour t={t} />

      {/* Achievement Toast */}
      <AchievementToast />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <AppContent />
      </I18nextProvider>
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
