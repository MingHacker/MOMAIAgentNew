from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

class BabyLogCreate(BaseModel):
    baby_id: str
    log_type: Literal["feeding", "diaper", "sleep", "cry", "bowel", "outside"]
    log_data: dict
    logged_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ReminderCreate(BaseModel):
    baby_id: str
    reminder_type: Literal["feed", "diaper", "sleep"]
    reminder_time: datetime
    notes: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
