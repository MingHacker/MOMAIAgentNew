# -------- schema.py --------
from typing import Literal, TypedDict, Optional


class Metrics(TypedDict, total=False):
    sleep_hours_last_night: float
    hrv: float
    baby_total_playtime_today: str
    tasks_completed: int
    period_due_in_days: int
    stress_level: Literal["low", "medium", "high"]


class CompanionHeader(TypedDict):
    headerText: str
