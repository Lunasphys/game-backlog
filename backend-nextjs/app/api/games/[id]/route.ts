import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth(req)
        const body = await req.json()

        const game = await db.game.update({
            where: {
                id: params.id,
                tenantId: user.tenantId,
            },
            data: body
        })

        return NextResponse.json(game)
    } catch (error) {
        return NextResponse.json(
            { error: 'Not found or unauthorized' },
            { status: 404 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth(req)

        await db.game.delete({
            where: {
                id: params.id,
                tenantId: user.tenantId,
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return NextResponse.json(
            { error: 'Not found or unauthorized' },
            { status: 404 }
        )
    }
}