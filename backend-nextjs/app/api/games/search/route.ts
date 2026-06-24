import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

const STEAM_SEARCH_URL = 'https://store.steampowered.com/api/storesearch/'
const STEAM_DETAILS_URL = 'https://store.steampowered.com/api/appdetails/'

export async function GET(req: NextRequest) {
    try {
        await requireAuth(req)
        const query = req.nextUrl.searchParams.get('q')
        const appId = req.nextUrl.searchParams.get('appid')

        if (appId) {
            const res = await fetch(`${STEAM_DETAILS_URL}?appids=${appId}&l=french&cc=FR`)
            const data = await res.json()
            const app = data[appId]

            if (!app?.success) {
                return NextResponse.json({ error: 'Game not found' }, { status: 404 })
            }

            const d = app.data
            return NextResponse.json({
                steamAppId: d.steam_appid,
                title: d.name,
                description: d.short_description,
                coverUrl: d.header_image,
                price: d.price_overview?.final_formatted ?? 'Gratuit',
                releaseDate: d.release_date?.date,
                genres: d.genres?.map((g: { description: string }) => g.description) ?? [],
                platforms: Object.entries(d.platforms ?? {})
                    .filter(([, v]) => v)
                    .map(([k]) => k === 'windows' ? 'PC' : k === 'mac' ? 'Mac' : 'Linux'),
                metacritic: d.metacritic?.score,
                screenshots: d.screenshots?.slice(0, 4).map((s: { path_full: string }) => s.path_full) ?? [],
            })
        }

        if (!query || query.length < 2) {
            return NextResponse.json({ error: 'Query too short' }, { status: 400 })
        }

        const url = `${STEAM_SEARCH_URL}?term=${encodeURIComponent(query)}&l=french&cc=FR`
        const res = await fetch(url, { redirect: 'follow' })
        const text = await res.text()
        let data: { items?: { id: number; name: string; tiny_image: string; price?: { final: number; currency: string } }[] }
        try {
            data = JSON.parse(text)
        } catch {
            console.error('Steam API non-JSON response:', res.status, text.substring(0, 200))
            return NextResponse.json([])
        }

        const results = (data.items ?? []).map((item: { id: number; name: string; tiny_image: string; price?: { final: number; currency: string } }) => ({
            steamAppId: item.id,
            title: item.name,
            coverUrl: item.tiny_image,
            price: item.price ? `${(item.price.final / 100).toFixed(2)} €` : 'Gratuit',
        }))

        return NextResponse.json(results)
    } catch (error) {
        const isUnauthorized = error instanceof Error && error.message === 'Unauthorized'
        return NextResponse.json(
            { error: isUnauthorized ? 'Unauthorized' : 'Search failed' },
            { status: isUnauthorized ? 401 : 500 }
        )
    }
}
