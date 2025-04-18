# api/analyze.py
# 包含宝宝数据分析的 API 接口（如 /api/summary）
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv

from models.db import get_db
from agents.baby_manager import get_today_records, call_gpt_analysis
from agents.babymanager.graph import build_baby_manager_graph
from agents.babymanager.schema import BabyAgentState


router = APIRouter()
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ====== 提交 JSON 分析使用的数据结构（前端 POST 用） ======
class FeedItem(BaseModel):
    time: str
    amount: int

class SleepItem(BaseModel):
    start: str
    end: str

class DiaperItem(BaseModel):
    time: str
    poop: bool

class AnalyzeRequest(BaseModel):
    babyName: Optional[str] = "your baby"
    feedings: List[FeedItem]
    sleeps: List[SleepItem]
    diapers: List[DiaperItem]
    outsideDuration: Optional[int] = 0


# ====== GPT Prompt 分析接口（独立测试）======
@router.post("/api/analyze")
def analyze_baby(data: AnalyzeRequest):
    prompt = f"""
You are a pediatric assistant. Summarize today's condition of the baby named {data.babyName} based on the following data:

Feedings: {data.feedings}
Sleeps: {data.sleeps}
Diapers: {data.diapers}
Outdoor time: {data.outsideDuration} minutes

Provide:
1. Summary of baby's condition.
2. Any potential issues or red flags.
3. Soft suggestions to the mother.
"""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "summary": response.choices[0].message.content
    }

