from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/api/health")
async def health_handler(request: Request):
    data = await request.json()
    return {
        "success": True,
        "agent": "health",
        "message": "健康数据收到 🩺",
        "data": data
    }
