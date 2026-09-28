import { useMemo } from 'react'

const DEPTH_MIN = 900, DEPTH_MAX = 1280
const HEIGHT = 220

const pct = (d) => ((d - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN)) * 100

const TICKS = [900,950,1000,1050,1100,1150,1200,1250]

const INC_COLOR = {
  stuck_pipe:    'var(--inc-stuck)',
  torque_spike:  'var(--inc-torque)',
  mud_loss:      'var(--inc-loss)',
  kick:          'var(--inc-kick)',
}

export default function DepthAxis({ incidents, activeDepth }) {
  const activePct = pct(Math.min(Math.max(activeDepth, DEPTH_MIN), DEPTH_MAX))

  const positions = useMemo(() => {
    let pos = [...incidents]
      .sort((a, b) => a.depth_m - b.depth_m)
      .map(inc => {
        const trueY = (pct(inc.depth_m) / 100) * HEIGHT
        return { ...inc, trueY, idealY: trueY }
      })

    const MIN_GAP = 14
    for (let iter = 0; iter < 10; iter++) {
      for (let i = 0; i < pos.length - 1; i++) {
        const diff = pos[i+1].idealY - pos[i].idealY
        if (diff < MIN_GAP) {
          const overlap = MIN_GAP - diff
          pos[i].idealY -= overlap / 2
          pos[i+1].idealY += overlap / 2
        }
      }
    }

    pos.forEach(p => {
      p.idealY = Math.max(6, Math.min(HEIGHT - 6, p.idealY))
    })

    return pos
  }, [incidents])

  return (
    <div className="depth-axis-section">
      <div className="section-header" style={{padding:'10px 12px'}}>
        <span className="section-label">Depth correlation</span>
        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--info)',fontWeight:600}}>
          {Math.round(activeDepth).toLocaleString()} m
        </span>
      </div>

      <div className="depth-axis-body" style={{height:HEIGHT}}>
        <div className="depth-ruler-line"/>

        {TICKS.map(d => (
          <div key={d} className="depth-tick" style={{top:`${pct(d)}%`}}>
            <div className="dt-label">{d >= 1000 ? d.toLocaleString() : d}</div>
            <div className="dt-tick"/>
          </div>
        ))}

        {positions.map((inc) => (
          <div key={inc.incident_id}>
            <svg style={{ position: 'absolute', left: 52, top: 0, width: 8, height: HEIGHT, pointerEvents: 'none' }}>
              <path 
                d={`M 0,${inc.trueY} L 8,${inc.idealY}`} 
                stroke={INC_COLOR[inc.incident_type] || 'var(--border-strong)'} 
                strokeWidth="1.5" 
                fill="none" 
                opacity="0.4" 
              />
            </svg>
            <div
              className="depth-event-marker"
              style={{
                top: `${inc.idealY}px`,
                transform: 'translateY(-50%)',
                background: 'var(--surface-2)',
                padding: '2px 0'
              }}
              title={`${inc.incident_type.toUpperCase()}\nWell: ${inc.well_id}\nDepth: ${inc.depth_m} m TVD\nMitigation: ${inc.mitigation}\nSeverity: High`}
            >
              <div
                className="event-diamond"
                style={{
                  background: INC_COLOR[inc.incident_type] ?? 'var(--text-3)',
                  opacity: Math.abs(inc.depth_m - activeDepth) <= 100 ? 1 : 0.45
                }}
              />
              <div className="event-name">{inc.incident_type.replace(/_/g,' ')}</div>
              <div className="event-well-id">{inc.well_id}</div>
            </div>
          </div>
        ))}

        <div className="active-depth-label" style={{top:`${activePct}%`}}>
          {Math.round(activeDepth)}
        </div>
        <div className="active-depth-indicator" style={{top:`${activePct}%`}}/>
      </div>

      <div className="depth-legend-strip">
        {[
          ['var(--inc-stuck)',  'Stuck pipe / torque'],
          ['var(--inc-loss)',   'Mud loss'],
          ['var(--inc-kick)',   'Kick / overpressure'],
        ].map(([c,l]) => (
          <div key={l} className="dl-entry">
            <div className="dl-diamond" style={{background:c}}/>
            {l}
          </div>
        ))}
        <div className="dl-entry" style={{marginTop:2}}>
          <div className="dl-bar" style={{background:'var(--info)'}}/>
          Current depth
        </div>
      </div>
    </div>
  )
}
