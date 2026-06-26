import { cookies } from 'next/headers'

const COOKIE_KEY = 'pms-selected-student'

export async function getSelectedStudentId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_KEY)?.value || null
}

/**
 * Given a list of students and an optional cookie-stored selection,
 * returns the selected student (or the first one if no valid selection).
 */
export function resolveSelectedStudent<T extends { id: string }>(
  students: T[],
  selectedId: string | null
): T {
  if (selectedId) {
    const found = students.find(s => s.id === selectedId)
    if (found) return found
  }
  return students[0]
}
