import { useEffect, useRef, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0d1829', border:'1px solid #1e3554', borderRadius:6, padding:'8px 12px', fontFamily:'monospace', fontSize:11 }}>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom:2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function LiveChart({ onDepthUpdate, onAlert, onStreamData }) {
  const [data, setData]           = useState([])
  const [alertDepth, setAlertDepth] = useState(null)
  const esRef                     = useRef(null)

  useEffect(() => {
    const es = new EventSource('/api/stream/telemetry')
    esRef.current = es

    es.onmessage = (e) => {
      const row = JSON.parse(e.data)
      if (row.event === 'loop_reset') return

      const point = {
        depth:  row.depth_m,
        torque: +row.torque_knm.toFixed(2),
        mud:    +row.mud_weight_sg.toFixed(3),
      }
      setData(prev => [...prev.slice(-60), point])
      onStreamData?.(row)
      onDepthUpdate?.(row.depth_m)

      if (row.alert_flag === 1 && !alertDepth) {
        setAlertDepth(row.depth_m)
        onAlert?.(row.alert_message || 'Anomaly detected in telemetry stream.')
      }
      if (row.proactive_alert) onAlert?.(row.proactive_message)
    }

    return () => es.close()
  }, [])

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Live telemetry</span>
        <div style={{ display:'flex', gap:16, fontSize:11, fontFamily:'var(--font-mono)' }}>
          <span>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#ef4444', marginRight:5 }}/>
            Torque kNm
          </span>
          <span>
            <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#3b82f6', marginRight:5 }}/>
            Mud SG
          </span>
        </div>
      </div>
      <div className="card-body" style={{ padding:'12px 14px' }}>
        {data.length === 0 ? (
          <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontFamily:'var(--font-mono)', fontSize:12 }}>
            Connecting to telemetry stream…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data} margin={{ top:4, right:4, bottom:0, left:-20 }}>
              <CartesianGrid stroke="#1a2d4a" strokeDasharray="3 3" vertical={false}/>
              <XAxis
                dataKey="depth"
                tick={{ fill:'#64748b', fontSize:10, fontFamily:'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="torque"
                domain={[0, 12]}
                tick={{ fill:'#64748b', fontSize:10, fontFamily:'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="mud"
                orientation="right"
                domain={[1.0, 1.4]}
                tick={{ fill:'#64748b', fontSize:10, fontFamily:'monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip/>}/>
              {alertDepth && (
                <ReferenceLine
                  yAxisId="torque"
                  x={alertDepth}
                  stroke="#ef4444"
                  strokeDasharray="4 3"
                  label={{ value:'SPIKE', fill:'#ef4444', fontSize:10, fontFamily:'monospace' }}
                />
              )}
              <Line
                yAxisId="torque"
                type="monotone"
                dataKey="torque"
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="mud"
                type="monotone"
                dataKey="mud"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
