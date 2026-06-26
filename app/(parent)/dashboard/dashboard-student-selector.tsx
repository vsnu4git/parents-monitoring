'use client'

import { useRouter } from 'next/navigation'
import { StudentSelector } from '@/components/student-selector'

interface Student {
  id: string
  name: string
  registerNumber: string
  year: number
  semester: number
  section: string
  department: { code: string; name: string }
}

export function DashboardStudentSelector({
  students,
  selectedId,
}: {
  students: Student[]
  selectedId: string
}) {
  const router = useRouter()

  const handleSelect = async (studentId: string) => {
    await fetch('/api/select-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    router.refresh()
  }

  return (
    <StudentSelector
      students={students}
      selectedId={selectedId}
      onSelect={handleSelect}
    />
  )
}
