import React from 'react'

export default function RiskAnalysis() {
  return (
    <div style={{ padding: 24, height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Risk Analysis Engine (Prototype)</h2>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Explainable risk scoring based on real-time telemetry and historical memory.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        
        {/* Left Column: Score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 16 }}>Current Risk Score</div>
            <div style={{ fontSize: 64, fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>65</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginTop: 8 }}>HIGH RISK</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 16, background: 'var(--page)', padding: '8px', borderRadius: 4 }}>
              Trend: <strong style={{ color: '#dc2626' }}>Rising rapidly</strong> over last 15 mins.
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 16 }}>Confidence Metrics</div>
            <Metric label="Data Quality" value="High (98%)" />
            <Metric label="Offset Matches" value="3 Wells" />
            <Metric label="Model Type" value="Rule-based Heuristic" />
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 16, fontStyle: 'italic', lineHeight: 1.5 }}>
              *This is a prototype scoring engine designed to demonstrate data relationships, not a validated machine-learning model.
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Risk Breakdown (Explainability)</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Factor label="Historical Pattern Match (Stuck Pipe)" score="+45" color="#dc2626" width="90%" detail="Jodhpur Sandstone is a known danger zone. 3 offset wells experienced differential sticking at this depth." />
              <Factor label="Real-time Torque Anomaly" score="+20" color="#d97706" width="40%" detail="Brief spike to 8.7 kNm detected 10 minutes ago." />
              <Factor label="Mud Weight Deviation" score="+15" color="#d97706" width="30%" detail="Current 1.15 SG is below the historically successful mitigation threshold of 1.25 SG." />
              <Factor label="Depth in target window" score="+5" color="#2563eb" width="10%" detail="Approaching 1,148 m TVD where INC-1 occurred." />
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function Factor({ label, score, color, width, detail }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{score}</div>
      </div>
      <div style={{ height: 6, background: 'var(--page)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width, background: color }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{detail}</div>
    </div>
  )
}
