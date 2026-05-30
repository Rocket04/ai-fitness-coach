import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Flame, Trophy, ChevronRight, Upload, Download, RotateCcw,
  Trash2, Globe, Bell, Info, FileJson, Database, Shield,
  Calendar, Clock, Grip, Activity, Smartphone, Link2,
  Dumbbell, AlertTriangle, HelpCircle, RefreshCw, ChevronDown
} from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import { useTourStore } from '../../domains/onboarding/useTourStore.js';
import { changeLanguage, getCurrentLanguage } from '../../shared/i18n/index.js';
import { DAYS, DAYS_TO_DOW } from '../../shared/config/constants.js';
import Modal from '../components/Modal.jsx';
import { getStoredNotifyTime, saveNotifyTime, saveNotifyEnabled } from '../../domains/notifications/notifications.js';
import { saveSetting } from '../../data/storage.js';

function SectionGroup({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="profile-group">
      <button className="profile-group__header" onClick={() => setOpen(o => !o)}>
        <span className="profile-group__header-left">
          {icon}
          <span className="profile-group__title">{title}</span>
        </span>
        <span className={`profile-group__chevron ${open ? 'is-open' : ''}`}>
          <ChevronDown size={16} />
        </span>
      </button>
      {open && <div className="profile-group__body">{children}</div>}
    </div>
  );
}

function ProfileRow({ icon, label, value, onClick, destructive, prominent, testId }) {
  return (
    <button
      className={`profile-row ${destructive ? 'profile-row--destructive' : ''} ${prominent ? 'profile-row--prominent' : ''}`}
      onClick={onClick}
      data-testid={testId}
    >
      {icon && <span className="profile-row__icon">{icon}</span>}
      <span className="profile-row__label">{label}</span>
      {value && <span className="profile-row__value">{value}</span>}
      {onClick && !destructive && <ChevronRight size={16} className="profile-row__chevron" />}
    </button>
  );
}

