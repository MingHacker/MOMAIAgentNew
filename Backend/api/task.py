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

class SubTask(BaseModel):
    text: str

class SaveTaskRequest(BaseModel):
    main_task: str
    sub_tasks: List[SubTask]

class SubTaskUpdate(BaseModel):
    text: str
    done: bool

class TaskUpdateRequest(BaseModel):
    main_task: str
    sub_tasks: List[SubTaskUpdate]
    done: bool

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
def save_task(request: SaveTaskRequest):
    print("✅ 收到主任务：", request.main_task)
    print("✅ 收到子任务列表：", [t.text for t in request.sub_tasks])
    return {"success": True, "message": "已收到任务内容"}

@router.post("/api/task/update")
async def update_task_status(req: TaskUpdateRequest = Body(...)):
    """
    接收任务状态更新请求
    """
    print("✅ 接收到主任务更新:")
    print("主任务:", req.main_task)
    print("主任务是否完成:", req.done)
    print("子任务:")
    for sub in req.sub_tasks:
        print(f" - {sub.text} ✅ {'完成' if sub.done else '未完成'}")

    # 可后续加入数据库更新逻辑
    return {"success": True, "message": "任务状态已接收"}