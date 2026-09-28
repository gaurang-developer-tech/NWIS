// Semicircle: center (70,65), radius 52
// Arc from 180° to 0° (left to right)
// Point on arc: x = cx + r*cos(θ), y = cy - r*sin(θ)  
// θ in radians. 180°=π, 0°=0
// For score 0-100: θ = π - (score/100)*π
// SVG arc: M startX startY A rx ry 0 large-arc sweep endX endY

export default function RiskGauge({ riskData }) {
  const score = riskData?.score ?? 0
  const level = riskData?.risk_level ?? 'low'
  const factors = riskData?.top_factors ?? []

  const cx = 70, cy = 65, r = 52
  const startX = cx - r, startY = cy
  const angle  = Math.PI - (score / 100) * Math.PI
  const endX   = cx + r * Math.cos(angle)
  const endY   = cy - r * Math.sin(angle)
  const largeArc = score > 50 ? 1 : 0

  const arcColor = score >= 75 ? '#ef4444'
                 : score >= 50 ? '#f59e0b'
                 : score >= 25 ? '#3b82f6'
                 :               '#14b8a6'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Risk assessment</span>
        <span className={`badge ${level === 'critical' || level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low'}`}>
          {level.toUpperCase()}
        </span>
      </div>
      <div className="card-body">
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <svg width="140" height="80" viewBox="0 0 140 80">
            <path
              d={`M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}`}
              fill="none" stroke="#1a2d4a" strokeWidth="10" strokeLinecap="round"
            />
            {score > 0 && (
              <path
                d={`M${startX} ${startY} A${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
                fill="none" stroke={arcColor} strokeWidth="10" strokeLinecap="round"
              />
            )}
            <text x={cx} y={cy-8} textAnchor="middle"
              style={{ fontSize:26, fontWeight:700, fontFamily:'monospace', fill:arcColor }}>
              {score}
            </text>
            <text x={cx} y={cy+8} textAnchor="middle"
              style={{ fontSize:10, fill:'#64748b', fontFamily:'monospace' }}>
              / 100
            </text>
          </svg>

          <div style={{ flex:1 }}>
            {factors.slice(0,3).map((f, i) => {
              const contribution = [45,25,20][i] ?? 10
              const color = i === 0 ? '#ef4444' : '#f59e0b'
              return (
                <div key={i} className="factor-row">
                  <div className="factor-label">
                    <span>{f}</span>
                    <span className="factor-val" style={{ color }}>+{contribution}</span>
                  </div>
                  <div className="factor-bar-track">
                    <div className="factor-bar"
                      style={{ width:`${(contribution/50)*100}%`, background:color }}/>
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
