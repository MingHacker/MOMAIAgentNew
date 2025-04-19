from pydantic import BaseModel
from typing import Optional, List


class EmotionAgentState(BaseModel):
    user_id: str
    baby_id: str
    mom_data: dict
    baby_data: dict
    task_count: Optional[int] = 0  # ✅ 可选：传入完成任务数
    summary: Optional[str] = ""
    emotion_label: Optional[str] = ""
    suggestions: Optional[List[str]] = []
    gentle_message: Optional[str] = ""

celebration_text: Optional[str] = ""