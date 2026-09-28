"""
main.py — NWIS FastAPI Application
Nearby Wells Intelligence System — Backend API

Run with:
    uvicorn main:app --reload --port 8000

All data is loaded into memory on startup; zero per-request file I/O.
"""

import json
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag import search_incidents, format_answer
from search import (
    compute_risk_level,
    filter_incidents_by_depth,
    wells_within_radius,
)
from stream import telemetry_event_generator

# ── Paths ─────────────────────────────────────────────────────────────────────
_DATA_DIR      = os.path.join(os.path.dirname(__file__), "data")
_WELLS_PATH    = os.path.join(_DATA_DIR, "wells.json")
_INCIDENTS_PATH= os.path.join(_DATA_DIR, "incidents.json")

# ── In-memory store (populated by lifespan) ───────────────────────────────────
_store: Dict[str, Any] = {
    "wells":     [],
    "incidents": [],
}


# ═══════════════════════════════════════════════════════════════════════════════
#  LIFESPAN — load data once at startup
# ═══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load JSON data files into memory on startup."""
    with open(_WELLS_PATH, encoding="utf-8") as f:
        _store["wells"] = json.load(f)

    with open(_INCIDENTS_PATH, encoding="utf-8") as f:
        _store["incidents"] = json.load(f)

    print(
        f"[NWIS] Startup complete — "
        f"{len(_store['wells'])} wells, {len(_store['incidents'])} incidents loaded."
    )
    yield
    # Nothing to clean up
    print("[NWIS] Shutting down.")


# ═══════════════════════════════════════════════════════════════════════════════
#  APP
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="NWIS — Nearby Wells Intelligence System",
    description=(
        "Rule-based drilling intelligence API for the Bikaner-Nagaur basin, Rajasthan. "
        "Provides geological filtering, Haversine proximity search, "
        "incident pattern analysis, proactive depth triggers, ADWIN drift detection, "
        "and a pure-math risk scoring engine."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # open for local frontend dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    question: str
    matched_incidents: List[Dict[str, Any]]
    answer: str


class RiskScoreRequest(BaseModel):
    depth_m:        float
    formation:      str
    fault_block:    str
    mud_weight_sg:  float
    torque_knm:     float


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

# ── GET /api/health ───────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health() -> Dict[str, Any]:
    """Simple liveness check with data-load confirmation."""
    return {
        "status": "ok",
        "wells": len(_store["wells"]),
        "incidents": len(_store["incidents"]),
    }


# ── GET /api/wells ────────────────────────────────────────────────────────────
@app.get("/api/wells", tags=["Wells"])
def get_wells() -> List[Dict[str, Any]]:
    """
    Return all 8 wells with a computed 'risk_level' field.

    Risk levels:
      high   — incident shares well_id, formation, AND fault_block
      medium — incident shares formation only
      low    — no matching incidents
    """
    enriched = []
    for well in _store["wells"]:
        w = dict(well)
        w["risk_level"] = compute_risk_level(well, _store["incidents"])
        enriched.append(w)
    return enriched


# ── GET /api/wells/nearby ─────────────────────────────────────────────────────
@app.get("/api/wells/nearby", tags=["Wells"])
def get_nearby_wells(
    lat: float = Query(..., description="Latitude of query point (decimal degrees)"),
    lon: float = Query(..., description="Longitude of query point (decimal degrees)"),
    radius_km: float = Query(
        30.0, ge=1.0, le=500.0, description="Search radius in kilometres"
    ),
) -> Dict[str, Any]:
    """
    Return wells within radius_km of (lat, lon) using the Haversine formula.
    Each well includes a 'distance_km' field. Results sorted by distance.
    """
    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=422, detail="lat must be between -90 and 90.")
    if not (-180 <= lon <= 180):
        raise HTTPException(status_code=422, detail="lon must be between -180 and 180.")

    results = wells_within_radius(_store["wells"], lat, lon, radius_km)

    # Add risk_level to each result
    for w in results:
        if "risk_level" not in w:
            original = next(
                (o for o in _store["wells"] if o["well_id"] == w["well_id"]), w
            )
            w["risk_level"] = compute_risk_level(original, _store["incidents"])

    return {
        "query": {"lat": lat, "lon": lon, "radius_km": radius_km},
        "count": len(results),
        "wells": results,
    }


