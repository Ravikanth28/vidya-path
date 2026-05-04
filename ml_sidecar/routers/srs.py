from fastapi import APIRouter
from pydantic import BaseModel
from ..services import srs_service

router = APIRouter()


class ScheduleRequest(BaseModel):
    ease: float = 2.5
    interval: int = 0
    reps: int = 0
    quality: int = 3


@router.post("/schedule")
def schedule(req: ScheduleRequest):
    return srs_service.schedule(req.ease, req.interval, req.reps, req.quality)
