# AGENTS.md — Smart Fitness Coach

## Project Identity

Smart Fitness Coach is a local-first adaptive training planner.

Primary goal:

**Answer "Am I ready to train today, and what exactly should I do?"**

Current product strength:

- transparent APRE-based strength autoregulation;
- tiered recovery scoring;
- manual check-in;
- local data ownership;
- basic multi-sport planning.

Do not describe the product as a complete Health OS, wearable platform, or medical system unless those features are actually implemented.

## Tech Stack

Use the versions in `package.json` as source of truth.

Core stack:

- React 18;
- TypeScript;
- Vite;
- Zustand;
- Dexie / IndexedDB;
- Vitest;
- react-i18next;
- lucide-react;
- custom CSS.

## Product Boundaries

### Data privacy

Default rule:

- Data stays local unless the user explicitly opts into an integration, export, or sync.

Allowed with explicit product approval:

- Apple Health / HealthKit;
- Health Connect;
- Garmin;
- Strava;
- CSV import/export;
- optional encrypted sync.

Disallowed:

- selling user data;
- advertising trackers;
- silent health-data upload;
- external calls without user-facing purpose.

## Architecture

```text
Input → IndexedDB → Zustand → derived state → UI recommendation
```

Core files:

- `js/stores/useAppStore.ts`;
- `js/stores/slices/` — Zustand store slices (checkin, session, ui, data, demo);
- `js/core/recoveryScore.ts`;
- `js/core/readiness.ts`;
- `js/core/planning.ts`;
- `js/core/apre/engine.js`;
- `js/core/exerciseDatabase.ts`;
- `js/core/completionRate.ts`;
- `js/core/import/csvParser.ts`;
- `js/core/analytics.ts`;
- `js/core/sessionLoad.ts`.

## Coding Rules

### Core logic

- Keep domain logic pure when possible.
- Add tests for new domain functions.
- Avoid `any` in `js/core/`; use proper types or `unknown` with guards.
- Keep `types.ts` synchronized with store state.

### React

- New components should use JSX.
- Legacy pages may still use `React.createElement`.
- Do not expand legacy style unless required.
- Prefer one Zustand subscription per component.

### Styling

- Use existing CSS tokens.
- Custom CSS is acceptable.
- Accessibility has priority over visual purity.
- Do not forbid light/high-contrast/reduced-motion support if product needs it.

### Storage

- User data belongs in IndexedDB.
- LocalStorage is acceptable only for small UI/settings flags.
- Any integration must track data source and timestamp.

### Commit Discipline

- Documentation is part of the commit: every commit that changes API, data model, architecture, or user-facing behavior must update the relevant README/docs/
- Split commits by concern: one logical change per commit, not a dump of unrelated files
- Commit messages summarize the "why" in one line, then list changed files/areas

## Feature Honesty Rules

Every feature must be labeled as one of:

- implemented;
- partial;
- planned;
- placeholder;
- removed.

Do not call placeholders "integrations".

Do not call rule-based advice "AI".

Do not claim test suite is green unless `npm test` was run and passed in the current session.

## Testing Rules

Before declaring completion:

**PowerShell:**
```powershell
Set-Location -Path 'c:\Projects\fitness-tracker'; npm run type-check; npm test
```

**E2E tests** (Playwright — requires `npm run dev` on `:3000`):
```powershell
Set-Location -Path 'c:\Projects\fitness-tracker'; npm run test:e2e
```

If tests fail, report:

- failed files;
- failed test count;
- whether the failure is pre-existing or caused by the change.

## Product Priorities

When uncertain, prioritize:

1. correctness;
2. safety;
3. explanation;
4. data quality;
5. training specificity;
6. privacy;
7. UI polish.

Do not prioritize PDF export, badges, or generic AI chat over the training decision engine.

## Model Selection by Task Type

- **SWE 1.6 Fast/SWE 1.6** — быстрые правки, простой рефакторинг, выполнение рутинных действий. Используется по умолчанию.
- **Kimi K2.6** — написание кода (экономный режим, подходит для большей части рутины).
- **Claude Opus 4.7 Think (Medium/High)/ChatGPT 5.5 (xhigh/high)** — сложная архитектура, глубокий анализ, распутывание запутанной логики. Переключаться при упоминании слов "архитектура", "дизайн", "проблема".

