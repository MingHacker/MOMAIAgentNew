from fastapi import APIRouter, Query, Depends
from fastapi.responses import JSONResponse
from core.supabase import get_supabase
from supabase import Client
from agents.emotionmanager.graph import build_emotion_graph
from agents.emotionmanager.schema import EmotionAgentState
from typing import Optional
from datetime import date, datetime, timedelta
from agents.emotion_manager import run_emotion_analysis
import asyncio
from agents.emotionmanager.emotion_card_image_gen import generate_emotion_card_image
from utils.emotion_utils import generate_celebration_text, get_baby_months_old
router = APIRouter()

@router.get("/api/emotion/today")
async def get_today_emotion(
    user_id: str = Query(...),
    baby_id: str = Query(...),
    task_count: Optional[int] = 0,
    supabase = Depends(get_supabase)
):
    try:
        # 1. 查询 mom 数据
        # 首先获取 mom_id
        mom_profile = (
            supabase
            .table("mom_profiles")
            .select("id")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not mom_profile.data:
            return JSONResponse(status_code=404, content={"success": False, "message": "No mom profile found"})

        mom_id = mom_profile.data["id"]

        # 查询健康数据
        result = (
            supabase
            .table("mom_health")
            .select("hrv, sleep_hours, resting_heart_rate, record_date")
            .eq("mom_id", mom_id)
            .gte("record_date", date.today().isoformat())
            .order("record_date", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            return JSONResponse(status_code=404, content={"success": False, "message": "No mom data"})

        mom = result.data[0]

        # 2. 查询 baby 数据
        baby_logs = (
            supabase
            .table("baby_logs")
            .select("log_type, log_data, logged_at")
            .eq("baby_id", baby_id)
            .gte("logged_at", date.today().isoformat())
            .execute()
        ).data

        baby = {
            "sleep_total_hours": 0,
            "cry_total_minutes": 0
        }
        for row in baby_logs:
            log_type = row["log_type"]
            data = row["log_data"]
            if log_type == "sleep":
                baby["sleep_total_hours"] += data.get("duration", 0) / 3600  # 秒转小时
            if log_type == "cry":
                baby["cry_total_minutes"] += data.get("duration_minutes", 0)

        # 3. 执行 Emotion Agent
        graph = build_emotion_graph()
        state = EmotionAgentState(
            user_id=user_id,
            baby_id=baby_id,
            task_count=task_count,
            mom_data=mom,
            baby_data=baby
        )

        result = await graph.ainvoke(state)
        print(f"Graph result type: {type(result)}")
        print(f"Graph result: {result}")

        # 将结果转换为字典
        result_dict = dict(result)

        return {
            "success": True,
            "summary": result_dict.get("summary", ""),
            "emotion_label": result_dict.get("emotion_label", ""),
            "suggestions": result_dict.get("suggestions", []),
            "gentle_message": result_dict.get("gentle_message", "")
        }

    except Exception as e:
        print(f"Error in emotion analysis: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@router.get("/api/emotion/card")
def get_emotion_card(user_id: str, baby_id: str):
    # 1. 查 emotion_dates 表
    # 2. 判断是否有值得纪念的日子（如宝宝5个月、妈妈生日）
    # 3. 构造 GPT prompt，生成文字
    # 4. 生成 image + 返回
    return {
        "message": "LeLe turns 5 months today... 🧡",
        "image_url": "https://cdn/...emotion-card.png"
    }

@router.get("/api/emotion/card")
def get_emotion_card(user_id: str, baby_id: str, supabase: Client = Depends(get_supabase)):
    try:
        # 获取 emotion_dates
        profile = supabase.table("emotion_dates").select("*").eq("mom_id", user_id).eq("baby_id", baby_id).single().execute().data
        
        baby_name = profile["baby_nickname"]
        baby_birthday = profile["baby_birthday"]
        months_old = get_baby_months_old(baby_birthday)

        # 判断是否满月
        if date.today().day != datetime.fromisoformat(baby_birthday).day:
            return {"success": False, "message": "No special occasion today"}

        # 生成祝福语
        message = generate_celebration_text(baby_name, months_old)
        image_url = generate_emotion_card_image(message, months_old, baby_name)

        return {
            "success": True,
            "message": message,
            "image_url": image_url
        }

    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/api/emotion/scrapbook")
def get_emotion_scrapbook(user_id: str, supabase: Client = Depends(get_supabase)):
    logs = supabase.table("emotion_log") \
        .select("date, gentle_message, celebration_text") \
        .eq("mom_id", user_id) \
        .order("date", desc=True) \
        .limit(30).execute().data

    return {"success": True, "data": logs}

@router.get("/api/emotion/trend")
def get_emotion_trend(user_id: str, baby_id: str, supabase: Client = Depends(get_supabase)):
    today = date.today()
    start_date = today - timedelta(days=7)

    # mom
    mom_data = supabase.table("mom_health") \
        .select("hrv, sleep_hours, resting_heart_rate, created_at") \
        .eq("mom_id", user_id) \
        .gte("created_at", start_date.isoformat()) \
        .order("created_at", asc=True).execute().data

    # baby logs
    logs = supabase.table("baby_logs") \
        .select("log_type, log_data, logged_at") \
        .eq("baby_id", baby_id) \
        .gte("logged_at", start_date.isoformat()) \
        .execute().data

    # baby logs 聚合
    baby_summary = {}
    for row in logs:
        day = row["logged_at"][:10]
        if day not in baby_summary:
            baby_summary[day] = {"cry": 0, "sleep": 0}
        if row["log_type"] == "cry":
            baby_summary[day]["cry"] += row["log_data"].get("duration_minutes", 0)
        if row["log_type"] == "sleep":
            baby_summary[day]["sleep"] += row["log_data"].get("duration", 0) / 3600  # 秒转小时

    # 汇总对照数据
    result = []
    for row in mom_data:
        day = row["created_at"][:10]
        result.append({
            "date": day,
            "hrv": row.get("hrv", 0),
            "sleep_hours": row.get("sleep_hours", 0),
            "baby_cry": baby_summary.get(day, {}).get("cry", 0),
            "baby_sleep": baby_summary.get(day, {}).get("sleep", 0)
        })

    return {"success": True, "data": result}

@router.get("/api/emotion/milestone")
def get_emotion_milestone(user_id: str, baby_id: str, supabase: Client = Depends(get_supabase)):
    today = date.today()

    # 读取宝宝生日
    profile = supabase.table("emotion_dates") \
        .select("baby_birthday") \
        .eq("mom_id", user_id).eq("baby_id", baby_id).single().execute().data

    baby_birthday = profile["baby_birthday"]
    birth = datetime.fromisoformat(baby_birthday).date()
    days_since_birth = (today - birth).days

    # 查询连续 emotion_log
    emotion_data = supabase.table("emotion_log") \
        .select("date") \
        .eq("mom_id", user_id) \
        .gte("date", (today - timedelta(days=30)).isoformat()) \
        .order("date", desc=True).execute().data

    # 连续记录天数
    consecutive = 0
    for i in range(0, 30):
        target = (today - timedelta(days=i)).isoformat()
        if any(d["date"] == target for d in emotion_data):
            consecutive += 1
        else:
            break

    return {
        "success": True,
        "days_since_birth": days_since_birth,
        "consecutive_emotion_logs": consecutive,
        "message": f"LeLe is {days_since_birth} days old. You've logged your emotions {consecutive} days in a row — amazing!"
    }
