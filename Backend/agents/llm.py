import json
import re
from typing import Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

CATEGORIES = ["Health", "Family", "Baby", "Other"]

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_gpt_category(content: str) -> str:
    try:
        # 优先用正则提取 JSON 代码块
        match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            # 回退方式：直接找 { 开始
            json_start = content.find("{")
            if json_start == -1:
                print("❌ 未找到 JSON 内容")
                return ""
            json_str = content[json_start:]

        # 尝试解析 JSON
        try:
            result = json.loads(json_str)
            if "category" not in result:
                print("❌ 返回结果缺少 category 字段")
                return ""
            return result["category"]
        except json.JSONDecodeError as e:
            print("❌ JSON 解析失败:", str(e))
            return ""

    except Exception as e:
        print("❌ GPT 调用失败:", str(e))
        return ""

def parse_gpt_json(content: str):
    try:
        # 优先用正则提取 JSON 代码块
        match = re.search(r"```json\n(.*?)\n```", content, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            # 回退方式：直接找 { 开始
            json_start = content.find("{")
            if json_start == -1:
                print("❌ 未找到 JSON 内容")
                return {"tasks": []}
            json_str = content[json_start:]

        # 尝试解析 JSON
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
            max_tokens=800
            #print("📬 GPT 回复内容:", response)
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
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "你是一个善于将任务结构化的生活助理，只返回 JSON 格式的任务列表"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        print("📬 GPT 回复内容:", response)
        content = response.choices[0].message.content

        if isinstance(content, str):
            return parse_gpt_json(content)  # content 是字符串，解析成 dict
        elif isinstance(content, dict):
            return content  # content 已经是 dict，不需要再解析
        else:
            print("⚠️ GPT 回复格式异常")
            return {"tasks": []}
        
    except Exception as e:
        print("❌ GPT 调用失败:", str(e))
        return {"tasks": []}

    #     json_start = content.find("{")
    #     if json_start == -1:
    #         print("❌ 未找到 JSON 内容")
    #         return {"tasks": []}
        
    #     json_str = content[json_start:]
    #     try:
    #         result = json.loads(json_str)
    #         if "tasks" not in result:
    #             print("❌ 返回结果缺少 tasks 字段")
    #             return {"tasks": []}
    #         return result
    #     except json.JSONDecodeError as e:
    #         print("❌ JSON 解析失败:", str(e))
    #         return {"tasks": []}

    # except Exception as e:
    #     print("❌ GPT 调用失败:", str(e))
    #     return {"tasks": []}





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
- Baby: tasks related to baby care, such as feeding, sleeping, diaper changes, baths, or playtime.
- Health: tasks related to healthcare, self-care, doctor appointments, exercise, or emotional well-being.
- Family: tasks related to family activities, outings, celebrations, or managing family needs.
- Other: any tasks that do not fit into the above categories.


Task: "{task_title}"
Which category does this task belong to? Only reply with the category name.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "你是一个善于将任务结构化的生活助理，只返回 JSON 格式的任务列表"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        if isinstance(content, str):
            category = parse_gpt_category(content)  # content 是字符串，解析成 dict
        elif isinstance(content, dict):
            category = content  # content 已经是 dict，不需要再解析
        else:
            print("⚠️ GPT 回复格式异常")
            category =  "Other"
        return category if category in CATEGORIES else "Other"

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
