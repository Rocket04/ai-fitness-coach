# Smart Fitness Coach — Product Audit & Redesigned Golden Path

**Prepared:** 2026-05-30  
**Based on:** golden-path.md + current-state-audit.md  
**Method:** Vision critique against 9 product-habit principles + competitive pattern analysis

---

# Part 1: Critique of Current Vision

## 1. What's Generic (Where You Fail to Differentiate)

Your value proposition — *"Тренировки, которые слушают твоё тело"* — is WHOOP's tagline, translated. The recovery ring visual is lifted from WHOOP/Oura/Athlytic. The onboarding goal selection (Сила / Выносливость / Реабилитация / Гибкость) is identical to FitBod, Strong, and Hevy. The CSV import, the coach advice panel, the adherence banner, the 7-day strip — all recognizable patterns any fitness app could ship.

**What IS actually differentiated:**

- **APRE live weight adjustment from AMRAP sets** — most apps don't touch this. You compute the next week's training max in real time from the user's actual performance. That's genuinely novel.
- **Recovery-to-plan integration** — not just "rest today" but modifying *which exercises* and *what weight* based on HRV/sleep/subjective data.
- **Multi-sport periodization with cross-sport recovery modeling** — nobody else does this at this level without a subscription and a coach.

**The problem:** these differentiators are buried three taps deep. Your APRE moment is computed in `apre/engine.js` but its output surfaces (if at all) as a small number in an exercise card. Your marketing copy should be the APRE toast: *"You did 8 reps instead of 6 → next week's weight went up automatically."* That is the hook. Everything else — the ring, the CSV import, the analytics — is infrastructure that supports the hook. Build the product surface around what makes you unique, not around what makes you look like WHOOP.

---

## 2. What's Unrealistic (Given Local-First, Manual-Input Architecture)

**HRV as 40% of the recovery score.** Zero integrations are working. Garmin/Apple Health/WHOOP integrations are 0% implemented, waitlist-only. The majority of your users will be on the Light tier — 100% subjective score. A Light-tier recovery score is a dressed-up mood ring. You're building a product whose primary differentiator (data-driven load adaptation) collapses to "how do you feel 1-5?" for most users. This gap between vision and implementation is the most dangerous thing in your current spec.

**Scene 4: "Данные уже там."** The vision describes CSV import as seamless — data "appears" after a weekly upload. In reality, CSV import from HealthSync is: open HealthSync → trigger export → find the file in downloads → navigate to your PWA → find the import button → drag-drop → wait for parse. That's 5-6 friction points presented as magic. Users will do this once and forget.

**Tier auto-detect at onboarding.** The system claims to auto-detect the optimal tier based on 14 days of check-in patterns — on Day 0, when there's no data. This creates a trust-breaking promise.

**What to do instead:** Own the manual-first architecture. Make it a feature: *"Никаких облаков. Никаких подписок. Только твои данные, только на твоём устройстве."* The manual input ritual (30 seconds every morning) becomes the product's core identity, not an apology for missing hardware integrations.

---

## 3. What's Over-Engineered (Doesn't Drive Daily Habit)

**The Methodology page** (520L, 6 formula sections, APRE Simulator, Recovery Score Simulator) was built for the developer who built it. It's technically impressive. Zero users will return to it more than once. It should exist but live three taps deep, not as a navigation tab.

**Demo mode with 4 elaborately biometrically distinct profiles** (marathoner, yogi, crossfitter, rehab) — useful for App Store screenshots. A real user discovers this, plays with it for 2 minutes, and never touches it again.

**19 achievements** — the first 3 days of novelty, then background noise. Achievements only drive habit formation when they're tied to core actions AND visible at the exact moment of completion. Currently they're discoverable only in ProfilePage. That's not a reward loop; that's a trophy room nobody visits.

**Guided tour (8 steps)** — skip rates on guided tours are 85%+ industry-wide. They increase time-to-first-value by adding friction, not reducing it.

**8 sport disciplines with full 4-phase periodization** — impressive engineering. But a user running + lifting 3x/week who also selects Swimming and Yoga "just in case" gets a plan that's complex to navigate without delivering more value. Progressive disclosure: start with one sport, add more after day 30.

**The `completionRate.ts` not fully wired** and **APRE not feeding into next session generation** — you have over-engineered the peripheral (demo profiles, methodology page, 8 sports) while the core (the adaptation loop) is 95% done, not 100%.

---

## 4. What's Glaringly Missing

