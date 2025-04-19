# ✅ 只保留以下内容：

import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import json

load_dotenv()

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

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str
    
# @router.post("/api/analysis/baby/langgraph", operation_id="analyze_baby_graph_v1")
# async def analyze_baby_via_graph(user_id: str = Depends(get_current_user)):
#     state = BabyAgentState(
#         user_id=user_id,
#         db=supabase,
#         records={},
#         analysis="",
#         next_action="",
#         missing_fields=[],
#         health_score=100
#     )

#     graph = build_baby_manager_graph()
#     result = graph.invoke(state)
#     result = BabyAgentState(**result) 

#     return {
#         "summary": result.analysis,
#         "next_action": result.next_action,
#         "health_score": result.health_score,
#         "missing_fields": result.missing_fields
#     }

# @router.get("/api/baby/summary/daily")
# async def get_baby_daily_summary(user_id: str = Depends(get_current_user)) -> Dict:
#     today = datetime.now().date()
#     start = datetime.combine(today, datetime.min.time())
#     end = datetime.combine(today, datetime.max.time())

#     # Use Supabase to fetch the data
#     feed_records_response = supabase.table("baby_logs").select("*").eq("baby_id", user_id).eq("log_type", "feeding").gte("logged_at", start.isoformat()).lte("logged_at", end.isoformat()).execute()
#     sleep_records_response = supabase.table("baby_logs").select("*").eq("baby_id", user_id).eq("log_type", "sleep").gte("logged_at", start.isoformat()).lte("logged_at", end.isoformat()).execute()
#     diaper_records_response = supabase.table("baby_logs").select("*").eq("baby_id", user_id).eq("log_type", "diaper").gte("logged_at", start.isoformat()).lte("logged_at", end.isoformat()).execute()
#     outside_records_response = supabase.table("baby_logs").select("*").eq("baby_id", user_id).eq("log_type", "outside").gte("logged_at", start.isoformat()).lte("logged_at", end.isoformat()).execute()

#     feed_records = feed_records_response.data
#     sleep_records = sleep_records_response.data
#     diaper_records = diaper_records_response.data
#     outside_records = outside_records_response.data

#     feed_data = {datetime.fromisoformat(r["logged_at"]).strftime("%H:%M"): r["log_data"]["amount"] for r in feed_records}
#     sleep_data = {datetime.fromisoformat(r["logged_at"]).strftime("%H:%M"): r["log_data"]["duration"] for r in sleep_records}
#     diaper_poop_count = sum(1 for r in diaper_records if r["log_data"].get("poop", False))
#     diaper_total = len(diaper_records)
#     outside_minutes = sum(r["log_data"]["duration"] for r in outside_records)

#     return {
#         "feed_graph": feed_data,
#         "sleep_graph": sleep_data,
#         "diaper": {"total": diaper_total, "poop": diaper_poop_count},
#         "outside": outside_minutes,
#         "summary": f"今天共喂奶 {len(feed_records)} 次，睡觉 {len(sleep_records)} 次，换尿布 {diaper_total} 次，外出 {outside_minutes} 分钟。"
#     }

# @router.get("/api/baby/summary/weekly")
# def get_baby_summary_weekly(user_id: str = Depends(get_current_user)) -> Dict[str, List]:
#     today = datetime.now()
#     labels = [(today - timedelta(days=i)).strftime('%a') for i in reversed(range(7))]

#     return {
#         "labels": labels,
#         "feed": [120, 100, 140, 110, 130, 150, 115],  # 单位：ml
#         "sleep": [480, 450, 500, 470, 490, 510, 440],  # 单位：分钟
#         "diaper": [5, 4, 6, 5, 5, 6, 4],               # 次数
#         "outside": [20, 30, 15, 0, 40, 35, 25]          # 单位：分钟
#     }

from baby_health_agent.agent import baby_health_graph, BabyHealthAgentState
from datetime import date, timedelta

@router.get("/health_analysis/{baby_id}")
async def get_baby_health_analysis(baby_id: str, user_id: str = Depends(get_current_user), ):
    state = BabyHealthAgentState(
        user_id=user_id,
        baby_id=baby_id
    )
    # result = baby_health_agent(state)
    result = await baby_health_graph.ainvoke(state)
    
    review_data = result["llm_response"]

    # Save the result to the baby_health_reviews table
    try:
        data = {
            "baby_id": baby_id,
            "review_period_start": (date.today() - timedelta(days=7)).isoformat(),
            "review_period_end": date.today().isoformat(),
            "overall_status": review_data.get("overall_status", "N/A"),
            "summary": review_data.get("summary", "N/A"),
            "indicators": review_data.get("indicators", {}),
            "recommendations": review_data.get("recommendations", {})
        }
        supabase.table("baby_health_reviews").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return review_data
