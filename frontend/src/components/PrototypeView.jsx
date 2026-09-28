import React from 'react'

export default function PrototypeView({ title }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-3)', padding: 40, textAlign: 'center' }}>
      <i className="ti ti-tool" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{title} Module</h2>
      <p style={{ maxWidth: 400, fontSize: 13, lineHeight: 1.6 }}>
        This module is part of the broader NWIS intelligence architecture but is not the primary focus of this interactive prototype. 
        <br/><br/>
        Please navigate to <strong>Live monitoring</strong> or <strong>Doc intelligence</strong> to explore core functionality.
      </p>
    </div>
  )
}