**Push notifications.** The single largest gap in the entire product. You have a service worker — PWA Web Push exists. Not having a daily 07:30 check-in nudge in a *daily-check-in app* is structurally equivalent to building Duolingo without streaks. WHOOP's push notification at the time of app open is their primary DAU mechanism. Without it, your DAU depends entirely on intrinsic motivation — the worst possible foundation for a habit-formation product.

**Per-exercise strength history.** Strong and Hevy exist because of one feature: watching your strength curve trend upward over time. When a user opens your app and sees *"Жим лёжа — прошлый раз: 80 кг × 6. Сегодня: 82.5 кг × 6"*, that is the hook that brings them back. Your APRE engine computes the progression — but nowhere in the app is there a clean chart of bench press 6 weeks ago vs. today. This is the reward that justifies the ritual.

**Estimated session duration on Today screen.** "Тренировка А · ~45 мин · 6 упражнений" on the main card. This one line reduces activation energy to start. Without it, users don't know if they have 20 minutes or 60 minutes — and uncertainty kills initiation.

**Screen wake lock.** The vision says the screen doesn't go to sleep during workouts. The audit doesn't confirm this is implemented. Between-set phone unlocking breaks flow completely — this is a table-stakes workout tracker feature.

**Rest timer as first-class UI element.** Implied in the vision, but the audit doesn't surface it as a prominent component. The rest timer should be the dominant visual during rest periods — not a peripheral indicator. Strong users have said in reviews that the rest timer alone justifies the app.

**Weekly re-engagement trigger.** One Monday morning push notification with 3 specific stats (best lift delta, compliance rate, avg recovery change) is WHOOP's highest-engagement touchpoint. You don't have it.

---

## 5. Where the UX is Paternalistic or Annoying

**Tier Suggestion Banner** — *"We noticed your check-in patterns don't match your current tier. Consider switching to Medium?"* If the system can detect this, it should act, not ask. Automated decisions with a post-hoc notification (*"Чек-ин tier переключён на Medium — это точнее отражает твои данные"*) are respectful. Asking for permission to optimize is passive-aggressive.

**"⚠️ Вес снижен для защиты ЦНС"** — an experienced lifter reading this wants to throw the phone. "CNS protection" as an app label is condescending. It's not wrong; it's just clinical in a way that signals the app doesn't trust the athlete. Say instead: *"Сегодня −30% веса. Тело просило."* Personal, not medical.

**12-field check-in** — sleepHours, sleepQuality, restHR, hrv, weight, breathing, energy, mood, soreness, stress, hip pain, shoulder pain, notes. Asking about *breathing quality* every morning is either for athletes with asthma or for users building a clinical database of themselves. The first check-in screen must have 3 fields. Everything else is "подробнее."

**The "Почему?" button as the primary explanation mechanism.** This is defensive design — it says *"we know our UI isn't self-explanatory, so here's an escape hatch."* If the ring says 43 (yellow), the one-line subtitle below the number should already say why. The button is fine for deep dives. It shouldn't be the first explanation.

**Adherence banner with emoji** — 🔼 *"Прогресс! Объём увеличен на 20%"* feels like a gamified sticker. Experienced athletes don't want affirmation from an emoji. They want information. Remove the emoji. Make it data.

---

## 6. The First 60 Seconds

TodayPage currently has **13 competing layers**: Tier Suggestion Banner, Weekly 7-Day Strip, Adherence Volume Banner, Weekly Plan Card, Hero Ring, Status Pill, Sparkline Panel, Start Workout Button, Training Plan/Rest Day, Explanation Card, Coach Tips Panel, Tomorrow Preview, Streak Badge.

Imagine opening WHOOP to find 13 cards before your recovery score. You would delete the app.

The recovery ring — your most differentiated, most emotionally resonant element — is visually present but surrounded by banners that compete with it for eye attention. It appears as item #5 in the visual hierarchy.

The first 60 seconds must answer one question: **"Can I train hard today?"** The current flow is: *Banner → Strip → Banner → Card → Ring.* It should be: *Ring → Verdict → Plan.* Full stop. Every other element is below the fold, accessible by scrolling, available when the user wants it — not pushed at them.

---

## 7. Cold Start Problem

A new user on Day 0 sees:
- A ring that shows... what? Zero? "Заполни чек-ин"? The current spec doesn't define this empty state.
- A training plan based on zero recovery data — it's a template, indistinguishable from any other app.
- Demo mode available only via *Profile → Developer Testing*. A feature this powerful should not require excavation.

There's no demonstration of what the app will *become*. Compare Oura: first night of wearing the ring → morning reveal of a personalized recovery score. The product SHOWS you what you're buying before you've committed to the ritual.

