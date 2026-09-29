import { useEffect, useRef, useState } from 'react'
import { MOCK_INCIDENTS } from '../services/api'

// Group incidents by depth buckets to avoid label overlap
function clusterIncidents(incidents, bucketSize = 40) {
  const buckets = {}
  incidents.forEach(inc => {
    const key = Math.round(inc.depth_m / bucketSize) * bucketSize
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(inc)
  })
  return Object.entries(buckets).map(([depth, incs]) => ({
    depth: Number(depth),
    label: incs.length > 1 ? `${incs.length} events` : `${incs[0].well_id}`,
    type: incs[0].incident_type,
    count: incs.length,
  }))
}

const INCIDENT_COLORS = {
  stuck_pipe:       '#ef4444',
  mud_loss:         '#f97316',
  kick:             '#a855f7',
  overpressure_zone:'#3b82f6',
}

export default function TelemetryChart({ streamHistory }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const clusters = clusterIncidents(MOCK_INCIDENTS)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const W = container.clientWidth
    const H = container.clientHeight
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    const PAD_LEFT = 52
    const PAD_RIGHT = 60
    const PAD_TOP = 28
    const PAD_BOT = 28
    const CHART_W = W - PAD_LEFT - PAD_RIGHT
    const CHART_H = H - PAD_TOP - PAD_BOT

    if (!streamHistory || streamHistory.length < 2) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for telemetry stream…', W / 2, H / 2)
      return
    }

    const depths  = streamHistory.map(r => r.depth)
    const torques = streamHistory.map(r => r.torque)
    const muds    = streamHistory.map(r => r.mud)

    const minDepth = Math.min(...depths) - 20
    const maxDepth = Math.max(...depths) + 20
    const depthRange = maxDepth - minDepth || 1

    const minTorque = 0, maxTorque = 12
    const minMud = 1.0, maxMud = 1.5

    // Helpers
    const yFromDepth = d => PAD_TOP + ((d - minDepth) / depthRange) * CHART_H
    const xFromTorque = t => PAD_LEFT + ((t - minTorque) / (maxTorque - minTorque)) * CHART_W
    const xFromMud = m => PAD_LEFT + ((m - minMud) / (maxMud - minMud)) * CHART_W

    // --- Background ---
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Chart area bg
    const grad = ctx.createLinearGradient(PAD_LEFT, 0, PAD_LEFT + CHART_W, 0)
    grad.addColorStop(0, 'rgba(0,51,102,0.08)')
    grad.addColorStop(1, 'rgba(243,112,33,0.05)')
    ctx.fillStyle = grad
    ctx.fillRect(PAD_LEFT, PAD_TOP, CHART_W, CHART_H)

    // --- Grid lines (horizontal = depth ticks) ---
    const depthStep = depthRange < 100 ? 20 : depthRange < 300 ? 50 : 100
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let d = Math.ceil(minDepth / depthStep) * depthStep; d <= maxDepth; d += depthStep) {
      const y = yFromDepth(d)
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT, y)
      ctx.lineTo(PAD_LEFT + CHART_W, y)
      ctx.stroke()
    }

    // --- Depth axis labels (left) ---
    ctx.fillStyle = '#64748b'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'
    for (let d = Math.ceil(minDepth / depthStep) * depthStep; d <= maxDepth; d += depthStep) {
      const y = yFromDepth(d)
      ctx.fillText(`${d}m`, PAD_LEFT - 6, y + 3)
      // tick
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT - 3, y)
      ctx.lineTo(PAD_LEFT, y)
      ctx.stroke()
    }

    // --- Torque axis (top, red) ---
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('← Torque (kNm)', PAD_LEFT + CHART_W * 0.25, PAD_TOP - 10)
    for (let t = 0; t <= 12; t += 3) {
      const x = xFromTorque(t)
      ctx.fillStyle = '#64748b'
      ctx.font = '9px monospace'
      ctx.fillText(t, x, PAD_TOP - 2)
    }

    // --- Mud axis (bottom, blue) ---
    ctx.fillStyle = '#3b82f6'
    ctx.font = 'bold 9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Mud Weight (SG) →', PAD_LEFT + CHART_W * 0.7, H - 4)
    for (let m = 1.0; m <= 1.5; m += 0.1) {
      const x = xFromMud(parseFloat(m.toFixed(1)))
      ctx.fillStyle = '#64748b'
      ctx.font = '9px monospace'
      ctx.fillText(m.toFixed(1), x, H - PAD_BOT + 14)
    }

    // --- Historical incident markers (with collision-avoidance labels) ---
    // Step 1: compute desired y positions only for visible clusters
    const visibleClusters = clusters
      .filter(cl => cl.depth >= minDepth && cl.depth <= maxDepth)
      .map(cl => ({ ...cl, y: yFromDepth(cl.depth) }))
      .sort((a, b) => a.y - b.y)

    // Step 2: collision-avoidance — push labels apart so they never overlap
    const MIN_GAP = 14  // px minimum between label centres
    const labelY = visibleClusters.map(cl => cl.y)  // start at exact depth position
    let changed = true
    for (let pass = 0; pass < 30 && changed; pass++) {
      changed = false
      for (let i = 1; i < labelY.length; i++) {
        const gap = labelY[i] - labelY[i - 1]
        if (gap < MIN_GAP) {
          const push = (MIN_GAP - gap) / 2
          labelY[i - 1] -= push
          labelY[i]     += push
          changed = true
        }
      }
    }

    // Step 3: draw dashed depth line at actual depth, label at collision-free y
    visibleClusters.forEach((cl, idx) => {
      const yLine  = cl.y          // true depth position for dashed line
      const yLabel = labelY[idx]   // collision-free label position
      const color  = INCIDENT_COLORS[cl.type] || '#f97316'

      // Dashed line across chart at actual depth
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT, yLine)
      ctx.lineTo(PAD_LEFT + CHART_W, yLine)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      // Connector line from right edge to label if they diverge
      const RX = PAD_LEFT + CHART_W + 4
      if (Math.abs(yLabel - yLine) > 4) {
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(RX + 2, yLine)
        ctx.lineTo(RX + 2, yLabel)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }

      // Diamond marker at true depth on right edge
      ctx.fillStyle = color
      ctx.save()
      ctx.translate(RX + 2, yLine)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-3, -3, 6, 6)
      ctx.restore()

      // Background pill for label readability
      const labelText = cl.label
      ctx.font = 'bold 8px monospace'
      const tw = ctx.measureText(labelText).width
      ctx.fillStyle = 'rgba(15,23,42,0.82)'
      ctx.fillRect(RX + 8, yLabel - 8, tw + 6, 12)

      // Label text at collision-free position
      ctx.fillStyle = color
      ctx.textAlign = 'left'
      ctx.fillText(labelText, RX + 11, yLabel + 2)
    })

    // --- MUD WEIGHT line (blue, smooth) ---
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 2
    ctx.shadowColor = '#3b82f6'
    ctx.shadowBlur = 6
    ctx.beginPath()
    streamHistory.forEach((row, i) => {
      const x = xFromMud(row.mud)
      const y = yFromDepth(row.depth)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.shadowBlur = 0

    // --- TORQUE line (red/orange) ---
    ctx.strokeStyle = '#f87171'
    ctx.lineWidth = 2
    ctx.shadowColor = '#ef4444'
    ctx.shadowBlur = 6
    ctx.beginPath()
    streamHistory.forEach((row, i) => {
      const x = xFromTorque(row.torque)
      const y = yFromDepth(row.depth)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.shadowBlur = 0

    // --- Current depth indicator ---
    const latestDepth = depths[depths.length - 1]
    const yNow = yFromDepth(latestDepth)
    ctx.strokeStyle = '#f37021'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(PAD_LEFT - 3, yNow)
    ctx.lineTo(PAD_LEFT + CHART_W, yNow)
    ctx.stroke()

    // Active depth label
    ctx.fillStyle = '#f37021'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`▶ ${latestDepth}m`, PAD_LEFT - 6, yNow - 3)

    // --- Legend box (bottom-left) ---
    const LX = PAD_LEFT + 8
    const LY = PAD_TOP + CHART_H - 56
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.roundRect(LX - 4, LY - 4, 130, 52, 4)
    ctx.fill()

    const legend = [
      { color: '#f87171', label: 'Torque (kNm)' },
      { color: '#60a5fa', label: 'Mud Weight (SG)' },
      { color: '#f37021', label: 'Current depth' },
    ]
    legend.forEach((l, i) => {
      ctx.fillStyle = l.color
      ctx.fillRect(LX, LY + i * 16, 14, 2)
      ctx.fillStyle = '#cbd5e1'
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(l.label, LX + 18, LY + i * 16 + 3)
    })

  }, [streamHistory, clusters])

  return (
    <div className="telemetry-section" style={{ background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="section-header" style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pip-blink 2s ease-in-out infinite' }} />
          <span className="section-label" style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.08em' }}>
            DRILLING PARAMETERS — DEPTH CORRELATION
          </span>
        </div>
        <div className="tag-row">
          <span className="data-tag tag-live">Live SSE</span>
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
            {streamHistory?.length || 0} pts
          </span>
        </div>
      </div>

      {/* Axis labels row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 16px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#64748b', fontFamily: 'monospace', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 14, height: 2, background: '#f87171', display: 'inline-block' }} />
            Torque kNm [0–12]
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 14, height: 2, background: '#60a5fa', display: 'inline-block' }} />
            Mud Wt SG [1.0–1.5]
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 14, height: 2, background: '#f37021', display: 'inline-block' }} />
            Current Depth
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 14, height: 0, borderTop: '2px dashed #ef4444', display: 'inline-block', opacity: 0.6 }} />
            Historical Events
          </span>
        </div>
      </div>

      {/* Canvas chart */}
      <div ref={containerRef} className="chart-container" style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#0f172a', minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  )
}
