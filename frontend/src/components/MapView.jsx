import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const RISK_STYLES = {
  high:   { fill:'#fee2e2', stroke:'#dc2626' },
  medium: { fill:'#fef3c7', stroke:'#d97706' },
  low:    { fill:'#dcfce7', stroke:'#16a34a' },
}

const DRILL_LOC = [28.234, 73.195] // OIL-001 Baghewala-1

// Haversine distance in km
function getDist(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)
}

// Conceptual boundaries for the Bikaner-Nagaur basin operating area
const FIELD_BOUNDARY = [
  [28.55, 72.85], [28.45, 73.55], [27.85, 73.65], [27.75, 72.95], [28.15, 72.75]
]

export default function MapView({ wells, activeWell, onWellClick, mapLayers }) {
  const riskStyle = (level) => RISK_STYLES[level] ?? RISK_STYLES.low

  return (
    <div className="map-zone" style={{ background: '#e8e4dc' }}>
      <MapContainer
        center={DRILL_LOC}
        zoom={9}
        style={{ height:'100%', width:'100%', background: 'transparent' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          className="osm-muted-tiles"
        />

      {mapLayers.boundary && (
        <Polygon 
          positions={FIELD_BOUNDARY} 
          pathOptions={{ color: '#b0a898', weight: 1.5, dashArray: '5 5', fillOpacity: 0.02 }} 
        />
      )}

      {mapLayers.radius && (
        <Circle
          center={DRILL_LOC}
          radius={30000}
          pathOptions={{
            color:'#1e3a5f', weight:1,
            dashArray:'8 5', fillOpacity:0.03
          }}
        />
      )}

      {/* The active drill rig (OIL-001) */}
      <CircleMarker
        center={DRILL_LOC}
        radius={7}
        pathOptions={{ fillColor: '#ffffff', fillOpacity: 1, color: '#1e3a5f', weight: 3 }}
      >
        <Popup className="nwis-popup">
          <div style={{fontFamily:'var(--font-mono)',fontSize:11,minWidth:120}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:2,color:'#1e3a5f'}}>OIL-001 (ACTIVE)</div>
            <div style={{color:'var(--text-2)'}}>Baghewala-1</div>
            <div style={{color:'var(--text-3)'}}>Drilling Rig</div>
          </div>
        </Popup>
      </CircleMarker>

      {/* Offset wells */}
      {mapLayers.offsetWells && wells.filter(w => w.well_id !== 'OIL-001').map(w => {
        const s = riskStyle(w.risk_level)
        const isSelected = activeWell?.well_id === w.well_id
        const dist = getDist(DRILL_LOC[0], DRILL_LOC[1], w.lat, w.lon)
        
        return (
          <CircleMarker
            key={w.well_id}
            center={[w.lat, w.lon]}
            radius={isSelected ? 8 : 5}
            pathOptions={{
              fillColor: isSelected ? '#ffffff' : s.fill,
              fillOpacity: 1,
              color: isSelected ? '#1e3a5f' : s.stroke,
              weight: isSelected ? 2.5 : 1.5,
            }}
            eventHandlers={{ click: () => onWellClick(w) }}
          >
            <Popup className="nwis-popup">
              <div style={{fontFamily:'var(--font-mono)',fontSize:11,minWidth:160}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontWeight:600,fontSize:12,color:'var(--text)'}}>{w.well_id}</span>
                  <span style={{color:'var(--text-3)'}}>{dist} km</span>
                </div>
                <div style={{color:'var(--text-2)',marginBottom:2}}>{w.name}</div>
                <div style={{color:'var(--text-3)',marginBottom:6}}>{w.formation}</div>
                <div style={{display:'flex'}}>
                  <span style={{background:s.fill,color:s.stroke,padding:'2px 6px',borderRadius:2,fontSize:9,textTransform:'uppercase',fontWeight:600,border:`1px solid ${s.stroke}`}}>
                    {w.risk_level} RISK
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>

    {/* HUD Overlays */}
    <div className="map-info-chip" style={{top:10,left:12,fontSize:10}}>
      Bikaner-Nagaur basin &nbsp;·&nbsp; 8 wells &nbsp;·&nbsp; 30 km radius
    </div>

      <div className="map-legend-chip" style={{bottom:10,right:10}}>
        <div className="ml-row"><div className="ml-dot" style={{background:'#fee2e2',borderColor:'#dc2626'}}/>High risk offset</div>
        <div className="ml-row"><div className="ml-dot" style={{background:'#fef3c7',borderColor:'#d97706'}}/>Moderate risk</div>
        <div className="ml-row"><div className="ml-dot" style={{background:'#dcfce7',borderColor:'#16a34a'}}/>Normal</div>
        <div className="ml-row"><div className="ml-dot" style={{background:'#fff',borderColor:'#1e3a5f',borderWidth:2.5}}/>Active Drill Rig</div>
      </div>
    </div>
  )
}
