# 🍼 baby_manager.py

from http import client
from agents.babymanager.prompts import baby_gpt_prompt
import openai  
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Dict
from supabase import create_client, Client
from datetime import date
from typing import Dict, Any

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str


def get_mom_health_today(user_id: str, supabase: Client) -> Dict[str, Any]:
    """
    根据 user_id 获取妈妈今天的健康数据（从 mom_profiles 和 mom_health 表）
    返回统一结构：
    {
        "success": bool,
        "message": str,
        "data": {...} or None
    }
    """
    today_str = date.today().isoformat()

    # 1. 获取 mom_id
    mom_result = supabase.table("mom_profiles") \
        .select("id") \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    if not mom_result.data:
        return {
            "success": False,
            "message": "No mom profile found for this user",
            "data": None
        }

    mom_id = mom_result.data["id"]

    # 2. 查询今天的健康记录
    health_result = supabase.table("mom_health") \
        .select("*") \
        .eq("mom_id", mom_id) \
        .eq("record_date", today_str) \
        .single() \
        .execute()

    if not health_result.data:
        return {
            "success": False,
            "message": "No health record found for today",
            "data": None
        }

    health = health_result.data

    # 3. 返回统一格式
    return {
        "success": True,
        "message": "Health data loaded successfully",
        "data": {
            "hrv": health.get("hrv"),
            "sleep": health.get("sleep_hours"),
            "steps": health.get("steps"),
            "mood": health.get("mood"),
            "stress": health.get("stress_level"),
            "calories": health.get("calories_burned"),
            "restingHeartRate": health.get("resting_heart_rate"),
            "breathingRate": health.get("breathing_rate")
        }
    }

# ✨ GPT 分析函数（调用分析 Agent）
def call_gpt_baby_analysis(data: dict) -> BabyAnalysisResponse:
    prompt = baby_gpt_prompt.format(data=data)

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a baby care assistant AI."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    answer = response['choices'][0]['message']['content']

    # 简化方式解析，建议后续改为 JSON parser
    parts = answer.split("Next Action:")
    return BabyAnalysisResponse(
        summary=parts[0].strip(),
        next_action=parts[1].strip() if len(parts) > 1 else ""
    )

def call_gpt_baby_analysis_str(data: dict) -> str:

    prompt = baby_gpt_prompt(
        sleep_hours=data["sleep_duration"],
        feedings=data["feeding_count"],
        diapers=data["diaper_count"],
        cries=data["cry_count"],
        outside_minutes=data["outside_duration"]
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

class BabyManager:
    def __init__(self, db: Session):
        self.db = db

    def get_baby_health_today(self, user_id: str):
        return get_baby_health_today(user_id, self.db)

    def analyze_baby_health(self, data: dict) -> BabyAnalysisResponse:
        return call_gpt_baby_analysis(data)

