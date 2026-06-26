import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { generateStudentQRToken } from '@/lib/data/mobile.data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const result = generateStudentQRToken(id)
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
