from utils.emotion_utils import is_baby_milestone_tomorrow, count_consecutive_low_sleep, is_mom_birthday_today, days_since_baby_birth, get_baby_months_old, generate_celebration_text
from datetime import date, timedelta, datetime
from agents.emotionmanager.schema import EmotionAgentState
from agents.emotionmanager.graph import build_emotion_graph
from supabase import Client
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
from core.auth import get_current_user
import os
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from core.auth import get_current_user
router = APIRouter()

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
    user_id: str = Depends(get_current_user)
):
    try:
        # 获取 mom_id
        mom_result = supabase.table("mom_profiles").select("id").eq("user_id", user_id).single().execute()
        if not mom_result.data:
            raise HTTPException(status_code=404, detail="Mom profile not found")
        
        mom_id = mom_result.data["id"]
        
        # 保存聊天记录
        result = supabase.table("chat_logs").insert({
            "mom_id": mom_id,
            "role": chat_message.role,
            "message": chat_message.message,
            "emotion_label": chat_message.emotion_label,
            "source": chat_message.source,
            "timestamp": datetime.now().isoformat()
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save chat message")
            
        return ChatResponse(success=True, message="Chat message saved successfully")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(
    user_id: str = Depends(get_current_user),
    limit: int = 50
):
    try:
        # 获取 mom_id
        mom_result = supabase.table("mom_profiles").select("id").eq("user_id", user_id).single().execute()
        if not mom_result.data:
            raise HTTPException(status_code=404, detail="Mom profile not found")
        
        mom_id = mom_result.data["id"]
        
        # 获取聊天历史
        result = supabase.table("chat_logs")\
            .select("*")\
            .eq("mom_id", mom_id)\
            .order("timestamp", desc=True)\
            .limit(limit)\
            .execute()
            
        return result.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(
    chat_message: ChatMessage,
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        # 获取 mom_id
        mom_result = supabase.table("mom_profiles").select("id").eq("user_id", user_id).single().execute()
        if not mom_result.data:
            raise HTTPException(status_code=404, detail="Mom profile not found")
        
        mom_id = mom_result.data["id"]
        
        # 保存用户消息
        user_result = supabase.table("chat_logs").insert({
            "mom_id": mom_id,
            "role": "user",
            "message": chat_message.message,
            "source": "chatbot",
            "timestamp": datetime.now().isoformat()
        }).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=500, detail="Failed to save user message")
        
        # 调用 OpenAI 获取回复
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": """你是一个温柔体贴的 AI 助手，专门帮助新手妈妈。
                你的回复要充满同理心，语气要温暖柔和。
                使用简单的语言，避免专业术语。
                在适当的时候使用表情符号增加亲和力。
                如果妈妈表达负面情绪，要给予理解和鼓励。
                如果妈妈分享快乐，要真诚地分享喜悦。
                保持积极乐观的态度，但不要过度乐观。
                回复要简短，控制在 2-3 句话内。"""},
                {"role": "user", "content": chat_message.message}
            ],
            temperature=0.7,
            max_tokens=150
        )
        
        ai_message = response.choices[0].message.content
        
        # 保存 AI 回复
        ai_result = supabase.table("chat_logs").insert({
            "mom_id": mom_id,
            "role": "assistant",
            "message": ai_message,
            "source": "chatbot",
            "timestamp": datetime.now().isoformat()
        }).execute()
        
        if not ai_result.data:
            raise HTTPException(status_code=500, detail="Failed to save AI message")
            
        return ChatResponse(success=True, message=ai_message)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
