"""Bayesian Knowledge Tracing — 4-parameter Corbett-Anderson model."""
from typing import Dict, List, Any


def update(p_mastery: float, correct: int,
           p_learn: float = 0.10, p_slip: float = 0.10, p_guess: float = 0.20) -> float:
    pT = max(0.0, min(1.0, float(p_mastery)))
    pL = float(p_learn)
    pS = float(p_slip)
    pG = float(p_guess)
    if int(correct):
        num = pT * (1.0 - pS)
        den = num + (1.0 - pT) * pG
    else:
        num = pT * pS
        den = num + (1.0 - pT) * (1.0 - pG)
    posterior = (num / den) if den > 0 else pT
    new_pT = posterior + (1.0 - posterior) * pL
    return max(0.0, min(1.0, new_pT))


def next_lessons(masteries: List[Dict[str, Any]], threshold: float = 0.85,
                 limit: int = 5) -> List[Dict[str, Any]]:
    """Return concepts with p_mastery < threshold, sorted ascending."""
    eligible = [m for m in masteries if (m.get("p_mastery") or 0.0) < threshold]
    eligible.sort(key=lambda m: m.get("p_mastery") or 0.0)
    return eligible[:limit]
