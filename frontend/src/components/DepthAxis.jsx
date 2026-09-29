import { useMemo } from 'react'

const DEPTH_MIN = 900, DEPTH_MAX = 1280
const HEIGHT    = 220

const pct = d => ((d - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN)) * 100

const TICKS = [900, 950, 1000, 1050, 1100, 1150, 1200, 1250]

const INC_COLOR = {
  stuck_pipe:        'var(--inc-stuck)',
  torque_spike:      'var(--inc-torque)',
  mud_loss:          'var(--inc-loss)',
  kick:              'var(--inc-kick)',
  overpressure_zone: 'var(--inc-kick)',
}

const TYPE_LABEL = {
  stuck_pipe:        'Stuck Pipe',
  torque_spike:      'Torque Spike',
  mud_loss:          'Mud Loss',
  kick:              'Kick',
  overpressure_zone: 'Overpressure',
}

// Cluster incidents within BUCKET_M metres into a single marker
const BUCKET_M = 60

function clusterIncidents(incidents) {
  if (!incidents?.length) return []
  const sorted = [...incidents].sort((a, b) => a.depth_m - b.depth_m)
  const clusters = []

  sorted.forEach(inc => {
    const last = clusters[clusters.length - 1]
    if (last && inc.depth_m - last.depth <= BUCKET_M) {
      last.items.push(inc)
      last.depth = (last.depth * (last.items.length - 1) + inc.depth_m) / last.items.length
    } else {
      clusters.push({ depth: inc.depth_m, items: [inc] })
    }
  })

  return clusters.map(cl => {
    // Most common type in cluster
    const typeCounts = {}
    cl.items.forEach(i => { typeCounts[i.incident_type] = (typeCounts[i.incident_type] || 0) + 1 })
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
    const uniqueTypes  = [...new Set(cl.items.map(i => i.incident_type))]
    return {
      id:    `cluster-${Math.round(cl.depth)}`,
      depth: Math.round(cl.depth),
      type:  dominantType,
      count: cl.items.length,
      label: cl.items.length === 1
        ? TYPE_LABEL[dominantType] || dominantType
        : `${cl.items.length} events`,
      wellIds: [...new Set(cl.items.map(i => i.well_id))].join(', '),
      types:   uniqueTypes.map(t => TYPE_LABEL[t] || t).join(', '),
      tooltip: cl.items.map(i =>
        `${i.well_id}  ${i.depth_m}m  ${TYPE_LABEL[i.incident_type] || i.incident_type}`
      ).join('\n'),
    }
  })
}

// Force-directed label spread — more iterations, bigger gap for clusters
function spreadLabels(items, minGap = 18, iterations = 60) {
  const ys = items.map(cl => (pct(cl.depth) / 100) * HEIGHT)
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] - ys[i - 1] < minGap) {
        const push = (minGap - (ys[i] - ys[i - 1])) / 2
        ys[i - 1] -= push
        ys[i]     += push
        moved = true
      }
    }
    if (!moved) break
  }
  return ys.map(y => Math.max(6, Math.min(HEIGHT - 6, y)))
}

export default function DepthAxis({ incidents, activeDepth }) {
  const activePct = pct(Math.min(Math.max(activeDepth, DEPTH_MIN), DEPTH_MAX))

  const { clusters, labelYs } = useMemo(() => {
    const cls = clusterIncidents(incidents)
    return { clusters: cls, labelYs: spreadLabels(cls) }
  }, [incidents])

  return (
    <div className="depth-axis-section">
      <div className="section-header" style={{ padding: '10px 12px' }}>
        <span className="section-label">Depth correlation</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--info)', fontWeight: 600 }}>
          {Math.round(activeDepth).toLocaleString()} m
        </span>
      </div>

      <div className="depth-axis-body" style={{ height: HEIGHT }}>
        <div className="depth-ruler-line" />

        {/* Depth tick marks */}
        {TICKS.map(d => (
          <div key={d} className="depth-tick" style={{ top: `${pct(d)}%` }}>
            <div className="dt-label">{d >= 1000 ? d.toLocaleString() : d}</div>
            <div className="dt-tick" />
          </div>
        ))}

        {/* Connector SVG lines from true depth → spread label */}
        <svg style={{ position: 'absolute', left: 52, top: 0, width: 120, height: HEIGHT, pointerEvents: 'none', overflow: 'visible' }}>
          {clusters.map((cl, idx) => {
            const trueY  = (pct(cl.depth) / 100) * HEIGHT
            const labelY = labelYs[idx]
            const color  = INC_COLOR[cl.type] || 'var(--border-strong)'
            return (
              <line
                key={cl.id}
                x1={0} y1={trueY}
                x2={8} y2={labelY}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={Math.abs(labelY - trueY) > 4 ? '3 3' : 'none'}
                opacity="0.45"
              />
            )
          })}
        </svg>

        {/* Cluster markers */}
        {clusters.map((cl, idx) => {
          const trueY  = (pct(cl.depth) / 100) * HEIGHT
          const color  = INC_COLOR[cl.type] || 'var(--border-strong)'
          const isNear = Math.abs(cl.depth - activeDepth) <= 100

          return (
            <div key={cl.id}>
              {/* Faint horizontal rule at true depth */}
              <div style={{
                position: 'absolute',
                left: 52, right: 0,
                top: trueY,
                height: 1,
                background: color,
                opacity: isNear ? 0.25 : 0.12,
                pointerEvents: 'none',
              }} />

              {/* Label at spread position */}
              <div
                className="depth-event-marker"
                style={{ top: labelYs[idx], transform: 'translateY(-50%)' }}
                title={`Depth ≈ ${cl.depth} m\nWells: ${cl.wellIds}\n${cl.tooltip}`}
              >
                <div
                  className="event-diamond"
                  style={{
                    background: color,
                    opacity: isNear ? 1 : 0.45,
                    width: cl.count > 1 ? 9 : 6,
                    height: cl.count > 1 ? 9 : 6,
                  }}
                />
                <div className="event-name" style={{ opacity: isNear ? 1 : 0.6 }}>
                  {cl.label}
                </div>
                {cl.count > 1 && (
                  <div style={{ fontSize: 8, color: 'var(--text-3)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                    ×{cl.count}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Active depth indicator */}
        <div className="active-depth-label" style={{ top: `${activePct}%` }}>
          {Math.round(activeDepth)}
        </div>
        <div className="active-depth-indicator" style={{ top: `${activePct}%` }} />
      </div>

      {/* Legend */}
      <div className="depth-legend-strip">
        {[
          ['var(--inc-stuck)',  'Stuck Pipe'],
          ['var(--inc-loss)',   'Mud Loss'],
          ['var(--inc-kick)',   'Kick / Overpressure'],
        ].map(([c, l]) => (
          <div key={l} className="dl-entry">
            <div className="dl-diamond" style={{ background: c }} />
            {l}
          </div>
        ))}
        <div className="dl-entry" style={{ marginTop: 2 }}>
          <div className="dl-bar" style={{ background: 'var(--info)' }} />
          Current depth
        </div>
      </div>
    </div>
  )
}