# ── GET /api/incidents ────────────────────────────────────────────────────────
@app.get("/api/incidents", tags=["Incidents"])
def get_incidents(
    well_id: Optional[str] = Query(None, description="Filter by well ID, e.g. OIL-001"),
) -> List[Dict[str, Any]]:
    """
    Return incidents. If well_id is given, filter to that well.
    Returns 404 if well_id is specified but not found.
    """
    if well_id is None:
        return _store["incidents"]

    filtered = [
        inc for inc in _store["incidents"]
        if inc["well_id"].upper() == well_id.upper()
    ]
    if not filtered:
        raise HTTPException(
            status_code=404,
            detail=f"No incidents found for well_id '{well_id}'.",
        )
    return filtered


# ── GET /api/incidents/by-depth ───────────────────────────────────────────────
@app.get("/api/incidents/by-depth", tags=["Incidents"])
def get_incidents_by_depth(
    depth_m: float = Query(..., ge=0, description="Target drilling depth in metres"),
    formation: Optional[str] = Query(
        None, description="Formation name (e.g. 'Jodhpur Sandstone')"
    ),
    fault_block: Optional[str] = Query(
        None, description="Fault block identifier (FB-A, FB-B, FB-C)"
    ),
) -> Dict[str, Any]:
    """
    Geological filter — returns incidents where:
      |incident.depth_m - depth_m| <= 80 m
      AND formation matches (if provided)
      AND fault_block matches (if provided)

    Sorted by absolute depth difference ascending.
    This is NOT keyword search — it is a pure geological proximity filter.
    """
    matched = filter_incidents_by_depth(
        _store["incidents"],
        depth_m=depth_m,
        formation=formation,
        fault_block=fault_block,
    )

    return {
        "query": {
            "depth_m": depth_m,
            "formation": formation,
            "fault_block": fault_block,
            "tolerance_m": 80,
        },
        "count": len(matched),
        "incidents": matched,
    }


# ── POST /api/query ───────────────────────────────────────────────────────────
@app.post("/api/query", tags=["Intelligence"], response_model=QueryResponse)
def post_query(body: QueryRequest) -> QueryResponse:
    """
    Natural-language query endpoint.

    Parses the question to extract: depth, formation, incident type, fault block.
    Uses rule-based RAG to find top matching incidents.
    Returns a formatted natural-language answer — zero LLM API calls.

    Example:
        POST /api/query
        {"question": "what happened at 1150m in Jodhpur Sandstone?"}
    """
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="'question' field must not be empty.")
    if len(question) > 1000:
        raise HTTPException(
            status_code=422, detail="'question' must be 1000 characters or fewer."
        )

    matched    = search_incidents(question, top_k=3)
    answer_str = format_answer(question, matched)

    return QueryResponse(
        question=question,
        matched_incidents=matched,
        answer=answer_str,
    )


