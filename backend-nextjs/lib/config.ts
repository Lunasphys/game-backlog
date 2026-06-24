import { z } from 'zod'

const envSchema = z.object({
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    STEAM_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
