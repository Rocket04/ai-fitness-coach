// js/shared/ui/GuidedTour.jsx
// Guided tour component with spotlight overlay and step navigation

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTourStore } from '../../domains/onboarding/useTourStore.js';
import { TOUR_STEPS, getStepNumber } from '../config/tour-steps.js';
import styles from './GuidedTour.module.css';

// Demo data for tour display
const DEMO_TREND_DATA = [
  { date: '2026-05-18', recoveryScore: 62, hrv: 48, restHR: 64, sleepHours: 6.5 },
  { date: '2026-05-19', recoveryScore: 68, hrv: 52, restHR: 62, sleepHours: 7.0 },
  { date: '2026-05-20', recoveryScore: 55, hrv: 45, restHR: 66, sleepHours: 6.0 },
  { date: '2026-05-21', recoveryScore: 72, hrv: 56, restHR: 60, sleepHours: 8.0 },
  { date: '2026-05-22', recoveryScore: 78, hrv: 60, restHR: 58, sleepHours: 7.5 },
  { date: '2026-05-23', recoveryScore: 70, hrv: 54, restHR: 61, sleepHours: 7.0 },
  { date: '2026-05-24', recoveryScore: 74, hrv: 57, restHR: 59, sleepHours: 8.0 },
];

const DEMO_SESSION = {
  type: 'A',
  exercises: [
    { n: 'Подтягивания параллельным хватом', s: '3', r: '6-8', w: 'НЕ до отказа', isApre: true, protocol: 'APRE_6', currentRM: 0 },
    { n: 'Австралийские подтягивания', s: '3', r: '8-10', w: 'Контроль негативной фазы' },
    { n: 'W-подъём лёжа на животе', s: '3', r: '10 медленно', w: 'Нижние трапеции' },
  ],
  mode: 'full',
  monthColor: '#4a7c59',
  label: 'Бег Z2 + Тяга',
};

function calculatePosition(targetRect, position, tooltipWidth, tooltipHeight) {
  const margin = 16;
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  let top, left;
  switch (position) {
    case 'top':
      top = targetRect.top + scrollY - tooltipHeight - margin;
      left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipWidth / 2);
      break;
    case 'bottom':
      top = targetRect.bottom + scrollY + margin;
      left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipWidth / 2);
      break;
    case 'left':
      top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.left + scrollX - tooltipWidth - margin;
      break;
    case 'right':
      top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.right + scrollX + margin;
      break;
    default:
      top = targetRect.bottom + scrollY + margin;
      left = targetRect.left + scrollX;
  }
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  if (left < margin) left = margin;
  if (left + tooltipWidth > viewportWidth - margin) left = viewportWidth - tooltipWidth - margin;
  if (top < scrollY + margin) top = targetRect.bottom + scrollY + margin;
  if (top + tooltipHeight > scrollY + viewportHeight - margin) top = targetRect.top + scrollY - tooltipHeight - margin;
  return { top, left };
}

function Spotlight({ target, allowInteraction }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    const updateRect = () => {
      const el = document.querySelector(target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
      }
    };
    updateRect();
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);
    return () => { window.removeEventListener('scroll', updateRect); window.removeEventListener('resize', updateRect); };
  }, [target]);
  if (!rect) return null;
  const p = 8;
  return React.createElement('div', { className: styles['tour-spotlight'], style: { position: 'absolute', top: rect.top - p, left: rect.left - p, width: rect.width + p * 2, height: rect.height + p * 2, borderRadius: 'var(--radius-lg)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)', pointerEvents: allowInteraction ? 'none' : 'auto', zIndex: 9998, transition: 'all 0.3s ease-out' } });
}

function TourTooltip({ t, onDemoData }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });
  const { isActive, currentStep, totalSteps, nextStep, prevStep, skipTour, endTour } = useTourStore();
  const step = TOUR_STEPS[currentStep];
  if (!step || !isActive) return null;

  useEffect(() => {
    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (target && tooltipRef.current) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        setTooltipSize({ width: tooltipRect.width, height: tooltipRect.height });
        setPosition(calculatePosition(targetRect, step.position, tooltipRect.width || 320, tooltipRect.height || 200));
        if (!step.noScroll) {
          const vh = window.innerHeight;
          if (targetRect.top < 0 || targetRect.bottom > vh) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };
    const timer = setTimeout(updatePosition, 50);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => { clearTimeout(timer); window.removeEventListener('scroll', updatePosition); window.removeEventListener('resize', updatePosition); };
  }, [currentStep, step]);

  useEffect(() => {
    if (step.demoData && onDemoData) onDemoData(currentStep);
  }, [currentStep, step.demoData, onDemoData]);

  useEffect(() => {
    const el = document.querySelector(step.target);
    if (el && step.pulseTarget) {
      el.classList.add(styles['tour-pulse-highlight']);
      return () => el.classList.remove(styles['tour-pulse-highlight']);
    }
  }, [currentStep, step.pulseTarget]);

  useEffect(() => {
    if (!step.highlightBorder) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.classList.add(styles['tour-highlight-border']);
      return () => el.classList.remove(styles['tour-highlight-border']);
    }
  }, [currentStep, step.highlightBorder]);

  useEffect(() => {
    if (!step.softDrop) return;
    const container = document.querySelector('.card-appear');
    if (container) {
      container.classList.add(styles['tour-sparkline-highlight']);
      return () => container.classList.remove(styles['tour-sparkline-highlight']);
    }
  }, [currentStep, step.softDrop]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return ReactDOM.createPortal(
    React.createElement(React.Fragment, null,
      React.createElement('div', { className: styles['tour-backdrop'], onClick: skipTour }),
      React.createElement(Spotlight, { target: step.target, allowInteraction: step.allowInteraction }),
      React.createElement('div', { ref: tooltipRef, className: styles['tour-tooltip'], style: { position: 'absolute', top: position.top, left: position.left, zIndex: 10000 } },
        React.createElement('div', { className: styles['tour-step-counter'] }, getStepNumber(currentStep)),
        React.createElement('h3', { className: styles['tour-title'] }, t ? t(step.i18nTitle) : 'Tour Step'),
        React.createElement('p', { className: styles['tour-content'] }, t ? t(step.i18nContent) : ''),
        React.createElement('div', { className: styles['tour-actions'] },
          !isFirst && React.createElement('button', { className: styles['tour-btn'] + ' ' + styles['tour-btn--secondary'], onClick: prevStep }, t ? t('tour.back') : '← Back'),
          React.createElement('button', { className: styles['tour-btn'] + ' ' + styles['tour-btn--primary'], onClick: isLast ? endTour : nextStep }, isLast ? (t ? t('tour.finish') : 'Finish') : (t ? t('tour.next') : 'Next →')),
          React.createElement('button', { className: styles['tour-btn'] + ' ' + styles['tour-btn--text'], onClick: skipTour }, t ? t('tour.skip') : 'Skip')
        )
      )
    ), document.body
  );
}

export default function GuidedTour({ t }) {
  const { isActive, startTour } = useTourStore();

  const handleDemoData = useCallback((stepIndex) => {
    window.dispatchEvent(new CustomEvent('tour-demo-data', { detail: { step: stepIndex } }));
  }, []);

  useEffect(() => {
    const handleHash = () => { if (window.location.hash === '#tour' && !isActive) startTour(); };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isActive, startTour]);

  if (!isActive) return null;
  return React.createElement(TourTooltip, { t, onDemoData: handleDemoData });
}