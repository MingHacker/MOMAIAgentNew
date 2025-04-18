from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/api/emotion")
async def emotion_handler(request: Request):
    data = await request.json()
    return {
        "success": True,
        "agent": "emotion",
        "message": "情绪数据收到 ❤️",
        "data": data
    }
