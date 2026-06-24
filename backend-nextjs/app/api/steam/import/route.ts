import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { env } from '@/lib/config'

const STEAM_API = 'https://api.steampowered.com'

export async function POST(req: NextRequest) {
    try {
        const authUser = await requireAuth(req)

        if (!env.STEAM_API_KEY) {
            return NextResponse.json({ error: 'Steam API key not configured' }, { status: 503 })
        }

        const user = await db.user.findUnique({ where: { id: authUser.id } })
        if (!user?.steamId) {
            return NextResponse.json({ error: 'Steam ID not set' }, { status: 400 })
        }

        const body = await req.json()
        const steamAppIds: number[] = body.steamAppIds

        if (!Array.isArray(steamAppIds) || steamAppIds.length === 0) {
            return NextResponse.json({ error: 'No games selected' }, { status: 400 })
        }

        const res = await fetch(
            `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${env.STEAM_API_KEY}&steamid=${user.steamId}&include_appinfo=1&include_played_free_games=1&format=json`
        )
        const data = await res.json()
        const steamGames = data.response?.games ?? []

        const selectedGames = steamGames.filter(
            (g: { appid: number }) => steamAppIds.includes(g.appid)
        )

        let imported = 0
        let skipped = 0

        for (const g of selectedGames) {
            const existing = await db.game.findFirst({
                where: { steamAppId: g.appid, userId: authUser.id },
            })

            if (existing) {
                await db.game.update({
                    where: { id: existing.id },
                    data: { playtimeMinutes: g.playtime_forever },
                })
                skipped++
                continue
            }

            const status = g.playtime_forever > 600 ? 'playing' : 'backlog'

            await db.game.create({
                data: {
                    title: g.name,
                    platform: 'PC',
                    status,
                    priority: 3,
                    steamAppId: g.appid,
                    playtimeMinutes: g.playtime_forever,
                    coverUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
                    userId: authUser.id,
                    tenantId: authUser.tenantId,
                },
            })
            imported++
        }

        return NextResponse.json({ imported, updated: skipped })
    } catch (error) {
        const isUnauthorized = error instanceof Error && error.message === 'Unauthorized'
        return NextResponse.json(
            { error: isUnauthorized ? 'Unauthorized' : 'Import failed' },
            { status: isUnauthorized ? 401 : 500 }
        )
    }
}
