"""Multi-armed bandit (epsilon-greedy) over candidate quiz items.
Reward proxy = Fisher information at student theta."""
import math
import random
from typing import Dict, List, Any, Optional

from .irt_service import prob


def fisher_info(theta: float, a: float, b: float, c: float) -> float:
    p = prob(theta, a, b, c)
    if p <= c or p >= 1.0:
        return 0.0
    return (a * a * (p - c) ** 2 * (1.0 - p)) / max(p * (1.0 - c) ** 2, 1e-9)


def select(candidates: List[Dict[str, Any]], theta: float = 0.0,
           epsilon: float = 0.1) -> Dict[str, Any]:
    if not candidates:
        return {"selected": None, "reason": "no candidates"}
    if random.random() < epsilon:
        pick = random.choice(candidates)
        return {"selected": pick, "reason": "explore"}
    best: Optional[Dict[str, Any]] = None
    best_score = -math.inf
    for c in candidates:
        a = float(c.get("a", 1.0))
        b = float(c.get("b", 0.0))
        cp = float(c.get("c", 0.2))
        score = fisher_info(theta, a, b, cp)
        if score > best_score:
            best_score = score
            best = c
    return {"selected": best, "reason": "exploit", "info": best_score}
