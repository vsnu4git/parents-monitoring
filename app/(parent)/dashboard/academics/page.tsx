import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedStudentId, resolveSelectedStudent } from '@/lib/student-selection'
import { redirect } from 'next/navigation'
import AcademicsClient from './academics-client'

export default async function AcademicsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true }
    })
    if (!parent || parent.students.length === 0) return <div className="p-8 text-center text-[var(--pms-text-muted)]">No student linked.</div>

    const selectedId = await getSelectedStudentId()
    const student = resolveSelectedStudent(parent.students, selectedId)
    const marks = await prisma.markRecord.findMany({
      where: { studentId: student.id },
      include: { subject: true },
      orderBy: { publishedAt: 'desc' }
    })

    // Group by subject
    const bySubject: Record<string, { name: string; code: string; assessments: typeof marks }> = {}
    for (const m of marks) {
      if (!bySubject[m.subjectId]) bySubject[m.subjectId] = { name: m.subject.name, code: m.subject.code, assessments: [] }
      bySubject[m.subjectId].assessments.push(m)
    }

    const subjectResults = Object.values(bySubject).map(s => {
      const avg = s.assessments.length > 0
        ? s.assessments.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / s.assessments.length
        : 0
      return {
        name: s.name,
        code: s.code,
        avg: Math.round(avg),
        assessments: s.assessments.map(a => ({
          id: a.id,
          type: a.assessmentType,
          score: a.score,
          maxScore: a.maxScore,
          pct: Math.round((a.score / a.maxScore) * 100)
        }))
      }
    })

    const overallAvg = subjectResults.length > 0
      ? Math.round(subjectResults.reduce((sum, s) => sum + s.avg, 0) / subjectResults.length)
      : 0

    const topScore = marks.length > 0
      ? Math.round(Math.max(...marks.map(m => (m.score / m.maxScore) * 100)))
      : 0

    return (
      <AcademicsClient
        studentName={student.name}
        registerNumber={student.registerNumber}
        subjectResults={subjectResults}
        overallAvg={overallAvg}
        totalSubjects={subjectResults.length}
        totalAssessments={marks.length}
        topScore={topScore}
      />
    )
  } catch (error) {
    return <div className="p-8 text-center text-[var(--pms-text-muted)]">Error loading academics. Please check database connection.</div>
  }
}
