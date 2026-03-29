# agents/neg_risk_engine.py
# Phase 3b: Neg-risk over-round detection.
# Reads neg-risk snapshots grouped by event, writes signals to DB.

import logging
from config import NEG_RISK_OVERROUND_THRESHOLD, NEG_RISK_MIN_OUTCOMES
import db

logger = logging.getLogger(__name__)


def _analyse_event(event_slug, snapshots):
    if len(snapshots) < NEG_RISK_MIN_OUTCOMES:
        return None

    prices = []
    for s in snapshots:
        price = s.get("yes_price")
        if price is not None and float(price) > 0:
            prices.append((s.get("question", "?"), float(price), s.get("market_id")))

    if len(prices) < NEG_RISK_MIN_OUTCOMES:
        return None

    total = sum(p for _, p, _ in prices)
    if total <= NEG_RISK_OVERROUND_THRESHOLD:
        return None

    overround = total - 1.0
    return {
        "strategy":     "neg_risk_overround",
        "market_id":    None,
        "event_slug":   event_slug,
        "num_outcomes": len(prices),
        "sum_prices":   round(total, 6),
        "overround":    round(overround, 6),
        "edge_pct":     round(overround * 100, 4),
        "signal_score": round(overround, 6),
        "outcomes": [
            {"question": q, "yes_price": round(p, 4), "market_id": mid}
            for q, p, mid in sorted(prices, key=lambda x: x[1], reverse=True)
        ],
        "note": (
            f"Sum of {len(prices)} outcome prices = {total:.4f}. "
            f"Over-round of {overround*100:.2f}c. "
            f"Selling NO on all outcomes yields a theoretical edge."
        ),
    }


def run():
    logger.info("=== Neg-risk engine starting ===")
    events_by_slug = db.get_neg_risk_snapshots_by_event()

    if not events_by_slug:
        logger.info("No neg-risk snapshots found")
        return {"agent": "neg_risk_engine", "events_checked": 0, "signals": 0}

    logger.info(f"Checking {len(events_by_slug)} neg-risk events")
    signals = []
    for event_slug, snapshots in events_by_slug.items():
        signal = _analyse_event(event_slug, snapshots)
        if signal:
            row_id = db.insert_signal(signal)
            if row_id != -1:
                signals.append(signal)
                logger.info(
                    f"  SIGNAL [{row_id}]: {event_slug} | "
                    f"sum={signal['sum_prices']:.4f} | "
                    f"over-round={signal['edge_pct']:.2f}c"
                )

    return {
        "agent":          "neg_risk_engine",
        "events_checked": len(events_by_slug),
        "signals":        len(signals),
        "top":            signals[0]["event_slug"] if signals else None,
    }
