# PointVault

PointVault is a loyalty points wallet API. Members earn points, redeem them for rewards, and generate activity
events such as check-ins and purchases. It is an evidence project for building a production-style backend with
NestJS and TypeScript, PostgreSQL for the double-entry points ledger, MongoDB for activity telemetry, and
deployment to Azure with Docker, GitHub Actions and Application Insights.

> **Status:** Phase 3. The API ships as a production Docker image, and the whole stack runs with one command.

## Requirements

- Node.js 24 (`nvm use` reads `.nvmrc`)
- A recent npm (`npm install -g npm@latest`). npm 11.5 crashes on install with
  `Cannot read properties of null (reading 'edgesOut')`.
- Docker, for PostgreSQL, MongoDB and the API container

## Quick start

Run the whole stack in containers (API, PostgreSQL, MongoDB; migrations apply automatically):

```bash
npm install
npm run stack:up
```

Or run the API locally in watch mode against the containerised databases:

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:up
npm run db:migrate
npm run dev:api
```

Both use port 3000, so stop one before starting the other (`npm run stack:down`), or set `API_PORT=3001` for
the stack.

| URL                                     | What                                          |
| --------------------------------------- | --------------------------------------------- |
| http://localhost:3000/docs              | Swagger UI                                    |
| http://localhost:3000/docs/openapi.json | OpenAPI contract                              |
| http://localhost:3000/healthz           | Liveness probe: the process is up             |
| http://localhost:3000/readyz            | Readiness probe: both databases are reachable |

## Scripts

Run from the repo root.

| Script               | What it does                                                                     |
| -------------------- | -------------------------------------------------------------------------------- |
| `npm run dev:api`    | Start the API in watch mode                                                      |
| `npm run build`      | Build every workspace                                                            |
| `npm run lint`       | Lint every workspace (oxlint)                                                    |
| `npm test`           | Unit tests (Vitest)                                                              |
| `npm run test:e2e`   | End-to-end tests, app in-process against the test databases. Needs `db:up` first |
| `npm run test:stack` | Black-box HTTP tests against the running container stack. Needs `stack:up` first |
| `npm run db:up`      | Start only PostgreSQL and MongoDB                                                |
| `npm run db:down`    | Stop all containers. Data is kept in Docker volumes                              |
| `npm run db:migrate` | Apply Prisma migrations to the dev database                                      |
| `npm run stack:up`   | Build the API image and start the whole stack; waits until `/readyz` is green    |
| `npm run stack:down` | Stop the whole stack                                                             |
| `npm run stack:logs` | Follow the API container logs                                                    |

The e2e suite uses the separate `pointvault_test` databases (`apps/api/.env.test`) and applies migrations to them
itself, so it never touches dev data. Test levels and the choice of Vitest:
[ADR-002](docs/adr/ADR-002-test-runner.md).

## Docker image

`apps/api/Dockerfile` is a multi-stage build from the repo root:

```bash
docker build -f apps/api/Dockerfile -t pointvault-api .
```

- **runtime** (default): Node 24 Alpine, production dependencies only, runs as the non-root `node` user,
  `HEALTHCHECK` on `/healthz`, and shuts down cleanly on `SIGTERM`.
- **migrate**: one-shot `prisma migrate deploy`. docker-compose runs it before the API starts.

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
apps/api     NestJS REST API, Prisma schema and migrations, Dockerfile
docs/adr     Architecture decision records
infra        Database init scripts for docker-compose
```

Why PostgreSQL for points and MongoDB for events:
[ADR-001](docs/adr/ADR-001-database-architecture.md).

## Roadmap

- [x] **Phase 1:** NestJS REST API, validation, Swagger UI, unit and e2e tests
- [x] **Phase 2:** PostgreSQL (Prisma) ledger, MongoDB (Mongoose) activity events, ADR-001
- [x] **Phase 3:** Dockerfile, docker-compose, integration tests against the container stack
- [x] **Phase 4:** AZ-900 certification
- [ ] **Phase 5:** GitHub Actions CI: tests, Docker build, push to registry
- [ ] **Phase 6:** Deploy to Azure, Application Insights custom metrics
