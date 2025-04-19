from utils.emotion_utils import is_baby_milestone_tomorrow, count_consecutive_low_sleep, is_mom_birthday_today, days_since_baby_birth, get_baby_months_old, get_baby_birthday, get_mom_birthday, mom_birthday, baby_birthday, weekly_data
from datetime import date, timedelta, datetime
from agents.emotionmanager.schema import EmotionAgentState
from agents.emotionmanager.graph import build_emotion_graph
from supabase import Client
from fastapi import Body, Depends
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, Query, HTTPException, status
from core.supabase import get_supabase
from agents.emotion_manager import get_mom_health_today, get_baby_health_today
from agents.emotionmanager.steps import get_baby_months_old

router = APIRouter()


# 用法举例
# 🎂 明日提醒
months = is_baby_milestone_tomorrow(baby_birthday)

# 🧠 连续疲劳识别
fatigue_days = count_consecutive_low_sleep(weekly_data)

# 🎈 宝宝出生多少天了
days_alive = days_since_baby_birth(baby_birthday)

# 🎉 妈妈生日提醒
if is_mom_birthday_today(mom_birthday):
    message = "Today is your birthday 🎂 I hope someone celebrates YOU today, not just mom-you 💐"


@router.post("/api/chat/emotion")
def emotion_chat_handler(
    user_id: str = Body(...),
    baby_id: str = Body(...),
    task_count: int = Body(default=0),
    supabase: Client = Depends(get_supabase)
):
    today = date.today()

    # 1. 获取 mom + baby + emotion_dates 数据
    mom_data = get_mom_health_today(user_id, supabase)
    baby_data = get_baby_health_today(baby_id, supabase)

    profile = supabase.table("emotion_dates") \
        .select("*").eq("mom_id", user_id).eq("baby_id", baby_id).single().execute().data

    baby_birthday = profile["baby_birthday"]
    baby_name = profile.get("baby_nickname", "Your baby")
    mom_birthday = profile.get("mom_birthday")

    baby_data["birthday"] = baby_birthday
    baby_data["name"] = baby_name

    # 2. 构建状态，调用 Emotion Agent
    state = EmotionAgentState(
        user_id=user_id,
        baby_id=baby_id,
        task_count=task_count,
        mom_data=mom_data,
        baby_data=baby_data
    )

    result = build_emotion_graph().invoke(state)

    # 3. 插入情绪日志 emotion_log
    supabase.table("emotion_log").insert({
        "mom_id": user_id,
        "date": today.isoformat(),
        "emotion_label": result.emotion_label,
        "summary": result.summary,
        "score_happy": estimate_score(result.emotion_label, "happy"),
        "score_fatigue": estimate_score(result.emotion_label, "tired"),
        "score_anxiety": estimate_score(result.emotion_label, "stressed"),
        "gentle_message": result.gentle_message,
        "celebration_text": result.celebration_text
    }).execute()

    # 4. 判断明天是否宝宝满月
    from utils.emotion_utils import (
        is_baby_milestone_tomorrow, count_consecutive_low_sleep, is_mom_birthday_today
    )

    celebration_pre_notice = ""
    months = is_baby_milestone_tomorrow(baby_birthday)
    if months:
        celebration_pre_notice = f"🎂 Tomorrow is {baby_name}'s {months}-month milestone! Want a card ready?"

    # 5. 连续疲劳识别（睡眠<5.5 或 HRV<40）
    fatigue_days = 0
    weekly_data = supabase.table("mom_health") \
        .select("sleep_hours, hrv, created_at") \
        .eq("mom_id", user_id).gte("created_at", (today - timedelta(days=7)).isoformat()) \
        .order("created_at", desc=True).execute().data

    fatigue_days = count_consecutive_low_sleep(weekly_data)
    fatigue_reinforcement = ""
    if fatigue_days >= 2:
        fatigue_reinforcement = f"You’ve had {fatigue_days} tough days in a row. I see your effort, and I’m proud of your persistence. 💛"

    # 6. 判断今天是否是妈妈生日
    mom_birthday_message = ""
    if mom_birthday and is_mom_birthday_today(mom_birthday):
        mom_birthday_message = "🎉 Today is your birthday! I hope someone is celebrating YOU today, not just the mom in you. 💐"

    # 7. 返回所有内容
    return {
        "success": True,
        "summary": result.summary,
        "emotion_label": result.emotion_label,
        "gentle_message": result.gentle_message,
        "celebration_text": result.celebration_text,
        "pre_celebration_notice": celebration_pre_notice,
        "fatigue_reinforcement": fatigue_reinforcement,
        "mom_birthday_message": mom_birthday_message
    }
