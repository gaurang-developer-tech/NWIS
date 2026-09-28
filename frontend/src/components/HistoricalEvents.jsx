import React, { useState, useMemo } from 'react'
import { MOCK_INCIDENTS, MOCK_WELLS } from '../services/api'

export default function HistoricalEvents({ initialWell, onNavigate }) {
  const [query, setQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filters, setFilters] = useState({
    eventType: 'All',
    formation: 'All',
    well: initialWell ? initialWell.well_id : 'All',
    severity: 'All',
    depthMin: '',
    depthMax: ''
  })

  // Derive severity for incidents if not explicitly set
  const incidents = useMemo(() => {
    return MOCK_INCIDENTS.map(inc => ({
      ...inc,
      severity: inc.severity || (inc.incident_type.toLowerCase().includes('stuck') || inc.incident_type.toLowerCase().includes('kick') ? 'High' : 'Medium')
    }))
  }, [])

  const eventTypes = ['All', 'Stuck Pipe', 'Mud Loss', 'Kick', 'Torque Spike', 'Overpressure', 'Cementing', 'Fishing', 'NPT']
  const formations = ['All', ...new Set(MOCK_WELLS.map(w => w.formation))]
  const wells = ['All', ...new Set(MOCK_WELLS.map(w => w.well_id))]
  const severities = ['All', 'High', 'Medium', 'Low']

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const filteredEvents = useMemo(() => {
    return incidents.filter(inc => {
      const w = MOCK_WELLS.find(x => x.well_id === inc.well_id) || {}
      
      if (query.trim()) {
        const q = query.toLowerCase()
        const text = `${inc.incident_type} ${inc.cause} ${inc.mitigation} ${w.formation} ${inc.well_id}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      if (filters.eventType !== 'All' && inc.incident_type !== filters.eventType) return false
      if (filters.formation !== 'All' && w.formation !== filters.formation) return false
      if (filters.well !== 'All' && inc.well_id !== filters.well) return false
      if (filters.severity !== 'All' && inc.severity !== filters.severity) return false
      
      if (filters.depthMin && inc.depth_m < Number(filters.depthMin)) return false
      if (filters.depthMax && inc.depth_m > Number(filters.depthMax)) return false

      return true
    })
  }, [incidents, query, filters])

  return (
    <div style={{ display: 'flex', height: '100%', boxSizing: 'border-box' }}>
      
      {/* Left Filters Sidebar */}
      <div style={{ width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' }}>Event Filters</div>
        </div>
        
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Search</div>
            <input 
              type="text" placeholder="Search events..." value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, boxSizing: 'border-box' }}
            />
          </div>
          <FilterSelect label="Event type" value={filters.eventType} options={eventTypes} onChange={v => handleFilterChange('eventType', v)} />
          <FilterSelect label="Formation" value={filters.formation} options={formations} onChange={v => handleFilterChange('formation', v)} />
          <FilterSelect label="Well" value={filters.well} options={wells} onChange={v => handleFilterChange('well', v)} />
          <FilterSelect label="Severity" value={filters.severity} options={severities} onChange={v => handleFilterChange('severity', v)} />
          
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Depth Range (m)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="number" placeholder="Min" value={filters.depthMin} onChange={e => handleFilterChange('depthMin', e.target.value)}
                style={{ flex: 1, width: 0, padding: '6px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4 }}
              />
              <span style={{ color: 'var(--text-3)', alignSelf: 'center' }}>-</span>
              <input 
                type="number" placeholder="Max" value={filters.depthMax} onChange={e => handleFilterChange('depthMax', e.target.value)}
                style={{ flex: 1, width: 0, padding: '6px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Events List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--page)' }}>
        <div style={{ padding: '16px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Historical Events</h2>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{filteredEvents.length} events found</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 100px 120px 1fr', padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              <div>Event</div>
              <div>Well</div>
              <div>Depth</div>
              <div>Severity</div>
              <div>Formation</div>
            </div>
            
            <div>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No events match your criteria.</div>
              ) : (
                filteredEvents.map(inc => {
                  const w = MOCK_WELLS.find(x => x.well_id === inc.well_id) || {}
                  const isSelected = selectedEvent?.incident_id === inc.incident_id
                  const isHigh = inc.severity === 'High'
                  
                  return (
                    <div 
                      key={inc.incident_id} 
                      onClick={() => setSelectedEvent({ ...inc, formation: w.formation })}
                      style={{ 
                        display: 'grid', gridTemplateColumns: '120px 100px 100px 120px 1fr', padding: '12px 16px', 
                        borderBottom: '1px solid var(--border)', fontSize: 12, alignItems: 'center', cursor: 'pointer',
                        background: isSelected ? 'var(--info-bg)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--info)' : '3px solid transparent'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: isHigh ? '#b91c1c' : '#b05e00', background: isHigh ? '#fee2e2' : '#ffedd5', padding: '2px 6px', borderRadius: 4 }}>
                          {inc.incident_type}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{inc.well_id}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{inc.depth_m} m</div>
                      <div style={{ color: isHigh ? '#b91c1c' : '#b05e00', fontWeight: 500 }}>{inc.severity}</div>
                      <div style={{ color: 'var(--text-2)' }}>{w.formation}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedEvent && (
        <div style={{ width: 340, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Details</div>
            <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </div>
          
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 24, textTransform: 'uppercase' }}>
              {selectedEvent.incident_type}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'baseline' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Well:</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{selectedEvent.well_id}</div>
                
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Depth:</div>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{selectedEvent.depth_m.toLocaleString()}m</div>
                
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Formation:</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{selectedEvent.formation || 'Unknown'}</div>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              <DetailBlock label="Cause" text={selectedEvent.cause || selectedEvent.description} />
              <DetailBlock label="Mitigation" text={selectedEvent.mitigation} />
              <DetailBlock label="Outcome" text={selectedEvent.outcome || 'Operation resumed'} />
              
              <div style={{ height: 1, background: 'var(--border)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'baseline' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Source:</div>
                <div 
                  onClick={() => onNavigate && onNavigate('DocInt')}
                  style={{ fontSize: 13, color: 'var(--info)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  WCR-{selectedEvent.well_id.split('-')[1]}.pdf
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <select 
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface)', color: 'var(--text)' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function DetailBlock({ label, text }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>{label}:</div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{text || 'N/A'}</div>
    </div>
  )
}
