# ✅ api/mom.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from supabase import create_client, Client
from core.auth import get_current_user
from core.supabase import get_supabase
from typing import Dict, Any
from supabase import Client
from datetime import datetime, timedelta
from dotenv import load_dotenv
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import random
# LangGraph 结构分析
from agents.mommanager.graph import build_mom_manager_graph
from agents.mommanager.schema import MomAgentState

# GPT 分析（温柔鼓励）
from agents.mom_manager import call_gpt_mom_analysis, get_mom_health_today, call_gpt_mom_onesentence

load_dotenv()

router = APIRouter()


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        decoded = jwt.decode(
            token,
            os.getenv("SUPABASE_KEY"),
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{os.getenv('SUPABASE_URL')}/auth/v1",
            options={"verify_signature": False}
        )
        return decoded["sub"]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


class MomAnalysisResponse(BaseModel):
    success: bool
    summary: str  # GPT 生成的关于妈妈健康与建议的分析内容

class MomOneSentenceResponse(BaseModel):
    success: bool
    onesentence: str  # GPT 生成的关于妈妈健康与建议的分析内容

class MomAgentState(BaseModel):
    summary: str
    health_score: int
    hrv: int
    sleep: int
    steps: int
    resting_hr: int
    calories: int
    breathing_rate: float



def check_period_expected(user_id: str, supabase) -> bool:
    """
    判断妈妈是否接近下一个月经周期。
    参数：
        user_id (str): 当前妈妈的id
        supabase: supabase client
    返回：
        bool: True表示即将来月经，False表示不需要提醒
    """

    try:
        mom_profile = supabase.table("mom_profiles") \
            .select("last_period_start_date", "average_cycle_days", "period_tracking_enabled") \
            .eq("id", user_id) \
            .single() \
            .execute()

        profile_data = mom_profile.data

        if not profile_data or not profile_data.get("period_tracking_enabled"):
            return False

        last_period_date = profile_data.get("last_period_start_date")
        cycle_days = profile_data.get("average_cycle_days", 28)

        if not last_period_date:
            return False

        # 解析日期
        last_period_date = datetime.strptime(last_period_date, "%Y-%m-%d")
        today = datetime.utcnow().date()

        # 计算预计下一次经期开始日
        next_period_start = last_period_date.date()
        while next_period_start < today:
            next_period_start += timedelta(days=cycle_days)

        days_until_next = (next_period_start - today).days

        # 如果在5天以内，认为需要提醒
        return 0 <= days_until_next <= 5

    except Exception as e:
        print(f"Error checking period expected: {e}")
        return False

def get_mom_mood_tag(health_data: dict, period_expected: bool = False, pending_tasks: int = 0, completed_tasks_today: int = 0) -> str:
    """
    根据妈妈的健康状态推断当天的 mood_tag。
    参数：
        health_data (dict): 包含今日的 mom_health 数据
        period_expected (bool): 是否即将来月经
        pending_tasks (int): 今天未完成任务数
    返回：
        str: 推断出来的 mood_tag
    """

    if not health_data:
        return "normal"

    sleep_hours = health_data.get("sleep_hours")
    hrv = health_data.get("hrv")
    steps = health_data.get("steps")
    stress_level = health_data.get("stress_level")
    mood = health_data.get("mood")

    # 1. 优先判断经期提醒
    if period_expected:
        return "period_coming"

    # 2. 睡眠太少
    if sleep_hours is not None and sleep_hours < 5:
        return "sleep_low"

    # 3. HRV低 or 步数低（身体疲劳）
    if (hrv is not None and hrv < 40) or (steps is not None and steps < 1000):
        return "low_energy_day"

    # 4. 高压力 或情绪疲惫
    if (stress_level and stress_level.lower() == "high") or (mood and mood.lower() == "tired"):
        return "stressed"

    # 5. 今天完成任务多
    if completed_tasks_today and completed_tasks_today > 5:
        return "busy_day"
    
    # 6. 今天任务堆积
    if pending_tasks and pending_tasks > 5:
        return "task_pileup"

    # 6. 正常情况
    return "normal"

