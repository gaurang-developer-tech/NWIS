"""
rag.py — Rule-based Retrieval-Augmented Generation (no external API, no vector DB).

Loads incidents.json once on import and exposes:
  search_incidents(question)  -> top-3 ranked incident dicts
  format_answer(question, incidents) -> natural-language string
"""

import re
import random
import os
import json
from typing import List, Dict, Any, Tuple, Optional

# ── Load data once at import time ─────────────────────────────────────────────
_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

with open(os.path.join(_DATA_DIR, "incidents.json"), encoding="utf-8") as _f:
    _INCIDENTS: List[Dict[str, Any]] = json.load(_f)

# ── Keyword maps ──────────────────────────────────────────────────────────────
_FORMATION_KEYWORDS: Dict[str, str] = {
    "jodhpur":  "Jodhpur Sandstone",
    "bilara":   "Bilara Limestone",
    "nagaur":   "Nagaur Sandstone",
    "sandstone": None,   # ambiguous — used as partial match only
    "limestone": None,
}

_TYPE_KEYWORDS: Dict[str, str] = {
    "stuck":  "stuck_pipe",
    "pipe":   "stuck_pipe",
    "loss":   "mud_loss",
    "mud":    "mud_loss",
    "kick":   "kick",
    "influx": "kick",
    "gas":    "kick",
    "torque": "torque_spike",
    "spike":  "torque_spike",
    "twist":  "torque_spike",
}

_FAULT_KEYWORDS: Dict[str, str] = {
    "fb-a": "FB-A",
    "fb-b": "FB-B",
    "fb-c": "FB-C",
    "block a": "FB-A",
    "block b": "FB-B",
    "block c": "FB-C",
}


# ═══════════════════════════════════════════════════════════════════════════════
#  PARSER
# ═══════════════════════════════════════════════════════════════════════════════

