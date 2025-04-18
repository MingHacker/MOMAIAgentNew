# api/task.py

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

# 直接引入 graph 和输入定义
from agents.task_manager import run_task_manager

router = APIRouter()

# GPT 请求模型\ n
class GPTTaskRequest(BaseModel):
    user_id: str
    input_text: str
    mom_health_status : Dict[str, Any] = Field(default_factory=dict)
    baby_health_status: Dict[str, Any] = Field(default_factory=dict)

# 简化任务输出模型
class SimpleTaskModel(BaseModel):
    title: str

class GPTTaskResponse(BaseModel):
    success: bool
    message: str
    output: List[SimpleTaskModel]

@router.post("/api/task/gpt", response_model=GPTTaskResponse)
async def create_task_from_gpt(req: GPTTaskRequest = Body(...)):
    # 调用 runner 获取任务输出
    result = run_task_manager(req.dict())
    task_output = result.get("task_output", {})
    tasks = task_output.get("tasks", [])

    if not isinstance(tasks, list) or not tasks:
        raise HTTPException(status_code=500, detail="GPT 未能生成有效任务")

    # 提取 title
    simple_tasks = [SimpleTaskModel(title=t.get("title", "")) for t in tasks if t.get("title")]

    return GPTTaskResponse(
        success=True,
        message=task_output.get("message", "任务生成成功"),
        output=simple_tasks
    )