@router.get("/api/mom/onesentence", response_model=MomOneSentenceResponse, status_code=status.HTTP_200_OK)
def get_today_mom_onesentence(user_id: str = Depends(get_current_user)):
    try:
        # 1. 获取妈妈的健康数据
        health_data = get_mom_health_today(user_id, supabase)

        # 2. 检查period是否即将来
        period_expected = check_period_expected(user_id, supabase)

        # 3. 获取今天的pending任务数量（如果有）
        pending_tasks_query = supabase.table("tasks")\
            .select("*") \
            .eq("mom_id", user_id) \
            .eq("status", "pending") \
            .execute()
        pending_tasks = len(pending_tasks_query.data)if pending_tasks_query.data else 0
     

        completed_task_query = supabase.table("tasks")\
            .select("*") \
            .eq("mom_id", user_id) \
            .eq("status", "completed") \
            .eq("created_at", datetime.utcnow().date()) \
            .execute()
        completed_tasks_today = len(completed_task_query.data) if completed_task_query.data else 0
    
        # 4. 推断mood_tag
        mood_tag = get_mom_mood_tag(health_data.get("data", {}), period_expected, pending_tasks, completed_tasks_today)

        # 5. 获取妈妈名字
        mom_profile = supabase.table("mom_profiles") \
            .select("display_name") \
            .eq("id", user_id) \
            .single() \
            .execute()
        mom_name = mom_profile.data.get("display_name", "Mom")

        # 6. 根据mood_tag去mom_sentences表随机拿一句话
        sentence_query = supabase.table("mom_sentences") \
            .select("message_template") \
            .eq("mood_tag", mood_tag) \
            .execute()
        sentences = sentence_query.data
        
        if not sentences or len(sentences) == 0:
            fallback_query = supabase.table("mom_sentences") \
                .select("message_template") \
                .eq("mood_tag", "normal") \
                .execute()
            sentences = fallback_query.data

        # 8. 如果有句子，从中随机选一条
        if sentences and len(sentences) > 0:
            selected = random.choice(sentences)
            message = selected["message_template"].replace("{name}", mom_name)
        else:
            # 极端fallback：固定鼓励句子
            message = f"Hey {mom_name}, you're doing amazing today! ✨"

        return {"success": True, "onesentence": message}

    except Exception as e:
        print(f"Error generating mom onesentence: {e}")
        return {"success": True, "onesentence": "You're doing great! Keep going! 💪"}

