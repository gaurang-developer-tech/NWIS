import React, { useState, useRef } from 'react'

const INITIAL_DOCS = [
  { id: 'WCR_003.pdf', type: 'Well Completion Report', date: '2022-04-12', well: 'OIL-003', status: 'Processed', preview: null, extracted: true },
  { id: 'DDR_004_1162.pdf', type: 'Daily Drilling Report', date: '2023-01-08', well: 'OIL-004', status: 'Processed', preview: null, extracted: true },
  { id: 'MUD_005.pdf', type: 'Mud Logging Record', date: '2023-05-19', well: 'OIL-005', status: 'Pending OCR', preview: null, extracted: false },
]

export default function DocumentIntelligence() {
  const [docs, setDocs] = useState(INITIAL_DOCS)
  const [selectedDoc, setSelectedDoc] = useState(INITIAL_DOCS[0])
  const fileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      alert('Invalid file format. Please upload a PDF.')
      e.target.value = ''
      return
    }

    const preview = URL.createObjectURL(file)
    const newDoc = {
      id: file.name,
      type: 'Uploaded Document',
      date: new Date().toISOString().split('T')[0],
      well: 'Processing...',
      status: 'Uploading...',
      preview,
      extracted: false,
      size: (file.size / 1024).toFixed(1) + ' KB',
      isUserUploaded: true,
      extractedData: null
    }
    
    setDocs(prev => [newDoc, ...prev])
    setSelectedDoc(newDoc)
    e.target.value = ''

    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('http://localhost:8000/api/extract-wcr', { method: 'POST', body: formData })
      const data = await res.json()
      
      const updatedDoc = {
        ...newDoc,
        well: data.well_id,
        status: 'Processed',
        extracted: true,
        extractedData: data.extracted_data
      }
      setDocs(prev => prev.map(d => d.id === file.name ? updatedDoc : d))
      setSelectedDoc(updatedDoc)
    } catch (err) {
      console.error(err)
      const errDoc = {
        ...newDoc,
        status: 'Failed',
      }
      setDocs(prev => prev.map(d => d.id === file.name ? errDoc : d))
      setSelectedDoc(errDoc)
    }
  }

  const handleRemove = (id) => {
    const nextDocs = docs.filter(d => d.id !== id)
    setDocs(nextDocs)
    if (selectedDoc?.id === id) setSelectedDoc(nextDocs[0] || null)
  }

  return (
    <div style={{ padding: 20, display: 'flex', gap: 20, height: '100%', boxSizing: 'border-box' }}>
      
      {/* Left List */}
      <div style={{ width: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>DOCUMENTS</span>
          <div>
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleUpload} style={{display:'none'}} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'var(--text)', color: 'var(--surface)', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
            >
              + Upload PDF
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {docs.map(doc => (
            <div 
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              style={{ 
                padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: selectedDoc?.id === doc.id ? 'var(--surface-2)' : 'transparent',
                borderLeft: selectedDoc?.id === doc.id ? '3px solid var(--border-focus)' : '3px solid transparent'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4, wordBreak: 'break-all' }}>{doc.id}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>{doc.type} · {doc.well}</div>
              <div style={{ display: 'inline-block', fontSize: 10, padding: '2px 6px', background: doc.status.includes('Processed')||doc.status.includes('Uploaded') ? '#dcfce7' : '#f1f5f9', color: doc.status.includes('Processed')||doc.status.includes('Uploaded') ? '#16a34a' : 'var(--text-3)', borderRadius: 4, border: '1px solid currentColor' }}>
                {doc.status}
              </div>
            </div>
          ))}
          {docs.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>No documents available.</div>}
        </div>
      </div>

      {/* Right Content */}
      <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>DOCUMENT INTELLIGENCE EXTRACTION</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Demo NLP extraction workflow</div>
        </div>

        {selectedDoc && selectedDoc.isUserUploaded && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--page)' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Filename</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>{selectedDoc.id}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Size</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{selectedDoc.size}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Status</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-check" /> Uploaded successfully
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 12px', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Replace</button>
              <button onClick={() => handleRemove(selectedDoc.id)} style={{ padding: '6px 12px', fontSize: 11, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
            </div>
          </div>
        )}

        {selectedDoc?.extracted ? (
          <div style={{ padding: 24, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              
              {/* PDF Preview */}
              <div style={{ flex: 1, border: '1px solid var(--border-strong)', background: '#f8f9fa', height: 600, padding: selectedDoc.preview ? 0 : 20, position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
                {selectedDoc.preview ? (
                  <iframe src={selectedDoc.preview} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                ) : (
                  <>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>PAGE 12 / 48</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.8 }}>
                      ...drilling continued through the <span style={{ background: '#fef08a', color: '#854d0e', padding: '0 4px' }}>Jodhpur Sandstone</span>. 
                      At <span style={{ background: '#fef08a', color: '#854d0e', padding: '0 4px' }}>1,148 m</span> TVD, we observed sudden torque fluctuations followed by an immediate <span style={{ background: '#fecaca', color: '#991b1b', padding: '0 4px' }}>stuck pipe</span> incident. 
                      Rotation was entirely lost. The primary cause was identified as <span style={{ background: '#bfdbfe', color: '#1e3a8a', padding: '0 4px' }}>differential pressure</span> due to overbalance in the permeable zone. 
                      Remedial action taken: we decided to <span style={{ background: '#bbf7d0', color: '#166534', padding: '0 4px' }}>increase mud weight to 1.25 SG</span> and spot an acid pill.
                    </div>
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '4px 8px', borderRadius: 4 }}>
                      NLP bounding boxes matched
                    </div>
                  </>
                )}
              </div>

              {/* Extraction Results */}
              <div style={{ flex: 1 }}>
                
                {selectedDoc.isUserUploaded && (
                  <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Ingestion</h4>
                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i className="ti ti-check" style={{ color: '#16a34a' }}/> File received</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i className="ti ti-check" style={{ color: '#16a34a' }}/> Document indexed for prototype workflow</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}><i className="ti ti-circle" /> OCR extraction — prototype/demo</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}><i className="ti ti-circle" /> NLP structuring — prototype/demo</div>
                    </div>
                  </div>
                )}

                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase' }}>Extracted Record — Demo</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(selectedDoc.extractedData ? [
                    ['Event type', selectedDoc.extractedData['Event Type'], '#fecaca', '#991b1b'],
                    ['Depth', selectedDoc.extractedData['Depth'], '#fef08a', '#854d0e'],
                    ['Formation', selectedDoc.extractedData['Formation'], '#fef08a', '#854d0e'],
                    ['Severity', selectedDoc.extractedData['Severity'], '#fee2e2', '#dc2626'],
                    ['Cause', selectedDoc.extractedData['Cause'], '#bfdbfe', '#1e3a8a'],
                    ['Mitigation', selectedDoc.extractedData['Mitigation'], '#bbf7d0', '#166534']
                  ] : [
                    ['Event type', 'Stuck Pipe', '#fecaca', '#991b1b'],
                    ['Depth', '1,148 m', '#fef08a', '#854d0e'],
                    ['Formation', 'Jodhpur Sandstone', '#fef08a', '#854d0e'],
                    ['Severity', 'High', '#fee2e2', '#dc2626'],
                    ['Cause', 'Differential Pressure', '#bfdbfe', '#1e3a8a'],
                    ['Mitigation', 'Increase mud weight to 1.25 SG', '#bbf7d0', '#166534']
                  ]).map(([label, val, bg, fg]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 500, background: bg, color: fg, padding: '2px 6px', borderRadius: 4 }}>
                          {val}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  <strong>Action taken:</strong> This record was automatically mapped to the NWIS institutional memory database and is now available to the real-time risk engine for active well correlation.
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            {selectedDoc ? 'This document has not been processed by the NLP engine yet.' : 'Please select or upload a document.'}
          </div>
        )}
      </div>

    </div>
  )
}
