import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getWeeklyReport } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await getWeeklyReport(auth.userId)
    if (!data) return Response.json({ error: 'Parent not found' }, { status: 404 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
