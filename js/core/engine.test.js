// js/core/engine.test.js
// Юнит-тесты для чистых функций engine.js
// Запуск: node js/core/engine.test.js

const assert = require('assert');

(async function run() {
  const { calculateRecoveryScore, calcReadiness, detectRecoveryDebt, getWorkoutType } = await import('./engine.js');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  // ════════════════════════════════════════════════════════════
  // calculateRecoveryScore
  // ════════════════════════════════════════════════════════════
  console.log('\ncalculateRecoveryScore');

  test('возвращает 100 при идеальных показателях', () => {
    const baselineCheckins = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(2 + i).padStart(2, '0')}`,
      hrv: 70,
      restHR: 70,
    }));
    const checkin = {
      date: '2025-01-16',
      sleepHours: 8,
      hrv: 80,
      restHR: 60,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'ok',
      muscleSoreness: 0,
      energy: 5,
      mood: 5,
      sleepQuality: 5,
      stress: 0,
    };
    const score = calculateRecoveryScore(checkin, baselineCheckins);
    assert.strictEqual(score, 100, `ожидался 100, получен ${score}`);
  });

  test('возвращает меньше 40 при критических показателях', () => {
    const baselineCheckins = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(2 + i).padStart(2, '0')}`,
      hrv: 70,
      restHR: 60,
    }));
    const checkin = {
      date: '2025-01-16',
      sleepHours: 5.5,
      hrv: 35,
      restHR: 78,
      hipPain: 5,
      shoulderPain: 0,
      breathing: 'bad',
      muscleSoreness: 4,
      energy: 1,
      mood: 1,
      sleepQuality: 1,
      stress: 5,
    };
    const score = calculateRecoveryScore(checkin, baselineCheckins);
    assert.ok(score < 40, `ожидался score < 40, получен ${score}`);
  });

  // ════════════════════════════════════════════════════════════
  // calcReadiness
  // ════════════════════════════════════════════════════════════
  console.log('\ncalcReadiness');

  test('зелёный при хороших данных', () => {
    const checkin = {
      sleepHours: 8,
      restHR: 60,
      hrv: 70,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'ok',
      muscleSoreness: 0,
      energy: 5,
      mood: 5,
      sleepQuality: 5,
      stress: 0,
    };
    assert.strictEqual(calcReadiness(checkin), 'green');
  });

  test('красный при плохих данных', () => {
    const checkin = {
      sleepHours: 5,
      restHR: 80,
      hrv: 30,
      hipPain: 5,
      shoulderPain: 5,
      breathing: 'bad',
      muscleSoreness: 5,
      energy: 1,
      mood: 1,
      sleepQuality: 1,
      stress: 5,
    };
    assert.strictEqual(calcReadiness(checkin), 'red');
  });

  test('жёлтый при пограничных показателях', () => {
    const checkin = {
      sleepHours: 6.5,
      restHR: 72,
      hrv: 50,
      hipPain: 3,
      shoulderPain: 0,
      breathing: 'mild',
      muscleSoreness: 4,
      energy: 2,
      mood: 2,
      sleepQuality: 2,
      stress: 4,
    };
    assert.strictEqual(calcReadiness(checkin), 'yellow');
  });

  test('жёлтый не перекрывает красный', () => {
    const checkin = {
      sleepHours: 5.5,
      restHR: 72,
      hrv: 50,
      hipPain: 3,
      shoulderPain: 0,
      breathing: 'mild',
      muscleSoreness: 4,
      energy: 2,
      mood: 2,
      sleepQuality: 2,
      stress: 4,
    };
    assert.strictEqual(calcReadiness(checkin), 'red');
  });

  // ════════════════════════════════════════════════════════════
  // detectRecoveryDebt
  // ════════════════════════════════════════════════════════════
  console.log('\ndetectRecoveryDebt');

  test('3 дня хороших показателей → false', () => {
    const good = {
      sleepHours: 8,
      restHR: 60,
      hrv: 70,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'ok',
      muscleSoreness: 0,
      energy: 5,
      mood: 5,
      sleepQuality: 5,
      stress: 0,
    };
    const result = detectRecoveryDebt([good, good, good]);
    assert.strictEqual(result, false);
  });

  test('3 дня плохих показателей → true', () => {
    const bad = {
      sleepHours: 5,
      restHR: 80,
      hrv: 30,
      hipPain: 5,
      shoulderPain: 5,
      breathing: 'bad',
      muscleSoreness: 5,
      energy: 1,
      mood: 1,
      sleepQuality: 1,
      stress: 5,
    };
    const result = detectRecoveryDebt([bad, bad, bad]);
    assert.strictEqual(result, true);
  });

  test('пустой массив → false', () => {
    assert.strictEqual(detectRecoveryDebt([]), false);
  });

  test('массив с null → false', () => {
    assert.strictEqual(detectRecoveryDebt([null, null, null]), false);
  });

  test('смешанные данные (1 bad + 2 good) → true', () => {
    const good = {
      sleepHours: 8,
      restHR: 60,
      hrv: 70,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'ok',
      muscleSoreness: 0,
      energy: 5,
      mood: 5,
      sleepQuality: 5,
      stress: 0,
    };
    const bad = {
      sleepHours: 5,
      restHR: 80,
      hrv: 30,
      hipPain: 5,
      shoulderPain: 5,
      breathing: 'bad',
      muscleSoreness: 5,
      energy: 1,
      mood: 1,
      sleepQuality: 1,
      stress: 5,
    };
    assert.strictEqual(detectRecoveryDebt([bad, good, good]), true);
  });

  test('borderline: ровно 4 points → true', () => {
    const checkin = {
      sleepHours: 6,
      restHR: 71,
      hrv: 70,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'ok',
      muscleSoreness: 0,
      energy: 5,
      mood: 5,
      sleepQuality: 5,
      stress: 0,
    };
    // sleep 6 → <7 = +1, hr 71 → >=71 = +1. total 2 per day * 3 days = 6 >= 4
    assert.strictEqual(detectRecoveryDebt([checkin, checkin, checkin]), true);
  });

  // ════════════════════════════════════════════════════════════
  // getWorkoutType
  // ════════════════════════════════════════════════════════════
  console.log('\ngetWorkoutType');

  test('Пн с [1,3,5] → A', () => {
    assert.strictEqual(getWorkoutType(new Date('2025-01-13'), [1, 3, 5]), 'A');
  });

  test('Ср с [1,3,5] → B', () => {
    assert.strictEqual(getWorkoutType(new Date('2025-01-15'), [1, 3, 5]), 'B');
  });

  test('Пт с [1,3,5] → C', () => {
    assert.strictEqual(getWorkoutType(new Date('2025-01-17'), [1, 3, 5]), 'C');
  });

  test('Вс с [1,3,5] → null', () => {
    assert.strictEqual(getWorkoutType(new Date('2025-01-12'), [1, 3, 5]), null);
  });

  test('неотсортированные trainDays → тот же результат', () => {
    assert.strictEqual(getWorkoutType(new Date('2025-01-15'), [5, 1, 3]), 'B');
  });

  test('цикличность при 5 днях: Пн→A, Вт→B, Ср→C, Чт→A, Пт→B', () => {
    const days = [1, 2, 3, 4, 5];
    assert.strictEqual(getWorkoutType(new Date('2025-01-13'), days), 'A');
    assert.strictEqual(getWorkoutType(new Date('2025-01-14'), days), 'B');
    assert.strictEqual(getWorkoutType(new Date('2025-01-15'), days), 'C');
    assert.strictEqual(getWorkoutType(new Date('2025-01-16'), days), 'A');
    assert.strictEqual(getWorkoutType(new Date('2025-01-17'), days), 'B');
  });

  // ════════════════════════════════════════════════════════════
  // Итог
  // ════════════════════════════════════════════════════════════
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
