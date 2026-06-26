import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { verifyStudentQRToken } from '@/lib/data/mobile.data'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Token is required' }, { status: 400 })
    }

    const result = await verifyStudentQRToken(token)

    if (!result.valid) {
      return Response.json(result, { status: 400 })
    }

    // Create a StudentCheckIn record for the QR scan
    await prisma.studentCheckIn.create({
      data: {
        studentId: result.student.id,
        latitude: 0,
        longitude: 0,
        label: 'QR Scan',
        type: 'AUTO',
      },
    })

    return Response.json(result)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
