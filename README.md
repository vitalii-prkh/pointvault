# PointVault

PointVault is a loyalty points wallet API. Members earn points, redeem them for rewards, and generate activity
events such as check-ins and purchases. It is an evidence project for building a production-style backend with
NestJS and TypeScript, PostgreSQL for the double-entry points ledger, MongoDB for activity telemetry, and
deployment to Azure with Docker, GitHub Actions and Application Insights.

> **Status:** Phase 1. The REST API, validation and Swagger docs work, and the endpoints return mocked data.
> Databases arrive in Phase 2.

## Requirements

- Node.js 24 (`nvm use` reads `.nvmrc`)
- A recent npm (`npm install -g npm@latest`). npm 11.5 crashes on install with
  `Cannot read properties of null (reading 'edgesOut')`.

## Quick start

```bash
npm install
npm run dev:api
```

| URL | What |
| --- | --- |
| http://localhost:3000/docs | Swagger UI |
| http://localhost:3000/docs/openapi.json | OpenAPI contract |
| http://localhost:3000/healthz | Liveness probe |

## Scripts

Run from the repo root.

| Script | What it does |
| --- | --- |
| `npm run dev:api` | Start the API in watch mode |
| `npm run build` | Build every workspace |
| `npm run lint` | Lint every workspace (oxlint) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end HTTP tests (Vitest + Supertest) |

## API (Phase 1)

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/healthz` | `200`, process is up |
| `POST` | `/api/wallet/earn` | `201`, ledger entry |
| `POST` | `/api/wallet/redeem` | `201`, ledger entry |
| `GET` | `/api/wallet/:memberId` | `200`, balance |
| `POST` | `/api/activity/check-in` | `202`, event accepted |
| `POST` | `/api/activity/purchase` | `202`, event accepted |

Invalid or unknown fields return `400`.

## Repository layout

```
apps/api     NestJS REST API
docs/adr     Architecture decision records
```

## Roadmap

- [x] **Phase 1:** NestJS REST API, validation, Swagger UI, unit and e2e tests
- [ ] **Phase 2:** PostgreSQL (Prisma) ledger, MongoDB (Mongoose) activity events, ADR-001
- [ ] **Phase 3:** Dockerfile, docker-compose, integration tests against real databases
- [ ] **Phase 4:** AZ-900 certification
- [ ] **Phase 5:** GitHub Actions CI: tests, Docker build, push to registry
- [ ] **Phase 6:** Deploy to Azure, Application Insights custom metrics
