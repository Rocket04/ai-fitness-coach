// js/config/tour-steps.js
// Guided tour step definitions
// Each step targets a CSS selector and provides i18n keys for content

/**
 * @typedef {Object} TourStep
 * @property {string} target - CSS selector for the element to highlight
 * @property {string} i18nTitle - i18n key for the step title
 * @property {string} i18nContent - i18n key for the step description
 * @property {'top'|'bottom'|'left'|'right'} position - Tooltip position relative to target
 * @property {boolean} [allowInteraction] - Whether user can interact with the highlighted element
 */

/** @type {TourStep[]} */
export const TOUR_STEPS = [
  {
    target: '.card--hero',
    i18nTitle: 'tour.step1.title',
    i18nContent: 'tour.step1.content',
    position: 'bottom',
    allowInteraction: true,
  },
  {
    target: '.sparkline-card',
    i18nTitle: 'tour.step2.title',
    i18nContent: 'tour.step2.content',
    position: 'bottom',
    allowInteraction: false,
  },
  {
    target: '.training-header, .rest-day-card',
    i18nTitle: 'tour.step3.title',
    i18nContent: 'tour.step3.content',
    position: 'bottom',
    allowInteraction: true,
  },
  {
    target: '.exercise-row--apre, .exercise-card',
    i18nTitle: 'tour.step4.title',
    i18nContent: 'tour.step4.content',
    position: 'top',
    allowInteraction: true,
  },
  {
    target: 'input[type="range"]',
    i18nTitle: 'tour.step5.title',
    i18nContent: 'tour.step5.content',
    position: 'left',
    allowInteraction: true,
  },
  {
    target: '.quick-action-toggle',
    i18nTitle: 'tour.step6.title',
    i18nContent: 'tour.step6.content',
    position: 'top',
    allowInteraction: true,
  },
  {
    target: '.tomorrow-card',
    i18nTitle: 'tour.step7.title',
    i18nContent: 'tour.step7.content',
    position: 'top',
    allowInteraction: false,
  },
  {
    target: '.bottom-nav',
    i18nTitle: 'tour.step8.title',
    i18nContent: 'tour.step8.content',
    position: 'top',
    allowInteraction: true,
  },
];

/**
 * Get total number of tour steps
 * @returns {number}
 */
export function getTotalSteps() {
  return TOUR_STEPS.length;
}

/**
 * Get a specific step by index
 * @param {number} index - Step index (0-based)
 * @returns {TourStep | undefined}
 */
export function getStep(index) {
  return TOUR_STEPS[index];
}

/**
 * Get step number formatted for display (1-based)
 * @param {number} index - Step index (0-based)
 * @returns {string}
 */
export function getStepNumber(index) {
  return `${index + 1} / ${TOUR_STEPS.length}`;
}

export default TOUR_STEPS;
