from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError
from dotenv import load_dotenv
import os

load_dotenv()

class ElasticsearchClient:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ElasticsearchClient, cls).__new__(cls)
            cls._instance._initialize_client()
        return cls._instance
    
    def _initialize_client(self):
        self.url = os.getenv("ELASTICSEARCH_URL")
        if not self.url:
            raise ValueError("ELASTICSEARCH_URL not found in environment variables")
            
        try:
            self.client = Elasticsearch(
                self.url,
                request_timeout=30,
                max_retries=3,
                retry_on_timeout=True
            )
            # Verify connection
            if not self.client.ping():
                raise ConnectionError("Failed to connect to Elasticsearch")
        except Exception as e:
            raise ConnectionError(f"Elasticsearch connection failed: {str(e)}")
    
    def get_client(self):
        """Get the Elasticsearch client instance"""
        return self.client
    
    def is_healthy(self):
        """Check if Elasticsearch cluster is healthy"""
        try:
            return self.client.ping()
        except:
            return False

# Singleton instance
elastic_client = ElasticsearchClient()
