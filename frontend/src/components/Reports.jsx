import React, { useState, useMemo } from 'react'
import { MOCK_DOCS } from '../services/api'

export default function Reports({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedDoc, setSelectedDoc] = useState(null)

  const types = ['All', ...new Set(MOCK_DOCS.map(d => d.type))]

  const filteredDocs = useMemo(() => {
    return MOCK_DOCS.filter(doc => {
      if (typeFilter !== 'All' && doc.type !== typeFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!doc.id.toLowerCase().includes(q) && !doc.well.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [query, typeFilter])

  return (
    <div style={{ display: 'flex', height: '100%', boxSizing: 'border-box' }}>
      
      {/* Left List Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--page)' }}>
        
        <div style={{ padding: '20px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Historical Reports Repository</h2>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Bikaner-Nagaur basin · Synthetic data</div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ position: 'relative', width: 300 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input 
                type="text" placeholder="Search by filename or well..." value={query} onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: 13, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--page)', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Type:</span>
              <select 
                value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 13, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)' }}
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 100px 120px', padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              <div>Document</div>
              <div>Report Type</div>
              <div>Well</div>
              <div>Date</div>
              <div>Status</div>
            </div>
            
            <div>
              {filteredDocs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>No documents match the search criteria.</div>
              ) : (
                filteredDocs.map(doc => {
                  const isSelected = selectedDoc?.id === doc.id
                  return (
                    <div 
                      key={doc.id} onClick={() => setSelectedDoc(doc)}
                      style={{ 
                        display: 'grid', gridTemplateColumns: '1fr 200px 100px 100px 120px', padding: '16px', 
                        borderBottom: '1px solid var(--border)', fontSize: 12, alignItems: 'center', cursor: 'pointer',
                        background: isSelected ? 'var(--info-bg)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--info)' : '3px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ti ti-file-text" style={{ color: doc.status === 'Processed' ? 'var(--info)' : 'var(--text-3)', fontSize: 16 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{doc.id}</span>
                      </div>
                      <div style={{ color: 'var(--text-2)' }}>{doc.type}</div>
                      <div style={{ fontWeight: 500 }}>{doc.well}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{doc.date}</div>
                      <div>
                        <span style={{ fontSize: 10, padding: '2px 8px', background: doc.status === 'Processed' ? '#dcfce7' : '#fef3c7', color: doc.status === 'Processed' ? '#16a34a' : '#d97706', borderRadius: 12, border: '1px solid currentColor', fontWeight: 600 }}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Right Detail Panel */}
      {selectedDoc && (
        <div style={{ width: 340, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Details</div>
            <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </div>
          
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ width: 80, height: 100, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <i className="ti ti-file-text" style={{ fontSize: 40, color: 'var(--border-strong)' }} />
                {selectedDoc.status === 'Processed' && (
                  <div style={{ position: 'absolute', bottom: -8, right: -8, background: '#16a34a', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-check" style={{ fontSize: 14 }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{selectedDoc.id}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{selectedDoc.type}</div>
            </div>

            <div style={{ background: 'var(--page)', border: '1px solid var(--border)', borderRadius: 6, padding: 16, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, fontSize: 12 }}>
                <div style={{ color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Well</div>
                <div style={{ color: 'var(--text)', fontWeight: 600 }}>{selectedDoc.well}</div>
                
                <div style={{ color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Date</div>
                <div style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{selectedDoc.date}</div>
                
                <div style={{ color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                <div>
                  <span style={{ fontSize: 10, padding: '2px 8px', background: selectedDoc.status === 'Processed' ? '#dcfce7' : '#fef3c7', color: selectedDoc.status === 'Processed' ? '#16a34a' : '#d97706', borderRadius: 12, border: '1px solid currentColor', fontWeight: 600 }}>
                    {selectedDoc.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedDoc.status === 'Processed' ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Extracted Intelligence</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', padding: 12, borderRadius: 4, lineHeight: 1.6 }}>
                  Entities successfully extracted. Document added to institutional memory and available for semantic search queries.
                </div>
                <button 
                  onClick={() => onNavigate('DocInt')}
                  style={{ width: '100%', padding: '10px', marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--info)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <i className="ti ti-scan" /> View processing record
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Action Required</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
                  This document has not yet been processed by the NLP pipeline. Its contents are not currently indexed for semantic search.
                </div>
                <button 
                  onClick={() => onNavigate('DocInt')}
                  style={{ width: '100%', padding: '10px', background: 'var(--info)', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <i className="ti ti-wand" /> Process with AI
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
