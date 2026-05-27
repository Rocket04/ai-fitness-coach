---
name: auto-router
description: >-
  Automatically suggests relevant skills at conversation start based on the user's initial prompt.
  Scans the trigger-word table in AGENTS.md to match user intent with appropriate skills.
  Should be invoked at the beginning of conversations to route the user to the right tools.
license: MIT
metadata:
  category: meta
  source:
    repository: local
    path: auto-router
---

# Auto-Router Skill

Automatically suggests relevant skills based on user prompts by matching against trigger phrases in AGENTS.md.

## When to Use

Invoke this skill at the start of a conversation when:
- The user has entered an initial request
- You need to determine which skills are relevant to their task
- The user's intent is unclear and could map to multiple skill categories

## How It Works

1. **Parse AGENTS.md**: Extract the trigger-word table from the `## Agent Skills / Trigger Words` section
2. **Match User Prompt**: Use fuzzy string matching against trigger phrases
3. **Calculate Confidence**: Score matches on a 0-100 scale
4. **Present Results**: Show top 3-5 matching skills with confidence scores
5. **User Confirmation**: Ask which skills to load

## Usage

Run the matching script with the user's prompt:

```bash
python .kilo/skills/auto-router/scripts/match_skills.py "<user prompt>" [path/to/AGENTS.md]
```

The script outputs JSON with matched skills and confidence scores.

## Confidence Thresholds

- **>90**: High confidence — suggest auto-loading the skill
- **70-90**: Medium-high — present as strong match
- **40-70**: Medium — present as possible match
- **<40**: Low — ask user for clarification

## Interaction Flow

### With Clear Match (>70 confidence)

1. Parse user prompt with matching script
2. Present top 3-5 matches:
   ```
   Based on your request, these skills might help:
   
   1. diagnose (confidence: 95%) — Reproduce → instrument → fix loop
   2. tdd (confidence: 62%) — Test-driven development loop
   3. test-backfill (confidence: 45%) — Fill coverage gaps
   
   Which skills should I load? Any others you'd like to include?
   ```
3. Wait for user response
4. Invoke selected skills via `skill(name)`

### With High Confidence Match (>90)

1. Identify the top match
2. Confirm with user:
   ```
   This task looks like it needs the `diagnose` skill for debugging.
   Load it? (y/n)
   ```
3. If confirmed, invoke the skill

### With No Clear Match (<40)

1. Check for similar skills (semantic proximity)
2. Ask clarifying question:
   ```
   No clear skill match found. Did you mean:
   - Something related to testing? (tdd, test-backfill, webapp-testing)
   - Something related to web scraping? (firecrawl-scrape, firecrawl-search)
   - Something else?
   ```

## Example Matches

| User Prompt | Top Match | Confidence |
|-------------|-----------|------------|
| "fix this bug" | diagnose | 95% |
| "scrape this URL" | firecrawl-scrape | 98% |
| "design a landing page" | frontend-design | 92% |
| "test this first" | tdd | 88% |
| "make a plan" | planning-with-files | 85% |
| "crawl this site" | firecrawl-crawl | 90% |

## Script Output Format

```json
{
  "matches": [
    {
      "skill": "diagnose",
      "confidence": 95,
      "trigger_phrases": ["fix this bug", "broken", "failing test"],
      "description": "Reproduce → instrument → fix loop"
    }
  ],
  "top_match": {
    "skill": "diagnose",
    "confidence": 95
  },
  "has_clear_match": true,
  "suggested_skills": ["diagnose", "tdd"]
}
```

## Notes

- The script handles AGENTS.md parsing automatically
- Fuzzy matching tolerates typos and variations
- Always confirm with user before loading skills
- If multiple skills match, let user choose
