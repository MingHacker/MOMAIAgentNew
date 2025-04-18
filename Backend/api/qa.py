from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/api/qa")
async def qa_handler(request: Request):
    data = await request.json()
    return {
        "success": True,
        "agent": "qa",
        "message": "问答请求收到 🤖",
        "data": data
    }
