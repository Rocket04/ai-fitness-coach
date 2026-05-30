# Onboarding E2E Test Execution Pattern

## Test Scenario Template

**Purpose**: Validate the 5-step onboarding wizard end-to-end without code modifications.

### Step-by-Step Execution

1. **Isolated Browser Context**
   ```javascript
   mcp_chrome_devtools_new_page(isolatedContext="e2e_test", url="http://localhost:3000")
   ```

2. **Step 1: Value Selection**
   - Click the primary CTA (e.g., "Начать первую тренировку")
   - Snapshot, verify heading shows "Выбери свою цель" or similar
   
3. **Step 2: Goal Selection**
   - Click a goal option (e.g., uid=2_1 for first goal)
   - Next button becomes enabled, click it
   
4. **Step 3: Sports Selection**
   - Scroll through categories (Cardio, Strength, Flexibility, Team, Combat, Adventure)
   - Click multiple sport checkboxes (e.g., uid=3_3 for Running)
   - Verify checkboxes show checked state in snapshot
   - Click next button
   
5. **Step 4: Gadgets Selection**
   - Click gadget options (e.g., uid=5_2 for HRV monitor, uid=5_3 for smart watch)
   - Observe tier recommendation updates automatically
   - Click next button
   
6. **Step 5: Recovery Tier Confirmation**
   - Verify recommended tier matches gadget selection
   - Click final CTA to complete onboarding

### Verification Points

| Check | How to Verify |
|-------|---------------|
| Sports persistence | Navigate to Profile page, verify selected sports appear |
| Tier auto-detection | Check recommended check-in tier matches gadget capabilities |
| Console errors | Use `browser_console` or `mcp_chrome_devtools_list_console_messages` throughout |

### Report Generation

Create `docs/onboarding-e2e-report.md` with:
- Flow completion status (pass/fail for each step)
- Console errors observed
- Persistence verification results
- Tier auto-detection confirmation