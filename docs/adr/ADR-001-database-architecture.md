# ADR-001: PostgreSQL for the points ledger, MongoDB for activity events

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

PointVault stores two kinds of data with different needs.

- **Points ledger** (members, wallets, ledger entries). This is money-like. A balance must never be wrong or
  negative, earn and redeem must be all-or-nothing, and a retried request must not apply twice. The shape is
  fixed and relational.
- **Activity events** (check-ins, purchases, and more types later). This is telemetry: high volume, append-only,
  each type with different fields, and new types added often. Losing or delaying one event is acceptable; a
  wrong balance is not.

## Decision

1. **PostgreSQL (via Prisma) is the system of record for points.**
   - Double-entry ledger: every operation is one `ledger_transactions` row with two `ledger_entries` rows that
     sum to zero, one on the member wallet and one on a system wallet (issuance or redemption).
   - Each operation runs in one database transaction.
   - Overdraft is prevented twice: a guarded update (`balance >= points`) in the service, and a
     `CHECK (kind <> 'MEMBER' OR balance >= 0)` constraint in the database.
   - Idempotency: a unique `idempotency_key` per transaction. A retry returns the original result.
2. **MongoDB (via Mongoose) stores activity events** in `activity_events`, with a schemaless `payload` per event
   type and an index on `(memberId, receivedAt)`.
3. **No transaction spans both databases.** When an event also moves points (a purchase bonus), the service
   writes to Postgres first, then to Mongo. The order id is the idempotency key, so a retry after a Mongo failure
   never pays twice.

## Consequences

- **Good:** balances are correct by construction and auditable; events can change shape without migrations;
  each store can scale or be tuned separately.
- **Cost:** two databases to run, back up and monitor. Local setup needs docker-compose.
- **Cost:** cross-database writes are not atomic. A Mongo outage can leave a bonus paid with no event logged
  until the client retries. This is acceptable for telemetry. If it stops being acceptable, add a transactional
  outbox (write the event to a Postgres table in the same transaction, publish it to Mongo asynchronously).
- **Cost:** every transaction updates a system wallet row, so all earns (and all redeems) are serialized on that
  row. That is fine at this project's scale. At higher volume, drop the stored balance on system wallets and
  derive it from entries.
- **Cost:** a retried purchase logs a second `purchase` event (new `eventId`) even though the bonus is paid
  once. Event counts can include retries; points stay correct. Deduplicate on `payload.orderId` if analytics
  needs exact counts.
- **Cost:** events are not checked against Postgres (no cross-store foreign key), so a check-in for an unknown
  member is accepted. Acceptable for telemetry; validate the member first if events ever drive points.

## Alternatives considered

- **Postgres only, events in a JSONB table.** Simpler to operate, and JSONB handles flexible fields. Rejected for
  this project because a separate document store for high-volume telemetry is the pattern being demonstrated,
  and it keeps event load off the ledger database.
- **MongoDB only.** Multi-document transactions exist, but need a replica set, and relational constraints
  (foreign keys, CHECK, unique keys across tables) would move into application code. Rejected for the ledger.
- **Single-entry ledger** (one row per operation, balance column only). Simpler, but you can't prove the books
  balance. Rejected.
