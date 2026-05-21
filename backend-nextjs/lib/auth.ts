import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { env } from './config'

export type AuthUser = {
    id: string
    email: string
    tenantId: string
}

export function signToken(user: AuthUser): string {
    return jwt.sign(user, env.JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthUser {
    return jwt.verify(token, env.JWT_SECRET) as AuthUser
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Unauthorized')
    }

    const token = authHeader.slice(7)

    try {
        return verifyToken(token)
    } catch {
        throw new Error('Invalid token')
    }
}