Your equivalent should be: onboarding completes → animated demo ring (*"Вот как это выглядит"*) → *"Первый чек-ин разблокирует твой личный Score"* → immediate check-in prompt. Day 0 should end with the product **working**, not with instructions on how to use it.

---

## 8. Onboarding — Right Questions, Right Order?

**Current flow:** Value (1 screen) → Goal (3 cards + day chips) → Sports (4 categories, 8 options) → Gadgets (4 options + tier auto-detect) → Recovery Ring preview → Complete. **5 steps.**

**Problems:**

- **Day chips** (which days you train) asked on Day 0. Users don't know their optimal training split before using the app. They'll guess and set it wrong. This should be inferred from actual usage or asked after week 1.
- **Sport selection** (8 options on one screen) on Day 0 is overwhelming. Infer from goal (Strength → barbell training; Endurance → running) and let them refine later.
- **Tier auto-detect** shown as a feature at onboarding when it requires 14 days of data. This is a broken promise on first meeting.
- 5 steps is 2 too many. WHOOP does it in 3 screens. Hevy does it in 2.

**What to ask:**  
1. **Primary goal** (Набор силы / Выносливость / Общий фитнес) — determines the default protocol  
2. **Input method** (HRV устройство / Умные часы+CSV / Только телефон) — determines tier and check-in fields  

**What to defer:**  
- Secondary sports → after day 14  
- Training day preferences → infer from usage, ask at day 7 if ambiguous  
- Rehab setup → only if user selects "Реабилитация" as goal or reports pain in first check-in  
- Tier fine-tuning → auto-adjust after 14 days, notify user after the fact  

**What to add:**  
- Show the animated ring during onboarding with demo data. Let the user see what they're signing up for before they commit to answering questions.

---

## 9. The Habit Loop (Cue → Routine → Reward)

**Cue (Broken):** App icon. That's it. If the user doesn't consciously remember to open the app, they don't. No push notification = no external cue = DAU depends on existing motivation. You're building a daily ritual without the alarm clock that starts the ritual.

**Routine (High Friction):** 12-field check-in. The target user — an athlete, not a biohacker — will abandon a 12-field form after 3-5 days. The activation energy exceeds the perceived reward. 3 fields with smart defaults takes 15 seconds. The completion rate difference is likely 40% → 70%+.

**Reward (Abstract):** Recovery Score 82. Abstract number without context. APRE progression buried in exercise cards. Achievements discoverable only in ProfilePage. The reward is real — the architecture computes meaningful progression — but it's not *delivered* at the moment the user deserves to feel it.

**The loop is broken primarily at Cue level.** Even if routine and reward were perfect, without an external trigger, habit formation is slow and fragile. The fix is not complicated: Web Push at 07:30 → direct to check-in bottom sheet → ring animates → verdict with comparison. That's the loop.

---

# Part 2: Redesigned Golden Path

## Акт I: День 0 — 3 экрана, 90 секунд

### Экран 1: The Promise

**What the user sees:**  
Full-screen dark gradient (navy → black). Center: animated SVG ring (200px), slow pulse, "?" inside. Color: muted grey. Above ring: *"30 секунд утром. Точный план — весь день."* Below ring: 3 large goal cards with icons:  
- **"Стать сильнее"** (barbell icon)  
- **"Больше выносливости"** (running figure)  
- **"Общий фитнес"** (mixed icon)  

One button below: *"Начать →"* (full-width, accent).

**What the user does:** Taps one goal card. Goal highlights. Taps "Начать."

**What the system does:** Records goal. Maps to default protocol (Strength → APRE_6 + barbell plan; Endurance → running plan; General → mixed 3-day). Does NOT ask sport category. Does NOT show day chips. Does NOT mention tiers.

**WHY:** Show the ring before asking anything. Users commit to answering questions when they can see what they're getting. One question on screen 1. Anything more is abandonment risk. Day chips and sport selection are decisions users can't make well on Day 0 — defer them.

---

### Экран 2: Input Method

**What the user sees:**  
3 large option cards with illustrations:
- **"HRV монитор"** → chest strap illustration → subtitle: *"Максимальная точность"*
- **"Умные часы / телефон"** → smartwatch → subtitle: *"Загружаю данные из приложения"*
- **"Ввожу вручную"** → person with pencil → subtitle: *"Пульс и сон — сам"*

**What the user does:** Taps one card. No sub-questions.

**What the system does:** Sets tier internally: HRV → Full, Smartwatch → Medium, Manual → Light. The words "Full/Medium/Light" are **never shown to the user** — they are internal engineering language. HRV field is hidden from all check-ins if Manual is selected. If Smartwatch selected: a one-time CSV import prompt appears the first time the user visits the Log page, not now.

