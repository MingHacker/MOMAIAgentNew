# Redis Setup Guide

## Option 1: Docker (Recommended for Local Development)

1. Install Docker from https://www.docker.com/

2. Run Redis container:

```bash
docker run --name moma-redis -p 6379:6379 -d redis
```

3. Verify it's running:

```bash
docker ps
```

## Option 2: Native Installation

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### MacOS (using Homebrew)

```bash
brew install redis
brew services start redis
```

### Windows

Download from:
https://github.com/microsoftarchive/redis/releases

## Configuration

The default configuration works for development. For production:

- Set a password in redis.conf
- Enable persistence
- Configure memory limits

## Connecting to Redis

The application will automatically connect to:

- `redis://localhost:6379` (default)
- Or use `REDIS_URL` in .env to override

## Verifying the Connection

1. Connect to Redis CLI:

```bash
redis-cli
```

2. Check if keys are being created:

```bash
KEYS *
```

3. Monitor stream activity:

```bash
XREAD COUNT 10 STREAMS events_changes 0
```
