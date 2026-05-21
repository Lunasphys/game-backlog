import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createGameSchema = z.object({
    title: z.string().min(1).max(200),
    platform: z.string(),
    status: z.enum(['wishlist', 'playing', 'completed', 'abandoned']),
    priority: z.number().min(1).max(5).default(3),
    genre: z.string().optional(),
    coverUrl: z.url().optional(),
    notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth(req)

        const games = await db.game.findMany({
            where: { tenantId: user.tenantId },
            orderBy: [
                { status: 'asc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json(games)
    } catch (error) {
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