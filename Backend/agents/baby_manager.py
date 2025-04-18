# 🍼 baby_manager.py

from http import client
from agents.babymanager.prompts import baby_gpt_prompt
import openai  
from pydantic import BaseModel
from sqlalchemy.orm import Session

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str

def get_baby_health_today(user_id: str, db: Session):
    print(f"Getting today's records for user {user_id}")
    return {
        "babyName": "Evan",
        "feedings": [...],
        "sleeps": [...],
        "diapers": [...],
        "outsideDuration": 35
    }

# ✨ GPT 分析函数（调用分析 Agent）
def call_gpt_baby_analysis(data: dict) -> BabyAnalysisResponse:
    prompt = baby_gpt_prompt.format(data=data)

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a baby care assistant AI."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    answer = response['choices'][0]['message']['content']

    # 简化方式解析，建议后续改为 JSON parser
    parts = answer.split("Next Action:")
    return BabyAnalysisResponse(
        summary=parts[0].strip(),
        next_action=parts[1].strip() if len(parts) > 1 else ""
    )

def call_gpt_baby_analysis_str(data: dict) -> str:
    """
    用于 GPT 分析妈妈健康状况，返回 summary 文本（用于 /api/mom/summary）
    """
    prompt = baby_gpt_prompt(data["hrv"], data["sleep"], data["steps"])
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

class BabyManager:
    def __init__(self, db: Session):
        self.db = db

    def get_baby_health_today(self, user_id: str):
        return get_baby_health_today(user_id, self.db)

    def analyze_baby_health(self, data: dict) -> BabyAnalysisResponse:
        return call_gpt_baby_analysis(data)

