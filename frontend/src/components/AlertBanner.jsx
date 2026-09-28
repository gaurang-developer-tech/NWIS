export default function AlertBanner({ alerts }) {
  if (!alerts.length) return (
    <div style={{
      background:'var(--teal-bg)', border:'1px solid #003330',
      borderLeft:'3px solid var(--teal)', borderRadius:8,
      padding:'10px 14px', fontSize:12, color:'var(--teal)'
    }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:1, display:'block', marginBottom:3 }}>
        SYSTEM STATUS
      </span>
      ● Monitoring active — all parameters nominal
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {alerts.map(a => (
        <div
          key={a.id}
          className={`alert-banner${a.message.toLowerCase().includes('recommend') ? ' alert-proactive' : ''}`}
        >
          <div className="alert-type">
            {a.message.toLowerCase().includes('recommend')
              ? `⚡ Proactive alert — ${a.time}`
              : `⚠ Anomaly detected — ${a.time}`}
          </div>
          <div className="alert-msg">{a.message}</div>
          {a.message.toLowerCase().includes('recommend') && (
            <div className="alert-action">→ Review mitigation in geological memory</div>
          )}
        </div>
      ))}
    </div>
  )
}
