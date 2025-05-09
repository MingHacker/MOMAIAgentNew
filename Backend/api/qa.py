from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from core.auth import get_current_user
from core.supabase import get_supabase
from supabase import Client
import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import uuid

load_dotenv()
supabase = get_supabase()

router = APIRouter()

security = HTTPBearer()


# 初始化 OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
class QaRequest(BaseModel):
    question: str
    image_base64: Optional[str] = None

class QaResponse(BaseModel):
    answer: str
    created_at: datetime
    image_url: Optional[str] = None

@router.post("/api/qa/ask", response_model=QaResponse)
async def ask_question(
    request: QaRequest,
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(lambda: supabase)
):
    try:
        image_url = None
        messages = []

        # 如果有图片，先上传到 Supabase Storage
        if request.image_base64 and request.image_base64.strip():
            try:
                # 生成唯一的文件名
                file_name = f"{user_id}/{uuid.uuid4()}.jpg"
                
                # 解码 base64 图片数据
                try:
                    image_data = base64.b64decode(request.image_base64)
                except Exception as e:
                    print(f"Base64 decode error: {str(e)}")
                    raise HTTPException(status_code=400, detail="Invalid image data")
                
                # 上传到 Supabase Storage
                try:
                    storage_response = supabase.storage.from_('qa_images').upload(
                        file_name,
                        image_data,
                        {"content-type": "image/jpeg"}
                    )
                    
                    # 获取公开访问的 URL
                    image_url = supabase.storage.from_('qa_images').get_public_url(file_name)
                    
                    # 添加到 OpenAI 消息
                    messages.append({
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    })
                except Exception as e:
                    print(f"Storage upload error: {str(e)}")
                    raise HTTPException(status_code=500, detail="Failed to upload image")
            except Exception as e:
                print(f"Image processing error: {str(e)}")
                # 如果图片处理失败，继续处理文本问题
                pass

        # 添加问题文本
        messages.append({"type": "text", "text": request.question})

        # 调用 OpenAI API
        try:
            response = client.chat.completions.create(
                model="gpt-4-vision-preview" if image_url else "gpt-4",
                messages=[{
                    "role": "user",
                    "content": messages
                }],
                max_tokens=1000
            )
            answer = response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(e)}")

        created_at = datetime.now()

        # 存储到数据库
        qa_history = {
            "user_id": user_id,
            "question": request.question,
            "answer": answer,
            "has_image": bool(image_url),
            "image_url": image_url,
            "created_at": created_at.isoformat()
        }
        
        try:
            result = supabase.client.table("qa_history").insert(qa_history).execute()
        except Exception as e:
            print(f"Database Error: {str(e)}")
            print("qa_history payload:", qa_history)
            # 即使数据库存储失败，也返回答案给用户
            pass
        
        return QaResponse(
            answer=answer,
            created_at=created_at,
            image_url=image_url
        )

    except Exception as e:
        print(f"General Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/qa/history")
async def get_qa_history(
    user_id: str = Depends(get_current_user),
    supabase: Client = Depends(lambda: supabase)
):
    try:
        result = supabase.client.table("qa_history").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
