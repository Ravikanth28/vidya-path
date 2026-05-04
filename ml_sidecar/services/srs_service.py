"""SuperMemo SM-2 spaced repetition scheduler."""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any


def schedule(ease: float = 2.5, interval: int = 0, reps: int = 0,
             quality: int = 3) -> Dict[str, Any]:
    q = max(0, min(5, int(quality)))
    next_ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if next_ease < 1.3:
        next_ease = 1.3
    if q < 3:
        next_reps = 0
        next_interval = 1
    else:
        next_reps = reps + 1
        if next_reps == 1:
            next_interval = 1
        elif next_reps == 2:
            next_interval = 6
        else:
            next_interval = max(1, round(interval * next_ease))
    next_due = datetime.now(timezone.utc) + timedelta(days=next_interval)
    return {
        "ease": round(next_ease, 4),
        "interval": next_interval,
        "reps": next_reps,
        "next_due": next_due.isoformat()
    }
