from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..services import bandit_service

router = APIRouter()


class SelectRequest(BaseModel):
    student_id: Optional[str] = None
    theta: float = 0.0
    candidates: List[Dict[str, Any]]
    epsilon: float = 0.1


@router.post("/select")
def select(req: SelectRequest):
    return bandit_service.select(req.candidates, req.theta, req.epsilon)
