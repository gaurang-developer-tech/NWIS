import React, { useState, useMemo } from 'react'
import { MOCK_INCIDENTS, MOCK_WELLS } from '../services/api'

export default function GeologicalMemory() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    eventType: 'All',
    formation: 'All',
    well: 'All',
    severity: 'All',
    depthMin: '',
    depthMax: ''
  })

  // Extract unique filter options from synthetic data
  const eventTypes = ['All', 'Stuck Pipe', 'Mud Loss', 'Kick', 'Torque Spike', 'Overpressure', 'Cementing', 'Fishing', 'NPT']
  const formations = ['All', ...new Set(MOCK_WELLS.map(w => w.formation))]
  const wells = ['All', ...new Set(MOCK_WELLS.map(w => w.well_id))]
  const severities = ['All', 'High', 'Medium', 'Low']

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Filter Logic
  const filteredResults = useMemo(() => {
    return MOCK_INCIDENTS.filter(inc => {
      const well = MOCK_WELLS.find(w => w.well_id === inc.well_id) || {}
      
      // Text Search
      if (query.trim()) {
        const q = query.toLowerCase()
        const textToSearch = `${inc.incident_type} ${inc.cause} ${inc.mitigation} ${inc.outcome} ${w.formation} ${inc.well_id}`.toLowerCase()
        if (!textToSearch.includes(q) && !q.includes(inc.depth_m.toString())) return false
      }

      // Facets
      if (filters.eventType !== 'All' && inc.incident_type !== filters.eventType) return false
      if (filters.formation !== 'All' && w.formation !== filters.formation) return false
      if (filters.well !== 'All' && inc.well_id !== filters.well) return false
      if (filters.severity !== 'All' && inc.severity !== filters.severity) return false
      
      // Depth
      if (filters.depthMin && inc.depth_m < Number(filters.depthMin)) return false
      if (filters.depthMax && inc.depth_m > Number(filters.depthMax)) return false

      return true
    })
  }, [query, filters])

  return (
    <div style={{ display: 'flex', height: '100%', boxSizing: 'border-box' }}>
      
      {/* Left Filters Panel */}
      <div style={{ width: 260, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' }}>Filters</div>
        </div>
        
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
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

      {/* Right Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Search Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Search historical drilling knowledge...</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: 16 }} />
              <input 
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='e.g. "stuck pipe around 1150m"'
                style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: 14, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--page)', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Suggestions:</span>
            {["stuck pipe around 1150m", "mud loss in Jodhpur Sandstone", "mitigation for torque spike", "events near OIL-003"].map(q => (
              <button 
                key={q} onClick={() => setQuery(q)}
                style={{ fontSize: 11, background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 16, border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-2)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--page)' }}>
          {filteredResults.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
              <i className="ti ti-database-off" style={{ fontSize: 40, color: 'var(--text-3)', marginBottom: 16 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>No matching historical events</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Try widening the depth range or selecting another formation.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{filteredResults.length} records found</div>
              {filteredResults.map(inc => {
                const w = MOCK_WELLS.find(x => x.well_id === inc.well_id) || {}
                const isHighRisk = inc.incident_type.toLowerCase().includes('stuck') || inc.severity === 'High'
                
                return (
                  <div key={inc.incident_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isHighRisk ? '#b91c1c' : '#b05e00', background: isHighRisk ? '#fee2e2' : '#ffedd5', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
                          {inc.incident_type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)' }}>
                        <div><strong>Well:</strong> <span style={{ color: 'var(--text)' }}>{inc.well_id}</span></div>
                        <div><strong>Depth:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{inc.depth_m.toLocaleString()} m</span></div>
                        <div><strong>Formation:</strong> <span style={{ color: 'var(--text)' }}>{w.formation || 'Unknown'}</span></div>
                      </div>
                    </div>
                    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <DataField label="Cause" value={inc.cause || inc.description} />
                        <DataField label="Source" value={`WCR-${inc.well_id.split('-')[1]}.pdf`} isLink={true} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <DataField label="Mitigation" value={inc.mitigation} />
                        <DataField label="Outcome" value={inc.outcome || 'Operation resumed'} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
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

function DataField({ label, value, isLink }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: isLink ? 'var(--info)' : 'var(--text)', cursor: isLink ? 'pointer' : 'default', textDecoration: isLink ? 'underline' : 'none', lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  )
}