# ── POST /api/risk-score ─────────────────────────────────────────────────────
@app.post("/api/risk-score", tags=["Intelligence"])
def post_risk_score(body: RiskScoreRequest) -> Dict[str, Any]:
    """
    Pure-math drilling risk scoring engine — no ML libraries.

    Accepts current drilling parameters and returns a 0–100 risk score,
    risk classification, scored factor breakdown, similar historical incidents,
    and a formatted recommendation string.

    Scoring rubric:
      • Historical incident density  (max ~150 pts, capped at 100 total)
      • Mud weight deficit           (+25 if <1.18 SG, +25 more if <1.15 SG)
      • Torque elevation             (+20 if >7.0 kNm, +30 more if >8.5 kNm)
      • Depth danger zone            (+20 if 1100–1200 m)

    Test:
        curl -X POST http://localhost:8000/api/risk-score \\
             -H "Content-Type: application/json" \\
             -d '{"depth_m":1140,"formation":"Jodhpur Sandstone",
                  "fault_block":"FB-A","mud_weight_sg":1.15,"torque_knm":7.2}'
    Expected: score ~75, risk_level "critical", top_factors has 4 entries
    """
    # ── Validate ──────────────────────────────────────────────────────────────
    if body.depth_m < 0:
        raise HTTPException(status_code=422, detail="depth_m must be >= 0.")
    if body.mud_weight_sg <= 0:
        raise HTTPException(status_code=422, detail="mud_weight_sg must be > 0.")
    if body.torque_knm < 0:
        raise HTTPException(status_code=422, detail="torque_knm must be >= 0.")

    # ── 1. Historical incident density (formation + depth proximity ±100 m) ──
    matching = [
        inc for inc in _store["incidents"]
        if inc.get("formation", "").lower() == body.formation.lower()
        and abs(inc["depth_m"] - body.depth_m) <= 100
    ]
    similar_incidents = matching[:3]    # top 3 for response

    score      = 0
    top_factors: List[str] = []

    density_pts = len(matching) * 15
    if density_pts > 0:
        score += density_pts
        top_factors.append(
            f"Historical incident density: {len(matching)} incident(s) within "
            f"±100 m in {body.formation} (+{density_pts} pts)"
        )

    # ── 2. Mud weight risk ────────────────────────────────────────────────────
    if body.mud_weight_sg < 1.18:
        score += 25
        top_factors.append(
            f"Mud weight below safe threshold: {body.mud_weight_sg:.3f} SG < 1.18 SG (+25 pts)"
        )
    if body.mud_weight_sg < 1.15:
        score += 25
        top_factors.append(
            f"Mud weight critically low: {body.mud_weight_sg:.3f} SG < 1.15 SG (+25 pts)"
        )

    # ── 3. Torque risk ────────────────────────────────────────────────────────
    if body.torque_knm > 7.0:
        score += 20
        top_factors.append(
            f"Elevated torque: {body.torque_knm:.2f} kNm > 7.0 kNm (+20 pts)"
        )
    if body.torque_knm > 8.5:
        score += 30
        top_factors.append(
            f"High torque anomaly: {body.torque_knm:.2f} kNm > 8.5 kNm (+30 pts)"
        )

    # ── 4. Depth danger zone ──────────────────────────────────────────────────
    if 1100 <= body.depth_m <= 1200:
        score += 20
        top_factors.append(
            f"Depth in known danger zone: {body.depth_m:.0f} m (1100–1200 m Jodhpur Sandstone, +20 pts)"
        )

    # ── Cap and classify ──────────────────────────────────────────────────────
    score = min(score, 100)

    if score >= 75:
        risk_level = "critical"
    elif score >= 50:
        risk_level = "high"
    elif score >= 25:
        risk_level = "medium"
    else:
        risk_level = "low"

    # ── Build recommendation ──────────────────────────────────────────────────
    _recommendations: Dict[str, str] = {
        "critical": (
            f"CRITICAL RISK ({score}/100). Stop drilling immediately. "
            f"Increase mud weight to minimum 1.25 SG before proceeding. "
            f"Conduct full flow check. Reduce WOB to <8 tonnes and RPM to <90. "
            f"Stand by with LCM pill and BOP closure procedure."
        ),
        "high": (
            f"HIGH RISK ({score}/100). Reduce ROP to 3 m/hr. "
            f"Increase mud weight by 0.05–0.07 SG incrementally. "
            f"Monitor torque and drag trends every 30 minutes. "
            f"Prepare spotting fluid (diesel soak pill) as contingency."
        ),
        "medium": (
            f"MEDIUM RISK ({score}/100). Continue drilling with enhanced monitoring. "
            f"Check mud weight against pore pressure gradient every stand. "
            f"Log torque variance and compare against OIL-001/OIL-004 baseline. "
            f"Notify company man if torque exceeds 8.0 kNm."
        ),
        "low": (
            f"LOW RISK ({score}/100). Normal drilling parameters acceptable. "
            f"Maintain standard monitoring frequency. "
            f"Review again at next casing point."
        ),
    }

    return {
        "input": {
            "depth_m":       body.depth_m,
            "formation":     body.formation,
            "fault_block":   body.fault_block,
            "mud_weight_sg": body.mud_weight_sg,
            "torque_knm":    body.torque_knm,
        },
        "score":              score,
        "risk_level":         risk_level,
        "top_factors":        top_factors,
        "similar_incidents":  similar_incidents,
        "recommendation":     _recommendations[risk_level],
        "matching_count":     len(matching),
    }


