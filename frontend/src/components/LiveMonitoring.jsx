import React from 'react'

export default function LiveMonitoring({ activeDepth, streamRow }) {
  const torque = streamRow?.torque_knm ?? 6.0
  const mud = streamRow?.mud_weight_sg ?? 1.15

  return (
    <div style={{ padding: 24, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Live Monitoring</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Real-time drilling telemetry.</div>
        </div>
        <div style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 4, fontWeight: 600, border: '1px solid currentColor', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'blink 1s infinite' }} />
          SIMULATED STREAM
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        
        <MetricCard label="Current Depth" value={activeDepth.toLocaleString()} unit="m TVD" highlight={false} />
        <MetricCard label="Torque" value={torque.toFixed(2)} unit="kNm" highlight={torque > 7.8} />
        <MetricCard label="Mud Weight" value={mud.toFixed(2)} unit="SG" highlight={mud < 1.20} highlightColor="#d97706" />
        <MetricCard label="ROP (Simulated)" value="12.4" unit="m/hr" highlight={false} />
        <MetricCard label="RPM (Simulated)" value="120" unit="rpm" highlight={false} />
        <MetricCard label="WOB (Simulated)" value="15.2" unit="klbs" highlight={false} />

      </div>

      <div style={{ marginTop: 24, flex: 1, border: '1px solid var(--border)', borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <i className="ti ti-activity" style={{ fontSize: 32, marginBottom: 8, opacity: 0.5, display: 'block' }} />
          <div style={{ fontSize: 13 }}>Time-series visualization is actively rendering on the main operational dashboard.</div>
        </div>
      </div>

    </div>
  )
}

function MetricCard({ label, value, unit, highlight, highlightColor = '#dc2626' }) {
  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${highlight ? highlightColor : 'var(--border)'}`, borderRadius: 6, padding: 20, boxShadow: highlight ? `0 0 0 1px ${highlightColor}` : 'none' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: highlight ? highlightColor : 'var(--text)', fontFamily: 'var(--font-mono)' }}>{value}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{unit}</span>
      </div>
      {highlight && <div style={{ fontSize: 11, color: highlightColor, marginTop: 8, fontWeight: 500 }}>Deviation detected</div>}
    </div>
  )
}
