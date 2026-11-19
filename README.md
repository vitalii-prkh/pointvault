# PointVault

PointVault is a loyalty points wallet API. Members earn points, redeem them for rewards, and generate activity
events such as check-ins and purchases. It is an evidence project for building a production-style backend with
NestJS and TypeScript, PostgreSQL for the double-entry points ledger, MongoDB for activity telemetry, and
deployment to Azure with Docker, GitHub Actions and Application Insights.

> **Status:** Phase 2. Points are stored in a double-entry ledger in PostgreSQL; activity events in MongoDB.

## Requirements

- Node.js 24 (`nvm use` reads `.nvmrc`)
- A recent npm (`npm install -g npm@latest`). npm 11.5 crashes on install with
  `Cannot read properties of null (reading 'edgesOut')`.
- Docker, for the local PostgreSQL and MongoDB

## Quick start

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:up
npm run db:migrate
npm run dev:api
```

| URL                                     | What                                          |
| --------------------------------------- | --------------------------------------------- |
| http://localhost:3000/docs              | Swagger UI                                    |
| http://localhost:3000/docs/openapi.json | OpenAPI contract                              |
| http://localhost:3000/healthz           | Liveness probe: the process is up             |
| http://localhost:3000/readyz            | Readiness probe: both databases are reachable |

## Scripts

Run from the repo root.

| Script               | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `npm run dev:api`    | Start the API in watch mode                                           |
| `npm run build`      | Build every workspace                                                 |
| `npm run lint`       | Lint every workspace (oxlint)                                         |
| `npm test`           | Unit tests (Vitest)                                                   |
| `npm run test:e2e`   | End-to-end HTTP tests against the test databases. Needs `db:up` first |
| `npm run db:up`      | Start PostgreSQL and MongoDB (docker-compose)                         |
| `npm run db:down`    | Stop them. Data is kept in Docker volumes                             |
| `npm run db:migrate` | Apply Prisma migrations to the dev database                           |

The e2e suite uses the separate `pointvault_test` databases (`apps/api/.env.test`) and applies migrations to them
itself, so it never touches dev data.

## API

| Method | Path                     | Result                                                                            |
| ------ | ------------------------ | --------------------------------------------------------------------------------- |
| `GET`  | `/healthz`               | `200`, process is up                                                              |
| `GET`  | `/readyz`                | `200` when both databases answer, `503` otherwise                                 |
| `POST` | `/api/members`           | `201`, member with an empty wallet; `409` if the email exists                     |
| `GET`  | `/api/members/:id`       | `200`, member; `404` if unknown                                                   |
| `POST` | `/api/wallet/earn`       | `201`, ledger entry; `404` for an unknown member                                  |
| `POST` | `/api/wallet/redeem`     | `201`, ledger entry; `409` if the balance is too low; `404` for an unknown member |
| `GET`  | `/api/wallet/:memberId`  | `200`, balance; `404` for an unknown member                                       |
| `POST` | `/api/activity/check-in` | `202`, event stored in MongoDB                                                    |
| `POST` | `/api/activity/purchase` | `202`, event stored; awards 1 point per whole currency unit                       |

Invalid or unknown fields return `400`.

`earn` and `redeem` accept an optional `Idempotency-Key` header. A retry with the same key returns the original
entry instead of applying it twice; the same key with a different request returns `409`. A purchase uses its
`orderId` as the key, so a retried purchase never pays the bonus twice.

## Repository layout

```
apps/api     NestJS REST API, Prisma schema and migrations
docs/adr     Architecture decision records
infra        Database init scripts for docker-compose
```

Why PostgreSQL for points and MongoDB for events:
[ADR-001](docs/adr/ADR-001-database-architecture.md).

## Roadmap

- [x] **Phase 1:** NestJS REST API, validation, Swagger UI, unit and e2e tests
- [x] **Phase 2:** PostgreSQL (Prisma) ledger, MongoDB (Mongoose) activity events, ADR-001
- [ ] **Phase 3:** Dockerfile, docker-compose, integration tests against real databases
- [ ] **Phase 4:** AZ-900 certification
- [ ] **Phase 5:** GitHub Actions CI: tests, Docker build, push to registry
- [ ] **Phase 6:** Deploy to Azure, Application Insights custom metrics
