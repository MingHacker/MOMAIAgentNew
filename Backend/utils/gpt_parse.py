import re
import json
from typing import Union


def parse_gpt_response(response_text: str) -> Union[dict, None]:
    """
    从 GPT 返回的文本中提取 JSON 数据块。
    默认匹配第一个 `{...}` 结构，并尝试解析成字典。
    返回解析后的字典，失败时返回 None。
    """
    try:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            return json.loads(json_str)
    except Exception as e:
        print(f"[parse_gpt_response] 解析失败: {e}")
    
    return None
