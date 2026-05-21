import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z, ZodError } from 'zod'

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = loginSchema.parse(body)

        const user = await db.user.findUnique({ where: { email } })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const valid = await bcrypt.compare(password, user.password)

        if (!valid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
        })

        return NextResponse.json({
            token,
            user: { id: user.id, email: user.email }
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}