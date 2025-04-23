from openai import OpenAI
from dotenv import load_dotenv
import os
from agents.mommanager.prompts import mom_health_prompt
from supabase import create_client, Client
from datetime import date
from typing import Dict, Any

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_mom_health_today(user_id: str, supabase: Client) -> Dict[str, Any]:
    """
    根据 user_id 获取妈妈今天的健康数据（从 mom_profiles 和 mom_health 表）
    返回统一结构：
    {
        "success": bool,
        "message": str,
        "data": {...} or None
    }
    """
    try:
        today_str = date.today().isoformat()
        print(f"查询用户 {user_id} 的健康数据，日期：{today_str}")

        # 1. 获取 mom_id
        mom_result = supabase.table("mom_profiles") \
            .select("id") \
            .eq("id", user_id) \
            .single() \
            .execute()

        print(f"mom_profiles 查询结果：{mom_result.data}")

        if not mom_result.data:
            return {
                "success": False,
                "message": "No mom profile found for this user",
                "data": None
            }

        mom_id = mom_result.data["id"]
        print(f"找到 mom_id: {mom_id}")

        # 2. 查询今天的健康记录
        health_result = supabase.table("mom_health") \
            .select("*") \
            .eq("mom_id", mom_id) \
            .eq("record_date", today_str) \
            .maybe_single() \
            .execute()

        print(f"mom_health 查询结果：{health_result}")
        
        # 检查 health_result 是否为 None
        if health_result is None:
            print("⚠️ mom_health 查询返回 None")
            return {
                "success": True,
                "message": "No health record found for today",
                "data": None
            }

        # 检查 health_result.data 是否存在
        if not hasattr(health_result, 'data'):
            print("⚠️ health_result 没有 data 属性")
            return {
                "success": True,
                "message": "No health record found for today",
                "data": None
            }

        print(f"mom_health 数据：{health_result.data}")

        # 3. 返回统一格式
        result = {
            "success": True,
            "message": "Health data loaded successfully",
            "data": {
                "hrv": health_result.data.get("hrv", 0),
                "sleep_hours": health_result.data.get("sleep_hours", 0),
                "steps": health_result.data.get("steps", 0),
                "mood": health_result.data.get("mood", "normal"),
                "stress_level": health_result.data.get("stress_level", "normal"),
                "calories_burned": health_result.data.get("calories_burned", 0),
                "resting_heart_rate": health_result.data.get("resting_heart_rate", 0),
                "breathing_rate": health_result.data.get("breathing_rate", 0)
            }
        }
        print(f"返回的健康数据：{result}")
        return result

    except Exception as e:
        print(f"获取健康数据时发生错误：{str(e)}")
        return {
            "success": False,
            "message": f"Error fetching health data: {str(e)}",
            "data": None
        }



def call_gpt_mom_analysis(data: dict) -> str:
    """
    用于 GPT 分析妈妈健康状况，返回 summary 文本（用于 /api/mom/summary）
    """
    # 设置默认值
    default_values = {
        "hrv": 0,
        "sleep_hours": 0,
        "steps": 0,
        "resting_heart_rate": 0,
        "breathing_rate": 0
    }
    
    # 使用默认值填充缺失字段
    for field in default_values:
        if field not in data or data[field] is None:
            data[field] = default_values[field]
            print(f"警告：字段 {field} 缺失，使用默认值 {default_values[field]}")

    # 构造 prompt
    prompt = mom_health_prompt(
        hrv=data["hrv"],
        sleep_hours=data["sleep_hours"],
        steps=data["steps"],
        resting_heart_rate=data["resting_heart_rate"],
        breathing_rate=data["breathing_rate"]
    )

    print("🧠 prompt 发送给 GPT：\n", prompt)

    # GPT 请求
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()