from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ..services import irt_service

router = APIRouter()


class Response(BaseModel):
    a: float = 1.0
    b: float = 0.0
    c: float = 0.2
    correct: int = 0


class EstimateRequest(BaseModel):
    responses: List[Response]
    prior_theta: Optional[float] = 0.0


@router.post("/estimate")
def estimate(req: EstimateRequest):
    return irt_service.estimate([r.model_dump() for r in req.responses], req.prior_theta or 0.0)
