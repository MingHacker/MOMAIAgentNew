# api/timeline.py

from fastapi import APIRouter, HTTPException, Query, Body, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime, timezone
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.supabase import get_supabase, SupabaseService
from uuid import uuid4
from dotenv import load_dotenv
import os
import logging
from core.supabase import get_supabase
from core.auth import get_current_user

load_dotenv()
logger = logging.getLogger(__name__)

router = APIRouter()

security = HTTPBearer()



class TimelineItem(BaseModel):
    baby_id: str
    user_id: str
    date: date
    title: str
    emoji: Optional[str] = ""
    description: Optional[str] = ""
    image_url: Optional[str] = ""

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        # 将date对象转换为ISO格式字符串
        if isinstance(data.get('date'), date):
            data['date'] = data['date'].isoformat()
        return data


@router.get("/api/timeline", status_code=200)
def get_timeline(baby_id: str = Query(...), supabase: SupabaseService = Depends(get_supabase)):
    try:
        logger.info(f"Fetching timeline for baby_id: {baby_id}")
        result = supabase.query("timeline", {"baby_id": baby_id})
        logger.info(f"Found {len(result)} timeline items")
        return result
    except Exception as e:
        logger.error(f"Error fetching timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/timeline", status_code=status.HTTP_201_CREATED)
def add_timeline(item: TimelineItem, supabase: SupabaseService = Depends(get_supabase)):
    try:
        logger.info(f"Adding timeline item: {item.model_dump()}")
        payload = item.model_dump()
        payload = {k: v for k, v in payload.items() if v not in ["", None]}
        payload["id"] = str(uuid4())
        payload["created_at"] = datetime.now(timezone.utc).isoformat()

        # ✅ 如果 date 是 None，就自动填入今天
        if not payload.get("date"):
            payload["date"] = date.today().isoformat()

        logger.info(f"Inserting payload: {payload}")
        result = supabase.insert("timeline", payload)
        logger.info(f"Successfully inserted timeline item: {result}")
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error adding timeline item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
