import json
from typing import Dict, Optional
from openai import OpenAI

CATEGORIES = ["baby_care", "shopping", "housework", "healthcare", "self_care", "work", "other"]

client = OpenAI()

def call_gpt_json_newversion(prompt: str) -> Dict:
    try:
        print("📨 正在调用 GPT...")
        print("📝 Prompt:", prompt)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": [
                        {"type": "text", "text": "你是一个温柔体贴的 AI 助手，只返回 JSON 结构，格式如下：{\"message\": \"...\"}，不要多余说明。"}
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt}
                    ]
                }
            ],
            temperature=0.6,
            max_tokens=300
        )

        content = response.choices[0].message.content.strip()
        print("📬 GPT 回复内容:", content)

        # 尝试找到 JSON 起始部分
        json_start = content.find("{")
        if json_start == -1:
            print("❌ 未找到 JSON 内容")
            return {"message": content}

        json_str = content[json_start:]
        try:
            result = json.loads(json_str)
            return result if isinstance(result, dict) else {"message": content}
        except json.JSONDecodeError as e:
            print("❌ JSON 解析失败:", str(e))
            return {"message": content}

    except Exception as e:
        print("❌ GPT 调用失败:", str(e))
        return {"message": "🤖 出现错误，稍后再试"}
    

def call_gpt_json(prompt: str) -> dict:
    try:
        print("📨 正在调用 GPT...")
        print("📝 Prompt:", prompt)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "你是一个善于将任务结构化的生活助理，只返回 JSON 格式的任务列表"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        content = response.choices[0].message.content
        print("📬 GPT 回复内容:", content)

        json_start = content.find("{")
        if json_start == -1:
            print("❌ 未找到 JSON 内容")
            return {"tasks": []}
        
        json_str = content[json_start:]
        try:
            result = json.loads(json_str)
            if "tasks" not in result:
                print("❌ 返回结果缺少 tasks 字段")
                return {"tasks": []}
            return result
        except json.JSONDecodeError as e:
            print("❌ JSON 解析失败:", str(e))
            return {"tasks": []}

    except Exception as e:
        print("❌ GPT 调用失败:", str(e))
        return {"tasks": []}




client = OpenAI(
    api_key = "",  # or use os.getenv("...")
    base_url="https://api.deepseek.com/v1"  # Replace with your provider
)

def detect_task_category(task_title: str) -> Optional[str]:
    """
    Uses LLM to detect the category of a task based on its title/description.

    Args:
        task_title: A short task description (e.g., "Buy formula", "Book vaccine appointment")

    Returns:
        Predicted category as a string or None if detection fails.
    """
    prompt = f"""
You are an AI assistant helping a mom categorize her tasks.

Here are the possible categories:
- baby_care: feeding, sleep, diaper, bath, play
- shopping: buying items (diapers, groceries, etc.)
- housework: cleaning, laundry, dishes
- healthcare: appointments, checkups, medicine
- self_care: exercise, meditation, journaling
- work: job-related tasks
- other: if none of the above fits

Task: "{task_title}"
Which category does this task belong to? Only reply with the category name.
"""

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
        )
        category = response.choices[0].message.content.strip().lower()
        return category if category in CATEGORIES else "other"

    except Exception as e:
        print(f"Error detecting task category: {e}")
        return None

#def call_gpt_json(prompt: str) -> Dict:
#    print("🧠 模拟调用 GPT Prompt:\n", prompt)
#    return {
#        "tasks": [
#            {
#                "title": "去超市购物",
#                "due_date": "2025-04-16T10:00",
#                "priority": "medium",
#                "category": "home",
#                "status": "pending",
#                "sub_tasks": [
#                    {
#                        "title": "列购物清单",
#                        "due_date": "2025-04-16T08:30",
#                        "status": "pending"
#                    },
#                    {
#                        "title": "检查冰箱存货",
#                        "due_date": "2025-04-16T08:45",
#                        "status": "pending"
#                    }
#                ],
#                "reminder": {
#                    "time": "2025-04-16T09:30",
#                    "message": "记得出发前带上购物袋"
#                }
#            }
#        ]
#      }
