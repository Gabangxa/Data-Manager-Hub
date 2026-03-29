# CLAUDE.md — Polymarket Bot Constitution

## HARD CONSTRAINTS (read first, always)

1. **Never place real orders.** Phases 1–3 are read-only. No wallet keys,
   no order signing, no POST to the CLOB order endpoint.
2. **Never store credentials** in code or flat files. If Phase 4 execution
   is added, credentials go in environment variables only.
3. **Respect rate limits.** All API calls go through `api.py`. Default
   polling interval is 5 minutes. Never hammer endpoints in a loop.
4. **Data files are append-only.** Never delete snapshots or overwrite
   watchlist without explicit user instruction.
5. **Fail loudly.** All errors must be logged to `logs/`. Never silently
   swallow exceptions that would corrupt data or skip an analysis step.

---

## Project purpose

Build, observe, and learn. This bot exists to:
1. Select a watchlist of active Polymarket markets worth watching
2. Collect structured data snapshots over time
3. Run three non-predictive strategy engines against that data
4. Log and score opportunities for later review / paper trading

No predictions about real-world outcomes are made. Alpha comes from
market structure (spread, over-round, liquidity shock) not from knowing
what will happen.

---

## Agent responsibilities

| Agent | Reads from | Writes to |
|---|---|---|
| `market_scanner` | Gamma API | `data/watchlist/watched_markets.json` |
| `data_collector` | CLOB API, Data API | `data/snapshots/` |
| `spread_engine` | `data/snapshots/` | `reports/` |
| `neg_risk_engine` | `data/snapshots/` | `reports/` |
| `reversion_engine` | `data/snapshots/` | `reports/` |

---

## API base URLs

- Gamma API:  `https://gamma-api.polymarket.com`
- CLOB API:   `https://clob.polymarket.com`
- Data API:   `https://data-api.polymarket.com`

All endpoints are public. No API key needed for read operations.

---

## Memory system

- `data/watchlist/watched_markets.json` — current watchlist with metadata
- `data/snapshots/{market_id}_{iso_timestamp}.json` — point-in-time snapshot
- `logs/run_{iso_date}.log` — per-day log file
- `reports/opportunities_{iso_date}.md` — daily opportunity summary

---

## Coding conventions

- Python 3.11+
- `httpx` for all HTTP (sync client, no async complexity yet)
- `config.py` is the single source of truth for all constants
- Each agent is a plain function: `run() -> dict` returning a result summary
- `main.py` calls agents in order and logs the result summary
