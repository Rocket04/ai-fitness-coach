/** Достижения: key + функция проверки */
const ACHIEVEMENTS = [
  {
    key: 'first_workout',
    test: sessions => sessions.some(s => s.completed),
  },
  {
    key: 'week_streak_3',
    test: sessions => {
      const completed = sessions.filter(s => s.completed).map(s => s.date).sort();
      if (completed.length < 3) return false;
      return completed.slice(-3).every((d, i, arr) => {
        if (i === 0) return true;
        const prev = new Date(arr[i - 1]);
        const cur = new Date(d);
        return (cur - prev) / 86400000 <= 2;
      });
    },
  },
  {
    key: 'green_week',
    test: (sessions, checkins) => {
      const greens = checkins.filter(c => c.readiness === 'green').length;
      return greens >= 5;
    },
  },
  {
    key: 'test_improved',
    test: sessions => {
      const tests = sessions.filter(s => s.testResults?.pullUps != null).sort((a, b) => a.date.localeCompare(b.date));
      if (tests.length < 2) return false;
      const last = tests[tests.length - 1].testResults.pullUps;
      const prev = tests[tests.length - 2].testResults.pullUps;
      return last > prev;
    },
  },
];

export default ACHIEVEMENTS;
