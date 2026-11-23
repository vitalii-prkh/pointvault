# syntax=docker/dockerfile:1
# Build context is the repo root (npm workspaces share one package-lock.json):
#   docker build -f apps/api/Dockerfile -t pointvault-api .

ARG NODE_IMAGE=node:24.22.3-alpine

# ---- deps: every dependency, cached until a manifest or the Prisma schema changes
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/

# `postinstall` runs `prisma generate`, which needs the schema and config.
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
RUN npm ci -w apps/api

# ---- build: compile TypeScript to dist/ (the generated Prisma client is compiled in)
FROM deps AS build
COPY apps/api apps/api
RUN npm run build -w apps/api

# ---- migrate: one-shot job that applies migrations, then exits (prisma CLI is a dev dependency)
FROM deps AS migrate
WORKDIR /app/apps/api
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- prod-deps: runtime dependencies only.
# --omit=optional matters: the prisma CLI and typescript are optional peers of @prisma/client and
# @nestjs/swagger, so the lockfile marks them "devOptional" and --omit=dev alone keeps them (+250 MB).
# --ignore-scripts: skip `prisma generate`, the client is already compiled into dist/.
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci -w apps/api --omit=dev --omit=optional --ignore-scripts && npm cache clean --force

# ---- runtime: small, non-root, no compilers, no dev tools
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3000

# Liveness (/healthz): "the process is up". docker-compose overrides this with /readyz, so `up --wait`
# also waits for both databases.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form: node is PID 1 and receives SIGTERM directly, so Nest's shutdown hooks close the DB pools.
CMD ["node", "dist/main.js"]
