import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Mail, Phone, Building } from 'lucide-react'

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      students: { include: { department: true } }
    }
  })

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      {/* Avatar + Name */}
      <div className="flex flex-col items-center pt-3 pb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--pms-brown)', boxShadow: '0 0 0 4px var(--pms-border)' }}>
          <span className="text-3xl font-bold" style={{ color: 'var(--pms-bg)' }}>
            {session.user.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--pms-text)' }}>{session.user.name}</h1>
        <span className="mt-1.5 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--pms-border)', color: 'var(--pms-text-sec)' }}>
          {parent?.relation || 'Parent'}
        </span>
      </div>

      {/* Contact Section */}
      <div className="space-y-3">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--pms-text-muted)' }}>Contact</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--pms-border)' }}>
                <Mail className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Email</p>
                <p className="text-sm" style={{ color: 'var(--pms-text)' }}>{session.user.email}</p>
              </div>
            </div>
            {parent?.user?.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--pms-border)' }}>
                  <Phone className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Phone</p>
                  <p className="text-sm" style={{ color: 'var(--pms-text)' }}>{parent.user.phone}</p>
                </div>
              </div>
            )}
            {parent?.occupation && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--pms-border)' }}>
                  <Building className="w-4 h-4" style={{ color: 'var(--pms-brown)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Occupation</p>
                  <p className="text-sm" style={{ color: 'var(--pms-text)' }}>{parent.occupation}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student Cards */}
        {parent?.students.map(student => (
          <div key={student.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--pms-text-muted)' }}>Student</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Name</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{student.name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Register No.</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{student.registerNumber}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Department</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{student.department.name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Year / Semester</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>Year {student.year} / Sem {student.semester}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Section</p>
                <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{student.section}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Consent Status</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block" style={{ backgroundColor: 'var(--pms-border)', color: 'var(--pms-text-sec)' }}>
                  {student.consentStatus}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