**WHY:** Tier is a calculation parameter, not a user-facing concept. Users understand their hardware; they don't understand "Full tier with HRV-weighted z-score." Let them choose the device; let the system pick the tier. This removes one unnecessary decision from onboarding.

---

### Экран 3: First Check-In (not a tutorial — the actual product)

**What the user sees:**  
The ring at top, pulsing border animation, subtitle: *"Первый чек-ин — 30 секунд"*. Below ring: bottom sheet slides up automatically with 3 fields:

1. **"Сон"** — large number display (default: 7.5h), +/− buttons at 0.5h increments
2. **"Пульс покоя"** — large number (default: 65), +/− buttons at 1 bpm increments *(hidden entirely if Light tier)*
3. **"Самочувствие"** — row of 5 emoji: 😴 😐 🙂 😊 🤩 — tap one

Small link below: *"Добавить подробности ▸"* (collapsed accordion — mood, soreness, stress, notes)

Full-width button: **"Оценить готовность →"**

**What the user does:** Adjusts sleep (typically 1-2 taps), adjusts HR if different, taps emoji. Submits. 3-7 taps. 15-25 seconds.

**What the system does:** Computes first recovery score. Animates ring: grey → color, 0 → [score], 1.2-second fill animation. Displays:  
- Large: **"[NUMBER]"**  
- Medium: **"[Verdict: Готов к нагрузке / Умеренная готовность / Тело просит паузу]"**  
- Small: *"[Sport] тренировка · ≈ 45 мин → Начать"*

Onboarding is complete. User is now on Today page with a working recovery score and a training plan. Not a tutorial. Not an empty state. **The product, working.**

**WHY:** The worst moment in any app is completing onboarding and landing in an empty dashboard. The check-in is the last onboarding step — onboarding ends with value delivered, not with promises about future value. The +/- button pattern is critical: most mornings sleep changes by ±0.5-1h, so the user adjusts from the default rather than typing. The emoji energy scale eliminates the "what does 3/5 feel like?" ambiguity of number scales.

---

## Акт II: Ежеутренний ритуал (каждый день, 25 секунд)

### The Cue

**What the user sees:**  
Push notification at user-set time (default 07:30, configurable in Settings): *"[Name], как спал? Открой — 30 секунд →"*  
Lock screen widget (where PWA supports): small ring icon, grey/dimmed, *"Не заполнен"* text.

**What the user does:** Taps notification.

**What the system does:** App opens **directly to the check-in bottom sheet**, not to TodayPage. Zero navigation required. The bottom sheet is the first thing rendered.

**WHY:** Every additional screen between notification and first input is a measurable drop-off point. Notification → TodayPage → find check-in button → form = 3 steps. Notification → check-in form = 0 steps. This single change has a larger effect on daily completion rate than any UX improvement to the form itself. The screen-wake-lock should be acquired at this point so the phone doesn't dim during a 15-second interaction.

---

### The Routine

**What the user sees:**  
Bottom sheet over dimmed TodayPage (ring visible but blurred behind). 3 fields: Sleep (±), RHR (±, or hidden), Energy (emoji). *"Добавить подробности ▸"* collapsed. *"Оценить готовность →"* button.

**What the user does:** 3-7 taps. Max 25 seconds.

**WHY:** Smart defaults are the key mechanism. Last entry for sleep and HR means on a typical day, the user makes 0 adjustments to numeric fields and just taps the emoji and submits. 2 taps total. On days that differ from normal, they adjust. The cognitive load scales to the day's variance — low friction on normal days, normal friction on unusual days.

---

### The Reward (The Ring Reveal)

**What the user sees:**  
Bottom sheet closes. Ring on TodayPage animates: grey → [color], count-up 0 → [score] over 1.2 seconds.

**Two lines only, below the ring:**  
- **Large:** *"Готов к нагрузке"* (or yellow/red verdict)  
- **Small:** *"82 — твой средний за 30 дней: 71. Сегодня выше нормы."*

*(If fewer than 14 days of data: "82 — первые 14 дней строим baseline")*

**Below ring:** *"Тренировка А · Жим + Подтягивания · ≈ 45 мин →* **Начать**"

**No banners. No tier suggestions. No adherence warnings. No sparklines.** All of that exists — below the fold, accessible by scrolling.

