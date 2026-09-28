const TYPE_COLOR = {
  stuck_pipe:'var(--red)', mud_loss:'var(--amber)',
  kick:'var(--purple)', torque_spike:'var(--blue)'
}

export default function WellSidebar({ well, incidents }) {
  if (!well) return (
    <div className="card">
      <div className="card-header"><span className="card-title">Offset well details</span></div>
      <div className="card-body" style={{ color:'var(--muted)', fontSize:12, textAlign:'center', padding:'20px 14px' }}>
        Click a well on the map to inspect its history
      </div>
    </div>
  )

  const riskClass = well.risk_level === 'high' ? 'high'
                  : well.risk_level === 'medium' ? 'medium' : 'low'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{well.name}</span>
        <span className={`badge ${riskClass}`}>{well.risk_level.toUpperCase()}</span>
      </div>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', fontSize:11 }}>
        {[
          ['Formation', well.formation],
          ['Fault block', well.fault_block],
          ['TD', `${well.depth_m} m`],
          ['Status', well.status],
        ].map(([k,v]) => (
          <div key={k}>
            <div style={{ color:'var(--muted)', marginBottom:2 }}>{k}</div>
            <div style={{ fontFamily:'var(--font-mono)', color:'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ maxHeight:180, overflowY:'auto' }}>
        {incidents.length === 0 && (
          <div style={{ padding:12, color:'var(--muted)', fontSize:12 }}>No incidents recorded</div>
        )}
        {incidents.map(inc => (
          <div key={inc.incident_id}
            style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)',
              borderLeft:`3px solid ${TYPE_COLOR[inc.incident_type] ?? 'var(--dim)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)',
                color: TYPE_COLOR[inc.incident_type], textTransform:'uppercase' }}>
                {inc.incident_type.replace(/_/g,' ')}
              </span>
              <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--muted)' }}>
                {inc.depth_m} m
              </span>
            </div>
            <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.5, marginBottom:4 }}>
              {inc.description?.slice(0,100)}…
            </div>
            <div style={{ fontSize:11, color:'var(--teal)', background:'var(--teal-bg)',
              borderRadius:4, padding:'4px 8px', border:'1px solid #003330' }}>
              ↳ {inc.mitigation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
