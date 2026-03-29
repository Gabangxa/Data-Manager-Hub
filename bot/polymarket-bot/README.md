# polymarket-bot

Autonomous monitoring and strategy learning bot for Polymarket.
Reads public market data only — no auth or wallet required for Phases 1–3.

## Stack

- **Python 3.11** — single process, no async complexity
- **httpx** — all Polymarket API calls
- **PostgreSQL** — Replit's built-in DB (auto-provisioned, `DATABASE_URL` injected)
- **Flask** — minimal HTTP server keeps Replit "always on" alive
- **psycopg2** — Postgres driver

## Project structure

```
polymarket-bot/
├── CLAUDE.md              # Agent constitution (constraints first)
├── scheduler.py           # Entrypoint — starts Flask + pipeline loop
├── main.py                # Single pipeline run
├── server.py              # Flask keep-alive + /health /signals /watchlist
├── db.py                  # Postgres connection, schema, all query helpers
├── api.py                 # Thin wrapper over all three Polymarket APIs
├── config.py              # All tuneable constants in one place
│
├── agents/
│   ├── market_scanner.py  # Phase 1: fetch, filter, score, upsert watchlist
│   ├── data_collector.py  # Phase 2: snapshot per market → snapshots table
│   ├── spread_engine.py   # Phase 3a: spread > 2x fee detection
│   ├── neg_risk_engine.py # Phase 3b: over-round detection on neg-risk events
│   └── reversion_engine.py# Phase 3c: thin-liquidity price shock detection
│
└── logs/                  # run_YYYY-MM-DD.log (auto-created)
```

## Replit setup (one-time)

1. Push this repo to your Replit (import from GitHub or upload zip)
2. Open **Tools → Database** in the workspace — provision a Postgres DB
3. `DATABASE_URL` is now auto-set as an environment variable
4. Set the run command to `python scheduler.py` (already in `.replit`)
5. Hit **Run** — schema is created automatically on first start

## HTTP endpoints (while running)

| Endpoint | What it returns |
|---|---|
| `GET /` | `"polymarket-bot is running"` — Replit keep-alive ping |
| `GET /health` | JSON: status + DB row counts + last snapshot time |
| `GET /signals` | JSON: signal counts per strategy + last 50 signals (24h) |
| `GET /watchlist` | JSON: all watched markets with scores |

## Run cadence

- **Every 5 min**: collect snapshots + run all three strategy engines
- **Every 1 hour** (every 12th run): also refresh the watchlist via scanner

## Tuning

Everything lives in `config.py`. Key knobs:

| Constant | Default | What it does |
|---|---|---|
| `POLL_INTERVAL_SECONDS` | 300 | Time between pipeline runs |
| `MIN_VOLUME_24H` | 5,000 | USD volume floor for watchlist |
| `MAX_WATCHLIST_SIZE` | 20 | Max markets to watch |
| `SPREAD_FEE_MULTIPLE` | 2.0 | Spread must be this many × fee to signal |
| `NEG_RISK_OVERROUND_THRESHOLD` | 1.02 | Sum of prices to flag as over-round |
| `REVERSION_PRICE_MOVE_THRESHOLD` | 0.08 | Price move (in $) to flag as shock |

## Phase 4 (coming later)

The `signals` table already has `entry_price`, `exit_price`, `pnl`, `resolved`
columns reserved for paper trading. Phase 4 will track signal outcomes and
score each strategy's real-world alpha.
