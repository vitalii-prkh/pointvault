# ADR-002: Vitest instead of Jest, three test levels

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The original roadmap said "Jest + Supertest". The API was scaffolded with Vitest in Phase 1, and by Phase 3 it has
unit, e2e and container tests. The project is native ESM (`"type": "module"`, `.js` import suffixes), which is the
main pain point of Jest today: it needs experimental VM modules or a transform for ESM, and a separate TypeScript
transformer.

## Decision

1. **Keep Vitest** as the only test runner. Supertest stays for HTTP assertions; it is runner-agnostic.
2. **Three levels, three configs:**
  - **Unit** (`vitest.config.ts`, `*.spec.ts`): services and controllers with mocked Prisma and Mongoose. No I/O.
  - **E2e** (`vitest.config.e2e.ts`, `test/*.e2e-spec.ts`): the Nest app in-process against real Postgres and
    Mongo test databases. Fast, and can inspect the databases directly.
  - **Stack** (`vitest.config.stack.ts`, `test/stack/*.stack-spec.ts`): black-box HTTP against the API running
    in its production Docker image, with migrations applied by the `migrate` job. Nothing is imported from `src/`.

## Consequences

- **Good:** ESM and TypeScript work with no transform config. The Jest-compatible API (`describe`, `it`, `expect`,
  `vi.fn` instead of `jest.fn`) means the tests read the same as Jest tests.
- **Good:** the stack tests prove the image, not just the code: the build, `npm ci --omit=dev`, the generated
  Prisma client, env wiring and migrations. They caught a real bug while setting up Phase 3 (the Prisma client was
  generated with `.ts` imports inside the image).
- **Cost:** Jest is still the most common runner in NestJS job specs and docs. The concepts transfer; the
  `jest.*` mock API differs slightly.
- **Cost:** stack tests need a built stack (`npm run stack:up`, about a minute cold, seconds when cached).

## Alternatives considered

- **Jest with `ts-jest` and ESM.** Works, but needs `--experimental-vm-modules`, ESM-specific mocking
  (`jest.unstable_mockModule`) and transform config. Rejected: more setup for the same tests.
- **Testcontainers** (start Postgres and Mongo from the test code). Self-contained, but slower and duplicates
  docker-compose. Reconsider for CI in Phase 5 if compose becomes awkward there.
