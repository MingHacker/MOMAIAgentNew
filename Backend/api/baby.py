# ✅ 只保留以下内容：

from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from agents.babymanager.schema import BabyAgentState
from agents.babymanager.graph import build_baby_manager_graph
from models.db import get_db
from models.record_data import FeedRecord, SleepRecord, DiaperRecord, OutsideRecord
from datetime import datetime, timedelta
from typing import Dict, List

router = APIRouter()

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str
    
@router.post("/api/analysis/baby/langgraph", operation_id="analyze_baby_graph_v1")
def analyze_baby_via_graph(userId: str = Query(...), db: Session = Depends(get_db)):
    state = BabyAgentState(
        user_id=userId,
        db=db,
        records={},
        analysis="",
        next_action="",
        missing_fields=[],
        health_score=100
    )

    graph = build_baby_manager_graph()
    result = graph.invoke(state)
    result = BabyAgentState(**result) 

    return {
        "summary": result.analysis,
        "next_action": result.next_action,
        "health_score": result.health_score,
        "missing_fields": result.missing_fields
    }

@router.get("/api/baby/summary/daily")
def get_baby_daily_summary(userId: str = Query(...), db: Session = Depends(get_db)) -> Dict:
    today = datetime.now().date()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    feed_records = db.query(FeedRecord).filter(FeedRecord.user_id == userId, FeedRecord.time.between(start, end)).all()
    sleep_records = db.query(SleepRecord).filter(SleepRecord.user_id == userId, SleepRecord.start.between(start, end)).all()
    diaper_records = db.query(DiaperRecord).filter(DiaperRecord.user_id == userId, DiaperRecord.time.between(start, end)).all()
    outside_records = db.query(OutsideRecord).filter(OutsideRecord.user_id == userId, OutsideRecord.start.between(start, end)).all()

    feed_data = {r.time.strftime("%H:%M"): r.amount for r in feed_records}
    sleep_data = {r.start.strftime("%H:%M"): (r.end - r.start).seconds // 60 for r in sleep_records}
    diaper_poop_count = sum(1 for r in diaper_records if r.poop)
    diaper_total = len(diaper_records)
    outside_minutes = sum((r.end - r.start).seconds for r in outside_records) // 60

    return {
        "feed_graph": feed_data,
        "sleep_graph": sleep_data,
        "diaper": {"total": diaper_total, "poop": diaper_poop_count},
        "outside": outside_minutes,
        "summary": f"今天共喂奶 {len(feed_records)} 次，睡觉 {len(sleep_records)} 次，换尿布 {diaper_total} 次，外出 {outside_minutes} 分钟。"
    }

@router.get("/api/baby/summary/weekly")
def get_baby_summary_weekly(userId: str = Query(...), db: Session = Depends(get_db)) -> Dict[str, List]:
    today = datetime.now()
    labels = [(today - timedelta(days=i)).strftime('%a') for i in reversed(range(7))]

    return {
        "labels": labels,
        "feed": [120, 100, 140, 110, 130, 150, 115],  # 单位：ml
        "sleep": [480, 450, 500, 470, 490, 510, 440],  # 单位：分钟
        "diaper": [5, 4, 6, 5, 5, 6, 4],               # 次数
        "outside": [20, 30, 15, 0, 40, 35, 25]          # 单位：分钟
    }