## Agent Skills / Trigger Words

When a user request matches a trigger phrase, invoke the corresponding skill via `skill(name)`.

### Engineering & Code Quality

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "fix this bug", "broken", "failing test", "debug this" | `diagnose` | Reproduce → instrument → fix loop |
| "test this first", "red-green-refactor", "TDD" | `tdd` | Test-driven development loop |
| "fill test gaps", "more coverage", "backfill tests" | `test-backfill` | Fill coverage gaps to hit target |
| "ready for review", "clean up commits", "PR prep" | `pr-ready` | Squash WIP, polish messages, green checks |
| "find all X that don't Y", "refactor structurally" | `ast-grep` | AST-aware search and refactoring |
| "architecture needs work", "refactor opportunities" | `improve-codebase-architecture` | Find deepening opportunities |
| "too much context", "compact", "context rot" | `compact-hygiene` | Proactive `/compact` with preservation |
| "zoom out", "bigger picture", "how does this fit" | `zoom-out` | Broader context / higher-level perspective |
| "review my plan against docs", "grill my design" | `grill-with-docs` | Stress-test plan against domain model |
| "setup issue tracker skills", "configure triage" | `setup-matt-pocock-skills` | Setup agent skills for issue tracking |
| "refactor agent instructions", "split AGENTS.md" | `agent-md-refactor` | Refactor bloated agent instruction files |
| "scrape secrets before commit", "check for leaked keys" | `secret-scrubber` | Scan for leaked secrets, API keys, tokens |

### Planning & Issue Management

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "make a plan", "plan this out", "planning mode" | `planning-with-files` | Persistent markdown plan for non-trivial tasks |
| "turn this into tickets", "break into issues" | `to-issues` | Decompose plan into tracker issues |
| "write a PRD", "product requirements" | `to-prd` | Turn conversation into a PRD |
| "triage this", "new bug report", "review incoming" | `triage` | State-machine issue triage |
| "speckit specify", "formal spec" | `speckit-specify` | Turn loose request into formal spec |
| "speckit plan", "implementable plan" | `speckit-plan` | Decompose spec into plan with checkboxes |

### Testing & QA

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "test the webapp", "UI testing", "frontend QA" | `webapp-testing` | Playwright-based web app testing |
| "dogfood this", "exploratory QA", "find bugs" | `dogfood` | Exploratory QA, find bugs with evidence |
| "review my UI", "check accessibility", "audit UX" | `web-design-guidelines` | Review UI code for best practices |
| "visual iteration", "screenshot fix loop" | `visual-iteration` | Screenshot → describe → fix for UI work |

### Web Scraping & Research (Firecrawl)

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "scrape this URL", "get the page", "extract from web" | `firecrawl-scrape` | Extract clean markdown from any URL |
| "search the web", "find articles", "look up" | `firecrawl-search` | Web search with full page content |
| "crawl this site", "get all pages", "bulk extract" | `firecrawl-crawl` | Bulk extract from entire website |
| "deep research", "compare perspectives", "briefing" | `firecrawl-deep-research` | Multi-source deep research |
| "interact with page", "click through", "fill form" | `firecrawl-interact` | Browser interaction for dynamic pages |
| "download this site", "offline copy", "save docs" | `firecrawl-download` | Download entire website as local files |
| "extract structured data", "get all products", "JSON from site" | `firecrawl-agent` | AI-powered autonomous structured extraction |
| "SEO audit", "heading review", "sitemap analysis" | `firecrawl-seo-audit` | Audit website SEO |
| "market research", "industry trends", "earnings" | `firecrawl-market-research` | Extract market and financial metrics |
| "competitive intel", "track competitor pricing" | `firecrawl-competitive-intel` | Monitor competitor changes |
| "lead gen", "prospect list", "CRM-ready leads" | `firecrawl-lead-gen` | Generate structured lead lists |
| "build knowledge base", "RAG docs", "docs mirror" | `firecrawl-knowledge-base` | Build knowledge base from web content |
| "parse this PDF", "extract from document" | `firecrawl-parse` | Extract text from PDF/DOCX/XLSX |
| "research papers", "literature review", "PDF summary" | `firecrawl-research-papers` | Find and synthesize research papers |
| "map this site", "list all URLs", "site structure" | `firecrawl-map` | Discover all URLs on a website |
| "QA this site", "pre-launch quality review" | `firecrawl-qa` | QA test a live website |

