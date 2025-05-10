import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
})

const redis = new Redis(process.env.REDIS_URL)
const redisStream = 'events_changes'

async function start() {
  const channel = supabase.channel('public:events')

  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events',
    }, async (payload) => {
      const { eventType, new: newRow } = payload
      const message = {
        operation: eventType,
        data: newRow,
        timestamp: new Date().toISOString(),
      }

      await redis.xadd(redisStream, '*', 'message', JSON.stringify(message))
      console.log(`📤 ${eventType} → Redis stream:`, newRow.id)
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to Supabase Realtime')
      }
    })
}

start().catch(console.error)
