import { useEffect, useState } from 'react'

const DEPTH_MIN = 900, DEPTH_MAX = 1300, HEIGHT = 200

const depthToY = (d) => ((d - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN)) * HEIGHT

const COLORS = {
  stuck_pipe: '#ef4444', mud_loss: '#f59e0b',
  kick: '#8b5cf6', torque_spike: '#3b82f6'
}

export default function DepthCorrelation({ activeDepth }) {
  const [allIncidents, setAllIncidents] = useState([])

  useEffect(() => {
    fetch('/api/incidents')
      .then(r => r.json())
      .then(setAllIncidents)
      .catch(() => {})
  }, [])

  const activeY = depthToY(activeDepth)

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Depth correlation</span>
        <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--amber)' }}>
          ▼ {activeDepth.toLocaleString()} m
        </span>
      </div>
      <div className="card-body">
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between',
            height:HEIGHT, fontSize:9, fontFamily:'var(--font-mono)', color:'var(--dim)',
            textAlign:'right', width:32, flexShrink:0 }}>
            {[900,1000,1100,1200,1300].map(d => <span key={d}>{d}</span>)}
          </div>

          <div style={{ flex:1, position:'relative', height:HEIGHT,
            borderLeft:'1px solid var(--border2)' }}>
            <div style={{
              position:'absolute', left:0, right:0, top:activeY,
              height:1, background:'var(--amber)',
              boxShadow:'0 0 6px rgba(245,158,11,0.4)',
              transition:'top 0.5s ease', zIndex:10
            }}/>
            {allIncidents.map((inc, i) => {
              const y = depthToY(inc.depth_m)
              const isNear = Math.abs(inc.depth_m - activeDepth) <= 80
              const left = 15 + (i % 5) * 14
              return (
                <div
                  key={inc.incident_id}
                  className={`incident-diamond ${inc.incident_type.replace('_', '-')}${isNear ? ' near-active' : ''}`}
                  style={{ top: y - 4, left }}
                  title={`${inc.incident_type} at ${inc.depth_m}m — ${inc.well_id}`}
                />
              )
            })}
            <div style={{ position:'absolute', bottom:0, left:4, right:0,
              display:'flex', flexWrap:'wrap', gap:'6px 10px', fontSize:9 }}>
              {Object.entries(COLORS).map(([k,c]) => (
                <span key={k} style={{ color:c }}>◆ {k.replace('_',' ')}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
