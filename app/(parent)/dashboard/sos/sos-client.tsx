'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const TrackingMap = dynamic(() => import('@/components/tracking-map'), { ssr: false })

type SOSAlertData = {
  id: string
  studentId: string
  parentId: string
  latitude: number | null
  longitude: number | null
  message: string | null
  status: string
  resolvedAt: string | null
  createdAt: string
}

type StudentData = {
  id: string
  name: string
  registerNumber: string
  department: { name: string; code: string }
}

type Props = {
  data: {
    student: StudentData
    sosAlerts: SOSAlertData[]
    activeAlert: SOSAlertData | undefined
    parentId: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#EF4444',
  ACKNOWLEDGED: '#F59E0B',
  RESOLVED: '#22C55E',
  FALSE_ALARM: '#A1A1AA',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
  FALSE_ALARM: 'False Alarm',
}

export function SOSClient({ data }: Props) {
  const { student, sosAlerts: initialAlerts, activeAlert: initialActive, parentId } = data
  const [alerts, setAlerts] = useState(initialAlerts)
  const [activeAlert, setActiveAlert] = useState<SOSAlertData | undefined>(initialActive)
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pulseOn, setPulseOn] = useState(true)

  useEffect(() => {
    if (!activeAlert) return
    const interval = setInterval(() => setPulseOn(p => !p), 800)
    return () => clearInterval(interval)
  }, [activeAlert])

  async function updateAlertStatus(alertId: string, status: string) {
    setLoading(status)
    try {
      const res = await fetch(`/api/admin/sos/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status, resolvedAt: updated.resolvedAt || a.resolvedAt } : a))
        if (status !== 'ACTIVE') {
          setActiveAlert(undefined)
        }
        setMessage(`Alert marked as ${STATUS_LABELS[status]}`)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage('Failed to update alert')
        setTimeout(() => setMessage(null), 3000)
      }
    } catch {
      setMessage('Network error')
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(null)
    }
  }

  async function simulateSOS() {
    setLoading('simulate')
    try {
      const res = await fetch('/api/mobile/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          parentId,
          message: 'Test SOS Alert - Simulation',
          latitude: 11.0168 + (Math.random() - 0.5) * 0.01,
          longitude: 76.9558 + (Math.random() - 0.5) * 0.01,
        }),
      })
      if (res.ok) {
        const newAlert = await res.json()
        setAlerts(prev => [newAlert, ...prev])
        setActiveAlert(newAlert)
        setMessage('SOS simulated successfully')
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage('Failed to simulate SOS')
        setTimeout(() => setMessage(null), 3000)
      }
    } catch {
      setMessage('Network error')
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(null)
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Active SOS
  if (activeAlert) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--pms-bg)' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: pulseOn ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.03)',
          transition: 'background-color 0.8s ease',
          pointerEvents: 'none',
        }} />

        <div className="relative z-10 px-5 pt-5 pb-28 max-w-[600px] mx-auto">
          {message && (
            <div className="rounded-2xl p-3 mb-4 text-sm text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', color: 'var(--pms-brown)' }}>
              {message}
            </div>
          )}

          {/* SOS Pulse Circle */}
          <div className="flex justify-center mb-6 mt-6">
            <div className="w-40 h-40 rounded-full flex items-center justify-center transition-all" style={{
              backgroundColor: pulseOn ? '#EF4444' : '#DC2626',
              boxShadow: pulseOn ? '0 0 60px rgba(239, 68, 68, 0.6), 0 0 120px rgba(239, 68, 68, 0.3)' : '0 0 30px rgba(239, 68, 68, 0.3)',
            }}>
              <span className="text-5xl font-black text-white tracking-[6px]">SOS</span>
            </div>
          </div>

          {/* Student info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#EF4444]">EMERGENCY ALERT</h1>
            <p className="text-xl mt-2" style={{ color: 'var(--pms-text)' }}>{student.name}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--pms-text-muted)' }}>{student.registerNumber} | {student.department.name}</p>
          </div>

          {activeAlert.message && (
            <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#EF44441A', border: '1px solid #EF444430' }}>
              <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Message</p>
              <p className="text-base mt-1" style={{ color: 'var(--pms-text)' }}>{activeAlert.message}</p>
            </div>
          )}

          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>Triggered at</p>
            <p className="text-base mt-1" style={{ color: 'var(--pms-brown)' }}>{formatDate(activeAlert.createdAt)}</p>
          </div>

          {activeAlert.latitude && activeAlert.longitude && (
            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #EF444430' }}>
              <TrackingMap
                studentName={student.name}
                isOnCampus={false}
                currentLat={activeAlert.latitude}
                currentLng={activeAlert.longitude}
                lastSeenTime={formatDate(activeAlert.createdAt)}
                checkInHistory={[]}
                campusZones={[]}
                odTrip={null}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => updateAlertStatus(activeAlert.id, 'ACKNOWLEDGED')}
              disabled={loading !== null}
              className="py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: '#F59E0B', color: 'var(--pms-bg)', opacity: loading ? 0.6 : 1 }}
            >
              {loading === 'ACKNOWLEDGED' ? 'Acknowledging...' : 'Acknowledge Alert'}
            </button>

            <button
              onClick={() => updateAlertStatus(activeAlert.id, 'RESOLVED')}
              disabled={loading !== null}
              className="py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: '#22C55E', color: 'white', opacity: loading ? 0.6 : 1 }}
            >
              {loading === 'RESOLVED' ? 'Resolving...' : 'Mark Resolved'}
            </button>

            <button
              onClick={() => updateAlertStatus(activeAlert.id, 'FALSE_ALARM')}
              disabled={loading !== null}
              className="py-4 rounded-2xl text-base font-semibold active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'transparent', border: '1px solid var(--pms-border)', color: 'var(--pms-text-sec)', opacity: loading ? 0.6 : 1 }}
            >
              {loading === 'FALSE_ALARM' ? 'Marking...' : 'False Alarm'}
            </button>

            <a
              href={`tel:${student.registerNumber}`}
              className="block py-4 rounded-2xl text-center text-base font-semibold active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-brown)', color: 'var(--pms-brown)' }}
            >
              Call Student
            </a>
          </div>
        </div>
      </div>
    )
  }

  // No active alert
  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>SOS Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{student.name} | {student.department.name}</p>
        </div>

        {message && (
          <div className="rounded-2xl p-3 mb-4 text-sm text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', color: 'var(--pms-brown)' }}>
            {message}
          </div>
        )}

        {/* Status */}
        <div className="rounded-2xl p-5 text-center mb-4" style={{ backgroundColor: '#22C55E1A', border: '1px solid #22C55E30' }}>
          <div className="inline-block w-4 h-4 rounded-full bg-[#22C55E] mr-2 align-middle" />
          <span className="text-base font-semibold text-[#22C55E]">No Active SOS Alerts</span>
        </div>

        {/* Simulate */}
        <button
          onClick={simulateSOS}
          disabled={loading !== null}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold mb-6 active:scale-[0.98] transition-all duration-150"
          style={{ border: '2px dashed #EF4444', backgroundColor: '#EF44440A', color: '#EF4444', opacity: loading === 'simulate' ? 0.6 : 1 }}
        >
          {loading === 'simulate' ? 'Simulating...' : 'Simulate SOS (Testing)'}
        </button>

        {/* History */}
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--pms-text)' }}>SOS History</h2>

        {alerts.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
            <p className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>No SOS alerts recorded.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: `1px solid ${STATUS_COLORS[alert.status]}22` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{formatDate(alert.createdAt)}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                    backgroundColor: `${STATUS_COLORS[alert.status]}18`,
                    color: STATUS_COLORS[alert.status],
                  }}>
                    {STATUS_LABELS[alert.status]}
                  </span>
                </div>
                {alert.message && (
                  <p className="text-sm mb-2" style={{ color: 'var(--pms-text)' }}>{alert.message}</p>
                )}
                {alert.latitude && alert.longitude && (
                  <p className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>
                    Location: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                  </p>
                )}
                {alert.resolvedAt && (
                  <p className="text-xs mt-1" style={{ color: 'var(--pms-text-muted)' }}>
                    Resolved: {formatDate(alert.resolvedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
