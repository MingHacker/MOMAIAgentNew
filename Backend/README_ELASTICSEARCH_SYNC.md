# Elasticsearch Sync Service

This service synchronizes events from Supabase to Elasticsearch using Redis as a message queue.

## Architecture

```
Supabase → [Node.js Listener] → Redis Stream → [Python Indexer] → Elasticsearch
```

## Components

1. **Producer Service** (`run_producer.js`)

   - Node.js service listening to Supabase Realtime changes
   - Uses @supabase/supabase-js and ioredis
   - Pushes changes to Redis stream

2. **Consumer Service** (`elastic_consumer.py`)
   - Python service processing messages from Redis stream
   - Uses elasticsearch-py library
   - Handles idempotent indexing operations

## Requirements

- Node.js 18+ (for producer)
- Python 3.8+ (for consumer)
- Redis server
- Elasticsearch 8.x
- Supabase with Realtime enabled

## Configuration

1. Producer (Node.js):

```bash
cd Backend/SupabaseListener
npm install
```

2. Consumer (Python):

```bash
pip install -r requirements.txt
```

Ensure these environment variables are set in `.env`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379
```

## Running the Services

1. Start the producer service:

```bash
cd Backend/SupabaseListener
node run_producer.js
```

2. Start the consumer service (in separate terminal):

```bash
python run_consumer.py
```

## Error Handling

- Failed messages are logged but not automatically retried
- Consumer maintains its position in the stream
- Elasticsearch indexing is idempotent
- Connection errors trigger reconnection attempts

## Monitoring

Check logs for:

- Successful/failed operations
- Connection status
- Processing statistics

## Deployment

For production:

- Run multiple consumer instances for load balancing
- Configure proper logging and monitoring
- Set up proper Redis and Elasticsearch clusters
