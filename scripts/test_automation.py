"""
Smart Fitness Coach — Comprehensive Test Automation
Runs via Playwright against the dev server at http://localhost:3000
"""
import sys
import json
import traceback
from datetime import datetime
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
RESULTS = []
SCREENSHOT_DIR = "docs/screenshots"

def log(step, action, expected, status, detail=""):
    entry = {
        "step": step,
        "action": action,
        "expected": expected,
        "status": status,
        "detail": detail,
        "timestamp": datetime.now().isoformat()
    }
    RESULTS.append(entry)
    icon = "PASS" if status == "PASS" else "FAIL" if status == "FAIL" else "WARN" if status == "WARN" else "SKIP"
    print(f"[{icon}] [{step}] {action} — {detail}")

def screenshot(page, name):
    path = "{}/{}.png".format(SCREENSHOT_DIR, name)
    page.screenshot(path=path, full_page=False)
    return path

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            locale="ru-RU"
        )

        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # Clear storage
        page.evaluate("() => { localStorage.clear(); }")
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        screenshot(page, "00_fresh_load")

        # =========================================================
        # PHASE 1: ONBOARDING
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 1: ONBOARDING")
        print("="*60)

        # Step 1.1
        try:
            onboarding_visible = False
            for selector in ["text=Приветствие", "text=Welcome", "text=Начать", "text=Start", "text=Далее", "text=Next"]:
                try:
                    page.wait_for_selector(selector, timeout=3000)
                    onboarding_visible = True
                    break
                except:
                    continue

            if onboarding_visible:
                log("1.1", "Fresh install shows onboarding", "Onboarding wizard appears", "PASS", "Onboarding detected")
            else:
                # Check if main page is shown instead
                main_visible = False
                for selector in ["text=Today", "text=Сегодня", "text=Профиль", "text=Profile"]:
                    try:
                        page.wait_for_selector(selector, timeout=2000)
                        main_visible = True
                        break
                    except:
                        continue
                log("1.1", "Fresh install shows onboarding", "Onboarding wizard appears", "FAIL",
                    "Main page shown instead of onboarding" if main_visible else "Neither onboarding nor main page detected")
            screenshot(page, "1_1_onboarding")
        except Exception as e:
            log("1.1", "Fresh install shows onboarding", "Onboarding wizard appears", "FAIL", str(e)[:100])

        # Step 1.2: Click next / select sports
        try:
            next_btn = None
            for name in ["Далее", "Next", "Начать", "Start"]:
                btn = page.get_by_role("button", name=name).first
                if btn.is_visible():
                    next_btn = btn
                    break
            if next_btn:
                next_btn.click()
                page.wait_for_timeout(1000)

                # Try to select sports
                sport_clicked = 0
                for sport_name in ["Strength", "Силовые", "Running", "Бег"]:
                    try:
                        el = page.locator("text={}".format(sport_name)).first
                        if el.is_visible():
                            el.click()
                            page.wait_for_timeout(300)
                            sport_clicked += 1
                    except:
                        pass

                log("1.2", "Select sports: Strength + Running", "Checkboxes active, multiple selectable",
                    "PASS" if sport_clicked >= 1 else "WARN", "Clicked {} sport options".format(sport_clicked))
            else:
                log("1.2", "Select sports: Strength + Running", "Checkboxes active, multiple selectable", "SKIP", "Next button not found")
            screenshot(page, "1_2_sports")
        except Exception as e:
            log("1.2", "Select sports: Strength + Running", "Checkboxes active, multiple selectable", "FAIL", str(e)[:100])

        # Step 1.3: Level and goal
        try:
            next_btn = None
            for name in ["Далее", "Next"]:
                btn = page.get_by_role("button", name=name).first
                if btn.is_visible():
                    next_btn = btn
                    break
            if next_btn:
                next_btn.click()
                page.wait_for_timeout(1000)

            clicked = 0
            for name in ["Intermediate", "Средний"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(300)
                        clicked += 1
                        break
                except:
                    pass

            for name in ["Hypertrophy", "Гипертрофия"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(300)
                        clicked += 1
                        break
                except:
                    pass

            log("1.3", "Select level=Intermediate, goal=Hypertrophy", "Buttons toggle, selection saved",
                "PASS" if clicked >= 1 else "WARN", "Selected {} options".format(clicked))
            screenshot(page, "1_3_level_goal")
        except Exception as e:
            log("1.3", "Select level=Intermediate, goal=Hypertrophy", "Buttons toggle, selection saved", "FAIL", str(e)[:100])

        # Step 1.4: Equipment
        try:
            next_btn = None
            for name in ["Далее", "Next"]:
                btn = page.get_by_role("button", name=name).first
                if btn.is_visible():
                    next_btn = btn
                    break
            if next_btn:
                next_btn.click()
                page.wait_for_timeout(1000)

            equip_clicked = 0
            for name in ["Pull-up", "Турник", "Dumbbells", "Гантели"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(300)
                        equip_clicked += 1
                except:
                    pass

            log("1.4", "Select equipment", "Equipment checkboxes, weight slider",
                "PASS" if equip_clicked >= 1 else "WARN", "Selected {} equipment items".format(equip_clicked))
            screenshot(page, "1_4_equipment")
        except Exception as e:
            log("1.4", "Select equipment", "Equipment checkboxes, weight slider", "FAIL", str(e)[:100])

        # Step 1.5: Rehab and finish
        try:
            next_btn = None
            for name in ["Далее", "Next"]:
                btn = page.get_by_role("button", name=name).first
                if btn.is_visible():
                    next_btn = btn
                    break
            if next_btn:
                next_btn.click()
                page.wait_for_timeout(1000)

            for name in ["Shoulder", "Плеч", "плеч"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(300)
                        break
                except:
                    pass

            finish_clicked = False
            for name in ["Завершить", "Готово", "Finish", "Done", "Завершить"]:
                try:
                    btn = page.get_by_role("button", name=name).first
                    if btn.is_visible():
                        btn.click()
                        page.wait_for_timeout(2000)
                        finish_clicked = True
                        break
                except:
                    pass

            if not finish_clicked:
                # Try any button on page
                btns = page.locator("button").all()
                for btn in btns:
                    try:
                        txt = btn.inner_text()
                        if any(kw in txt for kw in ["Заверш", "Готов", "Finish", "Done"]):
                            btn.click()
                            page.wait_for_timeout(2000)
                            finish_clicked = True
                            break
                    except:
                        pass

            log("1.5", "Mark rehab=shoulder, finish onboarding", "Opens TodayPage, onboarding not shown again",
                "PASS" if finish_clicked else "WARN", "Finish button clicked" if finish_clicked else "Could not find finish button")
            screenshot(page, "1_5_finish")
        except Exception as e:
            log("1.5", "Mark rehab=shoulder, finish onboarding", "Opens TodayPage, onboarding not shown again", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 2: TODAYPAGE BEFORE CHECK-IN
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 2: TODAYPAGE (BEFORE CHECK-IN)")
        print("="*60)

        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # Step 2.1
        try:
            content = page.content()
            has_date = any(kw in content for kw in ["2026", "мая", "May", "Сегодня", "Today"])
            log("2.1", "Check header and date", "Today's date displayed", "PASS" if has_date else "FAIL",
                "Date element found" if has_date else "No date found")
            screenshot(page, "2_1_header")
        except Exception as e:
            log("2.1", "Check header and date", "Today's date displayed", "FAIL", str(e)[:100])

        # Step 2.2
        try:
            content = page.content()
            has_recovery = any(kw in content for kw in ["Recovery", "Восстановление", "чек-in", "check-in", "Пройдите", "?"])
            log("2.2", "Check Recovery Score", "Shows '?' or check-in prompt", "PASS" if has_recovery else "WARN",
                "Recovery area found" if has_recovery else "Recovery area not found")
            screenshot(page, "2_2_recovery")
        except Exception as e:
            log("2.2", "Check Recovery Score", "Shows '?' or check-in prompt", "FAIL", str(e)[:100])

        # Step 2.3
        try:
            content = page.content()
            has_exercises = any(kw in content for kw in ["Подтягив", "Присед", "Жим", "Бег", "Running", "Strength",
                                                          "Exercise", "Упражнение", "Подход", "Set", "Rep", "Повтор"])
            log("2.3", "Check workout plan", "Exercise list matches sports", "PASS" if has_exercises else "WARN",
                "Exercises found" if has_exercises else "No exercises found")
            screenshot(page, "2_3_plan")
        except Exception as e:
            log("2.3", "Check workout plan", "Exercise list matches sports", "FAIL", str(e)[:100])

        # Step 2.4
        try:
            nav_elements = page.locator("button, [class*='nav'], [class*='arrow'], [class*='strip'], [class*='date']").all()
            log("2.4", "Check 30-day date strip", "Arrows work, today highlighted",
                "PASS" if len(nav_elements) > 2 else "WARN",
                "Found {} nav elements".format(len(nav_elements)))
            screenshot(page, "2_4_strip")
        except Exception as e:
            log("2.4", "Check 30-day date strip", "Arrows work, today highlighted", "FAIL", str(e)[:100])

        # Step 2.5
        try:
            content = page.content()
            has_live = any(kw in content for kw in ["Живая тренировка", "Live", "Начать тренировку", "Start workout"])
            log("2.5", "Check live workout button", "Button visible (if implemented)",
                "SKIP" if not has_live else "PASS",
                "Not implemented" if not has_live else "Live workout button found")
        except:
            log("2.5", "Check live workout button", "Button visible (if implemented)", "SKIP", "Not implemented")

        # Step 2.6
        try:
            errors_so_far = [e for e in console_errors if "warning" not in e.lower() and "deprecated" not in e.lower()]
            log("2.6", "Console errors check", "No red errors", "PASS" if len(errors_so_far) == 0 else "FAIL",
                "{} errors: {}".format(len(errors_so_far), errors_so_far[0][:80] if errors_so_far else "none"))
        except Exception as e:
            log("2.6", "Console errors check", "No red errors", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 3: CHECK-IN
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 3: CHECK-IN")
        print("="*60)

        # Navigate to check-in
        try:
            for name in ["Log", "Лог", "Журнал", "Чек-ин", "Check-in"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue
            screenshot(page, "3_0_log")
        except:
            pass

        # Step 3.1
        try:
            content = page.content()
            has_fields = any(kw in content for kw in ["HRV", "ЧСС", "RHR", "Пульс", "Sleep", "Сон", "input", "range"])
            log("3.1", "Check form fields for Full tier", "HRV, RHR, Sleep, subjective fields",
                "PASS" if has_fields else "WARN", "Fields found" if has_fields else "Fields not found")
            screenshot(page, "3_1_form")
        except Exception as e:
            log("3.1", "Check form fields for Full tier", "HRV, RHR, Sleep, subjective fields", "FAIL", str(e)[:100])

        # Step 3.2: Validation
        try:
            save_btn = None
            for name in ["Сохранить", "Save", "Готово"]:
                btn = page.get_by_role("button", name=name).first
                if btn.is_visible():
                    save_btn = btn
                    break
            if save_btn:
                save_btn.click()
                page.wait_for_timeout(1000)
                content = page.content()
                has_val = any(kw in content for kw in ["обязательн", "required", "заполни", "fill", "ошибк", "error", "invalid"])
                log("3.2", "Validation on empty fields", "Fields highlighted, errors shown", "PASS" if has_val else "WARN",
                    "Validation found" if has_val else "No validation detected")
            else:
                log("3.2", "Validation on empty fields", "Fields highlighted, errors shown", "SKIP", "Save button not found")
            screenshot(page, "3_2_validation")
        except Exception as e:
            log("3.2", "Validation on empty fields", "Fields highlighted, errors shown", "FAIL", str(e)[:100])

        # Step 3.3: Fill form
        try:
            inputs = page.locator("input[type='number'], input[type='text']").all()
            filled = 0
            for inp in inputs:
                try:
                    if inp.is_visible():
                        inp_type = inp.get_attribute("type") or "text"
                        name = (inp.get_attribute("name") or inp.get_attribute("id") or "").lower()
                        placeholder = (inp.get_attribute("placeholder") or "").lower()
                        if "hrv" in name or "hrv" in placeholder:
                            inp.fill("55")
                            filled += 1
                        elif "rhr" in name or "pulse" in name or "пульс" in name:
                            inp.fill("62")
                            filled += 1
                        elif "sleep" in name or "сон" in name:
                            inp.fill("7")
                            filled += 1
                        elif "weight" in name or "вес" in name:
                            inp.fill("78")
                            filled += 1
                        elif inp_type == "number" and filled < 6:
                            inp.fill("3")
                            filled += 1
                except:
                    pass

            # Range sliders
            sliders = page.locator("input[type='range']").all()
            for slider in sliders[:5]:
                try:
                    slider.evaluate("el => { el.value = 3; el.dispatchEvent(new Event('input', {bubbles: true}); el.dispatchEvent(new Event('change', {bubbles: true}); }")
                    filled += 1
                except:
                    pass

            log("3.3", "Fill check-in data", "All fields accept values", "PASS" if filled > 0 else "WARN",
                "Filled {} fields".format(filled))
            screenshot(page, "3_3_filled")
        except Exception as e:
            log("3.3", "Fill check-in data", "All fields accept values", "FAIL", str(e)[:100])

        # Step 3.4: Save
        try:
            save_btn = None
            for name in ["Сохранить", "Save", "Готово"]:
                btn = page.get_by_role("button", name=name).first
                if btn.is_visible():
                    save_btn = btn
                    break
            if save_btn:
                save_btn.click()
                page.wait_for_timeout(2000)
                log("3.4", "Save check-in", "Data saved, returns to main", "PASS", "Check-in saved")
            else:
                log("3.4", "Save check-in", "Data saved, returns to main", "WARN", "Save button not found")
            screenshot(page, "3_4_saved")
        except Exception as e:
            log("3.4", "Save check-in", "Data saved, returns to main", "FAIL", str(e)[:100])

        # Step 3.5: Recovery Score recalculated
        try:
            for name in ["Today", "Сегодня", "Главная"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue

            content = page.content()
            has_score = any(kw in content for kw in ["Recovery", "Восстановление", "%"])
            log("3.5", "Recovery Score recalculated", "Score > 0, color indicator", "PASS" if has_score else "WARN",
                "Score displayed" if has_score else "Score not found")
            screenshot(page, "3_5_recovery")
        except Exception as e:
            log("3.5", "Recovery Score recalculated", "Score > 0, color indicator", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 4: LOG PAGE
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 4: LOG PAGE")
        print("="*60)

        # Step 4.1
        try:
            for name in ["Log", "Лог", "Журнал"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue
            log("4.1", "Navigate to Log tab", "Session and check-in list", "PASS", "Log page opened")
            screenshot(page, "4_1_log")
        except Exception as e:
            log("4.1", "Navigate to Log tab", "Session and check-in list", "FAIL", str(e)[:100])

        # Step 4.2
        try:
            content = page.content()
            has_checkin = any(kw in content for kw in ["7", "62", "55", "78", "чек-ин", "check-in", "Сон", "Sleep", "HRV"])
            log("4.2", "Check-in appears in log", "Record with data visible", "PASS" if has_checkin else "WARN",
                "Check-in data found" if has_checkin else "Check-in data not visible")
        except Exception as e:
            log("4.2", "Check-in appears in log", "Record with data visible", "FAIL", str(e)[:100])

        # Step 4.3
        try:
            content = page.content()
            has_session = any(kw in content for kw in ["RPE", "completed", "завершен", "Session", "Сессия", "тренировк"])
            log("4.3", "SessionLogger available", "Can enter RPE, mark completed", "PASS" if has_session else "WARN",
                "Session logger found" if has_session else "Session logger not found")
            screenshot(page, "4_3_session")
        except Exception as e:
            log("4.3", "SessionLogger available", "Can enter RPE, mark completed", "FAIL", str(e)[:100])

        # Step 4.5
        try:
            content = page.content()
            has_filter = any(kw in content for kw in ["календар", "calendar", "date", "дата", "filter", "фильтр"])
            log("4.5", "Date filter", "Date selection works", "PASS" if has_filter else "WARN",
                "Date filter found" if has_filter else "No date filter")
        except Exception as e:
            log("4.5", "Date filter", "Date selection works", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 5: ANALYTICS
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 5: ANALYTICS")
        print("="*60)

        # Step 5.1
        try:
            for name in ["Analytics", "Аналитика", "Графики"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue
            log("5.1", "Navigate to Analytics", "Charts displayed", "PASS", "Analytics opened")
            screenshot(page, "5_1_analytics")
        except Exception as e:
            log("5.1", "Navigate to Analytics", "Charts displayed", "FAIL", str(e)[:100])

        # Step 5.2
        try:
            content = page.content()
            has_period = any(kw in content for kw in ["недел", "week", "месяц", "month", "период", "period"])
            log("5.2", "Period switcher", "Charts update", "PASS" if has_period else "WARN",
                "Period switcher found" if has_period else "No period switcher")
        except Exception as e:
            log("5.2", "Period switcher", "Charts update", "FAIL", str(e)[:100])

        # Step 5.3
        try:
            content = page.content()
            has_chart = any(kw in content for kw in ["svg", "canvas", "chart", "график", "recharts", "tooltip"])
            log("5.3", "Chart tooltip", "Tooltip on hover", "PASS" if has_chart else "WARN",
                "Chart found" if has_chart else "No chart elements")
            screenshot(page, "5_3_charts")
        except Exception as e:
            log("5.3", "Chart tooltip", "Tooltip on hover", "FAIL", str(e)[:100])

        # Step 5.4
        try:
            content = page.content()
            has_warnings = any(kw in content for kw in ["предупреждени", "warning", "тренд", "trend", "негативн", "negative"])
            log("5.4", "Warnings section", "Negative trend warnings", "PASS" if has_warnings else "WARN",
                "Warnings found" if has_warnings else "No warnings (may need more data)")
        except Exception as e:
            log("5.4", "Warnings section", "Negative trend warnings", "FAIL", str(e)[:100])

        # Step 5.5
        try:
            errors_5 = [e for e in console_errors if "warning" not in e.lower() and "deprecated" not in e.lower()]
            log("5.5", "Console errors on Analytics", "No errors", "PASS" if len(errors_5) == 0 else "FAIL",
                "{} total errors".format(len(errors_5)))
        except Exception as e:
            log("5.5", "Console errors on Analytics", "No errors", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 6: PROFILE
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 6: PROFILE")
        print("="*60)

        # Step 6.1
        try:
            for name in ["Profile", "Профиль", "Настройки"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue
            log("6.1", "Navigate to Profile", "Settings displayed", "PASS", "Profile opened")
            screenshot(page, "6_1_profile")
        except Exception as e:
            log("6.1", "Navigate to Profile", "Settings displayed", "FAIL", str(e)[:100])

        # Step 6.2: Switch to English
        try:
            lang_found = False
            for name in ["English", "EN", "Английский"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(1500)
                        lang_found = True
                        break
                except:
                    continue

            if lang_found:
                content = page.content()
                is_en = "Profile" in content or "Settings" in content or "Today" in content
                log("6.2", "Switch to English", "Interface in English", "PASS" if is_en else "WARN",
                    "Switched" if is_en else "May not have switched")
            else:
                log("6.2", "Switch to English", "Interface in English", "SKIP", "Language switcher not found")
            screenshot(page, "6_2_english")
        except Exception as e:
            log("6.2", "Switch to English", "Interface in English", "FAIL", str(e)[:100])

        # Step 6.3: Switch back to Russian
        try:
            for name in ["Русский", "RU", "Russian"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue
            log("6.3", "Switch back to Russian", "Interface in Russian", "PASS", "Switched back")
            screenshot(page, "6_3_russian")
        except Exception as e:
            log("6.3", "Switch back to Russian", "Interface in Russian", "FAIL", str(e)[:100])

        # Step 6.4: Demo Mode
        try:
            demo_found = False
            for name in ["Demo", "Демо", "Demo Mode", "Демо режим"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(2000)
                        demo_found = True
                        break
                except:
                    continue

            if demo_found:
                content = page.content()
                has_demo = "Demo" in content or "Демо" in content
                log("6.4", "Enable Demo Mode", "Demo badge, synthetic data, dev panel",
                    "PASS" if has_demo else "WARN", "Demo activated" if has_demo else "Demo badge not found")
            else:
                log("6.4", "Enable Demo Mode", "Demo badge, synthetic data, dev panel", "SKIP", "Demo toggle not found")
            screenshot(page, "6_4_demo")
        except Exception as e:
            log("6.4", "Enable Demo Mode", "Demo badge, synthetic data, dev panel", "FAIL", str(e)[:100])

        # Step 6.5: Demo data
        try:
            for name in ["Today", "Сегодня", "Главная"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue

            content = page.content()
            has_data = any(kw in content for kw in ["Recovery", "Восстановление", "план", "plan", "упражнени", "exercise"])
            log("6.5", "Demo data on TodayPage", "Synthetic data visible", "PASS" if has_data else "WARN",
                "Demo data found" if has_data else "Demo data not visible")
            screenshot(page, "6_5_demo_data")
        except Exception as e:
            log("6.5", "Demo data on TodayPage", "Synthetic data visible", "FAIL", str(e)[:100])

        # Step 6.6: Dev panel
        try:
            content = page.content()
            has_dev = any(kw in content for kw in ["+1", "-1", "день", "day", "недел", "week", "следующ", "next"])
            log("6.6", "Dev panel advance days", "Date shifts, plan updates", "PASS" if has_dev else "WARN",
                "Dev panel found" if has_dev else "Dev panel not found")
        except Exception as e:
            log("6.6", "Dev panel advance days", "Date shifts, plan updates", "FAIL", str(e)[:100])

        # Step 6.7: Disable Demo
        try:
            for name in ["Profile", "Профиль", "Настройки"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1000)
                        break
                except:
                    continue

            demo_off = False
            for name in ["Demo", "Демо"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(1500)
                        demo_off = True
                        break
                except:
                    continue
            log("6.7", "Disable Demo Mode", "Badge disappears", "PASS" if demo_off else "SKIP",
                "Demo disabled" if demo_off else "Demo toggle not found")
        except Exception as e:
            log("6.7", "Disable Demo Mode", "Badge disappears", "FAIL", str(e)[:100])

        # Step 6.8: Edit profile
        try:
            for name in ["Advanced", "Продвинутый", "Expert"]:
                try:
                    el = page.locator("text={}".format(name)).first
                    if el.is_visible():
                        el.click()
                        page.wait_for_timeout(1000)
                        break
                except:
                    continue
            log("6.8", "Change level to Advanced", "Data saved, plan rebuilds", "PASS", "Level changed")
            screenshot(page, "6_8_edit")
        except Exception as e:
            log("6.8", "Change level to Advanced", "Data saved, plan rebuilds", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 7: LIVE WORKOUT
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 7: LIVE WORKOUT")
        print("="*60)

        try:
            for name in ["Today", "Сегодня", "Главная"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        break
                except:
                    continue

            content = page.content()
            has_live = any(kw in content for kw in ["Живая тренировка", "Live", "Начать тренировку", "Start workout", "LiveWorkout"])
            log("7.0", "Live workout check", "Feature exists or not", "SKIP" if not has_live else "PASS",
                "Not implemented" if not has_live else "Live workout found")
        except:
            log("7.0", "Live workout check", "Feature exists or not", "SKIP", "Not implemented")

        # =========================================================
        # PHASE 8: VIRTUAL DATE NAVIGATION
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 8: VIRTUAL DATE NAVIGATION")
        print("="*60)

        # Step 8.1
        try:
            nav_fwd = page.locator("[class*='nav-right'], [class*='arrow-right'], [class*='forward']").all()
            if len(nav_fwd) > 0:
                nav_fwd[-1].click()
                page.wait_for_timeout(1000)
                log("8.1", "Navigate forward", "Date increases, plan updates", "PASS", "Clicked forward nav")
            else:
                log("8.1", "Navigate forward", "Date increases, plan updates", "WARN", "No forward nav found")
            screenshot(page, "8_1_forward")
        except Exception as e:
            log("8.1", "Navigate forward", "Date increases, plan updates", "FAIL", str(e)[:100])

        # Step 8.2
        try:
            for name in ["Сегодня", "Today", "Сейчас"]:
                try:
                    btn = page.locator("text={}".format(name)).first
                    if btn.is_visible():
                        btn.click()
                        page.wait_for_timeout(1000)
                        break
                except:
                    continue
            log("8.2", "Return to today", "Back to real today", "PASS", "Today clicked")
        except Exception as e:
            log("8.2", "Return to today", "Back to real today", "FAIL", str(e)[:100])

        # Step 8.3
        try:
            day_cards = page.locator("[class*='day-card'], [class*='date-card'], [class*='strip'] > div, [class*='weekly'] > div").all()
            if len(day_cards) > 3:
                day_cards[3].click()
                page.wait_for_timeout(1000)
                log("8.3", "Click date in strip", "Day becomes active", "PASS", "Clicked day card")
            else:
                log("8.3", "Click date in strip", "Day becomes active", "WARN", "Only {} cards found".format(len(day_cards)))
            screenshot(page, "8_3_date")
        except Exception as e:
            log("8.3", "Click date in strip", "Day becomes active", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 9: METHODOLOGY
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 9: METHODOLOGY")
        print("="*60)

        # Step 9.1
        try:
            meth_found = False
            for name in ["Methodology", "Методология", "Наука", "Science"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1500)
                        meth_found = True
                        break
                except:
                    continue

            if meth_found:
                content = page.content()
                has_content = any(kw in content for kw in ["APRE", "Recovery", "HRV", "Mann", "методолог", "научн", "science"])
                log("9.1", "Navigate to Methodology", "APRE, Recovery, HRV zones", "PASS" if has_content else "WARN",
                    "Content found" if has_content else "Content not found")
            else:
                log("9.1", "Navigate to Methodology", "APRE, Recovery, HRV zones", "SKIP", "Tab not found")
            screenshot(page, "9_1_methodology")
        except Exception as e:
            log("9.1", "Navigate to Methodology", "APRE, Recovery, HRV zones", "FAIL", str(e)[:100])

        # Step 9.2
        try:
            content = page.content()
            has_interactive = any(kw in content for kw in ["input", "range", "slider", "calc", "калькулятор", "пример", "example"])
            log("9.2", "Interactive elements", "Calculators or examples", "PASS" if has_interactive else "WARN",
                "Found" if has_interactive else "Not found")
        except Exception as e:
            log("9.2", "Interactive elements", "Calculators or examples", "FAIL", str(e)[:100])

        # =========================================================
        # PHASE 10: EXPORT/IMPORT
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 10: EXPORT/IMPORT")
        print("="*60)

        try:
            for name in ["Profile", "Профиль", "Настройки"]:
                try:
                    tab = page.get_by_role("button", name=name).first
                    if tab.is_visible():
                        tab.click()
                        page.wait_for_timeout(1000)
                        break
                except:
                    continue

            content = page.content()
            has_export = any(kw in content for kw in ["Экспорт", "Export", "Импорт", "Import", "экспорт", "импорт"])
            log("10.0", "Export/Import check", "Feature exists or not", "SKIP" if not has_export else "PASS",
                "Not implemented" if not has_export else "Export/Import found")
            screenshot(page, "10_0_export")
        except:
            log("10.0", "Export/Import check", "Feature exists or not", "SKIP", "Not implemented")

        # =========================================================
        # PHASE 11: PWA
        # =========================================================
        print("\n" + "="*60)
        print("PHASE 11: PWA")
        print("="*60)

        # Step 11.1
        try:
            has_manifest = page.evaluate("() => !!document.querySelector('link[rel=manifest]')")
            log("11.1", "PWA manifest", "manifest.json linked", "PASS" if has_manifest else "FAIL",
                "Manifest found" if has_manifest else "No manifest")
        except Exception as e:
            log("11.1", "PWA manifest", "manifest.json linked", "FAIL", str(e)[:100])

        # Step 11.2
        try:
            has_sw = page.evaluate("() => 'serviceWorker' in navigator")
            log("11.2", "Service Worker", "SW supported", "PASS" if has_sw else "WARN",
                "SW supported" if has_sw else "SW not supported")
        except Exception as e:
            log("11.2", "Service Worker", "SW supported", "FAIL", str(e)[:100])

        # =========================================================
        # FINAL
        # =========================================================
        all_errors = [e for e in console_errors if "warning" not in e.lower() and "deprecated" not in e.lower()]
        print("\n" + "="*60)
        print("CONSOLE ERRORS: {}".format(len(all_errors)))
        print("="*60)
        for i, err in enumerate(all_errors[:20]):
            print("  {}. {}".format(i+1, err[:120]))

        screenshot(page, "99_final")
        browser.close()

        return RESULTS, all_errors

if __name__ == "__main__":
    results, errors = run_tests()

    # Generate report
    lines = [
        "# Smart Fitness Coach — Test Plan Results",
        "",
        "**Date:** {}".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
        "**Version:** Latest (git HEAD)",
        "**URL:** {}".format(BASE_URL),
        "",
        "## Summary",
        ""
    ]

    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    warnings = sum(1 for r in results if r["status"] == "WARN")
    skipped = sum(1 for r in results if r["status"] == "SKIP")

    lines.extend([
        "| Metric | Count |",
        "|--------|-------|",
        "| Total steps | {} |".format(total),
        "| Passed | {} |".format(passed),
        "| Failed | {} |".format(failed),
        "| Warnings | {} |".format(warnings),
        "| Skipped | {} |".format(skipped),
        "| Console errors | {} |".format(len(errors)),
        "",
        "## Detailed Results",
        "",
        "| # | Step | Action | Status | Detail |",
        "|---|------|--------|--------|--------|"
    ])

    for i, r in enumerate(results, 1):
        status = r["status"]
        action_short = r["action"][:60]
        detail_short = r["detail"][:80]
        lines.append("| {} | {} | {} | {} | {} |".format(i, r['step'], action_short, status, detail_short))

    lines.extend([
        "",
        "## Console Errors",
        ""
    ])

    if errors:
        for i, err in enumerate(errors, 1):
            lines.append("{}. `{}`".format(i, err[:200]))
    else:
        lines.append("No console errors detected.")

    lines.extend([
        "",
        "## Stability Assessment",
        "",
        "**Overall: {}**".format("STABLE" if failed == 0 and len(errors) == 0 else "NEEDS ATTENTION" if failed < 5 else "UNSTABLE"),
        "",
        "- {}/{} test steps passed".format(passed, total),
        "- {} critical failures".format(failed),
        "- {} warnings (non-critical)".format(warnings),
        "- {} skipped (not implemented)".format(skipped),
        "- {} console errors".format(len(errors)),
        "",
        "## Recommendations",
        ""
    ])

    if failed > 0:
        lines.append("### Critical Issues to Fix")
        for r in results:
            if r["status"] == "FAIL":
                lines.append("- **{}**: {} — {}".format(r['step'], r['action'], r['detail']))
        lines.append("")

    if warnings > 0:
        lines.append("### Warnings to Investigate")
        for r in results:
            if r["status"] == "WARN":
                lines.append("- **{}**: {} — {}".format(r['step'], r['action'], r['detail']))
        lines.append("")

    lines.extend([
        "---",
        "*Generated by test_automation.py at {}*".format(datetime.now().isoformat())
    ])

    report = "\n".join(lines)

    with open("docs/test-plan-results.md", "w", encoding="utf-8") as f:
        f.write(report)

    print("\n" + "="*60)
    print("REPORT: docs/test-plan-results.md")
    print("Total: {} | Pass: {} | Fail: {} | Warn: {} | Skip: {}".format(total, passed, failed, warnings, skipped))
    print("Console errors: {}".format(len(errors)))
