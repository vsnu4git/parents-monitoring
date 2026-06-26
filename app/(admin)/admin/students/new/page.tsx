import { prisma } from '@/lib/prisma'
import { AddStudentForm } from './add-student-form'

export default async function AddStudentPage() {
  const [departments, parents] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.parent.findMany({
      include: { user: { select: { name: true, email: true } }, students: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    }),
  ])

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#09090B' }}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>Add Student</h1>
          <p className="text-sm mt-1" style={{ color: '#71717A' }}>Register a new student and optionally link or create a parent account</p>
        </div>
        <AddStudentForm
          departments={departments.map(d => ({ id: d.id, code: d.code, name: d.name }))}
          existingParents={parents.map(p => ({
            id: p.id,
            name: p.user.name,
            email: p.user.email,
            studentNames: p.students.map(s => s.name),
          }))}
        />
      </div>
    </div>
  )
}
