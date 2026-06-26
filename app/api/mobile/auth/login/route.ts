import { loginMobile } from '@/lib/mobile-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await loginMobile(body)

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status })
    }

    return Response.json({ token: result.token, user: result.user })
  } catch (error) {
    console.error('Mobile login error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
