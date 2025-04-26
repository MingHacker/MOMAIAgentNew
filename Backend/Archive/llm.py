import json
from typing import Dict
from openai import OpenAI

client = OpenAI()

def call_gpt_json(prompt: str) -> dict:
    try:
        print("📨 Calling GPT...")
        print("📝 Prompt:", prompt)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a life assistant skilled at structuring tasks, only return task lists in JSON format"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        content = response.choices[0].message.content
        print("📬 GPT response:", content)

        # 提取 JSON（只保留可能是 JSON 的部分）
        json_start = content.find("{")
        if json_start == -1:
            print("❌ No JSON content found")
            return {"tasks": []}
            
        json_str = content[json_start:]
        try:
            result = json.loads(json_str)
            if "tasks" not in result:
                print("❌ Response missing 'tasks' field")
                return {"tasks": []}
            return result
        except json.JSONDecodeError as e:
            print("❌ JSON parse failed:", str(e))
            return {"tasks": []}

    except Exception as e:
        print("❌ GPT call failed:", str(e))
        return {"tasks": []}
#def call_gpt_json(prompt: str) -> Dict:
#    print("🧠 Simulating GPT call with prompt:\n", prompt)
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
