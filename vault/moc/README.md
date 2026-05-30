# Maps of Content (MOCs)

Curated reading lists for cross-cutting topics. Each MOC is a single markdown file that links to the ADRs, service pages, incidents, and external docs someone would need to understand a topic end-to-end.

## Examples of good MOCs

- `auth.md` — how authentication works here: the relevant ADRs, the auth service, the client SDK, the SSO config, past incidents with auth.
- `deploy.md` — how a change goes from PR to production: the CI pipeline, the staging environment, the rollout tool, the rollback runbook.
- `data-model.md` — our core entities and their relationships, with pointers to the schema, the domain invariants, and the services that own each entity.

## When to create a MOC

You've onboarded a new team member and had to send the same 6 links twice — it's time for a MOC.

## Format

Keep MOCs under 200 lines. They're indexes, not essays.

```markdown
# <Topic> — Map of Content

Last reviewed: YYYY-MM-DD

## Primer
One paragraph — what this topic is, why it matters.

## Canonical references
- [[decisions/ADR-XXX]] — the founding decision
- [[services/XXX]] — the system
- External: <link> — upstream docs

## Common tasks
- "Add a new X" → <page / section>
- "Debug X failing" → <runbook link>

## Incident history
- [[incidents/YYYY-MM-DD-XXX]]

## People
- [[people/XXX]] — owner
- [[people/XXX]] — historical context
```
