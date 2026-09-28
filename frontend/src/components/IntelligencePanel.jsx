import { useState } from 'react'
import { intelligenceService } from '../services/api'

const FACTOR_COLORS = ['var(--chart-torque)', 'var(--warn)', 'var(--warn)']

export default function IntelligencePanel({ riskData, alerts, well, incidents, activeDepth, onNavigate }) {
  const [queryText, setQueryText] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [querying, setQuerying] = useState(false)

  const score    = riskData?.score    ?? 0
  const level    = riskData?.risk_level ?? 'low'
  const factors  = riskData?.top_factors ?? ['Historical incidents','Mud weight deviation','Torque anomaly']
  const isHigh   = level === 'high' || level === 'critical'
  const scoreColor = isHigh ? 'var(--risk-high)' : level==='medium' ? 'var(--warn)' : 'var(--ok)'

  const CONTRIBUTIONS = [45, 25, 20]

  const doQuery = async (q) => {
    const question = q || queryText
    if (!question.trim()) return
    setQuerying(true)
    try {
      const res = await intelligenceService.queryMemory(question)
      setQueryResult(res)
    } catch { setQueryResult({answer:'Backend unavailable.',sources:[]}) }
    setQuerying(false)
  }

  const EXAMPLE_QUERIES = [
    'What happened at 1,150 m?',
    'Jodhpur Sandstone risks?',
    'Stuck pipe mitigation?',
  ]

  return (
    <aside className="intelligence-panel">

      {/* RISK SUMMARY */}
      <div className="intel-header">
        <div className="intel-label">Drilling intelligence</div>

        <div className="risk-summary-block">
          <div className="risk-score-display" style={{color:scoreColor}}>{score}</div>
          <div className="risk-text-block">
            <div className="risk-category" style={{color:scoreColor}}>
              {level === 'critical' ? 'Critical risk'
               : level === 'high' ? 'High risk'
               : level === 'medium' ? 'Moderate risk' : 'Normal'}
            </div>
            <div className="risk-primary-threat">
              {riskData?.recommendation?.slice(0,48) ?? 'Stuck pipe — primary threat'}
            </div>
            <div className="risk-interval" style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-2)'}}>
              {Math.round(activeDepth-43).toLocaleString()}–{Math.round(activeDepth+57).toLocaleString()} m window
            </div>
            <div className="risk-confidence">Confidence 91% · 3 offset wells</div>
          </div>
        </div>

        <div>
          <div className="sub-label">Risk contributors</div>
          {factors.slice(0,3).map((f,i) => (
            <div key={i} className="factor-row">
              <div className="factor-name">{f}</div>
              <div className="factor-track">
                <div className="factor-fill"
                  style={{width:`${(CONTRIBUTIONS[i]/50)*100}%`, background:FACTOR_COLORS[i]}}/>
              </div>
              <div className="factor-score">+{CONTRIBUTIONS[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EVIDENCE CHAIN */}
      <div className="intel-body">
        <div className="chain-section">
          
          <div className="sub-label">Intelligence hierarchy</div>

          {/* 1. CURRENT RISK SIGNAL */}
          <div className="chain-item" style={{ marginTop: 8 }}>
            <div className="chain-node cn-signal">!</div>
            <div className="chain-content-block">
              <div className="chain-step-label">Current Risk Signal</div>
              <div className="chain-text" style={{ fontWeight: 500, color: 'var(--text)' }}>
                Torque anomaly detected. Mud weight (1.15 SG) is critically below recommended threshold for this depth in Jodhpur Sandstone.
              </div>
            </div>
          </div>

          {/* 2. INSTITUTIONAL MEMORY */}
          <div className="chain-item">
            <div className="chain-node cn-why">
              <i className="ti ti-database" style={{ fontSize: 10 }} />
            </div>
            <div className="chain-content-block">
              <div className="chain-step-label">Institutional Memory (Evidence)</div>
              <div className="chain-text">
                NWIS retrieved <strong>6 relevant incidents</strong> across <strong>3 offset wells</strong> in the Jodhpur Sandstone interval (1,100–1,200 m).
              </div>
              <div className="evidence-pills" style={{ marginTop: 8 }}>
                <span className="evidence-pill">OIL-003 · Stuck Pipe (1,148m)</span>
                <span className="evidence-pill">OIL-004 · Torque Spike (1,162m)</span>
                <span className="evidence-pill">OIL-005 · Stuck Pipe (1,155m)</span>
              </div>
            </div>
          </div>

          {/* 3. RECOMMENDED ACTION */}
          <div className="chain-item">
            <div className="chain-node cn-rec">→</div>
            <div className="chain-content-block">
              <div className="chain-step-label">Recommended Action</div>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 6, marginTop: 4 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Increase mud weight before 1,130 m</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>1.15 SG</span>
                  <span style={{ color: '#64748b' }}>→</span>
                  <span style={{ fontSize: 13, color: '#166534', fontWeight: 600, background: '#bbf7d0', padding: '2px 6px', borderRadius: 4 }}>1.25 SG</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 8, lineHeight: 1.4 }}>
                  Based on successful historical mitigation in <strong>OIL-003</strong> which applied this exact adjustment to resolve differential sticking.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* GEOLOGICAL QUERY — not a chatbox, a research interface */}
        <div className="separator"/>
        <div style={{padding:'14px 16px'}}>
          <div className="sub-label" style={{marginBottom:8}}>Geological memory</div>
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            <input
              value={queryText}
              onChange={e=>setQueryText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doQuery()}
              placeholder="Query offset well records..."
              style={{
                flex:1, background:'var(--surface-2)',
                border:'1px solid var(--border)', borderRadius:4,
                padding:'7px 10px', fontSize:12,
                color:'var(--text)', outline:'none',
                fontFamily:'var(--font-ui)'
              }}
            />
            <button
              onClick={()=>doQuery()}
              disabled={querying}
              style={{
                background:'var(--info)', color:'white',
                border:'none', borderRadius:4,
                padding:'0 14px', fontSize:12,
                fontWeight:500, cursor:'pointer'
              }}
            >
              {querying ? '…' : 'Search'}
            </button>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
            {EXAMPLE_QUERIES.map(q => (
              <div key={q}
                onClick={()=>{setQueryText(q);doQuery(q)}}
                style={{
                  fontSize:11, padding:'3px 9px',
                  background:'var(--surface-2)',
                  border:'1px solid var(--border)',
                  borderRadius:3, color:'var(--text-2)',
                  cursor:'pointer'
                }}
              >{q}</div>
            ))}
          </div>
          {queryResult && (
            <div style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:4,padding:'10px 12px'}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>
                Retrieved from offset records
              </div>
              <div style={{fontSize:12,color:'var(--text)',lineHeight:1.6}}>{queryResult.answer}</div>
              {queryResult.sources?.length>0 && (
                <div style={{marginTop:7,fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text-3)'}}>
                  Sources: {queryResult.sources.join(' · ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SELECTED WELL DETAILS */}
        {well && (
          <>
            <div className="separator"/>
            <div style={{padding:'14px 16px'}}>
              <div className="sub-label" style={{marginBottom:8}}>
                {well.name} — incident history
              </div>
              {incidents.length === 0 ? (
                <div style={{fontSize:12,color:'var(--text-3)'}}>No incidents recorded for this well.</div>
              ) : incidents.map(inc => (
                <div key={inc.incident_id} style={{
                  padding:'9px 0', borderBottom:'1px solid var(--border)',
                  borderLeft:`2px solid ${
                    inc.incident_type==='stuck_pipe' ? 'var(--inc-stuck)' :
                    inc.incident_type==='mud_loss'   ? 'var(--inc-loss)'  :
                    inc.incident_type==='kick'       ? 'var(--inc-kick)'  : 'var(--inc-torque)'
                  }`,
                  paddingLeft:8, marginBottom:0
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--text-2)'}}>
                      {inc.incident_type.replace(/_/g,' ')}
                    </span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-3)'}}>
                      {inc.depth_m} m
                    </span>
                  </div>
                  <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.5,marginBottom:3}}>
                    {inc.description?.slice(0,90)}…
                  </div>
                  <div style={{fontSize:11,color:'var(--ok)',fontWeight:500}}>
                    ↳ {inc.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* SOURCE PROVENANCE */}
      <div className="source-section">
        <div className="sub-label" style={{marginBottom:8}}>Source evidence</div>
        {[
          ['WCR-003.pdf',             'Page 47 — drilling incidents'],
          ['DDR-OIL003-1148',         'Daily drilling report'],
          ['Mud log · 1140–1160 m',   'Mud logging record'],
        ].map(([doc, page]) => (
          <div key={doc} className="source-item">
            <div>
              <div className="source-doc-name">{doc}</div>
              <div className="source-doc-page">{page}</div>
            </div>
            <div className="source-link" onClick={() => onNavigate && onNavigate('Reports')}>View</div>
          </div>
        ))}
      </div>

    </aside>
  )
}