**WHY:** The comparative line is the difference between a meaningless number and a personal metric. *"82"* is abstract. *"82 — лучше твоего обычного"* creates pride and sets tomorrow's target. This is identical to how Garmin shows "better than your typical Monday" or how Oura says "your readiness is above your average." It transforms a metric into a moment. The silence around the ring reveal — no banners competing for attention — is as important as the ring itself. Let the number land.

---

## Акт III: Тренировка (2-3 минуты активного использования)

### Pre-Workout Card

**What the user sees:**  
Today's workout card (below ring, reached by scrolling or tapping CTA):
- Title: *"Тренировка А: Верх тела"*
- Estimated time: *"≈ 47 мин"*
- Exercise list: 6 items, each showing weight × reps
- If normal recovery: small green dot, no text
- If low recovery: *"Лёгкий режим — нагрузка снижена"* (no ⚠️, no CNS language, no emoji)
- **"▶ Начать тренировку"** (large, accent, full-width)

**What the user does:** Taps "Начать."

**What the system does:** Enters full-screen WorkoutMode. Acquires screen wake lock (critical — screen must NOT dim during workouts). Shows first exercise.

---

### During Workout: One Exercise at a Time

**What the user sees:**  
Full-screen, minimal. No navigation bar. No back button visible.

- **Top:** *"Жим лёжа"* (large, centered)
- **Center:** *"Подход 1 из 3 · 80 кг × 8"* (large)
- **Rest timer circle:** Large, centered below text, showing "--:--" (inactive)
- **Bottom:** Single full-width button: **"✓ Подход выполнен"**

Nothing else.

**What the user does:** Does the set. Taps the big button.

**What the system does:** Records set. Timer circle fills green, countdown begins: *"120 сек отдых."* Timer is the dominant visual during rest. Below timer: next set info pre-loaded (*"Подход 2 · 80 кг × 8"*).

**WHY:** Zero cognitive load. One decision per set: did I do it? The rest timer being the dominant visual during rest is not accidental — athletes stare at it between sets. Making it large, central, and countdown-animated means the phone stays in hand (not in pocket) and the app stays open. This is how workouts become 60-minute app sessions vs. 3-minute logging sessions.

---

### The AMRAP Set — The Magic Moment

**What the user sees:**  
On the last set of a strength exercise, the set label shows **"AMRAP"** tag. After tapping "Подход выполнен":  
Bottom sheet slides up: *"Сколько повторений сделал?"* — number keyboard, pre-filled with target reps (e.g., 8).

User changes to actual reps (e.g., 10).

**Immediately, before keyboard closes:**  
A toast notification slides in from the bottom of the screen:  
- Background: **green gradient**  
- Large: **"🔥 +2.5 кг на следующей неделе"**  
- Small: *"10 вместо 8 — прогресс зафиксирован"*  
- Auto-dismiss: 4 seconds  

If reps < target: toast is neutral blue: *"Зафиксировано. Вес без изменений."*  
If reps = target: toast is white: *"Зафиксировано. Продолжаем план."*

**WHY:** This is the entire reason this app exists. The APRE engine's output — your primary differentiation — needs to arrive at the **exact moment** the athlete earns it: still breathing hard, pump still in the muscle, before they put the phone down. Not in a weekly summary. Not in a morning notification tomorrow. Right now. The green toast for progression vs. neutral for maintenance creates a micro-game: every AMRAP set is a chance to see the green flash. This is the intrinsic motivation loop that separates your app from every other workout logger.

---

### Post-Workout: 10 Seconds

**What the user sees:**  
Full-screen completion state. Large animated checkmark (green, 400ms). Title: *"Тренировка записана."*

Below, immediately:  
- RPE slider (1-10), pre-filled at 7. Left label: *"Легко"*, right: *"Предел"*.
- Below slider: *"Заметки"* link (collapsed, optional).
- Full-width button: **"Готово →"**

**What the user does:** Adjusts RPE slider (typically 1-2 taps), taps Готово.

**What the system does:** Saves session. Updates completion rate. Runs APRE projection pipeline. Returns to TodayPage — ring now has a small ✓ overlay (training day completed). Nothing else changes visually.

**WHY:** One slider, not a fatigue + pain + notes form. Post-workout, the user has 20 seconds of app attention before they start cooldown, talk to someone, or check their phone for messages. Capture the most valuable signal (RPE — it feeds APRE recalibration) and get out. The checkmark animation is the end-of-session reward. Make it satisfying. The subtle ✓ on the ring acknowledges the day's commitment without demanding further interaction.

---

## Акт IV: Конец недели (Понедельник утром)

### The Monday Notification

