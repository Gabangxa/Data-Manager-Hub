# alerts.py — Discord notification helper
#
# Set DISCORD_WEBHOOK_URL in Replit Secrets (Tools → Secrets).
# All functions are fire-and-forget: failures are logged but never raise.

import json
import logging
import os
import urllib.request
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_WEBHOOK = None


def _webhook() -> str | None:
    global _WEBHOOK
    if _WEBHOOK is None:
        _WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL", "")
    return _WEBHOOK or None


def _send(content: str) -> None:
    """POST a message to the Discord webhook. Silent on failure."""
    url = _webhook()
    if not url:
        return
    try:
        payload = json.dumps({"content": content}).encode()
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5):
            pass
    except Exception as e:
        logger.warning(f"Discord alert failed (non-fatal): {e}")


# ── Public alert types ────────────────────────────────────────────────────────

def pipeline_crashed(run_number: int, error: Exception) -> None:
    """Alert when a full pipeline run raises an unhandled exception."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    _send(
        f":red_circle: **PolyBot pipeline crashed** | Run #{run_number} | {ts}\n"
        f"```{type(error).__name__}: {str(error)[:300]}```"
    )


def zero_signal_streak(engine: str, streak: int, last_signal_at: str | None) -> None:
    """Alert when an engine hasn't fired a signal for too many consecutive runs."""
    ts  = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    last = last_signal_at or "never"
    _send(
        f":warning: **Zero-signal streak** | `{engine}` | {ts}\n"
        f"{streak} consecutive runs (~{streak * 5} min) with no signals.\n"
        f"Last signal: `{last}`"
    )
