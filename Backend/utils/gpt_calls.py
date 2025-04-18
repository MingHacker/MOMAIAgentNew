from openai import OpenAI
import os
import json
from typing import Any, Dict
from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def gpt_call(prompt: str, system_prompt: str = "You are a helpful AI assistant.") -> str:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content

def gpt_vision_call(prompt: str, image_base64: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[
            {"role": "system", "content": "You are a baby image analysis assistant."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }
        ],
        max_tokens=1000
    )
    return response.choices[0].message.content

def call_gpt_json(prompt: str) -> Dict[str, Any]:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个结构化输出助手，只返回 JSON。" },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )

    content = response.choices[0].message.content

    try:
        # 自动处理带 ```json ``` 包裹的格式
        content = content.strip("```json").strip("```").strip()
        parsed = json.loads(content)
        return parsed

    except Exception as e:
        raise ValueError(f"GPT 返回 JSON 解析失败: {str(e)}\n原始内容: {content}")