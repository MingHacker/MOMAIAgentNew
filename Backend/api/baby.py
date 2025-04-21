# ✅ 只保留以下内容：

import os
from fastapi import APIRouter, Query, Depends, HTTPException, status
from pydantic import BaseModel
from agents.babymanager.schema import BabyAgentState
from agents.babymanager.graph import build_baby_manager_graph
from datetime import datetime, timedelta
from typing import Dict, List
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from supabase import Client
from datetime import datetime
from fastapi.responses import JSONResponse
from agents.baby_manager import get_baby_health_today
from core.supabase import get_supabase
from agents.baby_manager import call_gpt_baby_analysis


router = APIRouter()
supabase = get_supabase()
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

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str
    


@router.get("/api/baby/summary/week", status_code=status.HTTP_200_OK)
def get_weekly_baby_summary(baby_id: str, user_id: str = Depends(get_current_user)):
    try:
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=6)  # 包含今天，共7天

        # Ensure logs_result is directly used as it returns a list of results
        logs_result = supabase.query(
            "baby_logs",
            {"baby_id": baby_id}
        )

        # If the query is successful, logs_result will be a list of entries
        daily_summary = {}
        for row in logs_result:  # Directly iterate over the list
            dt = datetime.fromisoformat(row["logged_at"])
            day = dt.date().isoformat()
            daily = daily_summary.setdefault(day, {
                "date": day,
                "feed_total_ml": 0,
                "sleep_total_hours": 0,
                "diaper_count": 0,
                "bowel_count": 0,
                "outside_total_minutes": 0,
                "cry_total_minutes": 0
            })

            log_type = row["log_type"]
            data = row["log_data"]

            if log_type == "feeding":
                amount = data.get("feedAmount", 0)
                try:
                    daily["feed_total_ml"] += int(amount)
                except:
                    pass

            elif log_type == "sleep":
                duration = data.get("duration", 0) / 3600  # 秒转小时
                start = datetime.strptime(data.get('sleepStart'), "%H:%M")
                end = datetime.strptime(data.get('sleepEnd'), "%H:%M")
                daily["sleep_total_hours"] += (end - start).total_seconds() / 3600
        

            elif log_type == "diaper":
                daily["diaper_count"] += 1
                if data.get("diaperSolid") == True:
                    daily["bowel_count"] += 1

            elif log_type == "outside":
                duration = data.get("duration", 0)
                daily["outside_total_minutes"] += int(duration)

            elif log_type == "cry":
                duration = data.get("duration", 0)
                daily["cry_total_minutes"] += int(duration)

        # Print statement for debugging
        print("************************Weekly baby output", daily_summary)

        # 补全空天数
        output = []
        for i in range(7):
            day = (start_date + timedelta(days=i)).isoformat()
            output.append(daily_summary.get(day, {
                "date": day,
                "feed_total_ml": 0,
                "sleep_total_hours": 0,
                "diaper_count": 0,
                "bowel_count": 0,
                "outside_total_minutes": 0,
                "cry_total_minutes": 0
            }))
        print("************************Weekly baby output", output)
        return {"success": True, "data": output}

    except Exception as e:
        return {"success": False, "summary": str(e)}

######### ✅ 2. 每日健康数据（图表卡片用）
@router.get("/api/baby/health/daily", status_code=status.HTTP_200_OK)
async def get_baby_health_daily(baby_id: str, user_id: str = Depends(get_current_user)):
    try:
        analysis: Dict[str, Any] = get_baby_health_today(baby_id, supabase.client)
        return {"success": True, "summary": analysis}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "summary": str(e)})
    


@router.get("/api/baby/summary", status_code=status.HTTP_200_OK)
def get_today_baby_summary(baby_id: str, user_id: str = Depends(get_current_user)):
    try:
        data = get_baby_health_today(baby_id, supabase.client)
        print(f"✅ 获取到的宝宝数据: {data}")

        if not data or all(len(v) == 0 for k, v in data.items() if k != "babyName"):
            return JSONResponse(
                status_code=400,
                content={"success": False, "summary": "今天没有记录"}
            )

        # 调用 GPT 分析
        result = call_gpt_baby_analysis(baby_id, supabase.client)
        return {
            "success": True,
            "summary": result["summary"],
            "next_action": result["next_action"]
        }

    except Exception as e:
        print(f"❌ 分析宝宝健康数据出错: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "summary": str(e)}
        )
    

#@router.post("/api/analysis/baby/langgraph", operation_id="analyze_baby_graph_v1")
#async def analyze_baby_via_graph(user_id: str = Depends(get_current_user)):
#    state = BabyAgentState(
#        user_id=user_id,
#        db=supabase,
#        records={},
#        analysis="",
#        next_action="",
#        missing_fields=[],
#        health_score=100
#    )
