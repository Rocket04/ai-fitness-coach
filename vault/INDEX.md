# Project Wiki — INDEX

This is the living map of `vault/`. The `wiki-update` skill (wired via
[post_cascade_response_with_transcript](../.windsurf/hooks.json)) appends to this index
whenever a session produces a decision, fact, or state change.

Read this before starting any non-trivial task. Cascade does this automatically via the
`wiki-query` skill.

---

## Decisions

Architectural Decision Records (ADRs). Numbered sequentially. Never modified — deprecated
by writing a newer ADR that supersedes.

See [`decisions/`](decisions/).

- _(empty — add with `@wiki-update` or use `decisions/ADR-000-TEMPLATE.md`)_

## Services

One page per service / module / subsystem. Current owner, SLA, runbook,
known invariants, incident history.

See [`services/`](services/).

- _(empty — use `services/TEMPLATE.md`)_

## Incidents

Post-mortems, grouped by date. Root cause, timeline, action items, invariants learned.

See [`incidents/`](incidents/).

- _(empty — use `incidents/TEMPLATE.md`)_

## People

Who owns what. Not HR data — engineering ownership. Updated when ownership changes.

See [`people/`](people/).

- _(empty)_

## Maps of Content

Curated reading lists for cross-cutting topics (e.g., "How we do auth", "How we deploy",
"Data model primer").

See [`moc/`](moc/).

- _(empty)_

## Glossary

Terms of art specific to this project. See [`glossary.md`](glossary.md).

---

## Conventions

- **Append-only.** Never delete existing content. Mark stale sections with
  `> **Stale as of YYYY-MM-DD:** ...` and write the new version below.
- **Wikilinks.** Use `[[page-name]]` to cross-reference. Create stubs for missing pages.
- **Date everything.** Every entry starts with a date line.
- **Keep pages short.** Lookup, not narrative. If a page is > 300 lines, split it.
- **Cite sources.** Link PRs, Slack threads, external docs — don't paraphrase unsourced.
