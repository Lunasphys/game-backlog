import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        // Check authentication and get current user
        const user = await requireAuth(req)

        // Run all aggregations in parallel for performance
        const [byStatus, byPlatform, byGenre, aggregate] = await Promise.all([

            // Count games grouped by status
            db.game.groupBy({
                by: ['status'],
                where: { userId: user.id, tenantId: user.tenantId },
                _count: { status: true },
            }),

            // Count games grouped by platform
            db.game.groupBy({
                by: ['platform'],
                where: { userId: user.id, tenantId: user.tenantId },
                _count: { platform: true },
            }),

            // Count games grouped by genre (ignore null values)
            db.game.groupBy({
                by: ['genre'],
                where: {
                    userId: user.id,
                    tenantId: user.tenantId,
                    genre: { not: null },
                },
                _count: { genre: true },
            }),

            // Total count + average priority
            db.game.aggregate({
                where: { userId: user.id, tenantId: user.tenantId },
                _count: { id: true },
                _avg: { priority: true },
            }),
        ])

        return NextResponse.json({
            total: aggregate._count.id,
            averagePriority: aggregate._avg.priority,
            byStatus: byStatus.map((s) => ({
                status: s.status,
                count: s._count.status,
            })),
            byPlatform: byPlatform.map((p) => ({
                platform: p.platform,
                count: p._count.platform,
            })),
            byGenre: byGenre.map((g) => ({
                genre: g.genre,
                count: g._count.genre,
            })),
        })
    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }
}