import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { publishEvent } from '@/lib/redis'

const gameStatuses = ['wishlist', 'backlog', 'playing', 'completed', 'abandoned'] as const

const updateGameSchema = z.object({
    title: z.string().min(1).max(200),
    platform: z.string(),
    status: z.enum(gameStatuses),
    priority: z.number().min(1).max(5),
    genre: z.string().optional(),
    coverUrl: z.url().optional(),
    notes: z.string().optional(),
    rating: z.number().min(1).max(10).optional(),
}).partial()

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth(req)
        const body = await req.json()
        const data = updateGameSchema.parse(body)
        const resolvedParams = await params

        const game = await db.game.update({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId,
            },
            data
        })

        publishEvent('game:updated', { title: game.title, status: game.status })
        return NextResponse.json(game)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Not found or unauthorized' },
            { status: 404 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth(req)
        const resolvedParams = await params

        const toDelete = await db.game.findUnique({ where: { id: resolvedParams.id } })
        await db.game.delete({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId,
            }
        })

        publishEvent('game:deleted', { title: toDelete?.title ?? 'Unknown' })
        return new NextResponse(null, { status: 204 })
    } catch {
        return NextResponse.json(
            { error: 'Not found or unauthorized' },
            { status: 404 }
        )
    }
}
