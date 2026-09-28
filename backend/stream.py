"""
stream.py — Server-Sent Events helper for telemetry.csv streaming.

Features added in Phase 3:
  1. Proactive depth trigger  — fires once per loop when depth >= 1100 m and
     >= 2 matching Jodhpur Sandstone incidents exist within ±100 m of current
     depth on the same fault block.
  2. Simplified ADWIN drift detection — compares the mean of the first vs second
     half of a 20-value sliding torque window; flags when divergence > 1.5 kNm.

Existing behaviour preserved:
  • alert_flag=1 rows still receive alert_message.
  • Loop-reset event still fires between cycles.
"""

import csv
import json
import asyncio
import os
from collections import Counter
from typing import AsyncGenerator, Dict, Any, List

# ── Load CSV into memory once ─────────────────────────────────────────────────
_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
_CSV_PATH = os.path.join(_DATA_DIR, "telemetry.csv")
_INC_PATH = os.path.join(_DATA_DIR, "incidents.json")

_TELEMETRY_ROWS: List[Dict[str, Any]] = []

with open(_CSV_PATH, newline="", encoding="utf-8") as _f:
    _reader = csv.DictReader(_f)
    for _row in _reader:
        _TELEMETRY_ROWS.append(
            {
                "row_id":        int(_row["row_id"]),
                "timestamp":     _row["timestamp"],
                "depth_m":       float(_row["depth_m"]),
                "mud_weight_sg": float(_row["mud_weight_sg"]),
                "torque_knm":    float(_row["torque_knm"]),
                "rop_m_hr":      float(_row["rop_m_hr"]),
                "wob_tonnes":    float(_row["wob_tonnes"]),
                "spp_psi":       float(_row["spp_psi"]),
                "temp_c":        float(_row["temp_c"]),
                "alert_flag":    int(_row["alert_flag"]),
            }
        )

# ── Load incidents for proactive trigger ──────────────────────────────────────
with open(_INC_PATH, encoding="utf-8") as _f:
    _INCIDENTS: List[Dict[str, Any]] = json.load(_f)

# ── Determine the dominant fault block from the telemetry context ─────────────
# In a real rig, the fault block would come from real-time LWD/MWD.
# For this demo we treat the Jodhpur Sandstone wells as FB-A (most incidents).
_DEMO_FAULT_BLOCK = "FB-A"

# ── Constants ─────────────────────────────────────────────────────────────────
_ALERT_MESSAGE = (
    "TORQUE SPIKE DETECTED. Historical data shows stuck pipe risk at this depth "
    "in Jodhpur Sandstone. Recommend: increase mud weight to 1.25 SG immediately, "
    "reduce WOB, and monitor torque trend closely."
)

_STREAM_INTERVAL_S     = 0.4    # 400 ms between rows
_DEPTH_TRIGGER_DEPTH   = 1100.0 # m — threshold where proactive check runs
_DEPTH_PROXIMITY_M     = 100    # ±100 m search window for historical incidents
_PROACTIVE_MIN_MATCHES = 2      # minimum matching incidents to fire trigger

_ADWIN_WINDOW_SIZE   = 20       # total sliding window length
_ADWIN_DRIFT_THRESH  = 1.5      # kNm — mean difference to call drift


# ═══════════════════════════════════════════════════════════════════════════════
#  FEATURE 1 — PROACTIVE DEPTH TRIGGER
# ═══════════════════════════════════════════════════════════════════════════════

def _query_proactive_incidents(depth_m: float, fault_block: str) -> List[Dict[str, Any]]:
    """
    Return Jodhpur Sandstone incidents on fault_block within ±DEPTH_PROXIMITY_M
    of depth_m, sorted by absolute depth difference.
    """
    matches = []
    for inc in _INCIDENTS:
        if inc.get("formation", "").lower() != "jodhpur sandstone":
            continue
        if inc.get("fault_block", "").upper() != fault_block.upper():
            continue
        if abs(inc["depth_m"] - depth_m) <= _DEPTH_PROXIMITY_M:
            matches.append(inc)
    matches.sort(key=lambda i: abs(i["depth_m"] - depth_m))
    return matches


