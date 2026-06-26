'use client'

import { useState } from 'react'

type ControlData = {
  id: string
  parentId: string
  studentId: string
  spendingLimitDaily: number | null
  spendingLimitWeekly: number | null
  attendanceTarget: number | null
  curfewTime: string | null
  geofenceAlerts: boolean
  mealAlerts: boolean
  spendingAlerts: boolean
} | null

type Props = {
  data: {
    control: ControlData
    studentName: string
  }
}

export function ControlsClient({ data }: Props) {
  const { control, studentName } = data

  const [dailyLimit, setDailyLimit] = useState(control?.spendingLimitDaily?.toString() || '')
  const [weeklyLimit, setWeeklyLimit] = useState(control?.spendingLimitWeekly?.toString() || '')
  const [attendanceTarget, setAttendanceTarget] = useState(control?.attendanceTarget?.toString() || '75')
  const [curfewTime, setCurfewTime] = useState(control?.curfewTime || '21:00')
  const [geofenceAlerts, setGeofenceAlerts] = useState(control?.geofenceAlerts ?? true)
  const [mealAlerts, setMealAlerts] = useState(control?.mealAlerts ?? true)
  const [spendingAlerts, setSpendingAlerts] = useState(control?.spendingAlerts ?? true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spendingLimitDaily: dailyLimit ? parseFloat(dailyLimit) : null,
          spendingLimitWeekly: weeklyLimit ? parseFloat(weeklyLimit) : null,
          attendanceTarget: attendanceTarget ? parseInt(attendanceTarget) : null,
          curfewTime: curfewTime || null,
          geofenceAlerts,
          mealAlerts,
          spendingAlerts,
        }),
      })
      if (res.ok) {
        setMessage({ text: 'Controls saved successfully', type: 'success' })
      } else {
        setMessage({ text: 'Failed to save controls', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Parent Controls</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>Settings for {studentName}</p>
        </div>

        {/* Message */}
        {message && (
          <div className="rounded-2xl p-3 mb-4 text-sm text-center" style={{
            backgroundColor: message.type === 'success' ? '#22C55E1A' : '#EF44441A',
            border: `1px solid ${message.type === 'success' ? '#22C55E40' : '#EF444440'}`,
            color: message.type === 'success' ? '#22C55E' : '#EF4444',
          }}>{message.text}</div>
        )}

        {/* Spending Limits */}
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Spending Limits</h2>

          <div className="flex items-center justify-between mb-4">
            <label className="text-sm" style={{ color: 'var(--pms-text-sec)' }}>Daily Limit</label>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--pms-text-muted)' }}>₹</span>
              <input
                type="number"
                value={dailyLimit}
                onChange={e => setDailyLimit(e.target.value)}
                placeholder="500"
                className="w-[140px] text-right px-4 py-3 rounded-xl text-base outline-none"
                style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)', color: 'var(--pms-text)' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm" style={{ color: 'var(--pms-text-sec)' }}>Weekly Limit</label>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--pms-text-muted)' }}>₹</span>
              <input
                type="number"
                value={weeklyLimit}
                onChange={e => setWeeklyLimit(e.target.value)}
                placeholder="2500"
                className="w-[140px] text-right px-4 py-3 rounded-xl text-base outline-none"
                style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)', color: 'var(--pms-text)' }}
              />
            </div>
          </div>
        </div>

        {/* Attendance Target */}
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Attendance Target</h2>
          <div className="flex items-center justify-between">
            <label className="text-sm" style={{ color: 'var(--pms-text-sec)' }}>Target %</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="100"
                value={attendanceTarget}
                onChange={e => setAttendanceTarget(e.target.value)}
                className="w-[120px]"
                style={{ accentColor: 'var(--pms-brown)' }}
              />
              <span className="text-xl font-bold min-w-[48px] text-right" style={{ color: 'var(--pms-brown)' }}>{attendanceTarget}%</span>
            </div>
          </div>
        </div>

        {/* Curfew Time */}
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Curfew Time</h2>
          <div className="flex items-center justify-between">
            <label className="text-sm" style={{ color: 'var(--pms-text-sec)' }}>Return by</label>
            <input
              type="time"
              value={curfewTime}
              onChange={e => setCurfewTime(e.target.value)}
              className="w-[160px] text-center px-4 py-3 rounded-xl text-base outline-none"
              style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)', color: 'var(--pms-text)' }}
            />
          </div>
        </div>

        {/* Alert Toggles */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Alert Preferences</h2>

          <ToggleRow label="Geofence Alerts" description="Notify when student leaves campus" value={geofenceAlerts} onChange={setGeofenceAlerts} />
          <ToggleRow label="Meal Alerts" description="Notify about meal activity" value={mealAlerts} onChange={setMealAlerts} />
          <ToggleRow label="Spending Alerts" description="Notify on spending limit breach" value={spendingAlerts} onChange={setSpendingAlerts} />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-all duration-150"
          style={{
            backgroundColor: 'var(--pms-brown)',
            color: 'var(--pms-bg)',
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Controls'}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--pms-border)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>{description}</p>
      </div>
      <div
        onClick={() => onChange(!value)}
        className="flex-shrink-0 ml-4 cursor-pointer relative"
        style={{
          width: 48, height: 26, borderRadius: 13,
          backgroundColor: value ? 'var(--pms-brown)' : 'var(--pms-border)',
          transition: 'background-color 0.15s',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: value ? 'var(--pms-bg)' : 'var(--pms-text-muted)',
          position: 'absolute', top: 3,
          left: value ? 25 : 3,
          transition: 'left 0.15s, background-color 0.15s',
        }} />
      </div>
    </div>
  )
}
