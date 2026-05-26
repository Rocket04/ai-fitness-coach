// Pattern for extracting shared localStorage utilities in PWA projects
// Use this to deduplicate storage patterns and improve type safety

export function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Usage example:
interface TourStorage {
  hasCompletedTour: boolean;
  completedSteps: number[];
}

const savedState = getFromStorage<TourStorage>('tour-state-v2', { 
  hasCompletedTour: false, 
  completedSteps: [] 
});