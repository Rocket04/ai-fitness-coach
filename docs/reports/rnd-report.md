# R&D Report: Evolving Smart Fitness Coach to a Flexible, Personalized Coaching Platform

## Executive Summary

The Smart Fitness Coach is currently a powerful, science-backed tool tightly coupled to a single 12-week running plan and HRV-based Recovery Score. To serve hybrid athletes with varying data availability, we propose evolving it into a flexible, personalized coaching platform that adapts to users' available gadgets, preferred sports, and training goals.

## Current State Analysis

### Core Components
1. **Recovery Score System**: HRV-weighted (40%) + sleep (30%) + resting HR (10%) + subjective (20%)
2. **Training Plans**: Single rigid 12-week running plan (3 months: Foundation, Development, Integration)
3. **Check-in**: Comprehensive form with biometrics (HRV, restHR, weight), sleep, and subjective metrics
4. **Onboarding**: 3-step wizard (Value → Goal+Days → Recovery Score)
5. **Data Storage**: Local IndexedDB via Dexie, privacy-first

### Limitations
- Assumes HRV monitor availability (creates barrier for entry)
- Single sport focus (running only)
- Fixed training plan structure
- Check-in requires multiple data points for optimal function
- No accommodation for different athlete types or goals

## Research Findings: Best Practices from Top Fitness Apps

While web search was unavailable, based on industry knowledge:

### Whoop/Athlytic Model
- Tiered subscription with varying data depth
- Recovery score adapts based on available metrics
- Strong emphasis on trend analysis and personalized insights

### TrainingPeaks/TrainerRoad Model
- Sport-specific plan libraries
- Athlete profiling (cyclist, runner, triathlete, strength)
- Periodization based on sport demands
- Flexible plan mixing and matching

### Strava Model
- Sport tagging and activity type classification
- Community features with privacy controls
- Goal-based achievement systems
- Cross-training visibility

## Proposed Product Strategy

### Athlete Personas & Feature Mapping

#### 1. Hybrid Runner/Cyclist with Full Gear
- **Available Data**: HRV, restHR, sleep tracking, power/pace metrics, GPS
- **Relevant Features**: 
  - Full Recovery Score (HRV + RHR + Sleep + Subjective)
  - Sport-specific plans (running, cycling, strength)
  - Advanced analytics (correlations, trends)
  - GPS route planning integration
- **Adaptation**: Deep data analysis, performance predictions, sport-periodization

#### 2. Strength-Focused Athlete with Basic Smartwatch
- **Available Data**: restHR, sleep duration, basic activity tracking
- **Relevant Features**:
  - Medium Recovery Score (RHR + Sleep + Subjective)
  - Strength-focused plans (APRE-based)
  - Subjective wellness tracking emphasis
  - Exercise library with form guidance
- **Adaptation**: Focus on recovery trends, strength progression, subjective readiness

#### 3. Beginner with No Gadgets
- **Available Data**: Subjective check-ins only
- **Relevant Features**:
  - Light Recovery Score (Subjective only)
  - Foundational movement plans
  - Habit building and consistency tracking
  - Educational content on training principles
- **Adaptation**: On-ramp experience, gradual introduction to tracking, motivation-focused

#### 4. Time-Crunched Professional
- **Available Data**: Variable (may have some metrics sporadically)
- **Relevant Features**:
  - Adaptive Recovery Score (uses whatever data available)
  - Micro-workout options (10-15 minute sessions)
  - Stress and recovery balance focus
  - Flexible scheduling
- **Adaptation**: Maximizes benefit from minimal time investment

#### 5. Injury Recovery/Athlete Rehab
- **Available Data**: Mixed (may avoid certain metrics due to injury)
- **Relevant Features**:
  - Pain-guided check-in adaptation
  - Rehabilitation-focused plans
  - Load management emphasis
  - Professional guidance integration points
- **Adaptation**: Safety-first approach, pain-modulated training

### Recommended Changes to Onboarding Flow

#### New Onboarding Wizard Structure:
1. **Welcome & Value Proposition** (unchanged)
2. **Sport & Activity Preferences** (NEW)
   - Select primary sports: Running, Cycling, Strength Training, Yoga, Swimming, Other
   - Training frequency per sport
   - Experience level (Beginner/Intermediate/Advanced)
