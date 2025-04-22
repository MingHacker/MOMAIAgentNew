import uuid
from typing import Dict, Any, List
from utils.date_utils import safe_parse_datetime
from typing import TypedDict, Optional, Dict, Any, List, Literal
from pydantic import BaseModel
from agents.taskmanager.prompts import build_task_prompt
from .schema import TaskManagerInput, TaskManagerOutput, TaskItem
from agents.llm import call_gpt_json, call_gpt_json_newversion
from core.supabase import get_supabase


# def test_build_prompt():
#     prompt_str = build_task_prompt(
#         input_text="明天早上带宝宝去做体检，并准备疫苗本",
#         mom_health_status={"energy_level": "medium"},
#         baby_health_status={"age_in_months": 6}
#     )
#     gpt_result = call_gpt_json(prompt_str)
#     print("GPT result:", gpt_result)

def task_manager_node(input: TaskManagerInput) -> TaskManagerOutput:
    try:
        # 1️⃣ 构建 prompt
        prompt_str = build_task_prompt(
            input_text=input["input_text"],
            mom_health_status=input["mom_health_status"],
            baby_health_status=input["baby_health_status"]
        )

        # 2️⃣ 调 GPT
        gpt_result = call_gpt_json(prompt_str)
        print("🧠 GPT 原始返回结果:", gpt_result)

        if "tasks" not in gpt_result or not isinstance(gpt_result["tasks"], list):
            raise ValueError("GPT 返回结果缺少 tasks 字段")
        
        return gpt_result

        # # 3️⃣ 解析成内部完整结构 加入数据库（可选）
        # parsed_tasks: List[TaskItem] = []
        # for task in gpt_result["tasks"]:
        #     subTask = TaskItem()
        #     subTask["title"] = task.get("title", "未命名任务")
        #     subTask["due_date"] = safe_parse_datetime(task.get("due_date"))     # 解析日期
        #     subTask["priority"] = task.get("priority", "medium")  # 默认中等优先级
        #     subTask["category"] = task.get("category", "mom")  # 默认分类为妈妈
        #     subTask["status"] = task.get("status", "pending")  # 默认状态为待办
        #     subTask["reminder"] = None  # 提醒默认为空
        #     subTask["parent_id"] = input["task_id"]  

        #     # get_supabase().client.table("tasks").insert(subTask).execute()

        #     parsed_tasks.append(subTask)



        # # 4️⃣ ⬇️ **裁剪**成前端想要的极简格式
        # slim_tasks: List[Dict[str, str]] = [
        #     {"title": t["title"]} for t in parsed_tasks
        # ]

        # print("steps.py: slim_tasks", slim_tasks)

        # return {
        #     "tasks": slim_tasks,
        #     "status": "success",
        #     "message": f"生成了 {len(slim_tasks)} 个任务"
        # }

    except Exception as e:
        print("❌ 任务解析失败:", str(e))
        return {
            "tasks": [],
            "status": "error",
            "message": f"任务生成失败: {str(e)}"
        }
    
# def detect_task_category(task_title: str) -> Optional[str]:
# """
# Uses LLM to detect the category of a task based on its title/description.

# Args:
#     task_title: A short task description (e.g., "Buy formula", "Book vaccine appointment")

# Returns:
#     Predicted category as a string or None if detection fails.
# """
# prompt = f"""
# You are an AI assistant helping a mom categorize her tasks.

# Here are the possible categories:
# - baby_care: feeding, sleep, diaper, bath, play
# - shopping: buying items (diapers, groceries, etc.)
# - housework: cleaning, laundry, dishes
# - healthcare: appointments, checkups, medicine
# - self_care: exercise, meditation, journaling
# - work: job-related tasks
# - other: if none of the above fits

# Task: "{task_title}"
# Which category does this task belong to? Only reply with the category name.
# """

# try:
#     response = client.chat.completions.create(
#         model="deepseek-chat",
#         messages=[{"role": "user", "content": prompt}],
#     )
#     category = response.choices[0].message.content.strip().lower()
#     return category if category in CATEGORIES else "other"

# except Exception as e:
#     print(f"Error detecting task category: {e}")
#     return None
