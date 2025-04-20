# core/supabase.py
import os
import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import Depends, HTTPException

load_dotenv()

logger = logging.getLogger(__name__)

class SupabaseService:
    """Centralized service for Supabase operations"""
    
    _instance: Optional['SupabaseService'] = None
    
    def __init__(self):
        self.client = self._create_client()
        
    @classmethod
    def get_instance(cls) -> 'SupabaseService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def _create_client(self) -> Client:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("Missing Supabase credentials")
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
            
        return create_client(supabase_url, supabase_key)
        
    # Common CRUD operations
    def get_by_id(self, table: str, id: str) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table(table).select("*").eq("id", id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting record from {table}: {str(e)}")
            raise HTTPException(status_code=500, detail="Database error")
            
    def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error inserting to {table}: {str(e)}")
            raise HTTPException(status_code=500, detail="Insert operation failed")
            
    def update(self, table: str, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table(table).update(data).eq("id", id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating {table} record {id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Update operation failed")
            
    def query(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            query = self.client.table(table).select("*")
            for key, value in filters.items():
                query = query.eq(key, value)
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Error querying {table}: {str(e)}")
            raise HTTPException(status_code=500, detail="Query operation failed")

# FastAPI dependency
def get_supabase() -> SupabaseService:
    return SupabaseService.get_instance()