### Creative & Visual

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "design a landing page", "web component", "poster" | `frontend-design` | Production-grade frontend interfaces |
| "architecture diagram", "infra diagram", "cloud chart" | `architecture-diagram` | Dark-themed SVG architecture diagrams |
| "excalidraw diagram", "hand-drawn flowchart" | `excalidraw` | Hand-drawn style diagrams |
| "ASCII art", "figlet", "cowsay", "image to ASCII" | `ascii-art` | ASCII art generation |
| "ASCII video", "convert to colored ASCII" | `ascii-video` | Convert video to colored ASCII MP4/GIF |
| "pixel art", "NES style", "Game Boy style" | `pixel-art` | Pixel art with era palettes |
| "p5js sketch", "generative art", "interactive sketch" | `p5js` | p5.js sketches and generative art |
| "manim video", "3Blue1Brown style", "math animation" | `manim-video` | Manim CE math/algorithm animations |
| "claude design", "one-off HTML artifact" | `claude-design` | Design one-off HTML artifacts |
| "sketch mockup", "design variants", "compare layouts" | `sketch` | Throwaway HTML mockups |
| "popular web designs", "clone Stripe/Vercel/Linear" | `popular-web-designs` | 54 real design systems as HTML/CSS |
| "pretext", "ASCII art layout", "typographic flow" | `pretext` | DOM-free text layout experiments |
| "article illustration", "type × style × palette" | `baoyu-article-illustrator` | Article illustrations |
| "knowledge comic", "educational comic", "biography comic" | `baoyu-comic` | Knowledge comics |
| "infographic", "information visualization" | `baoyu-infographic` | Infographics in 21 layouts × 21 styles |
| "comfyui image", "generate image", "run workflow" | `comfyui` | ComfyUI image/video/audio generation |
| "touchdesigner", "real-time visuals", "TD operator" | `touchdesigner-mcp` | Control TouchDesigner via MCP |
| "songwriting", "AI music", "Suno prompt" | `songwriting-and-ai-music` | Songwriting craft and Suno prompts |
| "creative ideas", "project ideas", "ideation" | `creative-ideation` | Generate project ideas via constraints |
| "design tokens", "DESIGN.md", "token spec" | `design-md` | Author/validate Google DESIGN.md spec |

### Agent Tools & Integration

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "claude code", "delegate to Claude CLI" | `claude-code` | Delegate coding to Claude Code CLI |
| "codex", "openai codex", "delegate to Codex" | `codex` | Delegate coding to OpenAI Codex CLI |
| "opencode", "delegate to OpenCode" | `opencode` | Delegate coding to OpenCode CLI |
| "hermes agent", "configure Hermes" | `hermes-agent` | Configure or extend Hermes Agent |
| "kanban worker", "kanban pitfalls" | `kanban-worker` | Kanban worker guidance |
| "kanban orchestrator", "decompose for kanban" | `kanban-orchestrator` | Kanban orchestrator playbook |
| "kanban codex lane", "Codex as kanban lane" | `kanban-codex-lane` | Run Codex CLI as isolated implementation lane |

