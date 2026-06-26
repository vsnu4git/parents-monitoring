import { useState, useCallback } from 'react'
import type { Student } from '../types/api'

export function useStudentSelector(students: Student[]) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  )

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0]

  const selectStudent = useCallback((id: string) => {
    setSelectedStudentId(id)
  }, [])

  return { selectedStudent, selectedStudentId, selectStudent }
}
