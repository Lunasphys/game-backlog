import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth(req)
        const where = { tenantId: user.tenantId }

        const games = await db.game.findMany({ where })

        const totalGames = games.length
        const totalPlaytime = games.reduce((sum, g) => sum + (g.playtimeMinutes ?? 0), 0)
        const completedCount = games.filter((g) => g.status === 'completed').length
        const completionRate = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0
        const gamesWithPlaytime = games.filter((g) => g.playtimeMinutes && g.playtimeMinutes > 0)
        const avgPlaytime = gamesWithPlaytime.length > 0
            ? Math.round(totalPlaytime / gamesWithPlaytime.length)
            : 0

        const genreMap = new Map<string, { count: number; playtime: number }>()
        for (const g of games) {
            const genre = g.genre || 'Non classé'
            const entry = genreMap.get(genre) || { count: 0, playtime: 0 }
            entry.count++
            entry.playtime += g.playtimeMinutes ?? 0
            genreMap.set(genre, entry)
        }
        const byGenre = [...genreMap.entries()]
            .map(([genre, data]) => ({ genre, ...data }))
            .sort((a, b) => b.playtime - a.playtime)

        const statusMap = new Map<string, number>()
        for (const g of games) {
            statusMap.set(g.status, (statusMap.get(g.status) || 0) + 1)
        }
        const byStatus = [...statusMap.entries()]
            .map(([status, count]) => ({ status, count }))

        const platformMap = new Map<string, number>()
        for (const g of games) {
            platformMap.set(g.platform, (platformMap.get(g.platform) || 0) + 1)
        }
        const byPlatform = [...platformMap.entries()]
            .map(([platform, count]) => ({ platform, count }))
            .sort((a, b) => b.count - a.count)

        const topGames = [...games]
            .filter((g) => g.playtimeMinutes && g.playtimeMinutes > 0)
            .sort((a, b) => (b.playtimeMinutes ?? 0) - (a.playtimeMinutes ?? 0))
            .slice(0, 5)
            .map((g) => ({
                title: g.title,
                playtime: g.playtimeMinutes ?? 0,
                coverUrl: g.coverUrl,
                status: g.status,
            }))

        const recentGames = [...games]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 10)
            .map((g) => ({
                title: g.title,
                status: g.status,
                updatedAt: g.updatedAt.toISOString(),
            }))

        return NextResponse.json({
            totalGames,
            totalPlaytime,
            completionRate,
            avgPlaytime,
            completedCount,
            byGenre,
            byStatus,
            byPlatform,
            topGames,
            recentGames,
        })
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
