# core/supabase.py
import os
from fastapi import Depends
from supabase import create_client, Client

_SUPABASE_URL: str = os.getenv("SUPABASE_URL")
_SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")

# ---- create a singleton client ----------------------------------------
_supabase: Client = create_client(_SUPABASE_URL, _SUPABASE_KEY)

def get_supabase() -> Client:
    """
    FastAPI dependency – returns the singleton Supabase Client.
    Usage: db: Client = Depends(get_supabase)
    """
    return _supabase
