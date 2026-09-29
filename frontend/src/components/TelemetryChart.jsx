import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { MOCK_INCIDENTS } from '../services/api'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:4,padding:'8px 10px',fontSize:11,fontFamily:'var(--font-mono)'}}>
      <div style={{color:'var(--text-3)',marginBottom:4}}>{label} m</div>
      {payload.map(p => (
        <div key={p.name} style={{color:p.color,marginBottom:2}}>
          {p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(2):p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function TelemetryChart({ streamHistory }) {
  const [spikeDepth, setSpikeDepth] = useState(null)

  useEffect(() => {
    if (streamHistory && streamHistory.length > 0) {
      const latest = streamHistory[streamHistory.length - 1]
      // In the mock, alert_flag is derived if torque > 7.8
      if (latest.torque > 7.8) {
        setSpikeDepth(prev => prev || latest.depth)
      }
    }
  }, [streamHistory])

  const axisStyle = { fill:'var(--text-3)', fontSize:10, fontFamily:'var(--font-mono)' }

  return (
    <div className="telemetry-section">
      <div className="section-header">
        <span className="section-label">Drilling parameters</span>
        <div className="tag-row">
          <span className="data-tag tag-live">Live</span>
          <span className="data-tag tag-predicted">Predicted</span>
        </div>
      </div>
      <div className="chart-legend">
        <div className="cl-swatch">
          <div className="cl-line-solid" style={{background:'var(--chart-torque)'}}/>
          <span>Torque kNm</span>
        </div>
        <div className="cl-swatch">
          <div className="cl-line-solid" style={{background:'var(--chart-mud)'}}/>
          <span>Mud weight SG</span>
        </div>
        <div className="cl-swatch">
          <div className="cl-line-dashed"/>
          <span>Predicted</span>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart layout="vertical" data={streamHistory} margin={{top:20,right:20,bottom:20,left:0}}>
            <CartesianGrid stroke="var(--border)" horizontal={true} vertical={false} strokeDasharray="3 3"/>
            <XAxis
              type="number"
              xAxisId="t"
              domain={[0,12]}
              orientation="top"
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
            />
            <XAxis
              type="number"
              xAxisId="m"
              orientation="bottom"
              domain={[1.0,1.4]}
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="depth"
              yAxisId="depth"
              domain={['dataMin - 10', 'dataMax + 10']}
              reversed={true}
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<ChartTooltip/>}/>
            {spikeDepth && (
              <ReferenceLine
                yAxisId="depth" y={Math.round(spikeDepth)}
                stroke="var(--risk-high)"
                strokeDasharray="4 3"
                label={{value:'anomaly',fill:'var(--risk-high)',fontSize:10,fontFamily:'var(--font-mono)',position:'insideTopRight'}}
              />
            )}
            
            {/* Historical events markers */}
            {MOCK_INCIDENTS.map(inc => (
              <ReferenceLine
                key={inc.incident_id}
                yAxisId="depth"
                y={inc.depth_m}
                stroke="#d97706"
                strokeOpacity={0.6}
                strokeDasharray="2 2"
                label={{ value: `${inc.well_id} ${inc.incident_type}`, fill:'#d97706', fontSize:9, position:'insideTopLeft' }}
              />
            ))}

            <Line xAxisId="t" yAxisId="depth" type="monotone" dataKey="torque" stroke="var(--chart-torque)" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Torque"/>
            <Line xAxisId="m" yAxisId="depth" type="monotone" dataKey="mud"    stroke="var(--chart-mud)"   strokeWidth={1.5} dot={false} isAnimationActive={false} name="Mud wt"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
