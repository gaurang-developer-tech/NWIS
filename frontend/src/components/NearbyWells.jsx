import React, { useState, useMemo } from 'react'
import MapView from './MapView'
import { MOCK_WELLS, MOCK_INCIDENTS } from '../services/api'

// Simple haversine approximation for synthetic coords
const calcDist = (lat1, lon1, lat2, lon2) => {
  const dx = (lon2 - lon1) * 111.32 * Math.cos(lat1 * Math.PI / 180)
  const dy = (lat2 - lat1) * 111.32
  return Math.sqrt(dx * dx + dy * dy)
}

export default function NearbyWells({ activeDepth, onNavigate, initialWell, mapLayers }) {
  const [selectedWell, setSelectedWell] = useState(initialWell || null)
  const [radius, setRadius] = useState(5)
  const activeWell = MOCK_WELLS[0]

  const nearbyWells = useMemo(() => {
    return MOCK_WELLS
      .filter(w => w.well_id !== activeWell.well_id)
      .map(w => ({ ...w, dist: calcDist(activeWell.lat, activeWell.lon, w.lat, w.lon) }))
      .filter(w => w.dist <= radius)
      .sort((a, b) => a.dist - b.dist)
  }, [radius, activeWell])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>NEARBY WELLS</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Bikaner-Nagaur basin · Synthetic data</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 10px' }}>Radius</div>
          {[1, 5, 10, 20, 30].map(r => (
            <button 
              key={r} onClick={() => setRadius(r)}
              style={{ padding: '6px 14px', fontSize: 11, borderRadius: 16, cursor: 'pointer', background: radius === r ? 'var(--info)' : 'var(--surface)', color: radius === r ? '#fff' : 'var(--text-2)', border: `1px solid ${radius === r ? 'var(--info)' : 'var(--border)'}`, fontWeight: 600 }}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Map Section */}
        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <MapView wells={[activeWell, ...nearbyWells]} activeWell={selectedWell} onWellClick={setSelectedWell} activeDepth={activeDepth} mapLayers={mapLayers} radiusKm={radius} />
        </div>

        {/* Data Panel */}
        <div style={{ width: 380, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>
            WELLS WITHIN {radius} KM
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {nearbyWells.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                No offset wells found within {radius} km.
              </div>
            )}
            
            {nearbyWells.map(w => {
              const incidents = MOCK_INCIDENTS.filter(i => i.well_id === w.well_id)
              const isSelected = selectedWell?.well_id === w.well_id
              
              if (isSelected) {
                return (
                  <div key={w.well_id} style={{ padding: 20, borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', borderLeft: '3px solid var(--info)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{w.well_id}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>{w.name}</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, fontSize: 12, marginBottom: 16 }}>
                      <div style={{ color: 'var(--text-3)' }}>Distance:</div><div style={{ fontWeight: 500 }}>{w.dist.toFixed(1)} km</div>
                      <div style={{ color: 'var(--text-3)' }}>Formation:</div><div style={{ fontWeight: 500 }}>{w.formation}</div>
                      <div style={{ color: 'var(--text-3)' }}>Risk:</div>
                      <div>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: w.risk_level === 'high' ? '#fee2e2' : '#fef3c7', color: w.risk_level === 'high' ? '#dc2626' : '#d97706', border: '1px solid currentColor', fontWeight: 600, textTransform: 'uppercase' }}>
                          {w.risk_level}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-3)' }}>Events:</div><div style={{ fontWeight: 500 }}>{incidents.length}</div>
                    </div>
                    
                    {incidents.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Most relevant:</div>
                        <div style={{ fontSize: 12, background: 'var(--surface)', padding: '8px 12px', borderRadius: 4, border: '1px solid var(--border)' }}>
                          <strong>{incidents[0].incident_type}</strong> · {incidents[0].depth_m}m
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        onClick={() => onNavigate('Compare')} 
                        style={{ flex: 1, padding: '8px', background: 'var(--info)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Compare with active
                      </button>
                    </div>
                  </div>
                )
              }
              
              return (
                <div key={w.well_id} onClick={() => setSelectedWell(w)} style={{ padding: '16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderLeft: '3px solid transparent' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{w.well_id}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{w.dist.toFixed(1)} km</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{w.formation}</div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: w.risk_level === 'high' ? '#fee2e2' : '#fef3c7', color: w.risk_level === 'high' ? '#dc2626' : '#d97706', border: '1px solid currentColor', fontWeight: 600, textTransform: 'uppercase' }}>
                        {w.risk_level}
                      </span>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{incidents.length} events</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
