# ✅ agents/mom_manager/schema.py
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

class MomAgentState(BaseModel):
    user_id: str
    db: Session
    hrv: Optional[int] = None
    resting_hr: Optional[int] = None
    sleep: Optional[float] = None
    steps: Optional[int] = None
    calories: Optional[int] = None
    breathing_rate: Optional[int] = None
    summary: str = ""
    health_score: int = 100

    class Config:
        arbitrary_types_allowed = True