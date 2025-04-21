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
# LangGraph 结构分析
from agents.mommanager.graph import build_mom_manager_graph
from agents.mommanager.schema import MomAgentState

# GPT 分析（温柔鼓励）
from agents.mom_manager import call_gpt_mom_analysis, get_mom_health_today

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

class MomAgentState(BaseModel):
    summary: str
    health_score: int
    hrv: int
    sleep: int
    steps: int
    resting_hr: int
    calories: int
    breathing_rate: float


# ✅ 1. GPT 文本分析（用于 summary）
@router.get("/api/mom/summary", response_model=MomAnalysisResponse, status_code=status.HTTP_200_OK)
def get_today_mom_summary(user_id: str = Depends(get_current_user)):
    try:
        data = get_mom_health_today(user_id, supabase)
        print(f"获取到的健康数据：{data}")
        
        if not data.get("success"):
            return JSONResponse(
                status_code=500,
                content={"success": False, "summary": data.get("message", "获取健康数据失败")}
            )
            
        health_data = data.get("data", {})
        if not health_data:
            return JSONResponse(
                status_code=500,
                content={"success": False, "summary": "没有找到健康数据"}
            )
        
        prompt_input = {
            "hrv": health_data.get("hrv"),
            "sleep": health_data.get("sleep_hours"),
            "steps": health_data.get("steps"),
            "resting_heart_rate": health_data.get("resting_heart_rate"),
            "breathing_rate": health_data.get("breathing_rate")
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
        analysis: Dict[str, Any] = get_mom_health_today(user_id, supabase)
        return {"success": True, "summary": analysis}
    except Exception as e:
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
            .select("hrv, sleep_hours, resting_heart_rate, steps, breathing_rate, record_date")
            .eq("mom_id", user_id)
            .gte("record_date", start_date.isoformat())
            .execute()
        )

        daily_summary = {}
        for row in health_result.data:
            day = row["record_date"]
            daily_summary[day] = {
                "date": day,
                "hrv": row.get("hrv", 0),
                "sleep_hours": row.get("sleep_hours", 0),
                "resting_heart_rate": row.get("resting_heart_rate", 0),
                "steps": row.get("steps", 0),
                "breathing_rate": row.get("breathing_rate", 0)
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
                "breathing_rate": 0
            }))

        return {"success": True, "data": output}
        print(f"momweekly返回的数据：{output}")  
    except Exception as e:
        return {"success": False, "summary": str(e)}