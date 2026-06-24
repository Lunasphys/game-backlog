import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = registerSchema.parse(body)

        const existing = await db.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json(
                { error: 'Email already in use' },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const tenantId = randomUUID()

        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                tenantId,
            }
        })

        const token = signToken({
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
        })

        return NextResponse.json({
            token,
            user: { id: user.id, email: user.email }
        }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Register error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
