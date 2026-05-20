// js/ui/components/GuidedTour.jsx
// Guided tour component with spotlight overlay and step navigation

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTourStore } from '../../stores/useTourStore.js';
import { TOUR_STEPS, getStepNumber } from '../../config/tour-steps.js';

/**
 * Calculate position for the tooltip card
 * @param {DOMRect} targetRect
 * @param {string} position - 'top' | 'bottom' | 'left' | 'right'
 * @param {number} tooltipWidth
 * @param {number} tooltipHeight
 * @returns {{top: number, left: number}}
 */
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
  
  // Ensure tooltip stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (left < margin) left = margin;
  if (left + tooltipWidth > viewportWidth - margin) {
    left = viewportWidth - tooltipWidth - margin;
  }
  if (top < scrollY + margin) top = targetRect.bottom + scrollY + margin;
  if (top + tooltipHeight > scrollY + viewportHeight - margin) {
    top = targetRect.top + scrollY - tooltipHeight - margin;
  }
  
  return { top, left };
}

/**
 * Spotlight overlay that highlights the target element
 */
function Spotlight({ target, allowInteraction }) {
  const [rect, setRect] = useState(null);
  
  useEffect(() => {
    const updateRect = () => {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        setRect({
          top: rect.top + scrollY,
          left: rect.left + scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };
    
    updateRect();
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect);
    
    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [target]);
  
  if (!rect) return null;
  
  const padding = 8;
  const spotlightStyle = {
    position: 'absolute',
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2),
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
    pointerEvents: allowInteraction ? 'none' : 'auto',
    zIndex: 9998,
    transition: 'all 0.3s ease-out',
  };
  
  return React.createElement('div', {
    className: 'tour-spotlight',
    style: spotlightStyle,
  });
}

/**
 * Tour tooltip card with navigation
 */
function TourTooltip({ t }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });
  
  const { 
    isActive, 
    currentStep, 
    totalSteps, 
    nextStep, 
    prevStep, 
    skipTour, 
    endTour 
  } = useTourStore();
  
  const step = TOUR_STEPS[currentStep];
  if (!step || !isActive) return null;
  
  // Calculate tooltip position
  useEffect(() => {
    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (target && tooltipRef.current) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        setTooltipSize({ width: tooltipRect.width, height: tooltipRect.height });
        
        const pos = calculatePosition(
          targetRect, 
          step.position, 
          tooltipRect.width || 320, 
          tooltipRect.height || 200
        );
        setPosition(pos);
        
        // Scroll target into view if needed
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;
        if (targetRect.top < 0 || targetRect.bottom > viewportHeight) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    
    // Delay to allow tooltip to render first
    const timer = setTimeout(updatePosition, 50);
    
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, step]);
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  const tooltipContent = React.createElement('div', {
    ref: tooltipRef,
    className: 'tour-tooltip',
    style: {
      position: 'absolute',
      top: position.top,
      left: position.left,
      zIndex: 10000,
    },
  },
    // Step counter
    React.createElement('div', { className: 'tour-step-counter' },
      getStepNumber(currentStep)
    ),
    
    // Title
    React.createElement('h3', { className: 'tour-title' },
      t ? t(step.i18nTitle) : 'Tour Step'
    ),
    
    // Content
    React.createElement('p', { className: 'tour-content' },
      t ? t(step.i18nContent) : ''
    ),
    
    // Navigation buttons
    React.createElement('div', { className: 'tour-actions' },
      !isFirstStep && React.createElement('button', {
        className: 'tour-btn tour-btn--secondary',
        onClick: prevStep,
      }, t ? t('tour.back') : '← Back'),
      
      React.createElement('button', {
        className: 'tour-btn tour-btn--primary',
        onClick: isLastStep ? endTour : nextStep,
      }, isLastStep 
        ? (t ? t('tour.finish') : 'Finish') 
        : (t ? t('tour.next') : 'Next →')
      ),
      
      React.createElement('button', {
        className: 'tour-btn tour-btn--text',
        onClick: skipTour,
      }, t ? t('tour.skip') : 'Skip')
    )
  );
  
  return ReactDOM.createPortal(
    React.createElement(React.Fragment, null,
      // Backdrop overlay
      React.createElement('div', {
        className: 'tour-backdrop',
        onClick: skipTour,
      }),
      // Spotlight
      React.createElement(Spotlight, {
        target: step.target,
        allowInteraction: step.allowInteraction,
      }),
      // Tooltip
      tooltipContent
    ),
    document.body
  );
}

/**
 * Main GuidedTour component
 * @param {{t: Function}} props - i18n translation function
 */
export default function GuidedTour({ t }) {
  const { isActive } = useTourStore();
  
  if (!isActive) return null;
  
  return React.createElement(TourTooltip, { t });
}
