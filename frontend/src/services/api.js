// NWIS Centralized Service Layer
// Handles real API communication with graceful fallback to simulated demo data.

const API_BASE = '/api'
const USE_DEMO_FALLBACK = true

// --- MOCK DATA ADAPTERS ---

export const MOCK_WELLS = [
  { well_id: 'OIL-001', name: 'Baghewala-1', lat: 28.234, lon: 73.195, risk_level: 'low', formation: 'Jodhpur Sandstone', fault_block: 'FB-A', depth_m: 1143 },
  { well_id: 'OIL-002', name: 'Baghewala-2', lat: 28.210, lon: 73.180, risk_level: 'medium', formation: 'Jodhpur Sandstone', fault_block: 'FB-A', depth_m: 1100 },
  { well_id: 'OIL-003', name: 'Tawala-1', lat: 28.280, lon: 73.250, risk_level: 'high', formation: 'Jodhpur Sandstone', fault_block: 'FB-A', depth_m: 1205 },
  { well_id: 'OIL-004', name: 'Poonam-1', lat: 28.150, lon: 73.100, risk_level: 'high', formation: 'Jodhpur Sandstone', fault_block: 'FB-A', depth_m: 1250 },
  { well_id: 'OIL-005', name: 'Poonam-2', lat: 28.160, lon: 73.080, risk_level: 'high', formation: 'Jodhpur Sandstone', fault_block: 'FB-B', depth_m: 1180 },
]

export const MOCK_INCIDENTS = [
  { incident_id: 'INC-1', well_id: 'OIL-003', depth_m: 1148, incident_type: 'Stuck Pipe', description: 'Differential sticking in Jodhpur sandstone due to overbalance.', cause: 'Differential pressure', mitigation: 'Increase mud weight to 1.25 SG and spot acid pill.', outcome: 'Resolved in 4 hours' },
  { incident_id: 'INC-2', well_id: 'OIL-004', depth_m: 1162, incident_type: 'Torque Spike', description: 'Sudden torque fluctuations and erratic RPM.', cause: 'Formation tightness', mitigation: 'Reamed section, pumped lube pill.', outcome: 'Torque normalized' },
  { incident_id: 'INC-3', well_id: 'OIL-005', depth_m: 1155, incident_type: 'Stuck Pipe', description: 'Pack-off leading to mechanical sticking.', cause: 'Poor hole cleaning', mitigation: 'Circulated at high flow rate, worked pipe.', outcome: 'Freed after 8 hours' },
  { incident_id: 'INC-4', well_id: 'OIL-002', depth_m: 1080, incident_type: 'Mud Loss', description: 'Partial losses in fractured limestone.', cause: 'Natural fractures', mitigation: 'Pumped LCM pill.', outcome: 'Losses cured' },
]

export const MOCK_DOCS = [
  { id: 'WCR_003.pdf', type: 'Well Completion Report', date: '2022-04-12', well: 'OIL-003', status: 'Processed' },
  { id: 'DDR_004_1162.pdf', type: 'Daily Drilling Report', date: '2023-01-08', well: 'OIL-004', status: 'Processed' },
  { id: 'MUD_005.pdf', type: 'Mud Logging Record', date: '2023-05-19', well: 'OIL-005', status: 'Pending OCR' },
]

export const MOCK_ALERTS = [
  { id: 1, severity: 'HIGH', title: 'Stuck-pipe risk increasing', well: 'OIL-001', depth: '1,143 m', timestamp: '10:24 AM', status: 'Active', reason: 'Mud weight below threshold in Jodhpur Sandstone.' },
  { id: 2, severity: 'MEDIUM', title: 'Mud weight below recommended threshold', well: 'OIL-001', depth: '1,143 m', timestamp: '10:15 AM', status: 'Active', reason: 'Current 1.15 SG < Recommended 1.25 SG.' },
  { id: 3, severity: 'WARNING', title: 'Torque anomaly detected', well: 'OIL-001', depth: '1,142 m', timestamp: '09:45 AM', status: 'Resolved', reason: 'Brief spike to 8.7 kNm.' },
]

