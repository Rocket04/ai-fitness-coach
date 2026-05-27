# <service-name>

**Owner:** [[people/<name>]]
**Status:** Production | Beta | Prototype | Deprecated
**Last reviewed:** YYYY-MM-DD

## Purpose

One paragraph. What does this service do? Who is it for?

## Owners & On-Call

- **Primary owner:** [[people/<name>]]
- **Backup:** [[people/<name>]]
- **On-call rotation:** <link>

## Invariants

Non-negotiables for this service. Violating these is an incident.

1. ...
2. ...

## Interfaces

- **Endpoints:** `GET /api/...`, `POST /api/...`
- **Events:** publishes `topic.foo`, consumes `topic.bar`
- **Dependencies:** Postgres, Redis, SQS

## SLOs

- p95 latency: <value>
- Availability: <value>
- Error rate: <value>

## Data

- **Primary store:** Postgres `db_name.schema.table`
- **Cache:** Redis key pattern
- **PII handling:** what's stored, where, retention

## Runbook

### Common alerts
- **<AlertName>** — likely causes, first steps

### Deploys
- **How:** ...
- **Rollback:** ...

### Operations
- **Scaling:** how it scales, current capacity
- **Backup:** where, retention
- **Restore:** steps

## Incident History

- [[incidents/YYYY-MM-DD-<title>]]
- [[incidents/YYYY-MM-DD-<title>]]

## Related Decisions

- [[decisions/ADR-NNN-<title>]]