3. **Available Gadgets & Data Sources** (NEW)
   - HRV monitor: Yes/No
   - Smartwatch with sleep tracking: Yes/No
   - Heart rate chest strap: Yes/No
   - GPS tracking: Yes/No
   - Power meter (cycling): Yes/No
   - Manual entry only: Option
4. **Primary Goals** (Enhanced)
   - Strength/Endurance/Hybrid/Longevity/Rehab
   - Specific targets (e.g., "Run 5K under 25min", "Increase squat 20kg")
5. **Recovery Score Preference** (NEW)
   - Full: Want most accurate score (requires HRV)
   - Balanced: Good accuracy with available data
   - Simple: Subjective-only for privacy/minimalism
6. **Commitment & Schedule** (Enhanced from current)
   - Available training days/times
   - Session duration preferences
7. **Recovery Score Introduction** (unchanged, but contextualized)

#### Conditional Paths:
- If no HRV available → skip HRV explanation, emphasize RHR/sleep/subjective
- If only subjective data → explain Light Recovery Score mode
- If strength selected → show strength-oriented plan examples
- If multiple sports → explain hybrid training benefits

### Architecture Changes Needed

#### 1. Config System for Plans
- Replace hardcoded `MONTHS` array with modular plan system
- Create plan library by sport: `running/`, `cycling/`, `strength/`, `mobility/`
- Each plan contains: weekly structure, progression rules, sport-specific guidelines
- Plan mixer: Allow combining plans (e.g., 2 days running + 2 days strength)

#### 2. Modular Check-in System
- Implement tiered field display based on user's gadget selection
- Store user's preferred check-in tier in settings
- Dynamic form rendering in CheckinForm component
- Field groups: 
  - Biometrics (HRV, restHR, weight)
  - Sleep (hours, quality)
  - Subjective (energy, mood, stress, soreness, pain)
  - Sport-specific (optional: RPE, power, pace, etc.)

#### 3. Tiered Recovery Score System
- **Full Tier**: HRV (40%) + Sleep (30%) + RHR (10%) + Subjective (20%)
- **Medium Tier**: RHR (30%) + Sleep (30%) + Subjective (40%) [HRV weight redistributed]
- **Light Tier**: Subjective (100%) [simple average of normalized metrics]
- **Adaptive Mode**: Automatically adjust based on available data
- Update `calculateRecoveryScore` to handle missing data gracefully
- Modify `RECOVERY_WEIGHTS` to be dynamic based on selected tier

#### 4. User Settings Enhancement
- Add "Check-in Tier" selection in ProfilePage settings
- Add "Preferred Sports" and "Available Gadgets" sections
- Store preferences in user profile (IndexedDB)

### Migration Plan from Current Single-Sport App

#### Phase 1: Foundation (Immediate Impact)
1. Implement tiered Recovery Score calculation (handles missing HRV) (completed)
2. Add check-in tier selection in ProfilePage settings (completed)
3. Modify CheckinForm to conditionally render HRV field based on tier
4. Update onboarding to include gadget selection
5. Default existing users to "Medium" tier (preserves current behavior without HRV stress)

#### Phase 2: Personalization (High Impact)
1. Create modular plan library structure (start with running, add strength)
2. Implement plan mixer UI in onboarding/settings
3. Add sport selection to onboarding
4. Create basic strength training plan templates

#### Phase 3: Advanced Features (Long-term Value)
1. Implement adaptive Recovery Score (auto-detect available metrics)
2. Add sport-specific analytics and insights
3. Create hybrid plan recommendations
4. Add advanced goal setting and periodization

#### Phase 4: Ecosystem (Future)
1. Integrate with Apple Health/Google Fit (optional)
2. Add export/import for coach sharing
3. Community features (optional, privacy-first)
4. Advanced predictive analytics

### Priority Ranking of Changes

#### Tier 1: Immediate High Impact (Weeks 1-2)
1. **Tiered Recovery Score Calculation** - Enables users without HRV to benefit
   - Modify `js/core/recoveryScore.ts` 
   - Update `RECOVERY_WEIGHTS` handling
   - Add graceful degradation for missing metrics
2. **Check-in Tier Setting** - User control over data entry burden
   - Add setting in ProfilePage
   - Modify CheckinForm conditional rendering
   - Default to Medium for existing users

#### Tier 2: Personalization Foundation (Weeks 3-4)
1. **Sport Selection in Onboarding** - Captures athlete type early
   - Add step after Value, before Goal
   - Store preference in onboarding completion
