import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function Map({ wells, activeWell, onWellClick }) {
  const riskColor = (level) =>
    level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#14b8a6'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Geospatial — Bikaner-Nagaur basin</span>
        <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--muted)' }}>
          30 km radius active
        </span>
      </div>
      <div style={{ height:280, position:'relative' }}>
        <MapContainer
          center={[28.2, 73.0]}
          zoom={9}
          style={{ height:'100%', width:'100%', background:'#060f1a' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="©OpenStreetMap ©CartoDB"
          />
          {activeWell && (
            <Circle
              center={[activeWell.lat, activeWell.lon]}
              radius={30000}
              pathOptions={{ color:'#3b82f6', weight:1, dashArray:'6 4', fillOpacity:0.04 }}
            />
          )}
          {wells.map(w => (
            <CircleMarker
              key={w.well_id}
              center={[w.lat, w.lon]}
              radius={activeWell?.well_id === w.well_id ? 12 : 8}
              pathOptions={{
                color: riskColor(w.risk_level),
                fillColor: riskColor(w.risk_level),
                fillOpacity: activeWell?.well_id === w.well_id ? 0.5 : 0.25,
                weight: activeWell?.well_id === w.well_id ? 2.5 : 1.5
              }}
              eventHandlers={{ click: () => onWellClick(w) }}
            >
              <Popup>
                <div style={{ fontFamily:'monospace', fontSize:12, background:'#0d1829', color:'#e2e8f0', padding:8, borderRadius:4 }}>
                  <strong style={{ color:'#f59e0b' }}>{w.name}</strong><br/>
                  {w.formation}<br/>
                  Depth: {w.depth_m} m<br/>
                  Risk: <span style={{ color: riskColor(w.risk_level) }}>{w.risk_level}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <div style={{
          position:'absolute', bottom:10, left:14, zIndex:999,
          display:'flex', gap:12, background:'#0d1829cc',
          border:'1px solid #1a2d4a', borderRadius:4, padding:'4px 10px'
        }}>
          {[['#ef4444','High'],['#f59e0b','Medium'],['#14b8a6','Low']].map(([c,l]) => (
            <span key={l} style={{ fontSize:10, color:c }}>● {l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
