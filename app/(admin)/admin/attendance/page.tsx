import { prisma } from '@/lib/prisma'

export default async function AdminAttendancePage() {
  try {
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { department: true, attendanceRecords: true },
      orderBy: { name: 'asc' },
    })

    const data = students.map(s => {
      const total = s.attendanceRecords.length
      const present = s.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'OD').length
      const pct = total > 0 ? Math.round((present / total) * 100) : 0
      return { ...s, pct, total, present }
    })

    const low = data.filter(d => d.pct < 75)
    const warning = data.filter(d => d.pct >= 75 && d.pct < 80)
    const good = data.filter(d => d.pct >= 80)

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#FAFAFA' }}>Attendance Overview</h1>
        <p className="text-sm mb-6" style={{ color: '#52525B' }}>{students.length} active students</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <p className="text-3xl font-black" style={{ color: '#EF4444' }}>{low.length}</p>
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>Below 75% (Critical)</p>
          </div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <p className="text-3xl font-black" style={{ color: '#FB923C' }}>{warning.length}</p>
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>75-80% (Warning)</p>
          </div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
            <p className="text-3xl font-black" style={{ color: '#4ADE80' }}>{good.length}</p>
            <p className="text-xs mt-1" style={{ color: '#71717A' }}>Above 80% (Good)</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}>
          {data.sort((a, b) => a.pct - b.pct).map((s, i) => {
            const color = s.pct < 75 ? '#EF4444' : s.pct < 80 ? '#FB923C' : '#4ADE80'
            return (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < data.length - 1 ? '1px solid #27272A' : 'none' }}
              >
                <span className="text-xs font-mono w-6 text-center" style={{ color: '#52525B' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#FAFAFA' }}>{s.name}</p>
                  <p className="text-[10px]" style={{ color: '#71717A' }}>
                    {s.registerNumber} &middot; {s.department.code} &middot; Year {s.year}
                  </p>
                </div>
                <div className="w-32 flex items-center gap-2 flex-shrink-0">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#27272A' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-sm font-bold w-10 text-right" style={{ color }}>{s.pct}%</span>
                </div>
                <p className="text-[10px] w-20 text-right flex-shrink-0" style={{ color: '#52525B' }}>
                  {s.present}/{s.total}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#09090B' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>Attendance Overview</h1>
        <p className="mt-4" style={{ color: '#71717A' }}>Error loading attendance data.</p>
      </div>
    )
  }
}
