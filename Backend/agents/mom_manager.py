from openai import OpenAI
from dotenv import load_dotenv
import os
from agents.mommanager.prompts import mom_health_prompt
from supabase import create_client, Client


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_mom_health_today(user_id: str) -> dict:
    """
    根据 user_id 获取妈妈今天的健康数据（来自 mom_profiles 和 mom_health 表）
    """
    today_str = date.today().isoformat()

    # 第一步：获取 mom_id
    mom_result = supabase.table("mom_profiles") \
        .select("id") \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    if not mom_result.data:
        return {"error": "No mom profile found"}

    mom_id = mom_result.data["id"]

    # 第二步：获取 mom_health 的今日数据
    health_result = supabase.table("mom_health") \
        .select("*") \
        .eq("mom_id", mom_id) \
        .eq("record_date", today_str) \
        .single() \
        .execute()

    if not health_result.data:
        return {"error": "No health record found for today"}

    health = health_result.data

    # 第三步：格式化返回数据
    return {
        "hrv": health.get("hrv", None),
        "sleep": health.get("sleep_hours", None),
        "steps": health.get("steps", None),
        "mood": health.get("mood", None),
        "stress": health.get("stress_level", None),
        "calories": health.get("calories_burned", None),
        "restingHeartRate": health.get("resting_heart_rate", None),
        "breathingRate": health.get("breathing_rate", None)
    }

def call_gpt_mom_analysis(data: dict) -> str:
    """
    用于 GPT 分析妈妈健康状况，返回 summary 文本（用于 /api/mom/summary）
    """
    prompt = mom_health_prompt(data["hrv"], data["sleep"], data["steps"])
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content