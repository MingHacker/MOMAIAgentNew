from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from agents.emotion_manager import EmotionManager
from agents.baby_manager import get_baby_health_today
from agents.mom_manager import get_mom_health_today
#from agents.task_manager import get_task_today
#from agents.health_analytics import HealthAnalytics

router = APIRouter()

_emotion_manager = EmotionManager(
    get_baby_health_today,
    get_mom_health_today,
    #get_task_today,
    #HealthAnalytics(),
)

def get_emotion_manager() -> EmotionManager:
    """FastAPI dependency provider (local, no external deps.py needed)."""
    return _emotion_manager


@router.post("/api/emotion")
async def emotion_summary(
    user_id: UUID,
    baby_id: UUID,
    manager: EmotionManager = Depends(get_emotion_manager),
):
    """Return a warm daily overview (headerText) plus the raw metrics used."""
    try:
        data = await manager.summary(user_id, baby_id)
        return data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
