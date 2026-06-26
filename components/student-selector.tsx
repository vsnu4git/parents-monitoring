'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, GraduationCap, Check } from 'lucide-react'

interface Student {
  id: string
  name: string
  registerNumber: string
  year: number
  semester: number
  section: string
  department: { code: string; name: string }
}

interface StudentSelectorProps {
  students: Student[]
  selectedId: string
  onSelect: (studentId: string) => void
}

export function StudentSelector({ students, selectedId, onSelect }: StudentSelectorProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      const handler = () => setOpen(false)
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [open])

  if (students.length <= 1) return null

  const selected = students.find(s => s.id === selectedId) || students[0]

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-150 active:scale-[0.98]"
        style={{
          backgroundColor: 'var(--pms-card)',
          border: '1px solid var(--pms-border)',
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--pms-border)' }}
        >
          <GraduationCap className="w-3.5 h-3.5" style={{ color: 'var(--pms-text-sec)' }} />
        </div>
        <div className="text-left min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: 'var(--pms-text)' }}>
            {selected.name}
          </p>
          <p className="text-[9px]" style={{ color: 'var(--pms-text-muted)' }}>
            {selected.department.code} · Year {selected.year}
          </p>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150"
          style={{
            color: 'var(--pms-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            backgroundColor: 'var(--pms-card)',
            border: '1px solid var(--pms-border)',
            minWidth: 220,
          }}
        >
          <p className="text-[9px] font-bold uppercase tracking-wider px-3 pt-2.5 pb-1.5" style={{ color: 'var(--pms-text-muted)' }}>
            Select Child
          </p>
          {students.map(student => {
            const isSelected = student.id === selectedId
            return (
              <button
                key={student.id}
                onClick={() => {
                  onSelect(student.id)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--pms-text)' : 'transparent',
                  borderBottom: '1px solid var(--pms-border)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'var(--pms-bg)' : 'var(--pms-border)',
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: isSelected ? 'var(--pms-text)' : 'var(--pms-text-muted)' }}>
                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: isSelected ? 'var(--pms-bg)' : 'var(--pms-text)' }}>
                    {student.name}
                  </p>
                  <p className="text-[9px]" style={{ color: isSelected ? 'var(--pms-border)' : 'var(--pms-text-muted)' }}>
                    {student.registerNumber} · {student.department.code} · Yr {student.year} Sem {student.semester}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pms-bg)' }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
