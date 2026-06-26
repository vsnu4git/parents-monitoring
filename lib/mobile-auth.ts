import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod/v4'
import type { Role } from '@prisma/client'

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret'

export interface MobileUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface MobileTokenPayload {
  userId: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export function signMobileToken(user: MobileUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role } satisfies MobileTokenPayload,
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as MobileTokenPayload
  } catch {
    return null
  }
}

export async function authenticateMobileRequest(req: Request): Promise<MobileTokenPayload | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  return verifyMobileToken(token)
}

export async function loginMobile(body: unknown) {
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return { error: 'Invalid email or password format', status: 400 }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (!user || !user.isActive) return { error: 'Invalid credentials', status: 401 }
  if (!['PARENT', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return { error: 'Invalid role for mobile access', status: 403 }
  }

  const passwordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!passwordMatch) return { error: 'Invalid credentials', status: 401 }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const mobileUser: MobileUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }

  const token = signMobileToken(mobileUser)
  return { token, user: mobileUser }
}
