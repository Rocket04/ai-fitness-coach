# VISION: Health Operating System (Codename "Aetos")

## Mission

Give a person a personal digital mentor that knows more about their body than they do and helps them become healthier without requiring unnecessary thinking.

## Vision

The app is not just a tracker or a library of plans, but a closed-loop ecosystem: the body sends signals → the app interprets them → builds an adaptive action plan → analyzes the results → refines the plan again. The goal is an "ideal" hybrid body (strength + muscular endurance + cardio + flexibility + athletic volume) with minimal cognitive load on the user.

## Problem

- Most people don't know which exercises are safe for them specifically and don't know how to build long-term periodization.
- Existing apps either give template programs or dump raw data without interpretation.
- Perfectionists and people with ADHD get overwhelmed trying to control everything and quickly lose focus.
- High risk of injury due to unaccounted limitations and improper load distribution.

## Target Audience

- At launch: **myself** as the sole perfectionist user with specific body limitations.
- Later: people who care about their health and want to maximize their life potential using available means, following a "minimalist biohacker" lifestyle rhythm.

## Core Values

1. **Safety first** — the app must do no harm. All plans take into account injury history, chronic conditions, current pain, and objective markers of overtraining.
2. **Personalization** — not a template, but a plan growing out of individual data: HRV, resting heart rate, sleep, subjective state, physical limitations.
3. **Adaptability** — the plan changes every day based on the body's readiness (green/yellow/red status), and the macrocycle can be adjusted every few weeks.
4. **Algorithmic transparency** — a solid core of rules (deterministic algorithms) makes the main decisions. Artificial intelligence is only engaged as an assistant for edge cases, not as the primary "brain."
5. **Minimalism of interaction** — the user only inputs a few numbers per day; the system does everything else (and completes a full onboarding at the very beginning to gather all necessary data).

## Three Inseparable Product Cores

The entire app is built around three components that reinforce each other:

1. **Adaptive training plan**
   - Long-term periodization (seasons for strength, cardio, muscular endurance, volume, and flexibility).
   - A specific daily program adjusted to the current state.
   - Automatic exercise substitutions when pain or limitations are present.

2. **Health analytics**
   - Collection and interpretation of objective metrics (heart rate, HRV, sleep quality) and subjective ones (mood, stress, pain).
   - Calculation of recovery level, injury risk (ACWR), and training load (TRIMP).
   - Charts and summaries for day/week/month providing insight into dynamics.

3. **Health improvement recommendations**
   - Advice on nutrition, supplements, sleep, recovery, and rehabilitation exercises based on data, not generic checklists.
   - Rules trigger on deviations (e.g., three days of poor sleep → recommendation for magnesium and shifting bedtime).

## Principles Embedded in the Foundation

- **Algorithm first, then AI** — basic decisions (readiness status, load modification) are made by clear formulas. AI is used only when the rigid logic falls short.
- **Seasonal periodization with adaptation** — the macrocycle is divided into seasons by default, but phases can lengthen or shorten depending on progress and condition.
- **Safety screening** — a one-time PAR-Q+ questionnaire and Health History Questionnaire (HHQ) form a "risk profile" that permanently influences all generated plans.
- **Daily loop** — morning check-in with 5–7 metrics → status summary → training plan for the day → evening logging of completion and well-being.

## User Ritual (Target Experience)

1. Open the app in the morning.
2. Enter (or the app automatically pulls from a wearable): sleep, resting heart rate, HRV, subjective indicators (mood, stress, pain 1–5).
3. See the color-coded status of the day (green/yellow/red) and the adapted workout.
4. After the session, mark: completed/not completed, short comment.
5. Once a week, receive a mini-report on key metric trends.
6. Once a month/season — a suggestion to shift training focus if the system detects a plateau or imbalance.

## Roadmap (Development Vector)

### Stage 0: "Digital Journal" (current)

- Manual data entry.
- Calculation of readiness status and ACWR from entered numbers.
- Display of recommended daily load.
- Static training template with manual substitutions for pain.

### Stage 1: "Algorithmic Mentor"

- Implementation of a full safety questionnaire (PAR-Q+ / HHQ) that influences the plan.
- Macrocycle phase automaton: the training program automatically changes every 2–3 months according to the seasonal strategy.
- Daily adaptation of intensity and volume based on recovery status.
- First automatic sleep and recovery recommendations based on 7-day trends.

### Stage 2: "Closed Ecosystem"

- Integration with Huawei Health (or similar APIs) for automatic collection of objective data.
- Building a personalized baseline of metrics, more precise warnings about overtraining and injury risk.
- Recommendation layer for nutrition and supplements tied to training phase and biomarkers (if lab data available).
- Retrospective journal: analysis of reasons for missed sessions, adapting the plan to life circumstances.

### Stage 3: "Personal Health Autopilot"

- AI assistant for non-standard requests (e.g., "I want to train for an ultramarathon but have an old knee injury").
- Scaling to other users: PWA with multi-account support, basic profile settings.
- Library of exercises and protocols, expandable by the community.

## Success Metrics After One Year of Use

- **Objective:** lower resting heart rate, increased HRV (RMSSD), improved sleep quality, reduced body fat percentage, positive blood biomarker trends.
- **Subjective:** consistently high mood, low stress levels, improved appearance, absence of injuries and pain, feeling that "the body works like a clock."

## Product Philosophy

> *Don't think. Just do what the system says — it has already accounted for everything: how you slept, how you feel, what your weak spots are, and what goal is on the horizon. You become healthier without spending mental energy on planning.*

---
*This is a living document. It will be refined as hypotheses are tested on a single user.*
