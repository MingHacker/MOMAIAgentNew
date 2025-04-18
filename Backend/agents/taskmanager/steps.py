import uuid
from typing import Dict, Any, List
from utils.date_utils import safe_parse_datetime
from typing import TypedDict, Optional, Dict, Any, List, Literal
from pydantic import BaseModel
from agents.taskmanager.prompts import build_task_prompt
from .schema import TaskManagerInput, TaskManagerOutput, TaskItem
from agents.llm import call_gpt_json

def test_build_prompt():
    prompt_str = build_task_prompt(
        input_text="明天早上带宝宝去做体检，并准备疫苗本",
        mom_health_status={"energy_level": "medium"},
        baby_health_status={"age_in_months": 6}
    )
    gpt_result = call_gpt_json(prompt_str)
    print("GPT result:", gpt_result)

def task_manager_node(input: TaskManagerInput) -> TaskManagerOutput:
    try:
        # 1️⃣ 构建 prompt
        prompt_str = build_task_prompt(
            input_text=input["input_text"],
            mom_health_status=input.get("mom_health_status", {}),
            baby_health_status=input.get("baby_health_status", {})
        )

        # 2️⃣ 调 GPT
        gpt_result = call_gpt_json(prompt_str)
        print("🧠 GPT 原始返回结果:", gpt_result)

        if "tasks" not in gpt_result or not isinstance(gpt_result["tasks"], list):
            raise ValueError("GPT 返回结果缺少 tasks 字段")

        # 3️⃣ 解析成内部完整结构（可选）
        parsed_tasks: List[TaskItem] = []
        for task in gpt_result["tasks"]:
            task_id = str(uuid.uuid4())
            parsed_tasks.append(
                {  # 这里仍然保留全部字段，后续想用随时有
                    "task_id": task_id,
                    "title": task.get("title", "未命名任务"),
                    "due_date": safe_parse_datetime(task.get("due_date")),
                    "priority": task.get("priority", "medium"),
                    "category": task.get("category", "mom"),
                    "status": task.get("status", "pending"),
                    "sub_tasks": None,
                    "reminder": None
                }
            )

        # 4️⃣ ⬇️ **裁剪**成前端想要的极简格式
        slim_tasks: List[Dict[str, str]] = [
            {"title": t["title"]} for t in parsed_tasks
        ]

        print("steps.py: slim_tasks", slim_tasks)

        return {
            "tasks": slim_tasks,
            "status": "success",
            "message": f"生成了 {len(slim_tasks)} 个任务"
        }

    except Exception as e:
        print("❌ 任务解析失败:", str(e))
        return {
            "tasks": [],
            "status": "error",
            "message": f"任务生成失败: {str(e)}"
        }