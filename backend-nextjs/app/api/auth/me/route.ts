import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

export async function GET(req: NextRequest) {
    try {
        const authUser = await requireAuth(req)
        const user = await db.user.findUnique({ where: { id: authUser.id } })
        return NextResponse.json({
            id: user!.id,
            email: user!.email,
            steamId: user!.steamId,
        })
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}

const updateSchema = z.object({
    steamId: z.string().regex(/^\d{17}$/).optional(),
})

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await requireAuth(req)
        const body = await req.json()
        const data = updateSchema.parse(body)

        const user = await db.user.update({
            where: { id: authUser.id },
            data,
        })

        return NextResponse.json({
            id: user.id,
            email: user.email,
            steamId: user.steamId,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Steam ID invalide (17 chiffres)' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