# ── GET /api/stream/telemetry ─────────────────────────────────────────────────
@app.get("/api/stream/telemetry", tags=["Stream"])
async def stream_telemetry():
    """
    Server-Sent Events stream of telemetry.csv rows.

    - Sends one JSON row every 400 ms.
    - Rows with alert_flag=1 include an 'alert_message' field.
    - Rows at depth >= 1100 m (first time) include 'proactive_alert' and
      'proactive_message' if >= 2 Jodhpur Sandstone incidents are nearby.
    - All rows include 'drift_detected'; rows where ADWIN fires also include
      'drift_message' and 'drift_magnitude'.
    - Loops infinitely (row 200 → row 1) for demo purposes.

    Connect with EventSource in the browser or:
        curl -N http://localhost:8000/api/stream/telemetry
    """
    return StreamingResponse(
        telemetry_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",      # disable Nginx buffering if proxied
        },
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  MANUAL TEST COMMANDS (run from project root)
# ═══════════════════════════════════════════════════════════════════════════════
#
#  Start server:
#    python -m uvicorn main:app --reload --port 8000
#
#  Health check:
#    curl http://localhost:8000/api/health
#
#  All wells (with risk_level):
#    curl http://localhost:8000/api/wells
#
#  Nearby wells (30 km radius around Bikaner area):
#    curl "http://localhost:8000/api/wells/nearby?lat=28.4&lon=73.2&radius_km=30"
#
#  Incidents for a specific well:
#    curl "http://localhost:8000/api/incidents?well_id=OIL-001"
#
#  All incidents:
#    curl http://localhost:8000/api/incidents
#
#  Geological depth filter:
#    curl "http://localhost:8000/api/incidents/by-depth?depth_m=1140&formation=Jodhpur+Sandstone&fault_block=FB-A"
#
#  Natural language query:
#    curl -X POST http://localhost:8000/api/query \
#         -H "Content-Type: application/json" \
#         -d "{\"question\": \"what happened at 1150m in Jodhpur Sandstone?\"}"
#
#  ── NEW IN v1.1.0 ─────────────────────────────────────────────────────────
#
#  Risk score — CRITICAL scenario (depth 1140 m, low MW, elevated torque):
#    curl -X POST http://localhost:8000/api/risk-score \
#         -H "Content-Type: application/json" \
#         -d "{\"depth_m\":1140,\"formation\":\"Jodhpur Sandstone\",\"fault_block\":\"FB-A\",\"mud_weight_sg\":1.15,\"torque_knm\":7.2}"
#    Expected: {"score": 90, "risk_level": "critical", "top_factors": [...4 items...]}
#
#  Risk score — LOW scenario (deep, high MW, low torque):
#    curl -X POST http://localhost:8000/api/risk-score \
#         -H "Content-Type: application/json" \
#         -d "{\"depth_m\":950,\"formation\":\"Bilara Limestone\",\"fault_block\":\"FB-B\",\"mud_weight_sg\":1.22,\"torque_knm\":4.1}"
#    Expected: {"score": 15, "risk_level": "low"}
#
#  SSE stream with proactive trigger + ADWIN drift (Ctrl+C to stop):
#    curl -N http://localhost:8000/api/stream/telemetry
#    Watch for row ~26: "proactive_alert": true
#    Watch for row ~155: "drift_detected": true, "drift_magnitude": >1.5
#
#  Interactive API docs:
#    http://localhost:8000/docs
