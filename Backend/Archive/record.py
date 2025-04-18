from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any

from models.db import get_db
from models.record_data import FeedRecord, SleepRecord, DiaperRecord, OutsideRecord
from schemas.record_schema import FeedItem, SleepItem, DiaperItem, OutsideItem
from schemas.record_response import (
    FeedRecordResponse, SleepRecordResponse, DiaperRecordResponse, OutsideRecordResponse,
    FeedInsightResponse, SleepInsightResponse, DiaperInsightResponse, OutsideInsightResponse
)

router = APIRouter()

# ===== Feed Record =====
@router.post("/api/record/feed")
def submit_feed_record(item: FeedItem, db: Session = Depends(get_db)):
    record = FeedRecord(
        user_id=item.userId,
        time=datetime.fromtimestamp(item.startTime / 1000),
        amount=item.amount
    )
    db.add(record)
    db.commit()
    return {"success": True}

@router.get("/api/record/feed/today", response_model=FeedInsightResponse)
def get_today_feed_records(userId: str, db: Session = Depends(get_db)):
    records = db.query(FeedRecord).filter(FeedRecord.user_id == userId).all()
    total = sum(r.amount for r in records)
    next_time = "13:30"  # placeholder
    summary = f"宝宝今天喝了 {total}ml，预计{next_time}再喝奶"
    return FeedInsightResponse(
        records=[FeedRecordResponse(time=r.time.strftime("%Y-%m-%d %H:%M"), amount=r.amount) for r in records],
        total=total,
        nextTime=next_time,
        summary=summary
    )

# ===== Sleep Record =====
@router.post("/api/record/sleep")
def submit_sleep_record(item: SleepItem, db: Session = Depends(get_db)):
    record = SleepRecord(
        user_id=item.userId,
        start=datetime.fromtimestamp(item.startTime / 1000),
        end=datetime.fromtimestamp(item.endTime / 1000)
    )
    db.add(record)
    db.commit()
    return {"success": True}

@router.get("/api/record/sleep/today", response_model=SleepInsightResponse)
def get_today_sleep_records(userId: str, db: Session = Depends(get_db)):
    records = db.query(SleepRecord).filter(SleepRecord.user_id == userId).all()
    total_duration = sum((r.end - r.start).seconds for r in records) // 60
    next_time = "14:00"  # placeholder
    summary = f"今日共睡了 {total_duration} 分钟，建议 {next_time} 再次入睡"
    return SleepInsightResponse(
        records=[SleepRecordResponse(start=r.start.strftime("%Y-%m-%d %H:%M"), end=r.end.strftime("%Y-%m-%d %H:%M")) for r in records],
        total=total_duration,
        nextTime=next_time,
        summary=summary
    )

# ===== Diaper Record =====
@router.post("/api/record/diaper")
def submit_diaper_record(item: DiaperItem, db: Session = Depends(get_db)):
    record = DiaperRecord(
        user_id=item.userId,
        time=datetime.fromtimestamp(item.diaperTime / 1000),
        poop=item.solid
    )
    db.add(record)
    db.commit()
    return {"success": True}

@router.get("/api/record/diaper/today", response_model=DiaperInsightResponse)
def get_today_diaper_records(userId: str, db: Session = Depends(get_db)):
    records = db.query(DiaperRecord).filter(DiaperRecord.user_id == userId).all()
    total = len(records)
    next_time = "10:00"  # placeholder
    summary = f"已换 {total} 次尿布，建议 {next_time} 后再次检查"
    return DiaperInsightResponse(
        records=[DiaperRecordResponse(time=r.time.strftime("%Y-%m-%d %H:%M"), solid=r.poop) for r in records],
        total=total,
        nextTime=next_time,
        summary=summary
    )

# ===== Outside Record =====
@router.post("/api/record/outside")
def submit_outside_record(item: OutsideItem, db: Session = Depends(get_db)):
    now = datetime.now()
    record = OutsideRecord(
        user_id=item.userId,
        start=now,
        end=now + timedelta(minutes=item.duration)
    )
    db.add(record)
    db.commit()
    return {"success": True}

@router.get("/api/record/outside/today", response_model=OutsideInsightResponse)
def get_today_outside_records(userId: str, db: Session = Depends(get_db)):
    records = db.query(OutsideRecord).filter(OutsideRecord.user_id == userId).all()
    total = sum((r.end - r.start).seconds for r in records) // 60
    next_time = "16:00"  # placeholder
    summary = f"今日外出 {total} 分钟，建议傍晚 {next_time} 再次出门晒太阳"
    return OutsideInsightResponse(
        records=[OutsideRecordResponse(start=r.start.strftime("%Y-%m-%d %H:%M"), end=r.end.strftime("%Y-%m-%d %H:%M")) for r in records],
        total=total,
        nextTime=next_time,
        summary=summary
    )

# ===== All Records (分析使用) =====
@router.get("/api/record/all/today")
def get_all_today_records(userId: str = Query(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    today = datetime.now().date()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    def model_to_dict(obj):
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

    return {
        "feed": [model_to_dict(r) for r in db.query(FeedRecord).filter(FeedRecord.user_id == userId, FeedRecord.time.between(start, end)).all()],
        "sleep": [model_to_dict(r) for r in db.query(SleepRecord).filter(SleepRecord.user_id == userId, SleepRecord.start.between(start, end)).all()],
        "diaper": [model_to_dict(r) for r in db.query(DiaperRecord).filter(DiaperRecord.user_id == userId, DiaperRecord.time.between(start, end)).all()],
        "outside": [model_to_dict(r) for r in db.query(OutsideRecord).filter(OutsideRecord.user_id == userId, OutsideRecord.start.between(start, end)).all()]
    }