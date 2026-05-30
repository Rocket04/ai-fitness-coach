// js/shared/config/tour-steps.js
// Guided tour step definitions

/** @type {TourStep[]} */
export const TOUR_STEPS = [
  {
    target: '.card--hero',
    i18nTitle: 'tour.step1.title',
    i18nContent: 'tour.step1.content',
    position: 'top',
    allowInteraction: true,
    pulseTarget: true,
  },
  {
    target: '.sparkline-card',
    i18nTitle: 'tour.step2.title',
    i18nContent: 'tour.step2.content',
    position: 'bottom',
    allowInteraction: false,
    demoData: true,
    highlightBorder: true,
    softDrop: true,
  },
  {
    target: '.training-header, .rest-day-card',
    i18nTitle: 'tour.step3.title',
    i18nContent: 'tour.step3.content',
    position: 'bottom',
    allowInteraction: true,
    demoData: true,
    highlightBorder: true,
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
    noScroll: true,
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

export function getTotalSteps() {
  return TOUR_STEPS.length;
}

export function getStep(index) {
  return TOUR_STEPS[index];
}

export function getStepNumber(index) {
  return `${index + 1} / ${TOUR_STEPS.length}`;
}

export default TOUR_STEPS;