**What the user sees:**  
Push notification (Monday, same time as daily check-in):  
*"Итоги недели: +2.5 кг к жиму. 5/5 тренировок. →"*

User taps → opens TodayPage.

**WHY:** The weekly summary notification is WHOOP's most-engaged touchpoint. It does two things: rewards compliance (5/5 = pride) and highlights specific progress (the weight delta, not abstract "good week"). The specificity of "+2.5 кг к жиму" is everything — it connects to something the user physically felt on Thursday. Generic summaries ("You had a great week!") are ignored; specific personal data is not.

---

### Inline Weekly Review Card

**What the user sees:**  
At the TOP of TodayPage on Monday (above the ring, pushing everything down): a white card with subtle shadow. **Dismissable (× top right).**

Three lines, maximum:
1. **"💪 Жим лёжа: 80 кг → 82.5 кг"** *(most-progressed lift this week)*
2. **"📊 5 из 5 тренировок"** + context: *"Твоя лучшая неделя"* or *"−1 от рекорда"*
3. **"🔋 Средний Score: 74 (неделю назад: 69)"*

Below lines: **"На следующей неделе: +10% объёма"** or **"Объём без изменений — ещё одна хорошая неделя, и пойдём вверх"**

Footer: *"Подробная аналитика →"* (small link, right-aligned)

**What the user does:** Reads 3 lines (10 seconds). Maybe taps to analytics. Taps × to dismiss. Check-in form appears normally.

**What the system does:** Stores `weeklyReviewDismissed: [weekKey]` in localStorage. Card doesn't reappear until next Monday.

**WHY:** Users don't navigate to the Analytics page. The Analytics page is for enthusiasts who want to go deep — maybe 15% of your user base. 85% need the summary to find THEM. Inline, top-of-screen, Monday morning is the exact placement that drives re-engagement and sets up the coming week's motivation. The three specific lines (strongest lift delta, compliance, avg recovery delta) are the minimum meaningful feedback set. *"82.5 кг"* is a personal milestone. *"5 из 5"* creates a streak-protection instinct for next week.

---

## Акт V: Когда что-то идёт не так

### Recovery Debt (2+ consecutive bad days)

**What the user sees:**  
Morning check-in completes → ring animates to **yellow, 43**. Large verdict: *"Тело просит паузу."* Small comparative: *"43 — на 31% ниже твоего среднего."*

Scrolling down to workout section: plan is **already modified**, shown inline. No warning banner. No ⚠️. Just:  
*"Тренировка А (восстановительный режим) · ≈ 30 мин"*  
Exercise list shows lighter weights already applied.

To the right of the workout title: small **ℹ️** icon.  
Tapping it → bottom sheet:  
*"HRV −12% за 2 дня. Пульс +4 уд/мин. Вероятно: недосып. Нагрузка снижена автоматически на 30%."*  
Below: *"Тренировать по полному плану →"* (secondary button, not styled as primary).

**WHY:** Four problems with the current vision's low-recovery handling: (1) yellow ring, (2) "Будь осторожен" header, (3) automatic plan change, (4) explanation card + "Почему?" button = four separate communications of the same message. That's noise. The action (modified plan) speaks for itself. The explanation is one tap away for those who want it. The override is possible but requires deliberate intent — this is respectful UX for an experienced athlete. Don't explain unless asked. Don't lock the override behind a confirmation dialog.

---

### Injury / Pain Report

**What the user sees:**  
First time hip pain ≥3/5 is logged in check-in: a card appears BEFORE the workout section:  
*"Ты отметил боль в бедре. Добавить реабилитацию к тренировке?"*  
**[Да, добавить]** · **[Пропустить]** · **[Больше не спрашивать]**

If [Да, добавить]: a **"Реабилитация (бедро)"** block appears BELOW today's workout. It's additive, not substitutive. The main workout is unchanged.

**WHY:** Silent exercise substitution (current implementation) destroys trust with experienced athletes who notice it and don't understand why. *"Where did my Romanian deadlifts go?"* is a support ticket waiting to happen. Better: show the rehab block as an optional supplement. The athlete decides whether to do less and rehab, do everything, or skip rehab entirely. You provide the protocol; they make the decision. Respecting athlete agency is how you build trust.

---

# Part 3: Top 5 Priority Changes

Priority is ordered by **impact on daily habit formation**, not implementation ease.

---

## 1. Web Push Notifications

**What to change:**  
Add Web Push API integration to the existing service worker. Add notification time preference to ProfilePage Settings. Implement two notification types: (a) daily check-in reminder at user-set time; (b) Monday weekly summary with 3 specific stat lines. Use VAPID keys for push authentication.

