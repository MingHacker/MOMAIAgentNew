from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import logging
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.supabase import get_supabase, SupabaseService
from core.auth import get_current_user

load_dotenv()
logger = logging.getLogger(__name__)

router = APIRouter()

security = HTTPBearer()


router = APIRouter()

# ----------------------
# Pydantic Schemas
# ----------------------
class SaveUserFeaturesRequest(BaseModel):
    userId: str
    featureIds: List[str]

# ----------------------
# Save Features for User
# ----------------------

@router.post("/api/saveUserFeatures", status_code=status.HTTP_201_CREATED)
async def save_user_features(payload: SaveUserFeaturesRequest, supabase: SupabaseService = Depends(get_supabase)):
    try:
        # 1. 删除该用户的所有已选feature
        delete_query = supabase.client.table("settings").delete().eq("mom_id", payload.userId).execute()
        logger.debug(f"Delete response: {delete_query}")

        # 2. 插入新的feature选择
        insert_data = [
            {
                "mom_id": payload.userId,
                "feature_id": feature_id
            }
            for feature_id in payload.featureIds
        ]
        
        if insert_data:  # 只在有数据时执行插入
            res = supabase.client.table("settings").insert(insert_data).execute()
            logger.debug(f"Insert response: {res}")

        return {"success": True, "message": "Features saved"}
    except Exception as e:
        logger.error(f"Error saving features: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------
# Get Features for User
# ----------------------

@router.get("/api/getUserFeatures")
async def get_user_features(user_id: str = Depends(get_current_user), supabase: SupabaseService = Depends(get_supabase)):
    try:
        # 从settings表获取用户选择的features
        res = supabase.client.table("settings").select("feature_id").eq("mom_id", user_id).execute()
        logger.debug(f"Get features response: {res}")

        if not res or not hasattr(res, 'data'):
            return {"userId": user_id, "featureIds": []}

        # 提取所有feature IDs
        feature_ids = [item["feature_id"] for item in res.data] if res.data else []
        return {"userId": user_id, "featureIds": feature_ids}
    except Exception as e:
        logger.error(f"Error getting features: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------
# Recommend Features based on age
# ----------------------
@router.get("/api/recommendFeatures")
async def recommend_features(ageInMonths: int, supabase: SupabaseService = Depends(get_supabase)):
    try:
        logger.info(f"Querying features for age: {ageInMonths} months")
        query = supabase.client.table("features").select("*").lte("age_min", ageInMonths).gte("age_max", ageInMonths)
        logger.debug(f"Query built: {query}")
        
        res = query.execute()
        logger.debug(f"Query response: {res}")

        if not res or not hasattr(res, 'data'):
            logger.error(f"Invalid response from database: {res}")
            raise HTTPException(status_code=500, detail="Invalid response from database")

        if hasattr(res, 'error') and res.error:
            logger.error(f"Database error: {res.error}")
            raise HTTPException(status_code=500, detail=f"Database error: {res.error}")

        logger.info(f"Full response data: {res.data}")
        
        recommended = [item["id"] for item in res.data] if res.data else []
        logger.info(f"Found {len(recommended)} recommended features for age {ageInMonths} months")
        return {"recommended": recommended, "debug_data": res.data if res.data else []}
    except Exception as e:
        logger.error(f"Error in recommend_features: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error recommending features: {str(e)}")