def _build_proactive_message(depth_m: float, matches: List[Dict[str, Any]]) -> str:
    """
    Compose the proactive alert message from matching historical incidents.
    """
    # Dominant incident type
    type_counts: Counter = Counter(i["incident_type"] for i in matches)
    top_type = max(type_counts, key=lambda t: type_counts[t])
    top_type_label = top_type.replace("_", " ").title()

    # Best match (closest depth)
    best = matches[0]
    warn_depth = max(int(depth_m) - 30, 900)

    return (
        f"APPROACHING RISK ZONE at {depth_m:.0f} m. "
        f"{len(matches)} nearby wells encountered {top_type_label} in Jodhpur Sandstone "
        f"at similar depth. "
        f"Last occurrence: Well {best['well_id']} at {best['depth_m']} m — "
        f"{best['mitigation']} "
        f"RECOMMEND: Increase mud weight to 1.25 SG before {warn_depth} m."
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  FEATURE 2 — SIMPLIFIED ADWIN DRIFT DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def _check_adwin_drift(window: List[float]) -> Dict[str, Any]:
    """
    Simplified ADWIN: split window in half, compare means.

    Returns a dict with keys:
      drift_detected  : bool
      drift_message   : str (present only when drift_detected is True)
      drift_magnitude : float (present only when drift_detected is True)
      mean_baseline   : float
      mean_current    : float
    """
    if len(window) < _ADWIN_WINDOW_SIZE:
        return {"drift_detected": False}

    half = _ADWIN_WINDOW_SIZE // 2
    baseline_vals = window[:half]
    current_vals  = window[half:]

    mean_baseline = sum(baseline_vals) / len(baseline_vals)
    mean_current  = sum(current_vals)  / len(current_vals)
    delta         = abs(mean_current - mean_baseline)

    if delta <= _ADWIN_DRIFT_THRESH:
        return {
            "drift_detected": False,
            "mean_baseline":  round(mean_baseline, 3),
            "mean_current":   round(mean_current, 3),
        }

    pct_deviation = (delta / mean_baseline) * 100 if mean_baseline else 0.0

    return {
        "drift_detected": True,
        "drift_magnitude": round(delta, 3),
        "mean_baseline":   round(mean_baseline, 3),
        "mean_current":    round(mean_current, 3),
        "drift_message": (
            f"STATISTICAL DRIFT in torque signal detected. "
            f"Current mean {mean_current:.2f} kNm vs baseline {mean_baseline:.2f} kNm. "
            f"Deviation: {pct_deviation:.1f}%. "
            f"Possible formation change or tool wear."
        ),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  PUBLIC GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

async def telemetry_event_generator() -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings.

    Format per SSE spec:
        data: <json>\\n\\n

    Per-loop state:
        depth_trigger_fired  — fires once when depth >= 1100 m and matches >= 2
        torque_window        — rolling list of last 20 torque_knm values

    Loops infinitely (row 200 → row 1) for demo purposes.

    Test: curl -N http://localhost:8000/api/stream/telemetry
    Expected at ~row 25 (depth ~1100 m):
        "proactive_alert": true,
        "proactive_message": "APPROACHING RISK ZONE at 1100 m. 3 nearby wells..."
    Expected at ~row 30+ (window fills and drift diverges):
        "drift_detected": true,
        "drift_message": "STATISTICAL DRIFT in torque signal detected..."
    """
    while True:
        # ── Per-loop state ────────────────────────────────────────────────────
        depth_trigger_fired: bool       = False
        torque_window:       List[float] = []

        for row in _TELEMETRY_ROWS:
            payload: Dict[str, Any] = dict(row)     # copy — never mutate source

            depth_m = row["depth_m"]

            # ── EXISTING: alert_flag message ──────────────────────────────────
            if row["alert_flag"] == 1:
                payload["alert_message"] = _ALERT_MESSAGE

            # ── FEATURE 1: Proactive depth trigger ────────────────────────────
            if depth_m >= _DEPTH_TRIGGER_DEPTH and not depth_trigger_fired:
                fault_block = _DEMO_FAULT_BLOCK
                matches = _query_proactive_incidents(depth_m, fault_block)

                if len(matches) >= _PROACTIVE_MIN_MATCHES:
                    depth_trigger_fired          = True
                    payload["proactive_alert"]   = True
                    payload["proactive_message"] = _build_proactive_message(
                        depth_m, matches
                    )
                    payload["historical_wells"] = list(
                        dict.fromkeys(m["well_id"] for m in matches)   # ordered unique
                    )

            # ── FEATURE 2: ADWIN torque drift detection ───────────────────────
            torque_window.append(row["torque_knm"])
            if len(torque_window) > _ADWIN_WINDOW_SIZE:
                torque_window.pop(0)            # maintain fixed-size window

            drift_result = _check_adwin_drift(torque_window)
            payload["drift_detected"] = drift_result["drift_detected"]

            if drift_result["drift_detected"]:
                payload["drift_message"]   = drift_result["drift_message"]
                payload["drift_magnitude"] = drift_result["drift_magnitude"]

            # ── Emit SSE row ──────────────────────────────────────────────────
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(_STREAM_INTERVAL_S)

        # Brief pause + reset signal between loops
        yield (
            f"data: {json.dumps({'event': 'loop_reset', 'message': 'Restarting telemetry stream from row 1'})}\n\n"
        )
        await asyncio.sleep(1.0)

# ─────────────────────────────────────────────────────────────────────────────
# MANUAL TEST EXPECTATIONS:
#
# Feature 1 — Proactive depth trigger (fires once near row 25, depth ~1100 m):
#   {
#     "row_id": 26, "depth_m": 1100.0,
#     "proactive_alert": true,
#     "proactive_message": "APPROACHING RISK ZONE at 1100 m. 3 nearby wells
#       encountered Stuck Pipe in Jodhpur Sandstone at similar depth.
#       Last occurrence: Well OIL-001 at 1148 m — Increase mud weight by 0.07 SG...
#       RECOMMEND: Increase mud weight to 1.25 SG before 1070 m.",
#     "historical_wells": ["OIL-001", "OIL-002", "OIL-004"]
#   }
#
# Feature 2 — ADWIN drift (fires ~row 30+ when torque begins rising):
#   {
#     "row_id": 155, "depth_m": 1200.5, "torque_knm": 9.38,
#     "drift_detected": true,
#     "drift_magnitude": 3.512,
#     "drift_message": "STATISTICAL DRIFT in torque signal detected.
#       Current mean 8.89 kNm vs baseline 5.38 kNm. Deviation: 65.3%.
#       Possible formation change or tool wear."
#   }
# ─────────────────────────────────────────────────────────────────────────────
