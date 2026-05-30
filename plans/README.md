# Plans

File-based plans for Cascade, following the [Planning With Files](../.windsurf/skills/planning-with-files/SKILL.md) skill.

## Why This Directory Exists

File-based plans survive `/compact`, session restarts, and worktrees. Every non-trivial task gets a plan here before any code changes.

## Convention

- Filename: `<YYYY-MM-DD>-<slug>.md` (e.g., `2026-04-17-stripe-webhooks.md`)
- One plan = one PR = one merged feature
- Commit the empty plan template first — the plan is the contract

## Active Plans

<!-- Cascade appends here. Remove entries when the plan ships. -->

## Archive

Move completed plans to `plans/archive/<year>/` if you want to keep them searchable.

## Related

- Skill: [`planning-with-files`](../.windsurf/skills/planning-with-files/SKILL.md)
- Template: [`PRD.template.md`](../templates/PRD.template.md)
- Workflow: [`prd-driven`](../.windsurf/workflows/prd-driven.md)
- Guide: [§1 Cascade Modes](https://github.com/OnlyTerp/windsurf-unlocked#1-cascade-modes-code--plan--ask)
