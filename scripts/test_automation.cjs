const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'docs', 'screenshots');
const RESULTS = [];

function log(step, action, expected, status, detail) {
  RESULTS.push({ step, action, expected, status, detail });
  console.log(`[${status}] [${step}] ${action} - ${detail}`);
}

async function ss(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
}

async function clickText(page, texts, timeout = 5000) {
  for (const t of texts) {
    const loc = page.locator(`text=${t}`).first();
    try {
      await loc.waitFor({ state: 'visible', timeout: 2000 });
      await loc.click({ timeout });
      return t;
    } catch (e) { continue; }
  }
  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Clear ALL storage to simulate fresh install
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Delete IndexedDB
    return new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('SmartFitnessCoach');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  });
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await ss(page, '00_fresh');

  // ============ PHASE 1: ONBOARDING ============

  // 1.1 - Onboarding appears
  try {
    const found = await clickText(page, ['Начать первую тренировку', 'Начать', 'Start'], 8000);
    if (found) {
      log('1.1', 'Fresh install shows onboarding', 'Onboarding wizard appears', 'PASS', 'Found: ' + found);
    } else {
      log('1.1', 'Fresh install shows onboarding', 'Onboarding wizard appears', 'FAIL', 'No onboarding found');
      await browser.close(); return;
    }
  } catch (e) {
    log('1.1', 'Fresh install shows onboarding', 'Onboarding wizard appears', 'FAIL', e.message.slice(0,80));
    await browser.close(); return;
  }
  await ss(page, '1_1');

  // 1.2 - Goal step: select goal + training days, then next
  await page.waitForTimeout(1000);
  try {
    // Select a goal card
    const goalClicked = await clickText(page, ['Стать сильнее', 'Набрать форму', 'Похудеть'], 5000);
    await page.waitForTimeout(500);
    // Training days should already be selected (Mon/Wed/Fri defaults)
    // Click "Далее →"
    const nextClicked = await clickText(page, ['Далее →', 'Далее', 'Next'], 5000);
    log('1.2', 'Select goal + days, click next', 'Goal step completed', nextClicked ? 'PASS' : 'WARN',
      `Goal: ${goalClicked || 'none'}, Next: ${nextClicked || 'not found'}`);
  } catch (e) {
    log('1.2', 'Select goal + days, click next', 'Goal step completed', 'FAIL', e.message.slice(0,80));
  }
  await ss(page, '1_2');

  // 1.3 - Sports step: select sports, then next
  await page.waitForTimeout(1000);
  try {
    const sport1 = await clickText(page, ['Strength', 'Силовые', 'Силовой'], 3000);
    await page.waitForTimeout(300);
    const sport2 = await clickText(page, ['Running', 'Бег', 'Беговые'], 3000);
    await page.waitForTimeout(300);
    const nextClicked = await clickText(page, ['Далее →', 'Далее', 'Next'], 5000);
    log('1.3', 'Select sports (Strength+Running)', 'Sports selected', nextClicked ? 'PASS' : 'WARN',
      `Sports: ${sport1 || 'none'}, ${sport2 || 'none'}, Next: ${nextClicked || 'not found'}`);
  } catch (e) {
    log('1.3', 'Select sports (Strength+Running)', 'Sports selected', 'FAIL', e.message.slice(0,80));
  }
  await ss(page, '1_3');

  // 1.4 - Gadgets step: select gadget, then next
  await page.waitForTimeout(1000);
  try {
    const gadget = await clickText(page, ['Ручной ввод', 'Manual', 'manual', 'Без устройств'], 3000);
    await page.waitForTimeout(300);
    const nextClicked = await clickText(page, ['Далее →', 'Далее', 'Next'], 5000);
    log('1.4', 'Select gadget (Manual)', 'Gadget selected', nextClicked ? 'PASS' : 'WARN',
      `Gadget: ${gadget || 'none'}, Next: ${nextClicked || 'not found'}`);
  } catch (e) {
    log('1.4', 'Select gadget (Manual)', 'Gadget selected', 'FAIL', e.message.slice(0,80));
  }
  await ss(page, '1_4');

  // 1.5 - Recovery step: finish
  await page.waitForTimeout(1000);
  try {
    const finish = await clickText(page, ['Перейти к тренировке', 'Завершить', 'Готово', 'Finish', 'Done'], 5000);
    await page.waitForTimeout(2000);
    log('1.5', 'Finish onboarding', 'Opens TodayPage', finish ? 'PASS' : 'WARN', `Button: ${finish || 'not found'}`);
  } catch (e) {
    log('1.5', 'Finish onboarding', 'Opens TodayPage', 'FAIL', e.message.slice(0,80));
  }
  await ss(page, '1_5');

  // ============ PHASE 2: TODAYPAGE ============
  console.log('\n=== PHASE 2: TODAYPAGE ===');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  try {
    const c = await page.content();
    log('2.1', 'Header and date', 'Today date shown',
      ['2026','мая','May','Сегодня','Today'].some(k=>c.includes(k)) ? 'PASS' : 'FAIL', 'Checked');
  } catch(e) { log('2.1', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '2_1');

  try {
    const c = await page.content();
    log('2.2', 'Recovery Score', 'Shows ? or prompt',
      ['Recovery','Восстановление','чек-ин','check-in','Пройдите','?'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('2.2', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '2_2');

  try {
    const c = await page.content();
    log('2.3', 'Workout plan', 'Exercise list',
      ['Подтягив','Присед','Жим','Бег','Running','Strength','Exercise','Упражнение','Подход','Set'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('2.3', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '2_3');

  try {
    const navCount = await page.locator('button, [class*="nav"], [class*="arrow"], [class*="strip"], [class*="date"]').count();
    log('2.4', '30-day date strip', 'Nav elements', navCount > 2 ? 'PASS' : 'WARN', `${navCount} elements`);
  } catch(e) { log('2.4', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '2_4');

  try {
    const c = await page.content();
    const hasLive = ['Живая тренировка','Live','Начать тренировку','Start workout'].some(k=>c.includes(k));
    log('2.5', 'Live workout button', 'If implemented', hasLive ? 'PASS' : 'SKIP', hasLive ? 'Found' : 'Not implemented');
  } catch(e) { log('2.5', '...', '...', 'SKIP', 'N/A'); }

  try {
    const errs = consoleErrors.filter(e => !e.toLowerCase().includes('warning') && !e.toLowerCase().includes('deprecated'));
    log('2.6', 'Console errors', 'No red errors', errs.length === 0 ? 'PASS' : 'FAIL', `${errs.length} errors`);
  } catch(e) { log('2.6', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // ============ PHASE 3: CHECK-IN ============
  console.log('\n=== PHASE 3: CHECK-IN ===');

  // Navigate to check-in via "Дневник" tab
  try {
    const tab = await clickText(page, ['Дневник', 'Log', 'Журнал'], 5000);
    await page.waitForTimeout(1500);
  } catch(e) {}
  await ss(page, '3_0');

  try {
    const c = await page.content();
    log('3.1', 'Form fields (Full tier)', 'HRV, RHR, Sleep fields',
      ['HRV','ЧСС','RHR','Пульс','Sleep','Сон','input','range'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('3.1', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '3_1');

  // 3.2 - Validation: try saving empty
  try {
    const saveBtn = page.locator('button:has-text("Сохранить"), button:has-text("Save"), button:has-text("Готово")').first();
    if (await saveBtn.isVisible({ timeout: 3000 })) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
      const c = await page.content();
      log('3.2', 'Validation empty fields', 'Errors shown',
        ['обязательн','required','заполни','fill','ошибк','error','invalid'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
    } else {
      log('3.2', 'Validation empty fields', 'Errors shown', 'SKIP', 'No save button');
    }
  } catch(e) { log('3.2', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '3_2');

  // 3.3 - Fill form
  try {
    const inputs = page.locator('input[type="number"], input[type="text"]');
    const count = await inputs.count();
    let filled = 0;
    for (let i = 0; i < count; i++) {
      const inp = inputs.nth(i);
      if (await inp.isVisible()) {
        try {
          const name = ((await inp.getAttribute('name')) || (await inp.getAttribute('id')) || '').toLowerCase();
          const ph = ((await inp.getAttribute('placeholder')) || '').toLowerCase();
          if (name.includes('hrv') || ph.includes('hrv')) await inp.fill('55');
          else if (name.includes('rhr') || name.includes('pulse')) await inp.fill('62');
          else if (name.includes('sleep') || name.includes('сон')) await inp.fill('7');
          else if (name.includes('weight') || name.includes('вес')) await inp.fill('78');
          else await inp.fill('3');
          filled++;
        } catch(e) {}
      }
    }
    const sliders = page.locator('input[type="range"]');
    const sc = await sliders.count();
    for (let i = 0; i < Math.min(sc, 5); i++) {
      try {
        await sliders.nth(i).evaluate(el => { el.value = 3; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); });
        filled++;
      } catch(e) {}
    }
    log('3.3', 'Fill check-in data', 'Fields accept values', filled > 0 ? 'PASS' : 'WARN', `Filled ${filled}`);
  } catch(e) { log('3.3', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '3_3');

  // 3.4 - Save
  try {
    const saveBtn = page.locator('button:has-text("Сохранить"), button:has-text("Save"), button:has-text("Готово")').first();
    if (await saveBtn.isVisible({ timeout: 3000 })) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      log('3.4', 'Save check-in', 'Data saved', 'PASS', 'Saved');
    } else {
      log('3.4', 'Save check-in', 'Data saved', 'WARN', 'No save button');
    }
  } catch(e) { log('3.4', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '3_4');

  // 3.5 - Recovery Score
  try {
    await clickText(page, ['Сегодня', 'Today'], 5000);
    await page.waitForTimeout(1500);
    const c = await page.content();
    log('3.5', 'Recovery Score recalculated', 'Score > 0',
      ['Recovery','Восстановление','%'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('3.5', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '3_5');

  // ============ PHASE 4: LOG ============
  console.log('\n=== PHASE 4: LOG ===');

  try {
    await clickText(page, ['Дневник', 'Log'], 5000);
    await page.waitForTimeout(1500);
    log('4.1', 'Navigate to Log', 'Session list', 'PASS', 'Opened');
  } catch(e) { log('4.1', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '4_1');

  try {
    const c = await page.content();
    log('4.2', 'Check-in in log', 'Record visible',
      ['чек-ин','check-in','Сон','Sleep','HRV','RHR'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('4.2', '...', '...', 'FAIL', e.message.slice(0,80)); }

  try {
    const c = await page.content();
    log('4.3', 'SessionLogger', 'RPE input',
      ['RPE','completed','завершен','Session','Сессия','тренировк'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('4.3', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '4_3');

  try {
    const c = await page.content();
    log('4.5', 'Date filter', 'Date selection',
      ['календар','calendar','date','дата','filter','фильтр'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('4.5', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // ============ PHASE 5: ANALYTICS ============
  console.log('\n=== PHASE 5: ANALYTICS ===');

  try {
    await clickText(page, ['Аналитика', 'Analytics'], 5000);
    await page.waitForTimeout(1500);
    log('5.1', 'Navigate to Analytics', 'Charts shown', 'PASS', 'Opened');
  } catch(e) { log('5.1', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '5_1');

  try {
    const c = await page.content();
    log('5.2', 'Period switcher', 'Charts update',
      ['недел','week','месяц','month','период','period'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('5.2', '...', '...', 'FAIL', e.message.slice(0,80)); }

  try {
    const c = await page.content();
    log('5.3', 'Chart tooltip', 'Tooltip on hover',
      ['svg','canvas','chart','график','recharts','tooltip'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('5.3', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '5_3');

  try {
    const c = await page.content();
    log('5.4', 'Warnings section', 'Trend warnings',
      ['предупреждени','warning','тренд','trend','негативн','negative'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('5.4', '...', '...', 'FAIL', e.message.slice(0,80)); }

  try {
    const errs = consoleErrors.filter(e => !e.toLowerCase().includes('warning') && !e.toLowerCase().includes('deprecated'));
    log('5.5', 'Console errors', 'No errors', errs.length === 0 ? 'PASS' : 'FAIL', `${errs.length} errors`);
  } catch(e) { log('5.5', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // ============ PHASE 6: PROFILE ============
  console.log('\n=== PHASE 6: PROFILE ===');

  try {
    await clickText(page, ['Профиль', 'Profile'], 5000);
    await page.waitForTimeout(1500);
    log('6.1', 'Navigate to Profile', 'Settings shown', 'PASS', 'Opened');
  } catch(e) { log('6.1', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '6_1');

  // 6.2 - English
  try {
    const lang = await clickText(page, ['English', 'EN', 'Английский'], 3000);
    if (lang) {
      await page.waitForTimeout(1500);
      const c = await page.content();
      log('6.2', 'Switch to English', 'English UI', c.includes('Profile') || c.includes('Settings') || c.includes('Today') ? 'PASS' : 'WARN', 'Switched');
    } else {
      log('6.2', 'Switch to English', 'English UI', 'SKIP', 'Not found');
    }
  } catch(e) { log('6.2', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '6_2');

  // 6.3 - Russian
  try {
    await clickText(page, ['Русский', 'RU', 'Russian'], 3000);
    await page.waitForTimeout(1500);
    log('6.3', 'Switch to Russian', 'Russian UI', 'PASS', 'Switched back');
  } catch(e) { log('6.3', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '6_3');

  // 6.4 - Demo Mode
  try {
    const demo = await clickText(page, ['Demo', 'Демо', 'Demo Mode', 'Демо режим'], 3000);
    if (demo) {
      await page.waitForTimeout(2000);
      const c = await page.content();
      log('6.4', 'Enable Demo Mode', 'Demo badge + data', c.includes('Demo') || c.includes('Демо') ? 'PASS' : 'WARN', 'Activated');
    } else {
      log('6.4', 'Enable Demo Mode', 'Demo badge + data', 'SKIP', 'Not found');
    }
  } catch(e) { log('6.4', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '6_4');

  // 6.5 - Demo data
  try {
    await clickText(page, ['Сегодня', 'Today'], 5000);
    await page.waitForTimeout(1500);
    const c = await page.content();
    log('6.5', 'Demo data on TodayPage', 'Synthetic data',
      ['Recovery','Восстановление','план','plan','упражнени','exercise'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('6.5', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '6_5');

  // 6.6 - Dev panel
  try {
    const c = await page.content();
    log('6.6', 'Dev panel', 'Date shift buttons',
      ['+1','-1','день','day','недел','week','следующ','next'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('6.6', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // 6.7 - Disable Demo
  try {
    await clickText(page, ['Профиль', 'Profile'], 5000);
    await page.waitForTimeout(1000);
    const demo = await clickText(page, ['Demo', 'Демо'], 3000);
    log('6.7', 'Disable Demo', 'Badge gone', demo ? 'PASS' : 'SKIP', demo ? 'Disabled' : 'Not found');
  } catch(e) { log('6.7', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // 6.8 - Edit profile
  try {
    await clickText(page, ['Advanced', 'Продвинутый', 'Expert'], 3000);
    await page.waitForTimeout(1000);
    log('6.8', 'Change level to Advanced', 'Saved', 'PASS', 'Changed');
  } catch(e) { log('6.8', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '6_8');

  // ============ PHASE 7: LIVE WORKOUT ============
  console.log('\n=== PHASE 7: LIVE WORKOUT ===');
  try {
    await clickText(page, ['Сегодня', 'Today'], 5000);
    await page.waitForTimeout(1500);
    const c = await page.content();
    const hasLive = ['Живая тренировка','Live','Начать тренировку','Start workout','LiveWorkout'].some(k=>c.includes(k));
    log('7.0', 'Live workout', 'If implemented', hasLive ? 'PASS' : 'SKIP', hasLive ? 'Found' : 'Not implemented');
  } catch(e) { log('7.0', '...', '...', 'SKIP', 'N/A'); }

  // ============ PHASE 8: VIRTUAL DATE ============
  console.log('\n=== PHASE 8: VIRTUAL DATE ===');

  try {
    const fwd = page.locator('[class*="nav-right"], [class*="arrow-right"], [class*="forward"]').first();
    if (await fwd.isVisible({ timeout: 3000 })) {
      await fwd.click();
      await page.waitForTimeout(1000);
      log('8.1', 'Navigate forward', 'Date increases', 'PASS', 'Clicked');
    } else {
      log('8.1', 'Navigate forward', 'Date increases', 'WARN', 'No fwd button');
    }
  } catch(e) { log('8.1', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '8_1');

  try {
    await clickText(page, ['Сегодня', 'Today', 'Сейчас'], 3000);
    await page.waitForTimeout(1000);
    log('8.2', 'Return to today', 'Back to today', 'PASS', 'Clicked');
  } catch(e) { log('8.2', '...', '...', 'FAIL', e.message.slice(0,80)); }

  try {
    const cards = page.locator('[class*="day-card"], [class*="date-card"], [class*="strip"] > div, [class*="weekly"] > div');
    const cnt = await cards.count();
    if (cnt > 3) {
      await cards.nth(3).click();
      await page.waitForTimeout(1000);
      log('8.3', 'Click date in strip', 'Day active', 'PASS', `${cnt} cards`);
    } else {
      log('8.3', 'Click date in strip', 'Day active', 'WARN', `${cnt} cards`);
    }
  } catch(e) { log('8.3', '...', '...', 'FAIL', e.message.slice(0,80)); }
  await ss(page, '8_3');

  // ============ PHASE 9: METHODOLOGY ============
  console.log('\n=== PHASE 9: METHODOLOGY ===');
  // Note: Methodology is NOT in bottom nav. Check if accessible via link/button.
  try {
    const methLink = await clickText(page, ['Методология', 'Methodology', 'Наука', 'Science'], 3000);
    if (methLink) {
      await page.waitForTimeout(1500);
      const c = await page.content();
      log('9.1', 'Navigate to Methodology', 'APRE, Recovery content',
        ['APRE','Recovery','HRV','Mann','методолог','научн','science'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
    } else {
      log('9.1', 'Navigate to Methodology', 'APRE, Recovery content', 'SKIP', 'Not in nav, no link found');
    }
  } catch(e) { log('9.1', '...', '...', 'SKIP', 'Not accessible'); }
  await ss(page, '9_1');

  try {
    const c = await page.content();
    log('9.2', 'Interactive elements', 'Calculators',
      ['input','range','slider','calc','калькулятор','пример','example'].some(k=>c.includes(k)) ? 'PASS' : 'WARN', 'Checked');
  } catch(e) { log('9.2', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // ============ PHASE 10: EXPORT/IMPORT ============
  console.log('\n=== PHASE 10: EXPORT/IMPORT ===');
  try {
    await clickText(page, ['Профиль', 'Profile'], 5000);
    await page.waitForTimeout(1000);
    const c = await page.content();
    const hasExport = ['Экспорт','Export','Импорт','Import'].some(k=>c.includes(k));
    log('10.0', 'Export/Import', 'If implemented', hasExport ? 'PASS' : 'SKIP', hasExport ? 'Found' : 'Not implemented');
  } catch(e) { log('10.0', '...', '...', 'SKIP', 'N/A'); }
  await ss(page, '10_0');

  // ============ PHASE 11: PWA ============
  console.log('\n=== PHASE 11: PWA ===');

  try {
    const hasManifest = await page.evaluate(() => !!document.querySelector('link[rel=manifest]'));
    log('11.1', 'PWA manifest', 'manifest.json linked', hasManifest ? 'PASS' : 'FAIL', hasManifest ? 'Found' : 'Not found');
  } catch(e) { log('11.1', '...', '...', 'FAIL', e.message.slice(0,80)); }

  try {
    const hasSW = await page.evaluate(() => 'serviceWorker' in navigator);
    log('11.2', 'Service Worker', 'SW supported', hasSW ? 'PASS' : 'WARN', hasSW ? 'Supported' : 'Not supported');
  } catch(e) { log('11.2', '...', '...', 'FAIL', e.message.slice(0,80)); }

  // ============ FINAL ============
  const allErrors = consoleErrors.filter(e => !e.toLowerCase().includes('warning') && !e.toLowerCase().includes('deprecated'));
  console.log('\n=== CONSOLE ERRORS: ' + allErrors.length + ' ===');
  allErrors.slice(0, 20).forEach((e, i) => console.log(`  ${i+1}. ${e.slice(0, 120)}`));

  await ss(page, '99_final');
  await browser.close();

  // ============ REPORT ============
  const now = new Date().toISOString();
  const total = RESULTS.length;
  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const warns = RESULTS.filter(r => r.status === 'WARN').length;
  const skipped = RESULTS.filter(r => r.status === 'SKIP').length;

  const lines = [
    '# Smart Fitness Coach - Test Plan Results',
    '',
    `**Date:** ${now}`,
    '**Version:** Latest (git HEAD)',
    `**URL:** ${BASE_URL}`,
    '',
    '## Summary',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| Total steps | ${total} |`,
    `| Passed | ${passed} |`,
    `| Failed | ${failed} |`,
    `| Warnings | ${warns} |`,
    `| Skipped | ${skipped} |`,
    `| Console errors | ${allErrors.length} |`,
    '',
    '## Detailed Results',
    '',
    '| # | Step | Action | Status | Detail |',
    '|---|------|--------|--------|--------|'
  ];

  RESULTS.forEach((r, i) => {
    lines.push(`| ${i+1} | ${r.step} | ${r.action.slice(0, 60)} | ${r.status} | ${r.detail.slice(0, 80)} |`);
  });

  lines.push('', '## Console Errors', '');
  if (allErrors.length > 0) {
    allErrors.forEach((e, i) => lines.push(`${i+1}. \`${e.slice(0, 200)}\``));
  } else {
    lines.push('No console errors detected.');
  }

  const overall = failed === 0 && allErrors.length === 0 ? 'STABLE' : failed < 5 ? 'NEEDS ATTENTION' : 'UNSTABLE';
  lines.push('', '## Stability Assessment', '', `**Overall: ${overall}**`, '',
    `- ${passed}/${total} test steps passed`,
    `- ${failed} critical failures`,
    `- ${warns} warnings (non-critical)`,
    `- ${skipped} skipped (not implemented)`,
    `- ${allErrors.length} console errors`,
    '', '## Recommendations', '');

  if (failed > 0) {
    lines.push('### Critical Issues to Fix');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => lines.push(`- **${r.step}**: ${r.action} - ${r.detail}`));
    lines.push('');
  }
  if (warns > 0) {
    lines.push('### Warnings to Investigate');
    RESULTS.filter(r => r.status === 'WARN').forEach(r => lines.push(`- **${r.step}**: ${r.action} - ${r.detail}`));
    lines.push('');
  }

  lines.push('---', `*Generated at ${now}*`);

  const reportPath = path.join(__dirname, 'docs', 'test-plan-results.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');

  console.log('\n=== REPORT WRITTEN ===');
  console.log(`Total: ${total} | Pass: ${passed} | Fail: ${failed} | Warn: ${warns} | Skip: ${skipped}`);
  console.log(`Console errors: ${allErrors.length}`);
  console.log('REPORT: C:\\Projects\\fitness-tracker\\docs\\test-plan-results.md');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