# ✅ 1. GPT 文本分析（用于 summary）
@router.get("/api/mom/summary", response_model=MomAnalysisResponse, status_code=status.HTTP_200_OK)
def get_today_mom_summary(user_id: str = Depends(get_current_user)):
    try:
        data = get_mom_health_today(user_id, supabase)
        print(f"获取到的健康数据：{data}")
        
        if not data.get("success"):
            return JSONResponse(
                status_code=200,
                content={"success": False, "summary": data.get("message", "获取健康数据失败")}
            )
            
        health_data = data.get("data", {})
        if not health_data:
            return JSONResponse(
                status_code=200,
                content={"success": False, "summary": "没有找到健康数据"}
            )
        
        prompt_input = {
            "hrv": health_data.get("hrv"),
            "sleep": health_data.get("sleep_hours"),
            "steps": health_data.get("steps"),
            "resting_heart_rate": health_data.get("resting_heart_rate"),
            "breathing_rate": health_data.get("breathing_rate"),
            "mood": health_data.get("mood"),
        }
        print(f"发送给 GPT 的数据：{prompt_input}")
        
        analysis = call_gpt_mom_analysis(prompt_input)
        return {"success": True, "summary": analysis}
    except Exception as e:
        print(f"发生错误：{str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "summary": str(e)})


######### ✅ 2. 每日健康数据（图表卡片用）
@router.get("/api/mom/health/daily", status_code=status.HTTP_200_OK)
def get_mom_health_daily(user_id: str = Depends(get_current_user)):
    try:
        print(f"👩 正在获取 mom health，用户 ID: {user_id}")
        result = get_mom_health_today(user_id, supabase)
        print("🧠 get_mom_health_today 返回：", result)

        if not result or not isinstance(result, dict):
            return JSONResponse(status_code=500, content={
                "success": False,
                "summary": "get_mom_health_today 返回异常"
            })

        if not result.get("success"):
            return JSONResponse(status_code=500, content={
                "success": False,
                "summary": result.get("message", "Unknown error")
            })

        if not result.get("data"):
            print("⚠️ 没有健康数据，返回 null")
            return {"success": True, "data": None}

        print("✅ 成功返回数据")
        return {
            "success": True,
            "data": result["data"]
        }

    except Exception as e:
        print(f"❌ get_mom_health_daily 发生错误：{str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "summary": str(e)})

    
# ✅ 3. 每周健康趋势图表
@router.get("/api/mom/health/weekly", status_code=status.HTTP_200_OK)
def get_mom_weekly_health(user_id: str = Depends(get_current_user)):
    try:
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=6)

        health_result = (
            supabase
            .table("mom_health")
            .select("hrv, sleep_hours, resting_heart_rate, steps, breathing_rate, record_date, mood, calories_burned, mood, stress_level")
            .eq("mom_id", user_id)
            .gte("record_date", start_date.isoformat())
            .execute()
        )

        if not health_result or not health_result.data:
            return {"success": True, "data": None}

        daily_summary = {}
        for row in health_result.data:
            day = row["record_date"]
            daily_summary[day] = {
                "date": day,
                "hrv": row.get("hrv", 0),
                "sleep_hours": row.get("sleep_hours", 0),
                "resting_heart_rate": row.get("resting_heart_rate", 0),
                "steps": row.get("steps", 0),
                "breathing_rate": row.get("breathing_rate", 0),
                "mood": row.get("mood", "low"),
                "calories_burned": row.get("calories_burned", 0),
                "stress_level": row.get("stress_level", "low")
            }

        # 补全空白日期
        output = []
        for i in range(7):
            day = (start_date + timedelta(days=i)).isoformat()
            output.append(daily_summary.get(day, {
                "date": day,
                "hrv": 0,
                "sleep_hours": 0,
                "resting_heart_rate": 0,
                "steps": 0,
                "breathing_rate": 0,
                "mood": 0,
                "calories_burned": 0,
                "stress_level": 0
            }))

        return {"success": True, "data": output}
        print(f"momweekly返回的数据：{output}")  
    except Exception as e:
        return {"success": False, "summary": str(e)}
    


#@router.get("/api/mom/onesentence", response_model=MomOneSentenceResponse, status_code=status.HTTP_200_OK)
# def get_today_mom_onesentence(user_id: str = Depends(get_current_user)):
#     try:
#         # 1. 获取妈妈的健康数据
#         data = get_mom_health_today(user_id, supabase)
#         print(f"1. 获取到的健康数据：{data}")
        
#         if not data.get("success"):
#             return JSONResponse(
#                 status_code=200,
#                 content={"success": False, "onesentence": data.get("message", "获取健康数据失败")}
#             )
            
#         # 2. 如果没有健康数据，从 mom_sentences 表获取模板消息
#         if not data.get("success") or not data.get("data"):
#             try:
#                 # 获取妈妈的名字
#                 mom_profile = supabase.table("mom_profiles") \
#                     .select("display_name") \
#                     .eq("id", user_id) \
#                     .single() \
#                     .execute()
#                 print(f"2. 获取到的妈妈资料：{mom_profile.data}")
                
#                 mom_name = mom_profile.data.get("display_name", "Mom")
#                 print(f"3. 妈妈名字：{mom_name}")
                
#                 # 从 mom_sentences 表随机获取一条模板消息
#                 template_result = supabase.table("mom_sentences") \
#                     .select("message_template") \
#                     .order("id", desc=False) \
#                     .limit(1) \
#                     .execute()
#                 print(f"4. 获取到的模板消息：{template_result.data}")
                
#                 if template_result.data and len(template_result.data) > 0:
#                     # 替换模板中的 {name} 为妈妈的名字
#                     message = template_result.data[0]["message_template"].replace("{name}", mom_name)
#                     print(f"5. 替换后的消息：{message}")
#                     return {"success": True, "onesentence": message}
                
#                 print("6. 没有找到模板消息，使用默认消息")
#                 # 如果连模板消息都没有，返回一个默认的鼓励消息
#                 return {"success": True, "onesentence": f"Hey {mom_name}, you're doing great! Keep going! 💪"}
                
#             except Exception as template_error:
#                 print(f"7. 获取模板消息时发生错误：{str(template_error)}")
#                 return {"success": True, "onesentence": "You're doing great! Keep going! 💪"}
        
#         # 3. 如果有健康数据，使用原有的 GPT 分析逻辑
#         health_data = data.get("data", {})
#         if not health_data:
#             return JSONResponse(
#                 status_code=200,
#                 content={"success": False, "onesentence": "没有找到健康数据"}
#             )
        
#         prompt_input = {
#             "hrv": health_data.get("hrv"),
#             "sleep": health_data.get("sleep_hours"),
#             "steps": health_data.get("steps"),
#             "resting_heart_rate": health_data.get("resting_heart_rate"),
#             "breathing_rate": health_data.get("breathing_rate"),
#             "mood": health_data.get("mood"),
#         }
#         print(f"8. 发送给 GPT 的数据：{prompt_input}")
        
#         analysis = call_gpt_mom_onesentence(prompt_input)
#         print(f"9. GPT 返回的分析：{analysis}")
#         return {"success": True, "onesentence": analysis}
        
    # except Exception as e:
    #     print(f"10. 发生错误：{str(e)}")
    #     # 确保即使发生错误也返回一个有效的消息
    #     return {"success": True, "onesentence": "You're doing great! Keep going! 💪"
