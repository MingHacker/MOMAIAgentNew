# api/task.py

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
import jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import os
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.supabase import get_supabase
# 直接引入 graph 和输入定义
from agents.task_manager import run_task_manager
from agents.llm import detect_task_category
from datetime import datetime, timezone

load_dotenv()
supabase = get_supabase()

router = APIRouter()

security = HTTPBearer()

# GPT 请求模型\ n
class GPTTaskRequest(BaseModel):
    task_id: Optional[str] = None
    input_text: str
    mom_health_status : Dict[str, Any] = Field(default_factory=dict)
    baby_health_status: Dict[str, Any] = Field(default_factory=dict)



# 简化任务输出模型
class SimpleTaskModel(BaseModel):
    title: str

class GPTTaskResponse(BaseModel):
    success: bool
    message: str
    category: str
    output: List[SimpleTaskModel]

class TaskModel(BaseModel):
    id: str
    text: str

class SaveTaskRequest(BaseModel):
    main_task: TaskModel
    sub_tasks: List[TaskModel]

class TaskUpdate(BaseModel):
    id: str
    done: bool

class TaskUpdateRequest(BaseModel):
    main_task: TaskUpdate
    sub_tasks: List[TaskUpdate]

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        decoded = jwt.decode(
            token,
            os.getenv("SUPABASE_KEY"),
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{os.getenv('SUPABASE_URL')}/auth/v1",
            options={"verify_signature": False}
        )
        return decoded["sub"]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

@router.post("/api/task/gpt", response_model=GPTTaskResponse)
async def create_task_from_gpt(req: GPTTaskRequest = Body(...), user_id: str = Depends(get_current_user)):
    """
    创建任务
    """
    # 1️⃣ 直接调用任务管理器的 run_task_manager 函数
    # 调用 runner 获取任务输出
    result = run_task_manager(req.model_dump())
    task_output = result["task_output"]
    category = task_output["category"]
    tasks = task_output["tasks"]

    if not isinstance(tasks, list) or not tasks:
        raise HTTPException(status_code=500, detail="GPT 未能生成有效任务")

    # 提取 title
    simple_tasks = [SimpleTaskModel(title=t.get("title", "")) for t in tasks if t.get("title")]

    return GPTTaskResponse(
        success=True,
        message=task_output.get("message", "任务生成成功"),
        category=category,
        output=simple_tasks
    )

@router.post("/api/task/save")
def save_task(request: SaveTaskRequest, user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    category = detect_task_category(request.main_task.text)

        # 👉 Insert main task and get generated task_id
    main_insert = supabase.client.table("tasks").upsert({
        "task_id": request.main_task.id,
        "mom_id": user_id,
        "title": request.main_task.text,
        "status": "pending",
        "priority": "medium",
        "category": category,
        "created_at": now
    }).execute()

    main_task_id = main_insert.data[0]["task_id"]

        # 👉 Insert sub-tasks
    # 👇 Collect all subtask payloads
    subtask_payloads = [{
        "task_id": sub.id,
        "mom_id": user_id,
        "title": sub.text,
        "status": "pending",
        "priority": "medium",
        "created_at": now,
        "parent_id": main_task_id
    } for sub in request.sub_tasks]

    # ✅ Batch insert in one request
    if subtask_payloads:
        subInserts = supabase.client.table("tasks").insert(subtask_payloads).execute()

    return {"success": True}

@router.post("/api/task/update")
async def update_task_status_api(req: TaskUpdateRequest = Body(...)):
    try:
        update_task_status(req.main_task)
        for sub in req.sub_tasks:
            update_task_status(sub)
        return {"success": True, "message": "All tasks updated successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}

def update_task_status(task):
    status = "completed" if task.done else "pending"
    update_data = {"status": status}
    if status == "completed":
        update_data["complete_date"] = datetime.utcnow().isoformat()

    return supabase.client.table("tasks").update(update_data).eq("task_id", task.id).execute()
