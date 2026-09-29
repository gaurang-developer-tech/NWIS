"""
search.py — Haversine distance + geological filter functions
Imported by main.py; no FastAPI dependencies here.
"""

import math
from typing import List, Dict, Any, Optional


# ═══════════════════════════════════════════════════════════════════════════════
#  HAVERSINE
# ═══════════════════════════════════════════════════════════════════════════════

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Return the great-circle distance in kilometres between two points
    on the Earth's surface using the Haversine formula.
    """
    rlat1 = math.radians(lat1)
    rlat2 = math.radians(lat2)
    dlat  = math.radians(lat2 - lat1)
    dlon  = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_KM * c, 3)


def wells_within_radius(
    wells: List[Dict[str, Any]],
    lat: float,
    lon: float,
    radius_km: float,
) -> List[Dict[str, Any]]:
    """
    Filter wells list to those within radius_km of (lat, lon).
    Returns a new list with a 'distance_km' field added to each well.
    Sorted by distance ascending.
    """
    results = []
    for well in wells:
        dist = haversine_km(lat, lon, well["lat"], well["lon"])
        if dist <= radius_km:
            enriched = dict(well)          # shallow copy — don't mutate original
            enriched["distance_km"] = dist
            results.append(enriched)
    results.sort(key=lambda w: w["distance_km"])
    return results


# ═══════════════════════════════════════════════════════════════════════════════
#  GEOLOGICAL FILTER  (core of /api/incidents/by-depth)
# ═══════════════════════════════════════════════════════════════════════════════

DEPTH_TOLERANCE_M = 50


def filter_incidents_by_depth(
    incidents: List[Dict[str, Any]],
    depth_m: float,
    formation: Optional[str] = None,
    fault_block: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Return incidents where:
      |incident.depth_m - depth_m| <= DEPTH_TOLERANCE_M
      AND (formation matches if provided)
      AND (fault_block matches if provided)

    Result is sorted by absolute depth difference ascending.
    """
    matched = []
    for inc in incidents:
        depth_diff = abs(inc["depth_m"] - depth_m)
        if depth_diff > DEPTH_TOLERANCE_M:
            continue
        if formation and inc.get("formation", "").lower() != formation.lower():
            continue
        if fault_block and inc.get("fault_block", "").lower() != fault_block.lower():
            continue
        enriched = dict(inc)
        enriched["depth_diff_m"] = depth_diff
        matched.append(enriched)

    matched.sort(key=lambda i: i["depth_diff_m"])
    return matched


# ═══════════════════════════════════════════════════════════════════════════════
#  RISK LEVEL COMPUTATION
# ═══════════════════════════════════════════════════════════════════════════════

def compute_risk_level(well: Dict[str, Any], incidents: List[Dict[str, Any]]) -> str:
    """
    high   — at least one incident shares well_id AND formation AND fault_block
    medium — at least one incident shares formation only
    low    — no matching incidents
    """
    well_id     = well["well_id"]
    formation   = well["formation"].lower()
    fault_block = well["fault_block"].lower()

    for inc in incidents:
        inc_well      = inc.get("well_id", "").lower()
        inc_formation = inc.get("formation", "").lower()
        inc_fb        = inc.get("fault_block", "").lower()

        if (
            inc_well      == well_id.lower()
            and inc_formation == formation
            and inc_fb        == fault_block
        ):
            return "high"

    for inc in incidents:
        if inc.get("formation", "").lower() == formation:
            return "medium"

    return "low"
