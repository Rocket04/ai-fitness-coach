# Demo Data Generation Patterns

## Athlete Profile-Based Data Generation

### Pattern: Per-Profile Configuration
Each profile defines distinct data generation parameters:
- baseHrv/baseRhr/baseSleep: baseline values
- hrvVariation/rhrVariation/sleepVariation: ± ranges
- stressLevel/sorenessLevel: 1-5 scales
- consistency: 0-1 probability of data on any given day
- recoveryCycle: days for full sinusoidal recovery cycle

### Pattern: Deterministic Seeding
Use a hash of the profile name as the RNG seed for reproducible data.

### Pattern: Recovery Cycle
Use sinusoidal function: cycle = sin((i / recoveryCycle) * 2π - π/2)
Combined with noise: recovery = cycle * 0.6 + noise * 0.4

### Pattern: Missing Data (Consistency)
Simulate real-world missing data: hasData = rng() < consistency

### Profile Comparison
| Profile | HRV | RHR | Sleep | Stress | Consistency | Cycle |
|---------|-----|-----|-------|--------|-------------|-------|
| Marathoner | 62±15 | 52±8 | 8±1 | 2/5 | 95% | 28d |
| Yogi | 72±12 | 58±6 | 8.5±0.8 | 1/5 | 85% | 21d |
| CrossFitter | 52±18 | 65±10 | 7±1.5 | 3/5 | 80% | 35d |
| Rehab | 48±20 | 68±12 | 6.5±2 | 4/5 | 70% | 42d |

### Implementation Notes
- Use `Partial<Settings> & { checkinTier?; selectedGadgets?; selectedSports?; level?; goals? }` for profile config type
- Cast at usage: `profileConfig.settings.goals as FitnessGoal[]`
- Parse equipment JSON: `profileConfig.settings.equipment ? JSON.parse(...) : {}`
- Store process requires PowerShell on Windows: `Stop-Process -Name serve -Force`