### Productivity & Documents

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "notion page", "notion database", "sync to Notion" | `notion` | Notion API: pages, databases, markdown |
| "powerpoint", "create slides", "edit .pptx" | `powerpoint` | Create, read, edit PowerPoint decks |
| "humanize this", "strip AI-isms", "real voice" | `humanizer` | Humanize text, add real voice |
| "apple notes", "create note", "search notes" | `apple-notes` | Manage Apple Notes via memo CLI |
| "apple reminders", "add reminder", "list reminders" | `apple-reminders` | Apple Reminders via remindctl |
| "google workspace", "gmail", "calendar", "sheets" | `google-workspace` | Gmail, Calendar, Drive, Docs, Sheets |
| "airtable", "base", "records CRUD" | `airtable` | Airtable REST API via curl |
| "linear", "linear issues", "linear projects" | `linear` | Linear: issues, projects, teams |
| "maps", "geocode", "POIs", "routes", "timezone" | `maps` | Geocode, POIs, routes via OpenStreetMap |
| "ocr this", "extract text from PDF/scan" | `ocr-and-documents` | Extract text from PDFs and scans |
| "nano pdf", "edit PDF text", "PDF typos" | `nano-pdf` | Edit PDF text/titles via nano-pdf CLI |
| "find my device", "track AirTag", "FindMy" | `findmy` | Track Apple devices/AirTags |
| "imessage", "send iMessage", "SMS" | `imessage` | Send/receive iMessages via imsg CLI |
| "macos computer use", "drive macOS desktop" | `macos-computer-use` | Drive macOS desktop in background |
| "teams meeting", "summarize Teams", "meeting pipeline" | `teams-meeting-pipeline` | Teams meeting summary pipeline |
| "handoff", "compact for another agent" | `handoff` | Compact conversation into handoff document |
| "file organizer", "organize files", "cleanup" | `file-organizer` | Intelligently organize files and folders |

### Meta / Workflow

| Trigger phrase / intent | Skill | Description |
|---|---|---|
| "caveman mode", "less tokens", "be brief" | `caveman` | Ultra-compressed communication mode |
| "prototype this", "mock up", "try designs" | `prototype` | Throwaway prototype: terminal app or UI variations |
| "grill me", "stress-test my plan", "challenge me" | `grill-me` | Interview user relentlessly about plan/design |
| "write a skill", "create a new skill", "skill creator" | `skill-creator` / `write-a-skill` | Guide for creating effective agent skills |
| "reflection loop", "generate evaluate revise" | `reflection-loop` | Generate → evaluate → revise with external signal |
| "ralph safe", "persistent loop", "iterate until green" | `ralph-safe` | Ralph Wiggum persistent loop with kill-switch |
| "swarm split", "parallel subtasks", "6 sessions" | `swarm-split` | Decompose into 6 disjoint subtasks for parallel execution |
| "vercel react best practices", "optimize React" | `vercel-react-best-practices` | React/Next.js performance optimization |
| "wiki query", "read project wiki", "vault docs" | `wiki-query` | Read project wiki before non-trivial tasks |
| "wiki update", "update vault", "document decision" | `wiki-update` | Maintain project wiki after decisions |

## Documentation Update Rule

Любое изменение в ядре системы (каталоги `js/core/`, `js/plans/`, `js/stores/`, `js/ui/`) должно сопровождаться обновлением соответствующего файла `docs/domains/<домен>/README.md`.

Если изменение затрагивает API, модель данных или архитектурное решение – README домена обязательно обновляется. В остальных случаях – по необходимости.

## Session Logging

В начале каждой сессии, связанной с новой задачей, создавать файл `docs/sessions/YYYY-MM-DD-краткое-описание.md`. В начале файла указать цель сессии, в конце сессии дополнить файл кратким итогом: что сделано, какие решения приняты, что осталось на потом.

Если сессия продолжает предыдущую – дописывать в существующий файл.

## Memory Usage

**Перед началом сессии:**
- Всегда читать Cascade MEMORY (системные записи о проекте, доступных инструментах, статусе)
- Проверять релевантность memory к текущей задаче
- Использовать memory для контекста: tech stack, project boundaries, available skills/workflows

**В конце сессии:**
- Если задача изменила проект (новые файлы, изменённая архитектура, новые правила) — обновить memory через `create_memory` tool
- Сохранять только ключевые решения и паттерны, не временные данные
- Добавлять теги для будущего поиска (например, `project-context`, `rules`, `api-changes`)

### Session Skill Log

If a skill was invoked successfully in this session, prefer it for similar subsequent tasks without requiring explicit re-invocation. Log format (mental only, no file):

- Skill used → Task type → Result (success / partial / failed)
- Example: `diagnose` → "bug in recovery score calc" → success → prefer for future "bug", "fix", "broken" intents