def _parse_question(question: str) -> Dict[str, Any]:
    """
    Extract structured signals from a free-text question.
    Returns dict with keys: depths, formation, incident_type, fault_block.
    """
    q = question.lower()

    # Numbers → candidate depths (ignore years like 2019-2022)
    raw_numbers = [int(n) for n in re.findall(r"\b(\d{3,4})\b", q)]
    depths = [n for n in raw_numbers if 500 <= n <= 3000]

    # Formation
    formation = None
    for kw, full_name in _FORMATION_KEYWORDS.items():
        if kw in q and full_name:
            formation = full_name
            break

    # Incident type
    incident_type = None
    for kw, itype in _TYPE_KEYWORDS.items():
        if kw in q:
            incident_type = itype
            break

    # Fault block
    fault_block = None
    for kw, fb in _FAULT_KEYWORDS.items():
        if kw in q:
            fault_block = fb
            break

    return {
        "depths": depths,
        "formation": formation,
        "incident_type": incident_type,
        "fault_block": fault_block,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  SCORER
# ═══════════════════════════════════════════════════════════════════════════════

def _score_incident(
    inc: Dict[str, Any],
    depths: List[int],
    formation: Optional[str],
    incident_type: Optional[str],
    fault_block: Optional[str],
) -> Tuple[float, Dict[str, Any]]:
    """
    Score an incident (higher = better match). Returns (score, incident).
    """
    score = 0.0

    # Depth proximity — closest match wins
    if depths:
        best_depth_diff = min(abs(inc["depth_m"] - d) for d in depths)
        if best_depth_diff <= 50:
            score += 3.0
        elif best_depth_diff <= 100:
            score += 2.0
        elif best_depth_diff <= 200:
            score += 1.0

    # Formation exact match
    if formation and inc.get("formation", "").lower() == formation.lower():
        score += 2.5

    # Incident type match
    if incident_type and inc.get("incident_type") == incident_type:
        score += 2.0

    # Fault block match
    if fault_block and inc.get("fault_block", "").upper() == fault_block.upper():
        score += 1.5

    return score, inc


# ═══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════

def search_incidents(question: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Parse question, score every incident, return top_k by score.
    Falls back to returning first top_k incidents if no signal found.
    """
    signals = _parse_question(question)
    depths       = signals["depths"]
    formation    = signals["formation"]
    incident_type= signals["incident_type"]
    fault_block  = signals["fault_block"]

    scored = [
        _score_incident(inc, depths, formation, incident_type, fault_block)
        for inc in _INCIDENTS
    ]
    scored.sort(key=lambda x: x[0], reverse=True)

    # If nothing scored above 0, return first top_k (generic fallback)
    results = [inc for score, inc in scored if score > 0]
    if not results:
        results = [inc for _, inc in scored]

    return results[:top_k]


def format_answer(question: str, matched: List[Dict[str, Any]]) -> str:
    """
    Build a deterministic natural-language answer from matched incidents.
    No LLM — pure string formatting.
    """
    if not matched:
        return (
            "No historical drilling incidents found matching your query. "
            "Ensure formation name and depth range are within the Bikaner-Nagaur basin "
            "(depth 900–1350 m, formations: Jodhpur Sandstone, Bilara Limestone, "
            "Nagaur Sandstone)."
        )

    signals = _parse_question(question)
    formation_label = signals["formation"] or matched[0].get("formation", "the target formation")

    # Dominant incident type in matched set
    type_counts: Dict[str, int] = {}
    for inc in matched:
        t = inc.get("incident_type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
    dominant_type = max(type_counts, key=lambda t: type_counts[t])
    dominant_label = dominant_type.replace("_", " ")

    depths = [inc["depth_m"] for inc in matched]
    depth_range = f"{min(depths)}–{max(depths)} m" if len(depths) > 1 else f"{depths[0]} m"

    # Build answer header
    lines = [
        f"Based on {len(matched)} nearby well record(s) in {formation_label} "
        f"({depth_range} range), the most common risk is **{dominant_label}**.",
        "",
    ]

    # Per-incident detail
    for inc in matched:
        itype   = inc.get("incident_type", "unknown").replace("_", " ").title()
        well    = inc.get("well_id", "N/A")
        depth   = inc.get("depth_m", "N/A")
        mit     = inc.get("mitigation", "No mitigation recorded.")
        fb      = inc.get("fault_block", "N/A")
        mw      = inc.get("mud_weight_sg", "N/A")
        torque  = inc.get("torque_knm", "N/A")

        lines.append(
            f"• Well {well} ({fb}) encountered **{itype}** at {depth} m "
            f"[MW: {mw} SG, Torque: {torque} kNm]."
        )
        lines.append(f"  Mitigation: {mit}")
        lines.append("")

    # Proactive recommendation
    if signals["depths"]:
        warn_depth = min(signals["depths"]) - 20
        if dominant_type == "stuck_pipe":
            lines.append(
                f"⚠ Recommend increasing mud weight to ≥ 1.22 SG before reaching "
                f"{warn_depth} m to reduce differential sticking risk."
            )
        elif dominant_type == "mud_loss":
            lines.append(
                f"⚠ Prepare LCM pill (calcium carbonate + mica blend) before reaching "
                f"{warn_depth} m. Fracture gradient likely exceeded in this interval."
            )
        elif dominant_type == "kick":
            lines.append(
                f"⚠ Conduct flow check at {warn_depth} m. Reservoir pressure gradient "
                f"may exceed current mud weight — have BOP closure procedure ready."
            )
        elif dominant_type == "torque_spike":
            lines.append(
                f"⚠ Reduce WOB and increase RPM before reaching {warn_depth} m. "
                f"Stick-slip risk is elevated in this formation interval."
            )

    return "\n".join(lines)


def extract_wcr_document(filename: str, content: bytes) -> Dict[str, Any]:
    """Mock AI/NLP extraction of a PDF document."""
    formations = ["Jodhpur Sandstone", "Bilara Limestone", "Nagaur Sandstone"]
    incident_types = ["Stuck Pipe", "Mud Loss", "Kick", "Overpressure Zone"]
    
    # Try to parse well name from filename
    well_match = re.search(r'(Well|OIL|WCR)[-_]?(\d+)', filename, re.IGNORECASE)
    well_id = f"OIL-{well_match.group(2).zfill(3)}" if well_match else "OIL-UNKNOWN"
    
    return {
        "filename": filename,
        "well_id": well_id,
        "extracted_data": {
            "Event Type": random.choice(incident_types),
            "Depth": f"{random.randint(900, 1400)} m",
            "Mitigation": "Circulated bottoms up. Adjusted mud weight to 1.25 SG and applied overpull.",
            "Formation": random.choice(formations),
            "Severity": "High",
            "Cause": "Simulated NLP extraction cause"
        }
    }
