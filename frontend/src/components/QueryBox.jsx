import { useState } from 'react'

const CHIPS = ['Stuck pipe at 1150m?', 'Jodhpur Sandstone risks?', 'FB-A mitigation?']

export default function QueryBox() {
  const [q, setQ]     = useState('')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  const ask = async (question) => {
    const query = question || q
    if (!query.trim()) return
    setLoading(true)
    try {
      const r = await fetch('/api/query', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ question: query })
      })
      const d = await r.json()
      setRes(d)
    } catch {
      setRes({ answer: 'Backend unavailable. Check that uvicorn is running.', sources: [] })
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Geological memory — query</span>
      </div>
      <div className="card-body">
        <div className="query-wrap">
          <input
            className="query-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask about any depth or formation..."
          />
          <button className="query-btn" onClick={() => ask()}>Ask</button>
        </div>
        <div className="query-chips">
          {CHIPS.map(c => (
            <div key={c} className="chip"
              onClick={() => { setQ(c); ask(c) }}>{c}</div>
          ))}
        </div>
        {loading && (
          <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'var(--font-mono)', padding:'8px 0' }}>
            Searching geological memory...
          </div>
        )}
        {res && !loading && (
          <div className="query-result">
            <div className="result-tag">Retrieved from offset wells</div>
            <div className="result-text">{res.answer}</div>
            {res.sources?.length > 0 && (
              <div className="result-sources">Sources: {res.sources.join(' · ')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
