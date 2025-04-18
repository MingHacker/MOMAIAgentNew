### agents/taskmanager/schema.py
from typing import TypedDict, Optional, Dict, Any, List, Literal

class TaskManagerInput(TypedDict):
    user_id: str
    input_text: str
    mom_health_status: Optional[Dict[str, Any]]
    baby_health_status: Optional[Dict[str, Any]]

class SubTaskItem(TypedDict):
    task_id: str
    title: str
    due_date: str
    status: Literal["pending", "completed"]

class Reminder(TypedDict):
    time: str
    message: str

class TaskItem(TypedDict):
    task_id: str
    title: str
    due_date: str
    priority: Optional[Literal["low", "medium", "high"]]
    category: Optional[str]
    status: Literal["pending", "completed"]
    sub_tasks: Optional[List[SubTaskItem]]
    reminder: Optional[Reminder]

class TaskManagerOutput(TypedDict):
    tasks: List[TaskItem]
    status: Literal["success", "error"]
    message: str