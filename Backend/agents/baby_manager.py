# 🍼 baby_manager.py

from http import client
from agents.babymanager.prompts import baby_gpt_prompt
import openai  
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Dict
from supabase import create_client, Client

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str

def get_baby_health_today(user_id: str, supabase: Client) -> Dict:
    print(f"Getting today's baby health data for user {user_id}")

    # 1. 获取 baby_id 和 babyName（假设只有一个宝宝）
    baby_result = supabase.table("baby_profiles").select("id, name").eq("user_id", user_id).single().execute()

    if baby_result.data is None:
        return {"error": "No baby profile found"}

    baby_id = baby_result.data["id"]
    baby_name = baby_result.data.get("name", "Unknown")

    # 2. 获取今天的 baby_logs（以 UTC 日期判断）
    today_str = date.today().isoformat()
    logs_result = supabase.table("baby_logs") \
        .select("log_type, log_data, logged_at") \
        .eq("baby_id", baby_id) \
        .gte("logged_at", today_str) \
        .execute()

    # 3. 整理返回格式
    feedings, sleeps, diapers = [], [], []
    outside_duration = 0

    for row in logs_result.data:
        log_type = row["log_type"]
        log_data = row["log_data"]

        if log_type == "feeding":
            feedings.append(log_data)
        elif log_type == "sleep":
            sleeps.append(log_data)
        elif log_type == "diaper":
            diapers.append(log_data)
        elif log_type == "outside":
            duration = log_data.get("duration", 0)
            outside_duration += duration

    return {
        "babyName": baby_name,
        "feedings": feedings,
        "sleeps": sleeps,
        "diapers": diapers,
        "outsideDuration": outside_duration
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

