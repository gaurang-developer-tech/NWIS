import React, { useState } from 'react'
import { MOCK_ALERTS } from '../services/api'

export default function AlertsCenter() {
  const [filter, setFilter] = useState('All')

  const alerts = filter === 'All' ? MOCK_ALERTS : MOCK_ALERTS.filter(a => 
    filter === 'Resolved' ? a.status === 'Resolved' : a.severity === filter
  )

  const getSeverityStyle = (sev) => {
    if (sev === 'HIGH') return { bg: '#fee2e2', fg: '#dc2626' }
    if (sev === 'MEDIUM') return { bg: '#fef3c7', fg: '#d97706' }
    return { bg: '#dbeafe', fg: '#2563eb' }
  }

  return (
    <div style={{ padding: 24, height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Alert Center</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Real-time and historical operational alerts.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'HIGH', 'MEDIUM', 'WARNING', 'Resolved'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px', fontSize: 11, borderRadius: 16, cursor: 'pointer',
                background: filter === f ? 'var(--text)' : 'var(--surface)',
                color: filter === f ? 'var(--surface)' : 'var(--text-2)',
                border: `1px solid ${filter === f ? 'var(--text)' : 'var(--border)'}`
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map(a => {
          const style = getSeverityStyle(a.severity)
          return (
            <div key={a.id} style={{ 
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 20px',
              borderLeft: `4px solid ${style.fg}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: style.bg, color: style.fg, borderRadius: 4 }}>{a.severity}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{a.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>{a.reason}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  <span><i className="ti ti-target" /> {a.well}</span>
                  <span><i className="ti ti-arrow-down" /> {a.depth}</span>
                  <span><i className="ti ti-clock" /> {a.timestamp}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: a.status==='Active' ? '#dc2626' : '#16a34a', background: a.status==='Active' ? '#fee2e2' : '#dcfce7', padding: '4px 10px', borderRadius: 12 }}>
                {a.status}
              </div>
            </div>
          )
        })}
        {alerts.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>No alerts found for this filter.</div>}
      </div>
    </div>
  )
}
