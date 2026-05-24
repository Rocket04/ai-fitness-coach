// js/config/achievements.js
// Gamification: 15+ achievements with bronze/silver/gold tiers

/**
 * Achievement tier definitions
 */
export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
};

/**
 * Achievement categories for grouping
 */
export const ACHIEVEMENT_CATEGORIES = {
  CHECKIN: 'checkin',
  WORKOUT: 'workout',
  STREAK: 'streak',
  RECOVERY: 'recovery',
  TEST: 'test',
  CONSISTENCY: 'consistency',
};

/**
 * Achievement definition structure:
 * - key: unique identifier (category_tier_name)
 * - name: human-readable name (for i18n later)
 * - tier: bronze | silver | gold
 * - category: checkin | workout | streak | recovery | test | consistency
 * - icon: emoji or icon name for display
 * - test: function that returns true when achievement is unlocked
 * - progress: optional function returning { current, target } for progress bar
 */
const ACHIEVEMENTS = [
  // ============================================
  // CHECK-IN ACHIEVEMENTS
  // ============================================
  
  // Bronze: First check-in
  {
    key: 'checkin_first',
    name: 'First Check-in',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.CHECKIN,
    icon: '🎯',
    description: 'Complete your first daily check-in',
    test: (_, checkins) => checkins.length >= 1,
    progress: (_, checkins) => ({ current: checkins.length, target: 1 }),
  },
  
  // Bronze: 7 check-ins
  {
    key: 'checkin_week',
    name: 'Week of Tracking',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.CHECKIN,
    icon: '📅',
    description: 'Complete 7 daily check-ins',
    test: (_, checkins) => checkins.length >= 7,
    progress: (_, checkins) => ({ current: checkins.length, target: 7 }),
  },
  
  // Silver: 30 check-ins
  {
    key: 'checkin_month',
    name: 'Monthly Tracker',
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: ACHIEVEMENT_CATEGORIES.CHECKIN,
    icon: '📊',
    description: 'Complete 30 daily check-ins',
    test: (_, checkins) => checkins.length >= 30,
    progress: (_, checkins) => ({ current: checkins.length, target: 30 }),
  },
  
  // Gold: 100 check-ins
  {
    key: 'checkin_century',
    name: 'Century of Tracking',
    tier: ACHIEVEMENT_TIERS.GOLD,
    category: ACHIEVEMENT_CATEGORIES.CHECKIN,
    icon: '🏆',
    description: 'Complete 100 daily check-ins',
    test: (_, checkins) => checkins.length >= 100,
    progress: (_, checkins) => ({ current: checkins.length, target: 100 }),
  },

  // ============================================
  // WORKOUT ACHIEVEMENTS
  // ============================================
  
  // Bronze: First workout
  {
    key: 'workout_first',
    name: 'First Workout',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.WORKOUT,
    icon: '💪',
    description: 'Complete your first workout',
    test: sessions => sessions.some(s => s.completed && s.type !== 'morning' && s.type !== 'evening'),
  },
  
  // Bronze: 3 workouts
  {
    key: 'workout_trio',
    name: 'Workout Trio',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.WORKOUT,
    icon: '🔥',
    description: 'Complete 3 workouts',
    test: sessions => sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').length >= 3,
    progress: sessions => ({ 
      current: sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').length, 
      target: 3 
    }),
  },
  
  // Silver: 15 workouts
  {
    key: 'workout_dedicated',
    name: 'Dedicated Athlete',
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: ACHIEVEMENT_CATEGORIES.WORKOUT,
    icon: '⚡',
    description: 'Complete 15 workouts',
    test: sessions => sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').length >= 15,
    progress: sessions => ({ 
      current: sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').length, 
      target: 15 
    }),
  },
  
  // Gold: 50 workouts
  {
    key: 'workout_veteran',
    name: 'Training Veteran',
    tier: ACHIEVEMENT_TIERS.GOLD,
    category: ACHIEVEMENT_CATEGORIES.WORKOUT,
    icon: '🏋️',
    description: 'Complete 50 workouts',
    test: sessions => sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').length >= 50,
    progress: sessions => ({ 
      current: sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').length, 
      target: 50 
    }),
  },

  // ============================================
  // STREAK ACHIEVEMENTS
  // ============================================
  
  // Bronze: 3-day check-in streak
  {
    key: 'streak_checkin_3',
    name: 'On a Roll',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    icon: '🔥',
    description: 'Maintain a 3-day check-in streak',
    test: (_, __, streak) => streak >= 3,
    progress: (_, __, streak) => ({ current: streak, target: 3 }),
  },
  
  // Silver: 7-day check-in streak
  {
    key: 'streak_checkin_7',
    name: 'Weekly Warrior',
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    icon: '🔥🔥',
    description: 'Maintain a 7-day check-in streak',
    test: (_, streak) => streak >= 7,
    progress: (_, streak) => ({ current: streak, target: 7 }),
  },
  
  // Gold: 30-day check-in streak
  {
    key: 'streak_checkin_30',
    name: 'Month of Mastery',
    tier: ACHIEVEMENT_TIERS.GOLD,
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    icon: '🔥🔥🔥',
    description: 'Maintain a 30-day check-in streak',
    test: (_, streak) => streak >= 30,
    progress: (_, streak) => ({ current: streak, target: 30 }),
  },

  // ============================================
  // RECOVERY ACHIEVEMENTS
  // ============================================
  
  // Bronze: 5 green days
  {
    key: 'recovery_green_start',
    name: 'Green Light',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.RECOVERY,
    icon: '💚',
    description: 'Achieve 5 green readiness days',
    test: (_, checkins) => checkins.filter(c => c.readiness === 'green').length >= 5,
    progress: (_, checkins) => ({ current: checkins.filter(c => c.readiness === 'green').length, target: 5 }),
  },
  
  // Silver: 15 green days
  {
    key: 'recovery_green_15',
    name: 'Recovery Pro',
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: ACHIEVEMENT_CATEGORIES.RECOVERY,
    icon: '💚💚',
    description: 'Achieve 15 green readiness days',
    test: checkins => checkins.filter(c => c.readiness === 'green').length >= 15,
    progress: checkins => ({ current: checkins.filter(c => c.readiness === 'green').length, target: 15 }),
  },
  
  // Gold: 30 green days
  {
    key: 'recovery_green_30',
    name: 'Recovery Master',
    tier: ACHIEVEMENT_TIERS.GOLD,
    category: ACHIEVEMENT_CATEGORIES.RECOVERY,
    icon: '💚💚💚',
    description: 'Achieve 30 green readiness days',
    test: checkins => checkins.filter(c => c.readiness === 'green').length >= 30,
    progress: checkins => ({ current: checkins.filter(c => c.readiness === 'green').length, target: 30 }),
  },

  // ============================================
  // TEST ACHIEVEMENTS
  // ============================================
  
  // Bronze: First test
  {
    key: 'test_first',
    name: 'Baseline Set',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.TEST,
    icon: '📝',
    description: 'Record your first fitness test results',
    test: sessions => sessions.some(s => s.testResults && (s.testResults.pullUps > 0 || s.testResults.pushUps > 0 || s.testResults.plankSec > 0)),
  },
  
  // Silver: Improved test
  {
    key: 'test_improved',
    name: 'Progress Proof',
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: ACHIEVEMENT_CATEGORIES.TEST,
    icon: '📈',
    description: 'Improve your test results compared to previous',
    test: sessions => {
      const tests = sessions
        .filter(s => s.testResults?.pullUps != null)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (tests.length < 2) return false;
      const last = tests[tests.length - 1].testResults.pullUps;
      const prev = tests[tests.length - 2].testResults.pullUps;
      return last > prev;
    },
  },

  // Gold: 100 push-ups
  {
    key: 'test_pushup_100',
    name: 'Push-up Champion',
    tier: ACHIEVEMENT_TIERS.GOLD,
    category: ACHIEVEMENT_CATEGORIES.TEST,
    icon: '💯',
    description: 'Achieve 100 push-ups in a single test',
    test: sessions => {
      const best = sessions
        .filter(s => s.testResults && s.testResults.pushUps != null)
        .reduce((max, s) => Math.max(max, s.testResults.pushUps), 0);
      return best >= 100;
    },
    progress: sessions => {
      const best = sessions
        .filter(s => s.testResults && s.testResults.pushUps != null)
        .reduce((max, s) => Math.max(max, s.testResults.pushUps), 0);
      return { current: best, target: 100 };
    },
  },

  // ============================================
  // CONSISTENCY ACHIEVEMENTS
  // ============================================
  
  // Bronze: Full week training
  {
    key: 'consistency_week',
    name: 'Weekly Consistency',
    tier: ACHIEVEMENT_TIERS.BRONZE,
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    icon: '📆',
    description: 'Complete all planned workouts in a single week',
    test: sessions => {
      const byWeek = {};
      for (const s of sessions) {
        if (!s.completed || s.type === 'morning' || s.type === 'evening') continue;
        const weekNum = Math.floor(new Date(s.date).getTime() / (7 * 86400000));
        if (!byWeek[weekNum]) byWeek[weekNum] = { completed: 0, total: 0 };
        byWeek[weekNum].completed++;
      }
      // Check if any week has 3+ completed workouts (assuming 3 training days per week)
      return Object.values(byWeek).some(w => w.completed >= 3);
    },
  },
  
  // Silver: Perfect month streak (training + checkins)
  {
    key: 'consistency_perfect_month',
    name: 'Perfect Month',
    tier: ACHIEVEMENT_TIERS.SILVER,
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    icon: '🌟',
    description: 'Complete all training sessions and check-ins for 30 days',
    test: (sessions, checkins) => {
      if (checkins.length < 30) return false;
      const checkinDates = new Set(checkins.map(c => c.date));
      const sessionDates = new Set(
        sessions.filter(s => s.completed && s.type !== 'morning' && s.type !== 'evening').map(s => s.date)
      );
      // Check if there's a 30-day period with all checkins and all trainings
      for (let i = 0; i <= checkins.length - 30; i++) {
        let valid = true;
        for (let j = 0; j < 30; j++) {
          const date = checkins[i + j]?.date;
          if (!date || !checkinDates.has(date) || !sessionDates.has(date)) {
            valid = false;
            break;
          }
        }
        if (valid) return true;
      }
      return false;
    },
  },
];

export default ACHIEVEMENTS;