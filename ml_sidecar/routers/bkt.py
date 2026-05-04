from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..services import bkt_service

router = APIRouter()


class UpdateRequest(BaseModel):
    p_mastery: float = 0.1
    correct: int = 0
    p_learn: float = 0.1
    p_slip: float = 0.1
    p_guess: float = 0.2


@router.post("/update")
def update(req: UpdateRequest):
    new_p = bkt_service.update(req.p_mastery, req.correct, req.p_learn, req.p_slip, req.p_guess)
    return {"p_mastery": new_p}


class NextLessonsRequest(BaseModel):
    student_id: Optional[str] = None
    masteries: List[Dict[str, Any]]
    threshold: float = 0.85
    limit: int = 5


@router.post("/next-lessons")
def next_lessons(req: NextLessonsRequest):
    return {"recommendations": bkt_service.next_lessons(req.masteries, req.threshold, req.limit)}