function RehabIssuesEditor({ rehabIssues, setRehabIssues, t }) {
  const issues = [
    { key: 'hips', label: t('profile.rehab.hips') },
    { key: 'shoulder', label: t('profile.rehab.shoulder') },
    { key: 'back', label: t('profile.rehab.back') },
    { key: 'knees', label: t('profile.rehab.knees') },
    { key: 'neck', label: t('profile.rehab.neck') },
    { key: 'elbow', label: t('profile.rehab.elbow') },
    { key: 'wrist', label: t('profile.rehab.wrist') },
  ];

  const toggleIssue = (key) => {
    const current = rehabIssues || [];
    const updated = current.includes(key)
      ? current.filter(i => i !== key)
      : [...current, key];
    setRehabIssues(updated);
    saveSetting('rehabIssues', updated);
  };

  return (
    <div className="profile-rehab-grid">
      {issues.map(({ key, label }) => (
        <button
          key={key}
          className={`chip ${(rehabIssues || []).includes(key) ? 'active' : ''}`}
          onClick={() => toggleIssue(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const s = useAppStore();
  const {
    lastCheckin, recoveryScore, readiness,
    setActiveTab,
    handleExportData, handleImportData, handleImportHealthSyncCSV,
    confirmResetData,
    showToast,
    checkinTier, setCheckinTier,
    sessions, checkins,
    trainDays, startDate,
    streak, demoMode,
    rehabIssues, setRehabIssues,
    editStartDate, setEditStartDate,
    editTrainDays, setEditTrainDays,
    toggleDay, handleSaveSettings,
    backupList, refreshBackupList,
    handleRestoreBackup,
    virtualTodayOffset,
  } = s;

  const notifyEnabledKey = 'fitness-tracker-notify-enabled';
  const [notifyEnabled, setNotifyEnabledRaw] = useState(() => {
    try { return localStorage.getItem(notifyEnabledKey) === 'true'; } catch { return false; }
  });
  const [notifyTime, setNotifyTimeRaw] = useState(() => getStoredNotifyTime());
  const setNotifyEnabled = (v) => { setNotifyEnabledRaw(v); saveNotifyEnabled(v); };
  const setNotifyTime = (v) => { setNotifyTimeRaw(v); saveNotifyTime(v); };

  const [showBackupList, setShowBackupList] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);
  const [importingHealthSync, setImportingHealthSync] = useState(false);
  const [integrationModal, setIntegrationModal] = useState(null);
  const [integrationEmail, setIntegrationEmail] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);
  const devTimerRef = useRef(null);

  const [showRehabEditor, setShowRehabEditor] = useState(false);

  useEffect(() => { refreshBackupList(); }, []);

  const handleVersionTap = useCallback(() => {
    setDevTapCount(prev => {
      const next = prev + 1;
      if (next >= 7) {
        setShowDevTools(true);
        setDevTapCount(0);
        showToast(t('profile.devTools.unlocked'));
        return 0;
      }
      if (devTimerRef.current) clearTimeout(devTimerRef.current);
      devTimerRef.current = setTimeout(() => setDevTapCount(0), 3000);
      return next;
    });
  }, [showToast, t]);

  const handleImportCSV = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    input.accept = isTouch ? '*/*' : '.csv,.txt,text/csv,application/csv,application/octet-stream';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportingHealthSync(true);
      try {
        const text = await file.text();
        await handleImportHealthSyncCSV(text);
      } catch (err) {
        console.error('CSV import failed:', err);
        showToast(t('profile.importError', { error: err instanceof Error ? err.message : t('profile.importErrorDefault') }), 'error');
      } finally {
        setImportingHealthSync(false);
      }
    };
    input.click();
  };

  const handleImportJSON = async () => {
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
        showToast(t('profile.importError', { error: err instanceof Error ? err.message : t('profile.importErrorDefault') }), 'error');
      }
    };
    input.click();
  };

  const username = (() => {
    try { return localStorage.getItem('fitness-tracker-username'); } catch { return null; }
  })() || t('profile.defaultUsername');

  return (
    <div className="profile-page">
      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-header__avatar">
          <User size={28} />
        </div>
        <div className="profile-header__info">
          <h2 className="profile-header__name">{username}</h2>
          <div className="profile-header__stats">
            <span className="profile-header__streak">
              <Flame size={14} />
              {streak || 0} {t('profile.days')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Group 1: TRAINING ── */}
      <SectionGroup icon={<Dumbbell size={18} />} title={t('profile.group.training')}>
        {/* Schedule */}
        <div className="profile-group__field">
          <span className="profile-group__field-label">{t('profile.schedule')}</span>
          <div className="profile-chips">
            {DAYS.map((day, i) => (
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

        {/* Check-in tier */}
        <div className="profile-group__field">
          <span className="profile-group__field-label">{t('profile.checkinTier')}</span>
          <div className="profile-tier-selector">
            {(['light', 'medium', 'full']).map(tier => (
              <button
                key={tier}
                className={`btn btn-sm ${checkinTier === tier ? 'btn-accent' : 'btn-outline'}`}
                onClick={() => setCheckinTier(tier)}
              >
                {t(`profile.tier.${tier}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Start date */}
        <div className="profile-group__field">
          <span className="profile-group__field-label">{t('profile.settings.startDate')}</span>
          <input
            type="date"
            className="profile-date-input"
            value={editStartDate}
            onChange={e => setEditStartDate(e.target.value)}
          />
        </div>
      </SectionGroup>

      {/* ── Group 2: HEALTH ── */}
      <SectionGroup icon={<Activity size={18} />} title={t('profile.group.health')}>
        <div className="profile-group__field">
          <span className="profile-group__field-label">{t('profile.rehab.title')}</span>
          <div className="profile-rehab-summary">
            {(rehabIssues || []).length === 0 ? (
              <span className="profile-group__field-note">{t('profile.rehab.none')}</span>
            ) : (
              <div className="profile-chips">
                {(rehabIssues || []).map(issue => (
                  <span key={issue} className="chip active" style={{ cursor: 'default' }}>
                    {t('profile.rehab.' + issue)}
                  </span>
                ))}
              </div>
            )}
            <button className="btn btn-sm btn-outline" onClick={() => setShowRehabEditor(true)}>
              {t('profile.edit')}
            </button>
          </div>
        </div>
      </SectionGroup>

      {/* ── Group 3: INTEGRATIONS ── */}
      <SectionGroup icon={<Link2 size={18} />} title={t('profile.group.integrations')}>
        {[
          { name: 'Garmin Connect', icon: '⌚' },
          { name: 'Apple Health', icon: '🍎' },
          { name: 'Google Fit', icon: '🔵' },
        ].map(({ name, icon }) => (
          <div key={name} className="profile-integration-row">
            <span className="profile-integration-row__icon">{icon}</span>
            <span className="profile-integration-row__name">{name}</span>
            <span className="profile-integration-row__status">{t('profile.integration.notConnected')}</span>
            <button className="btn btn-sm btn-outline" onClick={() => setIntegrationModal(name)}>
              {t('profile.connect')}
            </button>
          </div>
        ))}
      </SectionGroup>

      {/* ── Group 4: DATA ── */}
      <SectionGroup icon={<Database size={18} />} title={t('profile.group.data')}>
        {/* CSV Import — prominent */}
        <button
          className="profile-csv-button"
          disabled={importingHealthSync}
          onClick={handleImportCSV}
        >
          <Upload size={20} />
          <span className="profile-csv-button__text">
            {importingHealthSync ? t('profile.loading') : t('profile.data.importCSV')}
          </span>
        </button>

        {/* JSON Export / Import */}
        <div className="profile-data-actions">
          <button className="btn btn-outline profile-data-btn" onClick={handleExportData}>
            <Download size={16} />
            {t('profile.data.export')}
          </button>
          <button className="btn btn-outline profile-data-btn" onClick={handleImportJSON}>
            <FileJson size={16} />
            {t('profile.data.import')}
          </button>
        </div>

        {/* Restore backup */}
        <button
          className="profile-link-btn"
          onClick={() => { refreshBackupList(); setShowBackupList(true); }}
        >
          <RotateCcw size={14} />
          {t('profile.data.restoreBackup')}
        </button>

        {/* Reset all data */}
        <button
          className="profile-reset-btn"
          onClick={() => setShowResetConfirm(true)}
        >
          <Trash2 size={16} />
          {t('profile.data.reset')}
        </button>
      </SectionGroup>

      {/* ── Group 5: APP ── */}
      <SectionGroup icon={<Smartphone size={18} />} title={t('profile.group.app')}>
        {/* Language */}
        <div className="profile-group__field">
          <span className="profile-group__field-label">{t('profile.language.title')}</span>
          <div className="profile-tier-selector">
            <button
              className={`btn btn-sm ${getCurrentLanguage() === 'ru' ? 'btn-accent' : 'btn-outline'}`}
              onClick={() => changeLanguage('ru')}
            >{t('profile.language.ru')}</button>
            <button
              className={`btn btn-sm ${getCurrentLanguage() === 'en' ? 'btn-accent' : 'btn-outline'}`}
              onClick={() => changeLanguage('en')}
            >{t('profile.language.en')}</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="profile-group__field">
          <label className="profile-toggle-row">
            <span className="profile-toggle-row__label">
              <Bell size={14} />
              {t('profile.notifications.morningReminder')}
            </span>
            <input
              type="checkbox"
              className="profile-toggle"
              checked={notifyEnabled}
              onChange={(e) => setNotifyEnabled(e.target.checked)}
            />
          </label>
          {notifyEnabled && (
            <div className="profile-notify-time">
              <span className="profile-group__field-label">{t('profile.notifications.morningTime')}</span>
              <input
                type="time"
                className="profile-time-input"
                value={notifyTime}
                onChange={(e) => setNotifyTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Version */}
        <div className="profile-group__field">
          <button className="profile-version-btn" onClick={handleVersionTap} title={t('profile.versionTapHint')}>
            <Info size={14} />
            {t('profile.version')} 1.0.0
            {devTapCount > 0 && <span className="profile-version__tap-count">{devTapCount}/7</span>}
          </button>
        </div>
      </SectionGroup>

      {/* ── Dev Tools (hidden, shown after 7 taps) ── */}
      {showDevTools && (
        <div className="profile-group profile-group--dev">
          <div className="profile-group__header">
            <span className="profile-group__header-left">
              <Shield size={18} />
              <span className="profile-group__title">{t('profile.devTools.title')}</span>
            </span>
          </div>
          <div className="profile-group__body">
            <div className="profile-dev-date-nav">
              <button className="btn btn-sm" onClick={() => useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) - 7)}>−7</button>
              <button className="btn btn-sm" onClick={() => useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) - 1)}>−1</button>
              <button className="btn btn-sm btn-accent" onClick={() => useAppStore.getState().setVirtualTodayOffset(0)}>{t('profile.devTools.today')}</button>
              <button className="btn btn-sm" onClick={() => useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) + 1)}>+1</button>
              <button className="btn btn-sm" onClick={() => useAppStore.getState().setVirtualTodayOffset((virtualTodayOffset || 0) + 7)}>+7</button>
            </div>
            <span className="profile-dev-offset">{t('profile.devTools.offset')} {(virtualTodayOffset || 0)} {t('profile.devTools.days')}</span>

            <div className="profile-dev-actions">
              <button
                className={`btn btn-sm ${demoMode ? 'btn-red' : 'btn-accent'}`}
                onClick={async () => {
                  const store = useAppStore.getState();
                  if (store.demoMode) {
                    await store.deactivateDemoMode();
                  } else {
                    await store.activateDemoMode();
                  }
                }}
              >
                {demoMode ? t('profile.devTools.exitDemo') : t('profile.devTools.activateDemo')}
              </button>
            </div>

            {!demoMode && (
              <div className="profile-dev-profiles">
                <span className="profile-dev-profiles__label">{t('profile.devTools.profileLabel')}</span>
                <div className="profile-dev-profiles__grid">
                  {[
                    { key: 'marathoner', icon: '🏃', name: t('profile.devTools.marathoner') },
                    { key: 'yogi', icon: '🧘', name: t('profile.devTools.yogi') },
                    { key: 'crossfitter', icon: '🏋️', name: t('profile.devTools.crossfitter') },
                    { key: 'rehab', icon: '🩹', name: t('profile.devTools.rehab') },
                  ].map(({ key, icon, name }) => (
                    <button
                      key={key}
                      className="btn btn-sm"
                      onClick={async () => {
                        const store = useAppStore.getState();
                        await store.activateDemoModeWithProfile(key);
                      }}
                    >
                      {icon} {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="profile-link-btn profile-link-btn--close" onClick={() => setShowDevTools(false)}>
              {t('profile.devTools.close')}
            </button>
          </div>
        </div>
      )}

      {/* ── Rehab Editor Modal ── */}
      {showRehabEditor && (
        <Modal isOpen onClose={() => setShowRehabEditor(false)} title={t('profile.rehab.title')}>
          <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text2)', fontSize: 'var(--font-size-body)' }}>
            {t('profile.rehab.description')}
          </p>
          <RehabIssuesEditor rehabIssues={rehabIssues} setRehabIssues={setRehabIssues} t={t} />
          <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setShowRehabEditor(false)}>
              {t('profile.close')}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Integration Modal ── */}
      {integrationModal && (
        <Modal isOpen onClose={() => setIntegrationModal(null)} title={integrationModal}>
          <p>{t('profile.integration.comingSoon', { name: integrationModal })}</p>
          <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text2)', marginTop: 'var(--spacing-sm)' }}>
            {t('profile.integration.emailHint')}
          </p>
          <input
            type="email"
            placeholder="your@email.com"
            className="profile-email-input"
            value={integrationEmail}
            onChange={(e) => setIntegrationEmail(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
            <button className="btn" onClick={() => setIntegrationModal(null)}>{t('profile.close')}</button>
            <button className="btn btn-accent" onClick={async () => {
              if (integrationEmail) {
                const { saveWaitlistEntry } = await import('../../data/storage.js');
                await saveWaitlistEntry(integrationEmail, integrationModal);
                setIntegrationModal(null);
                setIntegrationEmail('');
              }
            }}>{t('profile.save')}</button>
          </div>
        </Modal>
      )}

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <Modal isOpen onClose={() => setShowResetConfirm(false)} title={t('profile.confirmDelete')}>
          <p>{t('profile.confirmDeleteDesc')}</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
            <button className="btn" onClick={() => setShowResetConfirm(false)}>{t('profile.settings.cancel')}</button>
            <button className="btn btn-red" onClick={async () => { await confirmResetData(); setShowResetConfirm(false); }}>{t('profile.data.delete')}</button>
          </div>
        </Modal>
      )}

      {/* ── Backup List Modal ── */}
      {showBackupList && (
        <Modal isOpen onClose={() => setShowBackupList(false)} title={t('profile.data.backups')}>
          {backupList.length === 0
            ? <p>{t('profile.data.noBackups')}</p>
            : <div className="profile-backup-list">
                {backupList.map(b => (
                  <div key={b.id} className="profile-backup-item">
                    <span>{b.label}</span>
                    <button className="btn btn-sm" onClick={() => { setBackupToRestore(b.id); setShowBackupList(false); }}>
                      {t('profile.data.restore')}
                    </button>
                  </div>
                ))}
              </div>
          }
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
            <button className="btn" onClick={() => setShowBackupList(false)}>{t('profile.close')}</button>
          </div>
        </Modal>
      )}

      {/* ── Backup Restore Confirmation Modal ── */}
      {backupToRestore !== null && (
        <Modal isOpen onClose={() => setBackupToRestore(null)} title={t('profile.data.restoreConfirm')}>
          <p>{t('profile.data.restoreWarning')}</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
            <button className="btn" onClick={() => setBackupToRestore(null)}>{t('profile.settings.cancel')}</button>
            <button className="btn btn-accent" onClick={async () => {
              const bid = backupToRestore;
              if (bid === null) return;
              setBackupToRestore(null);
              await handleRestoreBackup(bid);
            }}>{t('profile.data.restore')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
