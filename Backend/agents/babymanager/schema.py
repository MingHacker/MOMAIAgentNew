from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from sqlalchemy.orm import Session

# ✅ BabyAgent 的状态结构，用于 LangGraph 流程控制
class BabyAgentState(BaseModel):
    user_id: str                     # 用户 ID
    db: Session                     # 数据库连接
    analysis: str = ""              # GPT 分析结果
    records: Optional[Dict[str, Any]] = None  # 宝宝记录数据

    summary: str = ""               # 摘要信息（暂时保留）
    next_action: str = ""           # 下一步建议
    missing_fields: List[str] = []  # 缺失的记录项
    health_score: int = 100         # 健康评分

    class Config:
        arbitrary_types_allowed = True  # 允许 SQLAlchemy Session 作为字段