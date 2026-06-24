import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { publishEvent } from '@/lib/redis'

const gameStatuses = ['wishlist', 'backlog', 'playing', 'completed', 'abandoned'] as const

const createGameSchema = z.object({
    title: z.string().min(1).max(200),
    platform: z.string(),
    status: z.enum(gameStatuses),
    priority: z.number().min(1).max(5).default(3),
    genre: z.string().optional(),
    coverUrl: z.url().optional(),
    notes: z.string().optional(),
    rating: z.number().min(1).max(10).optional(),
    steamAppId: z.number().int().optional(),
    playtimeMinutes: z.number().int().min(0).optional(),
})

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth(req)
        const { searchParams } = new URL(req.url)

        const status = searchParams.get('status')
        const platform = searchParams.get('platform')
        const search = searchParams.get('search')

        const where: Record<string, unknown> = { tenantId: user.tenantId }
        if (status) where.status = status
        if (platform) where.platform = platform
        if (search) where.title = { contains: search, mode: 'insensitive' }

        const games = await db.game.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { updatedAt: 'desc' },
            ]
        })

        return NextResponse.json(games)
    } catch {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await requireAuth(req)
        const body = await req.json()
        const data = createGameSchema.parse(body)

        const game = await db.game.create({
            data: {
                ...data,
                userId: user.id,
                tenantId: user.tenantId,
            }
        })

        publishEvent('game:added', { title: game.title, status: game.status, platform: game.platform })
        return NextResponse.json(game, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            )
        }

        const isUnauthorized =
            error instanceof Error &&
            error.message === 'Unauthorized'

        return NextResponse.json(
            { error: isUnauthorized ? 'Unauthorized' : 'Internal server error' },
            { status: isUnauthorized ? 401 : 500 }
        )
    }
}