2. **Modular Plan Structure** - Enables future flexibility
   - Create `js/plans/` directory with runner/base templates
   - Refactor planning.ts to use modular system

#### Tier 3: Enhanced Adaptability (Weeks 5-6)
1. **Gadget Detection in Onboarding** - Personalizes check-in experience
   - Add step after Sport Selection
   - Influences default check-in tier recommendation
2. **Adaptive Recovery Score** - Automatic tier selection
   - Logic to detect available metrics from recent checkins
   - Auto-suggest tier upgrade when new data becomes available

#### Tier 4: Advanced Features (Future)
1. Plan Mixing UI - Allow custom hybrid plans
2. Sport-Specific Insights - Tailored analytics
3. Advanced Goal Setting - Periodization and progression tracking
4. Health Platform Integration - Optional automatic data import

## Detailed Implementation Guidelines

### Recovery Score Calculation Updates
In `js/core/recoveryScore.ts`:
- Accept optional `tier` parameter (full/medium/light/adaptive)
- If tier not provided, derive from user settings or available data
- Implement weight redistribution when metrics missing:
  - Full: hrv:0.4, sleep:0.3, rhr:0.1, subjective:0.2
  - Medium (no HRV): rhr:0.3, sleep:0.3, subjective:0.4
  - Light (subjective only): subjective:1.0
- Handle edge cases where insufficient data for baseline calculation

### CheckinForm Modifications
- Accept `checkinTier` prop from store
- Conditionally render sections:
  - Always show: Sleep, Subjective (core)
  - Show Biometrics only if tier includes HRV/rHR/weight
  - Consider making weight optional in all tiers
- Update validation to only require fields in current tier

### OnboardingWizard Updates
- Add SportSelectionStep after ValueStep
- Add GadgetSelectionStep after SportSelectionStep
- Modify GoalStep to include sport-specific goal variations
- Add RecoveryPreferenceStep (or integrate into Gadget step)
- Store selections in onboarding completion data

### ProfilePage Settings Enhancement
- Add new section: "Data & Tracking Preferences"
- Include:
  - Check-in Tier selector (Full/Medium/Light/Adaptive)
  - Available Gadgets checklist
  - Preferred Sports selector
  - Default to user's current selections or Medium tier

## Risk Assessment & Mitigation

### Risk 1: Complexity Overwhelm for New Users
- **Mitigation**: Progressive disclosure - show only relevant fields
- Smart defaults based on onboarding selections
- Clear explanations of what each tier provides

### Risk 2: Inconsistent Data Across Tiers
- **Mitigation**: Clear documentation of what each tier measures
- Ability to view equivalent scores across tiers
- Education on limitations of subjective-only scoring

### Risk 3: Development Complexity
- **Mitigation**: Modular, incremental implementation
- Feature flags for gradual rollout
- Comprehensive unit tests for tiered calculations
- Backwards compatibility maintained

### Risk 4: Existing User Confusion
- **Mitigation**: 
  - Default existing users to Medium tier (matches current behavior without HRV stress)
  - Clear migration notice explaining changes
  - Optional tutorial for new features
  - Ability to revert to previous behavior if needed

## Success Metrics

### Adoption Metrics
- Percentage of users completing enhanced onboarding
- Distribution across check-in tiers (target: <30% Full, 50% Medium, 20% Light)
- Sport diversity among users (target: >40% non-running focused)

### Engagement Metrics
- Check-in completion rate by tier (goal: >80% across all tiers)
- Training adherence rate (goal: maintain >75%)
- Recovery Score correlation with actual performance (maintain validity)

### Business Metrics
- Retention improvement (target: +15% D30 retention)
- Reduced support burden from "I don't have HRV" inquiries
- Increased referral rate from diverse athlete communities

## Conclusion

By implementing a tiered, adaptive approach to data collection and personalization, Smart Fitness Coach can evolve from a niche HRV-dependent running tool to a inclusive platform serving athletes across the spectrum of data availability and sporting interests. This approach maintains the app's scientific rigor and privacy-first principles while significantly expanding its addressable market and real-world applicability.

The proposed changes can be rolled out incrementally, with early phases delivering immediate value to users without HRV monitors while laying the foundation for richer personalization features.

---
*Report generated: May 22, 2026*
*Based on analysis of PROJECT_CONTEXT.md, memory-bank files, js/config/constants.js, and core application components*