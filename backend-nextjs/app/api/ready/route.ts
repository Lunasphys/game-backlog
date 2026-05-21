import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        await db.$queryRaw`SELECT 1`

        return NextResponse.json({
            status: 'ready',
            postgres: 'ok'
        })
    } catch (error) {
        return NextResponse.json(
            { status: 'not ready', postgres: 'down' },
            { status: 503 }
        )
    }
}