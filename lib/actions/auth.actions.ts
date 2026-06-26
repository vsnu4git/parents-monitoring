'use server'

import { signIn, signOut } from '@/lib/auth'

export async function loginAction(email: string, password: string) {
  try {
    await signIn('credentials', { email, password, redirect: false })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
