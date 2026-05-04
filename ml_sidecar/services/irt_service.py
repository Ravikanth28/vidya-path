"""IRT 3-parameter logistic model — MLE estimation of theta given responses."""
import math
from typing import List, Dict, Any


def prob(theta: float, a: float, b: float, c: float) -> float:
    z = a * (theta - b)
    try:
        return c + (1.0 - c) / (1.0 + math.exp(-z))
    except OverflowError:
        return c if z < 0 else 1.0


def mle_theta(responses: List[Dict[str, Any]], prior_theta: float = 0.0,
              max_iter: int = 40, tol: float = 1e-4) -> float:
    """Newton-Raphson MLE with damped step. Returns theta in [-3, 3]."""
    theta = float(prior_theta)
    for _ in range(max_iter):
        num = 0.0
        den = 0.0
        for r in responses:
            a = float(r.get("a", 1.0))
            b = float(r.get("b", 0.0))
            c = float(r.get("c", 0.2))
            correct = int(r.get("correct", 0))
            p = prob(theta, a, b, c)
            p_star = (p - c) / max(1.0 - c, 1e-6)
            w = p_star * (1.0 - p_star)
            num += a * (correct - p)
            den += a * a * w
        if abs(den) < 1e-6:
            break
        step = num / den
        if step > 1.0:
            step = 1.0
        elif step < -1.0:
            step = -1.0
        theta += step
        if abs(step) < tol:
            break
    if theta < -3.0:
        theta = -3.0
    elif theta > 3.0:
        theta = 3.0
    return theta


def estimate(responses: List[Dict[str, Any]], prior_theta: float = 0.0) -> Dict[str, float]:
    if not responses:
        return {"theta": float(prior_theta), "prob": 0.5, "n": 0}
    theta = mle_theta(responses, prior_theta)
    p_avg = sum(prob(theta, r.get("a", 1.0), r.get("b", 0.0), r.get("c", 0.2))
                for r in responses) / len(responses)
    return {"theta": theta, "prob": p_avg, "n": len(responses)}
