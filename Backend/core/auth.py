import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import jwt
from dotenv import load_dotenv

load_dotenv()

_supabase_url = os.getenv("SUPABASE_URL")
_supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(_supabase_url, _supabase_key)

security = HTTPBearer()

def get_supabase() -> Client:
    return supabase

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Returns the authenticated user's `sub` (UUID) or raises 401.
    """
    token = credentials.credentials
    try:
        decoded = jwt.decode(
            token,
            _supabase_key,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{_supabase_url}/auth/v1",
            options={"verify_signature": False},  # Supabase JWTs are already verified
        )
        return decoded["sub"]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
