import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redis: Redis | null = null

function getRedis(): Redis | null {
    if (!process.env.REDIS_URL) return null
    if (!redis) {
        redis = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
        redis.on('error', () => {})
    }
    return redis
}

export function publishEvent(type: string, data: Record<string, unknown>) {
    const client = getRedis()
    if (!client) return
    client.publish('game-events', JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
    })).catch(() => {})
}