const MOCK_RISK_SCORE = {
  score: 65,
  risk_level: 'high',
  top_factors: ['Historical incidents (+45 pts)', 'Torque anomaly (+20 pts)'],
  recommendation: 'Increase mud weight to 1.25 SG before 1,130 m.'
}

const MOCK_QUERY_RESULT = {
  answer: 'Offset wells in the Jodhpur Sandstone have a history of stuck pipe (OIL-003 at 1148m, OIL-005 at 1155m). Mitigation involved spotting an acid pill and increasing mud weight to 1.25 SG.',
  sources: ['WCR_003.pdf', 'MUD_005.pdf']
}

// --- CORE FETCH WRAPPER ---

async function fetchWithFallback(endpoint, options, mockData, label) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    if (USE_DEMO_FALLBACK) {
      console.warn(`[NWIS Service] Real API unavailable for ${label}. Using demo adapter.`)
      return mockData
    }
    throw err
  }
}

// --- SERVICES ---

export const wellService = {
  getWells: () => fetchWithFallback('/wells', {}, MOCK_WELLS, 'getWells')
}

export const incidentService = {
  getAllIncidents: () => fetchWithFallback('/incidents', {}, MOCK_INCIDENTS, 'getAllIncidents'),
  getIncidentsByWell: (wellId) => fetchWithFallback(`/incidents?well_id=${wellId}`, {}, MOCK_INCIDENTS.filter(i => i.well_id === wellId), 'getIncidentsByWell')
}

export const riskService = {
  getRiskScore: (payload) => fetchWithFallback('/risk-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, MOCK_RISK_SCORE, 'getRiskScore')
}

export const intelligenceService = {
  queryMemory: (question) => fetchWithFallback('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  }, MOCK_QUERY_RESULT, 'queryMemory')
}

export const telemetryService = {
  subscribe: (onData, onAlert) => {
    let es;
    try {
      es = new EventSource(`${API_BASE}/stream/telemetry`)
      let connected = false

      es.onopen = () => { connected = true }
      
      es.onmessage = (e) => {
        const row = JSON.parse(e.data)
        onData(row)
        if (row.alert_flag === 1) onAlert(row.alert_message || 'Anomaly detected')
        if (row.proactive_alert) onAlert(row.proactive_message)
      }
      
      es.onerror = () => {
        es.close()
        console.warn('[NWIS Service] Real telemetry stream unavailable. Falling back to simulated stream.')
        return startSimulatedStream(onData, onAlert)
      }
      
      return () => es.close()
    } catch (err) {
      console.warn('[NWIS Service] Real telemetry stream failed immediately. Falling back to simulated stream.')
      return startSimulatedStream(onData, onAlert)
    }
  }
}

// --- DEMO STREAM SIMULATOR ---

function startSimulatedStream(onData, onAlert) {
  let depth = 1140
  
  const timer = setInterval(() => {
    depth += 0.2
    const torque = 6 + Math.random() * 2
    const mud = 1.15 + (Math.random() * 0.02 - 0.01)
    
    const row = {
      depth_m: depth,
      torque_knm: torque,
      mud_weight_sg: mud,
      alert_flag: torque > 7.8 ? 1 : 0,
      alert_message: torque > 7.8 ? 'Simulated torque spike detected.' : null,
      proactive_alert: depth >= 1145 && depth < 1146,
      proactive_message: depth >= 1145 && depth < 1146 ? 'Simulated Proactive Alert: Approaching risk zone.' : null
    }
    
    onData(row)
    if (row.alert_flag === 1) onAlert(row.alert_message)
    if (row.proactive_alert) onAlert(row.proactive_message)
  }, 1000)
  
  return () => clearInterval(timer)
}