**Files:** `sw.js` (or equivalent service worker file), `js/shared/notifications.ts` (new), `ProfilePage.jsx` (settings section).

**Why it matters:**  
This is the broken cue in your habit loop. Without an external trigger, DAU depends on intrinsic motivation. Every other improvement on this list increases the quality of the product *for users who are already in it*. Push notifications bring users **to** the product. Industry data on habit-formation apps consistently shows push notification implementation as the highest-leverage single change for Day-7 and Day-30 retention.

**How to change it:**  
Register push subscription in the existing service worker using `self.registration.pushManager.subscribe()`. Since this is a local-first app without a server, use `self.registration.showNotification()` triggered by a **periodic background sync** (where browser supports it) or a timed check on app focus. The Monday summary notification can be computed at app-open on Monday using existing `weeklySummary()` from `analytics.ts` and deferred-shown via `setTimeout(0)`. For the daily check-in: register a background sync tag `daily-checkin-reminder` that fires `showNotification()` if today's check-in is missing.

**Effort: M**

---

## 2. Compress Check-In to 3 Fields with Smart Defaults

**What to change:**  
Create a `QuickCheckin` mode in `CheckinForm.jsx` that renders only: Sleep (±0.5h buttons, default = last entry), RHR (±1 buttons, default = last entry, hidden if Light tier), Energy (5-emoji row). All other fields (mood, soreness, stress, weight, notes) behind a *"Добавить подробности ▸"* accordion. Make QuickCheckin the **default** render when no check-in exists for today.

**Files:** `CheckinForm.jsx` (314L) — add `mode="quick"` prop + Quick render path. `CheckinSlice` — defaults already stored, just use them for pre-fill. `TodayPage.jsx` — render CheckinForm in quick mode.

**Why it matters:**  
Daily check-in completion rate is the foundation of everything else. A 12-field form has abandonment fatigue after 3-5 days. A 3-field form with pre-filled defaults takes 15 seconds. The difference between 45% daily completion and 75% daily completion is the difference between a recovery score that means something and one that's based on 3 data points per week. All downstream features (APRE calibration, adaptation pipeline, analytics correlations) are only as good as the check-in data feeding them.

**How to change it:**  
In `CheckinForm.jsx`, add `if (props.mode === 'quick') { return <QuickCheckinLayout /> }` path. The QuickCheckinLayout renders sleep as a large `[−] [7.5h] [+]` row, RHR similarly, and energy as `<EmojiRow onChange={...} />` (5 inline emoji buttons). Below: a `<Collapsible label="Добавить подробности">` containing existing full form fields. Pre-fill values from `checkinSlice`'s last saved entry (already available in store). The expand/collapse state is local React state, not persisted.

**Effort: S**

---

## 3. APRE Toast in WorkoutMode

**What to change:**  
After user inputs actual AMRAP reps, if reps > target: display a floating toast at the bottom of WorkoutMode screen. Green background, *"🔥 +X.X кг на следующей неделе"*, 4-second auto-dismiss with slide-in/slide-out animation. Use the already-computed `calcNextWeekRM` result directly.

**Files:** `WorkoutMode.jsx` (354L) — add toast trigger logic in AMRAP reps handler. Add `<Toast>` component (new, ~30 lines, absolute-positioned div + CSS keyframe animation).

**Why it matters:**  
Your APRE engine is your biggest competitive differentiator. It's currently buried. The weight progression computed in `apre/engine.js` is output to... an exercise card field that most users never look at. The AMRAP toast delivers the most important feedback signal at the exact moment of maximum emotional relevance: right after the effort, before the endorphins fade. This is the *"magic moment"* — the instant a new user understands why this app is different from a simple logger. If this moment is memorable, the user comes back. If it's silent, the differentiation is invisible.

**How to change it:**  
In WorkoutMode's AMRAP reps submission handler, after calling `annotateExercisesWithApre()` or `calcNextWeekRM()`, check if `nextRM > currentRM`. If true, compute weight delta (`nextRM - currentRM`), format as *"+X.X кг"*, and set `toastMessage` state. Render `<Toast>` as `position: fixed; bottom: 80px;` with a `transform: translateY(100%)` → `translateY(0)` CSS animation (0.3s ease-out) and auto-dismiss via `setTimeout(() => setToastMessage(null), 4000)`. Three visual states: green (progress), neutral blue (maintained), grey-white (decreased). The toast must appear BEFORE the keyboard dismisses — trigger it in the same event handler as the reps save, not in a useEffect.

**Effort: S**

---

