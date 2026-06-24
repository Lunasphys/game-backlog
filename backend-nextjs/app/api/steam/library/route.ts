import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { env } from '@/lib/config'

const STEAM_API = 'https://api.steampowered.com'

export async function GET(req: NextRequest) {
    try {
        const authUser = await requireAuth(req)

        if (!env.STEAM_API_KEY) {
            return NextResponse.json({ error: 'Steam API key not configured' }, { status: 503 })
        }

        const user = await db.user.findUnique({ where: { id: authUser.id } })
        if (!user?.steamId) {
            return NextResponse.json({ error: 'Steam ID not set' }, { status: 400 })
        }

        const res = await fetch(
            `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${env.STEAM_API_KEY}&steamid=${user.steamId}&include_appinfo=1&include_played_free_games=1&format=json`
        )
        const data = await res.json()
        const games = data.response?.games ?? []

        const library = games.map((g: { appid: number; name: string; playtime_forever: number; rtime_last_played: number }) => ({
            steamAppId: g.appid,
            title: g.name,
            coverUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
            playtimeMinutes: g.playtime_forever,
            lastPlayed: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : null,
        }))

        library.sort((a: { playtimeMinutes: number }, b: { playtimeMinutes: number }) => b.playtimeMinutes - a.playtimeMinutes)

        return NextResponse.json({ count: library.length, games: library })
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
