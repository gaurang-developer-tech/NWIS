import React, { useState } from 'react'
import { MOCK_WELLS, MOCK_INCIDENTS } from '../services/api'

export default function WellComparison({ activeDepth, initialWell }) {
  const activeWell = MOCK_WELLS[0]
  const offsetWells = MOCK_WELLS.filter(w => w.well_id !== activeWell.well_id)
  const [selectedOffset, setSelectedOffset] = useState(
    initialWell && initialWell.well_id !== activeWell.well_id ? offsetWells.find(w => w.well_id === initialWell.well_id) || offsetWells[0] : offsetWells[0]
  )

  const getIncidents = (wid) => MOCK_INCIDENTS.filter(i => i.well_id === wid)
  
  const activeIncidents = getIncidents(activeWell.well_id)
  const offsetIncidents = getIncidents(selectedOffset.well_id)

  const dist = Math.abs((selectedOffset.lat - activeWell.lat)*111).toFixed(1)

  return (
    <div style={{ padding: 24, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Well Comparison</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Compare active well with historical offset wells</div>
        </div>
        <select 
          value={selectedOffset.well_id} 
          onChange={e => setSelectedOffset(offsetWells.find(w => w.well_id === e.target.value))}
          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          {offsetWells.map(w => <option key={w.well_id} value={w.well_id}>{w.well_id} - {w.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 20, minHeight: 0 }}>
        
        {/* Active Well Column */}
        <div style={{ flex: 1, background: 'var(--surface)', border: '2px solid var(--border-focus)', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 2 }}>ACTIVE WELL</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{activeWell.well_id}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{activeWell.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-block' }}>DRILLING</div>
            </div>
          </div>
          <div style={{ padding: 20, overflowY: 'auto' }}>
            <MetricRow label="Current Depth" value={`${activeDepth.toLocaleString()} m TVD`} />
            <MetricRow label="Formation" value={activeWell.formation} />
            <MetricRow label="Fault Block" value={activeWell.faultBlock || 'FB-A'} />
            <MetricRow label="Mud Weight" value="1.15 SG (Current)" color="#dc2626" />
            <MetricRow label="Torque" value="8.7 kNm (Spike)" color="#dc2626" />
            <MetricRow label="Historical Incidents" value={activeIncidents.length} />
          </div>
        </div>

        {/* Comparison Center Column */}
        <div style={{ width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
          <div style={{ height: 1, width: '100%', background: 'var(--border)', marginBottom: 20 }}></div>
          <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>DISTANCE</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{dist} km</div>
          <div style={{ height: 1, width: '100%', background: 'var(--border)', marginTop: 20 }}></div>
        </div>

        {/* Offset Well Column */}
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 2 }}>OFFSET WELL</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{selectedOffset.well_id}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{selectedOffset.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-block' }}>HISTORICAL</div>
            </div>
          </div>
          <div style={{ padding: 20, overflowY: 'auto' }}>
            <MetricRow label="Total Depth" value={`${selectedOffset.depth_m} m TVD`} />
            <MetricRow label="Formation" value={selectedOffset.formation} match={selectedOffset.formation === activeWell.formation} />
            <MetricRow label="Fault Block" value={selectedOffset.fault_block} match={selectedOffset.fault_block === (activeWell.faultBlock||'FB-A')} />
            <MetricRow label="Recommended Mud" value="1.25 SG" color="#16a34a" />
            <MetricRow label="Avg Torque" value="6.5 kNm" />
            
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase' }}>Historical Incidents</div>
              {offsetIncidents.length === 0 ? <div style={{fontSize: 12, color: 'var(--text-3)'}}>None</div> : offsetIncidents.map(inc => (
                <div key={inc.incident_id} style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: 12, borderRadius: 4, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 12, color: 'var(--text)' }}>{inc.incident_type}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{inc.depth_m} m</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>{inc.description}</div>
                  <div style={{ fontSize: 11, color: '#166534', background: '#bbf7d0', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                    Mitigation: {inc.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function MetricRow({ label, value, match = null, color = 'var(--text)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color }}>{value}</div>
        {match !== null && (
          <i className={`ti ${match ? 'ti-check' : 'ti-x'}`} style={{ color: match ? '#16a34a' : '#dc2626', fontSize: 12 }} />
        )}
      </div>
    </div>
  )
}
