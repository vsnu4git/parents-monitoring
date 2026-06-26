'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── B&W themed marker icons ──

const studentIcon = new L.DivIcon({
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#FFFFFF;border:3px solid #27272A;
    box-shadow:0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.25);
  "></div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const studentOffIcon = new L.DivIcon({
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#DC2626;border:3px solid #000000;
    box-shadow:0 0 10px rgba(220,38,38,0.5), 0 0 20px rgba(220,38,38,0.25);
  "></div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const destIcon = new L.DivIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:4px;transform:rotate(45deg);
    background:#71717A;border:2px solid #000000;
    box-shadow:0 0 8px rgba(113,113,122,0.6);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const historyIcon = new L.DivIcon({
  html: `<div style="
    width:8px;height:8px;border-radius:50%;
    background:rgba(113,113,122,0.6);border:1px solid #27272A;
  "></div>`,
  className: '',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
})

// Auto-center map on student location
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

// Force invalidate map size after mount (fixes grey tiles)
function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

interface TrackingMapProps {
  studentName: string
  isOnCampus: boolean
  currentLat: number
  currentLng: number
  lastSeenTime: string
  checkInHistory: { lat: number; lng: number; type: string; time: string }[]
  campusZones: { name: string; lat: number; lng: number; radiusM: number }[]
  odTrip?: {
    destinationName: string
    destLat: number
    destLng: number
    radiusM: number
    status: string
    lastLat?: number
    lastLng?: number
  } | null
}

export default function TrackingMap({
  studentName,
  isOnCampus,
  currentLat,
  currentLng,
  lastSeenTime,
  checkInHistory,
  campusZones,
  odTrip,
}: TrackingMapProps) {
  const [mapReady, setMapReady] = useState(false)
  const [tileError, setTileError] = useState(false)
  const [, setNow] = useState(new Date())

  // Auto-refresh timestamp every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMapReady = useCallback(() => {
    setMapReady(true)
  }, [])

  const center: [number, number] = [currentLat, currentLng]

  // Build trail path from check-in history
  const trailPath: [number, number][] = checkInHistory.map(c => [c.lat, c.lng])

  // OD trip path (current -> destination)
  const odPath: [number, number][] = odTrip
    ? [
        [odTrip.lastLat || currentLat, odTrip.lastLng || currentLng],
        [odTrip.destLat, odTrip.destLng],
      ]
    : []

  // Primary tile: CartoDB dark. Fallback: OpenStreetMap
  const tileUrl = tileError
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--pms-border)' }}>
      {/* Grayscale filter style for B&W map */}
      <style>{`
        .bw-map-tiles .leaflet-tile-pane {
          filter: grayscale(1) brightness(0.95);
        }
        .bw-map-tiles .leaflet-popup-content-wrapper {
          background: #09090B;
          color: #FAFAFA;
          border-radius: 10px;
          border: 1px solid #3F3F46;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .bw-map-tiles .leaflet-popup-tip {
          background: #09090B;
          border: 1px solid #3F3F46;
          border-top: none;
          border-right: none;
        }
        .bw-map-tiles .leaflet-popup-close-button {
          color: #71717A !important;
        }
        .bw-map-tiles .leaflet-popup-close-button:hover {
          color: #FFFFFF !important;
        }
        .bw-map-tiles .leaflet-control-attribution {
          display: none;
        }
      `}</style>

      {/* Loading overlay */}
      {!mapReady && (
        <div
          className="absolute inset-0 z-[1001] flex flex-col items-center justify-center"
          style={{ backgroundColor: '#000000' }}
        >
          <div
            className="w-8 h-8 rounded-full animate-spin mb-3"
            style={{ border: '3px solid #27272A', borderTopColor: '#FAFAFA' }}
          />
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#3F3F46' }}>
            Loading map...
          </p>
        </div>
      )}

      {/* Status bar overlay */}
      <div
        className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between"
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: '#000000E6', backdropFilter: 'blur(8px)', border: '1px solid #27272A40' }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{
              backgroundColor: isOnCampus ? '#22C55E' : '#DC2626',
              boxShadow: `0 0 8px ${isOnCampus ? 'rgba(34,197,94,0.6)' : 'rgba(220,38,38,0.6)'}`,
            }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: isOnCampus ? '#FFFFFF' : '#EF4444' }}
          >
            {isOnCampus ? 'On Campus' : 'Off Campus'}
          </span>
        </div>
        <div
          className="px-3 py-1.5 rounded-full"
          style={{ backgroundColor: '#000000E6', backdropFilter: 'blur(8px)', border: '1px solid #27272A40' }}
        >
          <span className="text-[9px] font-mono" style={{ color: '#71717A' }}>
            {lastSeenTime}
          </span>
        </div>
      </div>

      {/* OD Trip banner */}
      {odTrip && (
        <div
          className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ backgroundColor: '#000000E6', backdropFilter: 'blur(8px)', border: '1px solid #3F3F4650' }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#71717A' }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate" style={{ color: '#E4E4E7' }}>
              OD: {odTrip.destinationName}
            </p>
            <p className="text-[8px]" style={{ color: '#3F3F46' }}>
              {odTrip.status.replace('_', ' ')} · {odTrip.radiusM}m geofence
            </p>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={15}
        style={{ height: 280, width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        className="bw-map-tiles"
        whenReady={handleMapReady}
      >
        <TileLayer
          url={tileUrl}
          eventHandlers={{
            tileerror: () => {
              if (!tileError) setTileError(true)
            },
          }}
        />

        <MapUpdater center={center} />
        <MapResizer />

        {/* Campus geofence circles */}
        {campusZones.map((zone, i) => (
          <Circle
            key={i}
            center={[zone.lat, zone.lng]}
            radius={zone.radiusM}
            pathOptions={{
              color: '#71717A',
              fillColor: '#18181B',
              fillOpacity: 0.1,
              weight: 1.5,
              dashArray: '6 4',
            }}
          >
            <Popup>
              <div style={{ fontSize: 12 }}>
                <strong style={{ color: '#E4E4E7' }}>{zone.name}</strong><br />
                <span style={{ color: '#71717A' }}>{zone.radiusM}m radius</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* OD destination geofence */}
        {odTrip && (
          <>
            <Circle
              center={[odTrip.destLat, odTrip.destLng]}
              radius={odTrip.radiusM}
              pathOptions={{
                color: '#52525B',
                fillColor: '#71717A',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4 4',
              }}
            />
            <Marker position={[odTrip.destLat, odTrip.destLng]} icon={destIcon}>
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: '#E4E4E7' }}>{odTrip.destinationName}</strong><br />
                  <span style={{ color: '#71717A' }}>OD Destination · {odTrip.radiusM}m radius</span>
                </div>
              </Popup>
            </Marker>
            {/* Dashed line from student to destination */}
            {odPath.length === 2 && (
              <Polyline
                positions={odPath}
                pathOptions={{ color: '#71717A', weight: 2, dashArray: '8 6', opacity: 0.5 }}
              />
            )}
          </>
        )}

        {/* Movement trail */}
        {trailPath.length > 1 && (
          <Polyline
            positions={trailPath}
            pathOptions={{ color: '#18181B', weight: 2, opacity: 0.5 }}
          />
        )}

        {/* History markers */}
        {checkInHistory.slice(1).map((c, i) => (
          <Marker key={i} position={[c.lat, c.lng]} icon={historyIcon}>
            <Popup>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: '#E4E4E7' }}>
                  {c.type === 'CAMPUS_ENTRY' ? 'Entered' : c.type === 'CAMPUS_EXIT' ? 'Left' : 'Check-in'}
                </span><br />
                <span style={{ color: '#71717A' }}>{c.time}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Student current position */}
        <Marker position={center} icon={isOnCampus ? studentIcon : studentOffIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong style={{ color: '#FFFFFF' }}>{studentName}</strong><br />
              <span style={{ color: isOnCampus ? '#22C55E' : '#EF4444' }}>
                {isOnCampus ? 'Currently on campus' : 'Currently off campus'}
              </span><br />
              <span style={{ fontSize: 10, color: '#3F3F46' }}>Last seen: {lastSeenTime}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
