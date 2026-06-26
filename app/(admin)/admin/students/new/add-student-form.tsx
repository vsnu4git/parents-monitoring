'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  departments: { id: string; code: string; name: string }[]
  existingParents: { id: string; name: string; email: string; studentNames: string[] }[]
}

export function AddStudentForm({ departments, existingParents }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parentMode, setParentMode] = useState<'link' | 'new' | 'none'>('new')

  // Student fields
  const [name, setName] = useState('')
  const [registerNumber, setRegisterNumber] = useState('')
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '')
  const [year, setYear] = useState(1)
  const [semester, setSemester] = useState(1)
  const [section, setSection] = useState('A')
  const [dob, setDob] = useState('')

  // Parent fields (link)
  const [parentId, setParentId] = useState('')

  // Parent fields (new)
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentPassword, setParentPassword] = useState('')
  const [parentRelation, setParentRelation] = useState('Father')
  const [parentOccupation, setParentOccupation] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body: any = {
      name, registerNumber, departmentId,
      year, semester, section,
      dateOfBirth: dob || undefined,
    }

    if (parentMode === 'link' && parentId) {
      body.parentId = parentId
    } else if (parentMode === 'new') {
      body.parentName = parentName
      body.parentEmail = parentEmail
      body.parentPhone = parentPhone || undefined
      body.parentPassword = parentPassword
      body.parentRelation = parentRelation
      body.parentOccupation = parentOccupation || undefined
    }

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create student')
      } else {
        router.push('/admin/students')
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: '#18181B',
    border: '1px solid #27272A',
    color: '#FAFAFA',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  }

  const labelStyle = { color: '#A1A1AA', fontSize: '12px', fontWeight: 600 as const, marginBottom: '4px', display: 'block' as const }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#1C1517', border: '1px solid #3F1B1B', color: '#EF4444', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Student Details */}
      <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FAFAFA' }}>Student Details</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Student name" required />
            </div>
            <div>
              <label style={labelStyle}>Register Number *</label>
              <input style={inputStyle} value={registerNumber} onChange={e => setRegisterNumber(e.target.value)} placeholder="CS21001" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Department *</label>
              <select style={inputStyle} value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                {departments.map(d => <option key={d.id} value={d.id} style={{ backgroundColor: '#18181B' }}>{d.code} - {d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Year *</label>
              <select style={inputStyle} value={year} onChange={e => setYear(Number(e.target.value))}>
                {[1,2,3,4].map(y => <option key={y} value={y} style={{ backgroundColor: '#18181B' }}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Semester *</label>
              <select style={inputStyle} value={semester} onChange={e => setSemester(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} style={{ backgroundColor: '#18181B' }}>Sem {s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Section *</label>
              <input style={inputStyle} value={section} onChange={e => setSection(e.target.value)} placeholder="A" required />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" style={{...inputStyle, colorScheme: 'dark'}} value={dob} onChange={e => setDob(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Parent Account */}
      <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FAFAFA' }}>Parent Account</p>

        {/* Toggle buttons */}
        <div className="flex gap-2 mb-4">
          {(['new', 'link', 'none'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setParentMode(mode)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: parentMode === mode ? '#FAFAFA' : '#09090B',
                color: parentMode === mode ? '#09090B' : '#71717A',
                border: `1px solid ${parentMode === mode ? '#FAFAFA' : '#27272A'}`,
              }}
            >
              {mode === 'new' ? 'Create New' : mode === 'link' ? 'Link Existing' : 'Skip'}
            </button>
          ))}
        </div>

        {parentMode === 'new' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Parent Name *</label>
                <input style={inputStyle} value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Parent full name" required={parentMode === 'new'} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@email.com" required={parentMode === 'new'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <input type="password" style={inputStyle} value={parentPassword} onChange={e => setParentPassword(e.target.value)} placeholder="Min 6 chars" required={parentMode === 'new'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Relation</label>
                <select style={inputStyle} value={parentRelation} onChange={e => setParentRelation(e.target.value)}>
                  {['Father', 'Mother', 'Guardian', 'Other'].map(r => <option key={r} value={r} style={{ backgroundColor: '#18181B' }}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Occupation</label>
                <input style={inputStyle} value={parentOccupation} onChange={e => setParentOccupation(e.target.value)} placeholder="e.g. Engineer" />
              </div>
            </div>
          </div>
        )}

        {parentMode === 'link' && (
          <div>
            <label style={labelStyle}>Select Parent</label>
            <select style={inputStyle} value={parentId} onChange={e => setParentId(e.target.value)}>
              <option value="" style={{ backgroundColor: '#18181B' }}>-- Select a parent --</option>
              {existingParents.map(p => (
                <option key={p.id} value={p.id} style={{ backgroundColor: '#18181B' }}>
                  {p.name} ({p.email}) {p.studentNames.length > 0 ? `- ${p.studentNames.join(', ')}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {parentMode === 'none' && (
          <p className="text-xs" style={{ color: '#52525B' }}>Student will be created without a parent link. You can add one later.</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
        style={{
          backgroundColor: loading ? '#3F3F46' : '#FAFAFA',
          color: '#09090B',
        }}
      >
        {loading ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  )
}
