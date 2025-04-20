from utils.emotion_utils import is_baby_milestone_tomorrow, count_consecutive_low_sleep, is_mom_birthday_today, days_since_baby_birth, get_baby_months_old, generate_celebration_text
from datetime import date, timedelta, datetime
from agents.emotionmanager.schema import EmotionAgentState
from agents.emotionmanager.graph import build_emotion_graph
from fastapi import Body, Depends
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, Query, HTTPException, status
from core.supabase import get_supabase
from agents.mom_manager import get_mom_health_today
from agents.baby_manager import get_baby_health_today
from agents.emotionmanager.steps import get_baby_months_old
from pydantic import BaseModel
from typing import List, Dict, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from core.supabase import SupabaseService, get_supabase
from core.auth import get_current_user
router = APIRouter()
from agents.llm import call_gpt_json_newversion


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

supabase = get_supabase()
security = HTTPBearer()

class ChatMessage(BaseModel):
    message: str
    role: str
    emotion_label: Optional[str] = None
    source: str = "chatbot"

class ChatResponse(BaseModel):
    success: bool
    message: str

def estimate_score(emotion_label: str, target_emotion: str) -> int:
    """根据情绪标签估算分数"""
    if emotion_label == target_emotion:
        return 100
    elif emotion_label in ["tired", "stressed"]:
        return 30 if target_emotion == "happy" else 70
    else:
        return 50

@router.post("/api/chat/emotion", status_code=status.HTTP_200_OK)
async def emotion_chat_handler(baby_id: str, user_id: str = Depends(get_current_user),
    task_count: int = Body(default=0)):
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
    baby_birthday = profile["baby_birthday"]
    months = is_baby_milestone_tomorrow(baby_birthday)
    if months:
        celebration_pre_notice = f"🎂 Tomorrow is {baby_name}'s {months}-month milestone! Want a card ready?"

    # 5. 连续疲劳识别（睡眠<5.5 或 HRV<40）
    weekly_data = supabase.table("mom_health") \
        .select("sleep_hours, hrv, created_at") \
        .eq("mom_id", user_id).gte("created_at", (today - timedelta(days=7)).isoformat()) \
        .order("created_at", desc=True).execute().data

    fatigue_days = count_consecutive_low_sleep(weekly_data)
    fatigue_reinforcement = ""
    if fatigue_days >= 2:
        fatigue_reinforcement = f"You've had {fatigue_days} tough days in a row. I see your effort, and I'm proud of your persistence."

    # 6. 判断今天是否是妈妈生日
    mom_birthday_message = ""
    mom_birthday = profile.get("mom_birthday")
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

@router.post("/chat/save", response_model=ChatResponse)
async def save_chat_message(
    chat_message: ChatMessage,
    supabase: SupabaseService = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
):
    try:
        # 直接使用 user_id 作为 mom_id（你数据库就是用这个字段）
        result = supabase.insert("chat_logs", {
            "mom_id": user_id,
            "role": chat_message.role,
            "message": chat_message.message,
            "emotion_label": chat_message.emotion_label,
            "source": chat_message.source,
            "timestamp": datetime.now().isoformat()
        })

        if not result:
            raise HTTPException(status_code=500, detail="Failed to save chat message")

        return ChatResponse(success=True, message="Chat message saved successfully")

    except Exception as e:
        print(f"❌ /chat/save 错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    


@router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(
    limit: int = 50,
    supabase: SupabaseService = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
):
    try:
        result = (
            supabase.client
            .table("chat_logs")
            .select("*")
            .eq("mom_id", user_id)
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )

        return result.data or []

    except Exception as e:
        print(f"❌ /chat/history 错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    

@router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessage,
    supabase: SupabaseService = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
):
    try:
        # 1️⃣ 保存用户消息到 chat_logs
        user_log = supabase.insert("chat_logs", {
            "mom_id": user_id,
            "role": "user",
            "message": chat_message.message,
            "source": "chatbot",
            "timestamp": datetime.now().isoformat()
        })

        if not user_log:
            raise HTTPException(status_code=500, detail="❌ Failed to insert user message")

        # 2️⃣ 构建 prompt 并调用 GPT
        prompt = f"""妈妈说：“{chat_message.message}”
请你作为温柔体贴的 AI 助手，回复一句简短、充满同理心的回应，返回 JSON 格式：
{{"message": "..."}}
禁止输出解释、说明或非 JSON 格式内容。"""

        response = call_gpt_json_newversion(prompt)
        ai_message = response.get("message", "🤖 抱歉，我现在无法理解你的意思")

        # 3️⃣ 保存 AI 回复
        ai_log = supabase.insert("chat_logs", {
            "mom_id": user_id,
            "role": "assistant",
            "message": ai_message,
            "source": "chatbot",
            "timestamp": datetime.now().isoformat()
        })

        if not ai_log:
            raise HTTPException(status_code=500, detail="❌ Failed to insert assistant message")

        # 4️⃣ 返回响应
        return ChatResponse(success=True, message=ai_message)

    except Exception as e:
        print("❌ Chat error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

