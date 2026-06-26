import { getStudentSession } from '@/lib/student-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BookOpen, TrendingUp, Award } from 'lucide-react'
import { format } from 'date-fns'

export default async function AcademicsPage() {
  const session = await getStudentSession()
  if (!session) redirect('/login')

  const markRecords = await prisma.markRecord.findMany({
    where: { studentId: session.studentId },
    include: { subject: true },
    orderBy: { publishedAt: 'desc' },
  })

  // Group by subject
  const subjectMap = new Map<string, {
    subjectName: string
    subjectCode: string
    records: typeof markRecords
  }>()

  for (const record of markRecords) {
    const existing = subjectMap.get(record.subjectId)
    if (existing) {
      existing.records.push(record)
    } else {
      subjectMap.set(record.subjectId, {
        subjectName: record.subject.name,
        subjectCode: record.subject.code,
        records: [record],
      })
    }
  }

  const subjects = Array.from(subjectMap.values())

  // Overall average
  const overallAvg = markRecords.length > 0
    ? Math.round(markRecords.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / markRecords.length)
    : 0

  return (
    <div className="px-5 pt-5 pb-28 space-y-4" style={{ backgroundColor: 'var(--pms-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
          Academics
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>
          Marks & Grades
        </h1>
      </div>

      {/* Overall Score Card */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--pms-text)' }}
        >
          <Award className="w-7 h-7" style={{ color: 'var(--pms-bg)' }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
            Overall Average
          </p>
          <p className="text-3xl font-bold" style={{ color: 'var(--pms-text)' }}>
            {overallAvg > 0 ? `${overallAvg}%` : 'N/A'}
          </p>
          <p className="text-xs" style={{ color: 'var(--pms-text-sec)' }}>
            {markRecords.length} assessment{markRecords.length !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Subject Cards */}
      {subjects.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--pms-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>No marks published yet.</p>
        </div>
      ) : (
        subjects.map(({ subjectName, subjectCode, records }) => {
          const subjectAvg = Math.round(
            records.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / records.length
          )
          return (
            <div
              key={subjectCode}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}
            >
              {/* Subject Header */}
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pms-border)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--pms-glow)' }}
                  >
                    <BookOpen className="w-4 h-4" style={{ color: 'var(--pms-text)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--pms-text)' }}>{subjectName}</p>
                    <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>{subjectCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: subjectAvg >= 50 ? '#22C55E' : '#EF4444' }} />
                  <span className="text-lg font-bold" style={{ color: subjectAvg >= 50 ? '#22C55E' : '#EF4444' }}>
                    {subjectAvg}%
                  </span>
                </div>
              </div>

              {/* Assessment Rows */}
              <div>
                {records.map((record, idx) => {
                  const pct = Math.round((record.score / record.maxScore) * 100)
                  return (
                    <div
                      key={record.id}
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: idx < records.length - 1 ? '1px solid var(--pms-border)' : 'none' }}
                    >
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--pms-text)' }}>
                          {record.assessmentType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--pms-text-muted)' }}>
                          {format(new Date(record.publishedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--pms-text)' }}>
                          {record.score}/{record.maxScore}
                        </p>
                        <p
                          className="text-[10px] font-semibold"
                          style={{ color: pct >= 50 ? '#22C55E' : '#EF4444' }}
                        >
                          {pct}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
