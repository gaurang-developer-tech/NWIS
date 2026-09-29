import { useState, useEffect, useRef } from 'react'
import './App.css'
import MapView          from './components/MapView'
import TelemetryChart   from './components/TelemetryChart'
import DepthAxis        from './components/DepthAxis'
import IntelligencePanel from './components/IntelligencePanel'
import DocumentIntelligence from './components/DocumentIntelligence'
import AlertsCenter     from './components/AlertsCenter'
import LiveMonitoring   from './components/LiveMonitoring'
import NearbyWells      from './components/NearbyWells'
import WellComparison   from './components/WellComparison'
import GeologicalMemory from './components/GeologicalMemory'
import HistoricalEvents from './components/HistoricalEvents'
import RiskAnalysis     from './components/RiskAnalysis'
import Reports          from './components/Reports'
import PrototypeView    from './components/PrototypeView'

import { wellService, incidentService, riskService, telemetryService, MOCK_DOCS, MOCK_INCIDENTS } from './services/api'

export default function App() {
  const [wells,        setWells]        = useState([])
  const [allIncidents, setAllIncidents] = useState([])
  const [selectedWell, setSelectedWell] = useState(null)
  const [wellIncidents,setWellIncidents]= useState([])
  const [activeDepth,  setActiveDepth]  = useState(1050)
  const [streamRow,    setStreamRow]    = useState(null)
  const [streamHistory,setStreamHistory]= useState([])
  const [riskData,     setRiskData]     = useState(null)
  const [alerts,       setAlerts]       = useState([])
  const [activeNav,    setActiveNav]    = useState('Overview')

  // --- Header States ---
  const [isLive, setIsLive] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const [mapLayers, setMapLayers] = useState({
    boundary: true,
    radius: true,
    offsetWells: true,
    trajectories: false
  })

  // Close popovers on click outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.toolbar-actions')) {
        setShowLayers(false)
        setShowExport(false)
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  // --- Hoisted Telemetry ---
  const isLiveRef = useRef(isLive)
  useEffect(() => { isLiveRef.current = isLive }, [isLive])

  useEffect(() => {
    wellService.getWells().then(setWells).catch(()=>{})
    incidentService.getAllIncidents().then(setAllIncidents).catch(()=>{})

    const cleanup = telemetryService.subscribe(
      (row) => {
        if (!isLiveRef.current) return
        // Skip loop_reset events which have no telemetry fields
        if (row.event === 'loop_reset' || row.torque_knm == null || row.mud_weight_sg == null) return
        setActiveDepth(row.depth_m)
        setStreamRow(row)
        setStreamHistory(prev => [...prev.slice(-80), {
          depth: Math.round(row.depth_m),
          torque: +(row.torque_knm ?? 0).toFixed(2),
          mud: +(row.mud_weight_sg ?? 1.15).toFixed(3),
        }])

        riskService.getRiskScore({
          depth_m: row.depth_m,
          formation: 'Jodhpur Sandstone',
          fault_block: 'FB-A',
          mud_weight_sg: row.mud_weight_sg ?? 1.15,
          torque_knm: row.torque_knm ?? 6.0
        }).then(setRiskData).catch(()=>{})
      },
      (msg) => {
        if (!isLiveRef.current) return
        setAlerts(prev => [{id:Date.now(), msg, time: new Date().toLocaleTimeString()}, ...prev.slice(0,2)])
      }
    )
    return cleanup
  }, [])

  useEffect(() => {
    if (!selectedWell) return
    incidentService.getIncidentsByWell(selectedWell.well_id)
      .then(setWellIncidents).catch(()=>{})
  }, [selectedWell])

  const ACTIVE_WELL = {
    id: 'OIL-001',
    name: 'Baghewala-1',
    formation: 'Jodhpur Sandstone',
    faultBlock: 'FB-A',
    lat: 28.234,
    lon: 73.195,
  }

  // --- Export Logic ---
  const handleExport = (type) => {
    let filename = 'NWIS_Export.txt'
    let content = ''

    if (type === 'summary') {
      filename = `NWIS_${ACTIVE_WELL.id}_Well_Summary.txt`
      content = `NWIS WELL SUMMARY\n\nWell:\n${ACTIVE_WELL.id}\n\nName:\n${ACTIVE_WELL.name}\n\nFormation:\n${ACTIVE_WELL.formation}\n\nCurrent depth:\n${activeDepth.toLocaleString()} m TVD\n\nFault block:\n${ACTIVE_WELL.faultBlock}\n\nCurrent Risk Level:\n${riskData?.risk_level?.toUpperCase() || 'UNKNOWN'}\n\nData status:\nSynthetic prototype data`
    } else if (type === 'history') {
      filename = `NWIS_Historical_Events.csv`
      content = 'Incident ID,Well,Type,Depth,Severity,Cause\n'
      allIncidents.forEach(i => {
        content += `${i.incident_id},${i.well_id},${i.incident_type},${i.depth_m},${i.severity || 'High'},"${i.cause}"\n`
      })
    } else if (type === 'reports') {
      filename = `NWIS_Report_Index.csv`
      content = 'Report ID,Report Type,Well,Date,Status\n'
      MOCK_DOCS.forEach(d => {
        content += `${d.id},${d.type},${d.well},${d.date},${d.status}\n`
      })
    } else if (type === 'extracted') {
      filename = `NWIS_Extracted_Entity.json`
      content = JSON.stringify({ source: "Document Intelligence", entity: { well: "OIL-003", formation: "Jodhpur Sandstone", event: "Stuck Pipe" } }, null, 2)
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const NAV = [
    { group: 'Operations', items: [
      { label: 'Overview',         icon: 'ti-layout-dashboard', key: 'Overview' },
      { label: 'Live monitoring',  icon: 'ti-activity',         key: 'Live' },
      { label: 'Alerts',           icon: 'ti-bell',             key: 'Alerts', badge: alerts.length || null },
    ]},
    { group: 'Wells', items: [
      { label: 'Nearby wells',     icon: 'ti-map-pin',          key: 'Nearby' },
      { label: 'Well comparison',  icon: 'ti-git-compare',      key: 'Compare' },
    ]},
    { group: 'Intelligence', items: [
      { label: 'Geological memory',icon: 'ti-database',         key: 'Memory' },
      { label: 'Historical events',icon: 'ti-history',          key: 'History' },
      { label: 'Risk analysis',    icon: 'ti-trending-up',      key: 'Risk' },
    ]},
    { group: 'Knowledge', items: [
      { label: 'Reports',          icon: 'ti-file-description', key: 'Reports' },
      { label: 'Doc intelligence', icon: 'ti-scan',             key: 'DocInt' },
    ]},
  ]

  const currentLabel = NAV.flatMap(g => g.items).find(i => i.key === activeNav)?.label
  const hasMap = activeNav === 'Overview' || activeNav === 'Nearby'

  return (
    <div className="shell">

      {/* LEFT RAIL */}
      <aside className="rail">
        <div className="rail-header">
          <div className="product-wordmark" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/iocl-logo.svg" alt="Indian Oil Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <div>
              <div style={{fontWeight: 700, color: 'var(--iocl-saffron)', letterSpacing: '-0.2px', fontSize: '14px'}}>INDIAN OIL LIMITED</div>
              <div style={{fontSize: 10, color: '#8faac8', fontWeight: 500, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                NWIS eRTMAC <span style={{opacity:0.5}}>·</span> Prototype
              </div>
            </div>
          </div>
          <div className="well-identity">
            <div className="well-id-label">{ACTIVE_WELL.id}</div>
            <div className="well-name-heading">{ACTIVE_WELL.name}</div>
            <span className={isLive ? "status-pill drilling" : "status-pill"} style={{ background: isLive ? '#dcfce7' : '#f1f5f9', color: isLive ? '#166534' : '#475569' }}>
              {isLive && <span className="status-pip"/>}
              {isLive ? 'Drilling' : 'Paused'}
            </span>
            <div className="well-depth-block">
              <div className="depth-micro-label">Current depth</div>
              <div className="depth-display">
                {activeDepth.toLocaleString()}
                <span className="depth-unit">m TVD</span>
              </div>
              <div className="depth-formation">{ACTIVE_WELL.formation}</div>
              <div className="depth-fault">Fault Block {ACTIVE_WELL.faultBlock}</div>
            </div>
          </div>
        </div>

        <nav className="rail-nav">
          {NAV.map(group => (
            <div key={group.group}>
              <div className="nav-group-label">{group.group}</div>
              {group.items.map(item => (
                <div
                  key={item.key}
                  className={`nav-item${activeNav===item.key?' active':''}`}
                  onClick={()=>setActiveNav(item.key)}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true"/>
                  {item.label}
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* CENTER WORKSPACE */}
      <main className="center" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="workspace-toolbar">
          <div>
            <span className="toolbar-title">
              {activeNav === 'Overview' ? 'Operational overview' : currentLabel}
            </span>
            <span className="toolbar-breadcrumb"> · Bikaner-Nagaur basin · Synthetic data</span>
          </div>
          <div className="toolbar-actions">
            
            {/* Live Toggle */}
            <div 
              className="live-indicator" 
              onClick={() => setIsLive(!isLive)}
              style={{ cursor: 'pointer', background: isLive ? '#dcfce7' : '#f1f5f9', color: isLive ? '#166534' : '#475569', border: `1px solid ${isLive ? '#bbf7d0' : '#cbd5e1'}` }}
            >
              {isLive ? <span className="live-pip"/> : <i className="ti ti-player-pause" style={{ fontSize: 12, marginRight: 4 }} />}
              {isLive ? 'Live' : 'Paused'}
            </div>
            
            {/* Layers Dropdown */}
            {hasMap && (
              <div style={{ position: 'relative' }}>
                <button className={`btn-toolbar ${showLayers ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setShowLayers(!showLayers); setShowExport(false); }}>
                  <i className="ti ti-layers" style={{ marginRight: 6 }} /> Layers
                </button>
                {showLayers && (
                  <div className="popover-menu" onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Map Layers</div>
                    <label className="popover-item"><input type="checkbox" checked={mapLayers.offsetWells} onChange={() => setMapLayers(p => ({...p, offsetWells: !p.offsetWells}))} /> Nearby wells</label>
                    <label className="popover-item"><input type="checkbox" checked={mapLayers.radius} onChange={() => setMapLayers(p => ({...p, radius: !p.radius}))} /> Search radius</label>
                    <label className="popover-item"><input type="checkbox" checked={mapLayers.boundary} onChange={() => setMapLayers(p => ({...p, boundary: !p.boundary}))} /> Field boundary</label>
                    <label className="popover-item"><input type="checkbox" checked={mapLayers.trajectories} onChange={() => setMapLayers(p => ({...p, trajectories: !p.trajectories}))} /> Well trajectories</label>
                  </div>
                )}
              </div>
            )}

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button className={`btn-toolbar ${showExport ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setShowExport(!showExport); setShowLayers(false); }}>
                <i className="ti ti-download" style={{ marginRight: 6 }} /> Export
              </button>
              {showExport && (
                <div className="popover-menu" onClick={e => e.stopPropagation()}>
                  <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Export Data</div>
                  <div className="popover-action" onClick={() => handleExport('summary')}>Well summary (TXT)</div>
                  {(activeNav === 'History' || activeNav === 'Memory') && <div className="popover-action" onClick={() => handleExport('history')}>Historical events (CSV)</div>}
                  {activeNav === 'Reports' && <div className="popover-action" onClick={() => handleExport('reports')}>Report index (CSV)</div>}
                  {activeNav === 'DocInt' && <div className="popover-action" onClick={() => handleExport('extracted')}>Extracted record (JSON)</div>}
                </div>
              )}
            </div>

          </div>
        </div>

        {activeNav === 'Overview' ? (
          <>
            <MapView
              wells={wells}
              activeWell={selectedWell}
              onWellClick={setSelectedWell}
              activeDepth={activeDepth}
              mapLayers={mapLayers}
            />
            <div className="lower-split">
              <TelemetryChart streamHistory={streamHistory} />
              <DepthAxis
                incidents={allIncidents}
                activeDepth={activeDepth}
              />
            </div>
          </>
        ) : activeNav === 'Live' ? (
          <LiveMonitoring activeDepth={activeDepth} streamRow={streamRow} />
        ) : activeNav === 'Alerts' ? (
          <AlertsCenter />
        ) : activeNav === 'Nearby' ? (
          <NearbyWells activeDepth={activeDepth} onNavigate={setActiveNav} initialWell={selectedWell} mapLayers={mapLayers} />
        ) : activeNav === 'Compare' ? (
          <WellComparison activeDepth={activeDepth} initialWell={selectedWell} />
        ) : activeNav === 'Memory' ? (
          <GeologicalMemory />
        ) : activeNav === 'History' ? (
          <HistoricalEvents initialWell={selectedWell} onNavigate={setActiveNav} />
        ) : activeNav === 'Risk' ? (
          <RiskAnalysis />
        ) : activeNav === 'Reports' ? (
          <Reports onNavigate={setActiveNav} />
        ) : activeNav === 'DocInt' ? (
          <DocumentIntelligence />
        ) : (
          <PrototypeView title={currentLabel || activeNav} />
        )}
      </main>

      {/* RIGHT INTELLIGENCE PANEL */}
      {(activeNav === 'Overview' || activeNav === 'Live') && (
        <IntelligencePanel
          riskData={riskData}
          alerts={alerts}
          well={selectedWell}
          incidents={wellIncidents}
          activeDepth={activeDepth}
          onNavigate={setActiveNav}
        />
      )}

    </div>
  )
}
