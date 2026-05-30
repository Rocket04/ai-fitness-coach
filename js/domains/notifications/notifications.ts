export const NOTIFY_TIME_KEY = 'fitness-tracker-notify-time';
export const NOTIFY_ENABLED_KEY = 'fitness-tracker-notify-enabled';

export async function registerNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showDailyReminder(checkinDone: boolean, time: string): void {
  if (checkinDone) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const enabled = getStoredNotifyEnabled();
  if (!enabled) return;

  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  let msUntilTarget = target.getTime() - now.getTime();
  if (msUntilTarget <= 0) {
    msUntilTarget = 0;
  }

  if (msUntilTarget === 0) {
    new Notification('Утренний check-in', {
      body: 'Открой приложение и заполни чек-ин — 30 секунд',
      icon: '/icon-192.png',
      tag: 'daily-checkin',
    });
  } else {
    const timerId = setTimeout(() => {
      new Notification('Утренний check-in', {
        body: 'Открой приложение и заполни чек-ин — 30 секунд',
        icon: '/icon-192.png',
        tag: 'daily-checkin',
      });
    }, msUntilTarget);
    window.__dailyCheckinTimer = timerId;
  }
}

export function cancelDailyReminder(): void {
  if (window.__dailyCheckinTimer) {
    clearTimeout(window.__dailyCheckinTimer);
    delete window.__dailyCheckinTimer;
  }
}

export function showMondaySummary(body?: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification('Итоги недели', {
    body: body || 'Твой прогресс за неделю уже в приложении →',
    icon: '/icon-192.png',
    tag: 'monday-summary',
  });
}

function getStoredNotifyEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIFY_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getStoredNotifyTime(): string {
  try {
    const stored = localStorage.getItem(NOTIFY_TIME_KEY);
    return stored && /^\d{2}:\d{2}$/.test(stored) ? stored : '07:30';
  } catch {
    return '07:30';
  }
}

export function saveNotifyTime(time: string): void {
  try {
    localStorage.setItem(NOTIFY_TIME_KEY, time);
  } catch {
    // localStorage unavailable
  }
}

export function saveNotifyEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFY_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage unavailable
  }
}

declare global {
  interface Window {
    __dailyCheckinTimer?: ReturnType<typeof setTimeout>;
  }
}
