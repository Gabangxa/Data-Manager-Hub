# main.py — run the full pipeline once
# Order: schema init → scanner → collector → [spread, neg_risk, reversion]

import logging
import os
import sys
from datetime import datetime, timezone

from config import LOGS_DIR

os.makedirs(LOGS_DIR, exist_ok=True)

today    = datetime.now(timezone.utc).strftime("%Y-%m-%d")
log_path = os.path.join(LOGS_DIR, f"run_{today}.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_path),
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger("main")

import db
from agents import market_scanner, data_collector
from agents import spread_engine, neg_risk_engine, reversion_engine


def run_pipeline(skip_scan=False):
    run_start = datetime.now(timezone.utc).isoformat()
    results   = {"started_at": run_start, "agents": {}}

    logger.info("=" * 60)
    logger.info(f"Pipeline run started: {run_start}")
    logger.info("=" * 60)

    # Ensure schema exists (idempotent)
    try:
        db.init_schema()
    except Exception as e:
        logger.error(f"Schema init failed: {e}")
        # Don't abort — DB might already be set up

    if not skip_scan:
        try:
            result = market_scanner.run()
            results["agents"]["market_scanner"] = result
            logger.info(f"Scanner: {result}")
        except Exception as e:
            logger.error(f"market_scanner crashed: {e}", exc_info=True)
            results["agents"]["market_scanner"] = {"error": str(e)}
    else:
        logger.info("Skipping scanner (skip_scan=True)")

    try:
        result = data_collector.run()
        results["agents"]["data_collector"] = result
        logger.info(f"Collector: {result}")
    except Exception as e:
        logger.error(f"data_collector crashed: {e}", exc_info=True)
        results["agents"]["data_collector"] = {"error": str(e)}

    for name, agent in [
        ("spread_engine",    spread_engine),
        ("neg_risk_engine",  neg_risk_engine),
        ("reversion_engine", reversion_engine),
    ]:
        try:
            result = agent.run()
            results["agents"][name] = result
            logger.info(f"{name}: {result}")
        except Exception as e:
            logger.error(f"{name} crashed: {e}", exc_info=True)
            results["agents"][name] = {"error": str(e)}

    results["ended_at"] = datetime.now(timezone.utc).isoformat()
    _print_summary(results)
    return results


def _print_summary(results):
    agents = results.get("agents", {})
    print("\n" + "─" * 50)
    print("  PIPELINE SUMMARY")
    print("─" * 50)

    sc = agents.get("market_scanner", {})
    if sc and "error" not in sc:
        print(f"  Watchlist:  {sc.get('watchlist_size','?')} markets "
              f"from {sc.get('scanned','?')} scanned")

    co = agents.get("data_collector", {})
    if co and "error" not in co:
        print(f"  Snapshots:  {co.get('collected',0)} collected, "
              f"{co.get('failed',0)} failed")

    total = 0
    for engine in ["spread_engine", "neg_risk_engine", "reversion_engine"]:
        e   = agents.get(engine, {})
        n   = e.get("signals", 0)
        total += n
        top = e.get("top", "—")
        label = engine.replace("_engine","").replace("_","-")
        print(f"  {label:<16} {n} signal(s)" +
              (f"  → {str(top)[:40]}" if top else ""))

    try:
        stats = db.get_db_stats()
        print(f"\n  DB totals:  {stats['markets']} markets | "
              f"{stats['snapshots']} snapshots | "
              f"{stats['signals']} signals")
    except Exception:
        pass

    print(f"  Total signals this run: {total}")
    print("─" * 50 + "\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-scan", action="store_true")
    args = parser.parse_args()
    run_pipeline(skip_scan=args.skip_scan)
