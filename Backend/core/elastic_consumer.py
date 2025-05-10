import os
import json
import logging
from redis import Redis
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConflictError
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class ElasticsearchConsumer:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.channel_name = "events_changes"
        self.consumer_group = "elasticsearch_consumers"
        self.consumer_name = "consumer_1"
        
        self.redis = Redis.from_url(self.redis_url)
        self.es = Elasticsearch(os.getenv("ELASTICSEARCH_URL"))
        self.logger = logging.getLogger(__name__)
        
        # Create consumer group if not exists
        try:
            self.redis.xgroup_create(self.channel_name, self.consumer_group, id="0", mkstream=True)
        except Exception as e:
            self.logger.info(f"Consumer group already exists: {e}")

    def process_messages(self):
        """Process messages from Redis stream"""
        while True:
            try:
                # Read messages from stream
                messages = self.redis.xreadgroup(
                    groupname=self.consumer_group,
                    consumername=self.consumer_name,
                    streams={self.channel_name: ">"},
                    count=10,
                    block=5000
                )
                
                if not messages:
                    continue
                    
                for stream, message_list in messages:
                    for message_id, message_data in message_list:
                        try:
                            message = json.loads(message_data[b"message"])
                            self._process_message(message)
                            # Acknowledge message
                            self.redis.xack(self.channel_name, self.consumer_group, message_id)
                        except Exception as e:
                            self.logger.error(f"Error processing message {message_id}: {e}")
                            
            except Exception as e:
                self.logger.error(f"Error reading from stream: {e}")
                raise

    def _process_message(self, message):
        """Process individual message and index to Elasticsearch"""
        operation = message["operation"]
        data = message["data"]
        doc_id = data["id"]
        
        try:
            if operation in ("INSERT", "UPDATE"):
                # Transform data for Elasticsearch
                doc = {
                    "title": data["title"],
                    "description": data["description"],
                    "event_type": data["event_type"],
                    "start_time": data["start_time"],
                    "end_time": data["end_time"],
                    "location": {
                        "lat": data["latitude"],
                        "lon": data["longitude"]
                    } if data.get("latitude") and data.get("longitude") else None,
                    "source": data["source"],
                    "external_id": data["external_id"],
                    "created_at": data["created_at"],
                    "updated_at": data["updated_at"]
                }
                
                # Index document with idempotent operation
                self.es.index(
                    index="events",
                    id=doc_id,
                    body=doc,
                    op_type="create" if operation == "INSERT" else "index"
                )
                self.logger.info(f"Indexed document {doc_id} ({operation})")
                
            elif operation == "DELETE":
                self.es.delete(index="events", id=doc_id, ignore=[404])
                self.logger.info(f"Deleted document {doc_id}")
                
        except ConflictError:
            self.logger.warning(f"Document {doc_id} already exists (skipped)")
        except Exception as e:
            self.logger.error(f"Failed to process {operation} for {doc_id}: {e}")
            raise

def start_consumer():
    consumer = ElasticsearchConsumer()
    consumer.process_messages()
