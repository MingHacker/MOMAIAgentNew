# core/supabase.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import Depends

load_dotenv()

def get_supabase() -> Client:
    """FastAPI dependency provider for Supabase client."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
    
    return create_client(supabase_url, supabase_key)
