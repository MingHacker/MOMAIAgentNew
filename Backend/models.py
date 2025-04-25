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
    reminder_type: Literal["feeding", "diaper", "sleep"]
    reminder_time: datetime
    notes: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# create table features (
#   id text primary key,         -- 比如 'feed'
#   name text not null,          -- 显示名，如 "喂奶"
#   icon_url text,               -- 图标地址
#   order int,                   -- 前端排序
#   age_min int,                 -- 推荐的最小月龄（可选）
#   age_max int                  -- 推荐的最大月龄（可选）
# );