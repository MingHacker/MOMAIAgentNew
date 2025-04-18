from typing import Dict, Any
from uuid import UUID

from agents.baby_manager import get_baby_health_today
from agents.mom_manager import get_mom_health_today
#from agents.task_manager import TaskManager  -summary
from agents.emotionmanager.graph import run_companion_graph


class EmotionManager:
    """Aggregate data & ask LangGraph to craft the warm header sentence."""

    def __init__(
        self,
        baby_manager: get_baby_health_today,
        mom_manager: get_mom_health_today,
        #task_manager: TaskManager,
        #health_analytics: HealthAnalytics,
    ):
        self.baby_manager = baby_manager
        self.mom_manager = mom_manager
        #self.task_manager = task_manager
        #self.health_analytics = health_analytics

    async def _collect_metrics(self, user_id: UUID, baby_id: UUID) -> Dict[str, Any]:
        baby = await self.baby_manager.summary(baby_id)
        mom = await self.mom_manager.summary(user_id)
        task = await self.task_manager.today_summary(user_id)
        #trend = await self.health_analytics.week_trend(user_id)

        return {
            "sleep_hours_last_night": mom.get("sleep_hours"),
            "hrv": mom.get("hrv"),
            "baby_total_playtime_today": baby.get("play_time"),
            "tasks_completed": task.get("completed"),
            "period_due_in_days": mom.get("period_due"),
            "stress_level": mom.get("stress_level"),
        }

    async def _generate_header(self, metrics: Dict[str, Any]) -> str:
        result = await run_companion_graph(metrics)  # LangGraph call
        return result["headerText"]

    async def summary(self, user_id: UUID, baby_id: UUID) -> Dict[str, Any]:
        metrics = await self._collect_metrics(user_id, baby_id)
        header_text = await self._generate_header(metrics)
        return {"headerText": header_text, "rawMetrics": metrics}