## 4. Comparative Context Line Under the Recovery Ring

**What to change:**  
Add a single line below the ring score: *"[SCORE] — [твой средний за 30 дней: N]. Сегодня [выше нормы / ниже нормы / на уровне нормы]."* Use existing analytics functions to compute the 30-day average. If fewer than 14 data points, show *"Строим baseline — нужно ещё [N] чек-инов"* instead. No banner, no card — one line of text.

**Files:** `computeDerived.ts` — add `scoreLast30DayAvg: number | null` to derived state. `TodayPage.jsx` — render comparison line conditionally below ring score.

**Why it matters:**  
A recovery score without context is trivia. With context, it becomes personal. *"82"* produces no emotional response. *"82 — лучше твоего обычного (71)"* produces pride, a goal for tomorrow, and a reason to maintain the check-in streak so the comparison keeps being meaningful. This is the difference between a metric and a reward. It costs one derived field and two JSX lines. The ROI on retention is disproportionate to the implementation effort — this is the highest-leverage small change on this list.

**How to change it:**  
In `computeDerived.ts`, add:  
```ts
const last30Checkins = allCheckins.filter(c => isWithinDays(c.date, 30));
const scoreLast30DayAvg = last30Checkins.length >= 14 
  ? mean(last30Checkins.map(c => c.recoveryScore)) 
  : null;
```  
In `TodayPage.jsx`, below the score display:  
```tsx
{derived.scoreLast30DayAvg !== null && (
  <p className={styles.scoreContext}>
    {t('score.comparison', { avg: round(derived.scoreLast30DayAvg), 
      relation: score > avg ? 'выше' : score < avg ? 'ниже' : 'на уровне' })}
  </p>
)}
```  
Add i18n keys to `ru.json` + `en.json`. No new component required.

**Effort: S**

---

## 5. Inline Monday Weekly Review Card

**What to change:**  
Create a `WeeklyReviewCard` component that renders at the top of TodayPage on Mondays (or on first app-open after Sunday if the user doesn't open on Monday). Shows: best lift delta for the week, sessions completed (X/Y), average recovery score vs. prior week. Store `weeklyReviewDismissed: [weekISO]` in localStorage to show once per week. Dismissable with ×.

**Files:** `TodayPage.jsx` — add conditional `<WeeklyReviewCard>` at top of page layout. `WeeklyReviewCard.jsx` (new, ~80 lines). `computeDerived.ts` or a new `js/domains/analytics/weeklyReview.ts` for the data aggregation.

**Why it matters:**  
The Analytics page exists. Nobody navigates there unprompted. Weekly progress data is the strongest long-term retention driver — seeing *"Жим: 80 кг → 82.5 кг"* after 8 weeks is why athletes don't cancel gym memberships. If that data is buried in an Analytics tab, it doesn't drive behavior. Surfaced inline on Monday morning, it becomes the reason to open the app, the motivation for the week ahead, and the reward for last week's compliance. WHOOP's weekly report is their single highest-engagement touchpoint across all user segments. This is your equivalent.

**How to change it:**  
Create `weeklyReview.ts` using existing `weeklySummary()` from `analytics.ts`. Add exercise progression delta: filter `allSessions` from the previous 7 days, find the highest weight increase vs. 7-14 days prior for any strength exercise. In `WeeklyReviewCard.jsx`, render three lines as described in the Golden Path redesign. In `TodayPage.jsx`, add: `if (isMonday(today) && localStorage.getItem('weeklyReviewDismissed') !== thisWeekISO && previousWeekHasData)` render card above ring. On dismiss (× tap), `localStorage.setItem('weeklyReviewDismissed', thisWeekISO)`. The component should only render if at least 2 sessions exist for the previous week — avoid showing an empty card.

**Effort: M**

---

# Summary

| Priority | Change | Why | Effort |
|---|---|---|---|
| 1 | Web Push Notifications | Broken habit cue — the most impactful gap | M |
| 2 | 3-field quick check-in | Daily completion rate drives all data quality | S |
| 3 | APRE toast in WorkoutMode | Your differentiator, made visible at the magic moment | S |
| 4 | Comparative ring verdict line | Makes the score personal = reward loop | S |
| 5 | Inline Monday weekly review | Re-engagement + progress reward without Analytics navigation | M |

The existing codebase is genuinely strong — 720 passing tests, TypeScript clean, solid domain architecture. The gap is not in what's built; it's in what's surfaced. Priorities 2-4 are small changes to existing components. Priority 1 is the structural fix that makes everything else matter. Priority 5 is the weekly anchor that turns a useful app into a habit.
