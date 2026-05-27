import '@testing-library/jest-dom';

// Polyfill ResizeObserver for jsdom (used by TrendChart and other responsive components)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  (window as any).ResizeObserver = ResizeObserverMock;
}
