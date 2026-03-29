# Workspace

## Overview

pnpm workspace monorepo using TypeScript for a **Polymarket Bot** — a read-only market data collection and strategy analysis system. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/markets.ts` — `markets` table: one row per watched Polymarket market
- `src/schema/snapshots.ts` — `snapshots` table: time-series price/liquidity data per market
- `src/schema/signals.ts` — `signals` table: strategy signals from spread/neg-risk/reversion engines
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

#### Database Schema

**`markets`** — watched market metadata
- `market_id` (PK), `condition_id`, `question`, `event_title`, `event_slug`
- `tags[]`, `neg_risk`, `token_ids[]`, `outcomes[]`
- `volume_24h`, `liquidity`, `end_date`, `hours_to_close`, `fees_enabled`, `score`

**`snapshots`** — point-in-time market data (time-series)
- `id` (PK bigserial), `market_id` (FK), `collected_at`
- `yes_price`, `no_price`, `spread`, `midpoint`, `fee_rate_bps`, `open_interest`
- `price_history`, `top_holders`, `recent_trades` (JSONB), `errors[]`
- Index: `(market_id, collected_at DESC)`

**`signals`** — strategy engine outputs
- `id` (PK bigserial), `strategy`, `market_id`, `event_slug`, `signal_score`
- `metadata` (JSONB), `emitted_at`
- Paper trade fields: `entry_price`, `exit_price`, `pnl`, `resolved`
- Indexes: `(strategy, emitted_at DESC)`, `(market_id, emitted_at DESC)`

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## Current System Status (as of 2026-03-29)

- **Markets tracked**: 41
- **Snapshots collected**: 2,735+
- **Total signals**: 52 (23 resolved, 29 open)
- **Win rate**: 60.9% overall across resolved signals
- **Strategies**: SPREAD_HARVESTING (42 signals, 61.9% win rate), MEAN_REVERSION (10 signals, 50.0% win rate)
- **Bot frequency**: runs every 6 hours via Replit workflow scheduler
- **Dashboard**: Performance page confirmed working — all PNL and win rate values render correctly

## Bot Architecture (`bot/polymarket-bot/`)

Python bot that writes directly to the same PostgreSQL database used by the Express API.

- `scheduler.py` — entry point; runs a blocking scheduler loop (APScheduler) that fires every 6 hours; also starts a Flask keep-alive server on `BOT_PORT` (default `5001`)
- `server.py` — minimal Flask HTTP server to keep the Replit workflow alive
- `agents/data_collector.py` — fetches market metadata and snapshots from Polymarket public APIs; writes to `markets` and `snapshots` tables
- `agents/signal_engine.py` — evaluates spread-harvesting and mean-reversion strategies; writes signals to `signals` table
- `api.py` — low-level wrappers around Polymarket CLOB/Gamma REST endpoints
- `state.json` — persisted engine state (streak counters, last signal timestamps per strategy)

**Important port rule**: `PORT=8080` is reserved for the Express API server. The bot's Flask keep-alive must use `BOT_PORT` (default `5001`). Never let the bot read `PORT`.

## Known Issues & Fixes

### Port conflict: bot Flask server vs Express API server
**Symptom**: `EADDRINUSE: address already in use :::8080` — API server fails to start.  
**Root cause**: `bot/polymarket-bot/scheduler.py` starts a Flask keep-alive server using `os.environ.get("PORT", 8080)`. Replit sets `PORT=8080` for every workflow, so the Python bot grabbed port 8080 first, leaving the Express API server unable to bind.  
**Fix**: Bot now reads `BOT_PORT` (defaults to `5001`) instead of `PORT` for its keep-alive Flask server. `PORT` is reserved exclusively for the Express API server.  
**Files changed**: `bot/polymarket-bot/scheduler.py`

### Dashboard crash: `pnl.toFixed is not a function`
**Symptom**: Performance page crashes at runtime immediately on load.  
**Root cause**: PostgreSQL `numeric` columns serialize as strings over JSON. The `fmtPnl`, `fmtWinRate`, and `winRateColor` helpers in `performance.tsx` assumed numeric inputs but received strings, so `.toFixed()` failed.  
**Fix**: All three helpers now pass their input through `parseNumeric()` (already imported from `@/lib/utils`) before doing arithmetic. Input types widened to `number | string | null | undefined`.  
**Files changed**: `artifacts/dashboard/src/pages/performance.tsx`

### Production build fails silently: missing env vars at build time
**Symptom**: Deployed app shows blank screen; build log shows no errors.  
**Root cause**: `artifacts/dashboard/vite.config.ts` threw a hard error if `PORT` or `BASE_PATH` were not set. These vars are only needed at runtime (dev server), not at build time — so the production `vite build` was crashing before it could produce any output.  
**Fix**: `PORT` now defaults to `3000` and `BASE_PATH` defaults to `/` when not set, allowing `vite build` to complete successfully in all environments.  
**Files changed**: `artifacts/dashboard/vite.config.ts`

### yes_price always 0 / spread signals not firing
**Symptom**: `yes_price` stored as 0 in all snapshots; spread engine fires 0 signals.  
**Root cause**: Polymarket's CLOB `/spread` endpoint no longer returns `mid` or `sell` fields. The data collector was reading `data['mid']` from the spread response, which was always missing.  
**Fix**: Midpoint is now fetched from the dedicated `/midpoint` endpoint separately. Zero values from `/midpoint` are treated as `None` (no data) rather than a real price. Fallback price history is labeled `DEGRADED` when midpoint is unavailable.  
**Files changed**: `bot/polymarket-bot/agents/data_collector.py`, `bot/polymarket-bot/api.py`

### Production site appears broken after deployment (browser cache)
**Symptom**: The deployed `.replit.app` site shows crashes or a blank screen even after publishing, while the API is confirmed healthy (200s in deployment logs).  
**Root cause**: Vite produces a deterministic content hash for the JS bundle (`index-CWnspTtR.js`). Browsers aggressively cache this file. If a user visited the production site before a fix was deployed, their browser serves the stale cached bundle — even after a new deployment — because the filename hash didn't change.  
**Fix**: Hard-refresh the production URL (`Ctrl+Shift+R` / `Cmd+Shift+R`) or open it in an incognito window to bypass the browser cache. A new deployment also forces Replit to serve fresh assets.  
**Verification**: Dev app confirmed working post-fix — Performance page renders 60.9% win rate and all PNL values correctly.
