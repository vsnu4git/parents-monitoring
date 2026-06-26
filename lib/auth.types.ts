import { Role } from '@prisma/client'

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: Role
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser
  }
  interface User {
    role: Role
  }
}
