# ✅ api/mom.py
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from supabase import create_client, Client
from core.auth import get_current_user
from core.supabase import get_supabase

# LangGraph 结构分析
from agents.mommanager.graph import build_mom_manager_graph
from agents.mommanager.schema import MomAgentState

# GPT 分析（温柔鼓励）
from agents.mom_manager import call_gpt_mom_analysis

router = APIRouter()

class MomAnalysisResponse(BaseModel):
    success: bool
    summary: str  # GPT 生成的关于妈妈健康与建议的分析内容

# ✅ 1. GPT 文本分析（用于 summary）
@router.get("/api/mom/summary", response_model=MomAnalysisResponse)
def get_today_mom_summary(userId: str, user_id: str = Depends(get_current_user)):
    try:
        # mock 数据结构（未来从数据库替换）
        mock = {"hrv": 34, "sleep": 7.5, "steps": 4100}
        analysis = call_gpt_mom_analysis(mock)
        return {"success": True, "summary": analysis}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "summary": str(e)})

# ✅ 2. 每日健康数据（图表卡片用）
@router.get("/api/mom/health/daily")
def get_mom_health_daily(userId: str = Query(...), db: Session = Depends(get_supabase)):
    return {
        "date": "2025-04-13",
        "hrv": 34,
        "resting_hr": 72,
        "sleep": 6.8,
        "steps": 4100,
        "calories": 1650,
        "breathing_rate": 17,
        "summary": "HRV 略低，注意多休息，睡眠还不错",
        "health_score": 72
    }

# ✅ 3. 每周健康趋势图表
@router.get("/api/mom/health/weekly")
def get_mom_health_weekly(userId: str = Query(...), db: Session = Depends(get_supabase)):
    from datetime import datetime, timedelta
    today = datetime.now()
    labels = [(today - timedelta(days=i)).strftime('%a') for i in reversed(range(7))]

    return {
        "labels": labels,
        "hrv": [34, 36, 38, 35, 32, 30, 40],
        "resting_hr": [72, 74, 70, 71, 69, 70, 72],
        "steps": [4100, 5800, 3000, 2000, 6200, 7000, 5400],
        "sleep": [6.5, 7.0, 6.0, 6.8, 5.9, 7.1, 7.2]
    }

# ✅ 4. LangGraph 分析主流程（含打分、总结）
@router.post("/api/analysis/mom/langgraph")
def analyze_mom_graph(userId: str = Query(...), db: Session = Depends(get_supabase)):
    graph = build_mom_manager_graph()
    result = graph.invoke(MomAgentState(user_id=userId, db=db))
    final = MomAgentState(**result)
    return {
        "summary": final.summary,
        "health_score": final.health_score,
        "hrv": final.hrv,
        "sleep": final.sleep,
        "steps": final.steps,
        "resting_hr": final.resting_hr,
        "calories": final.calories,
        "breathing_rate": final.breathing_rate
    }
