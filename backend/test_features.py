"""
test_features.py — Integration tests for NWIS v1.1.0 intelligence features.

Tests:
  1. POST /api/risk-score — CRITICAL scenario
  2. POST /api/risk-score — HIGH scenario
  3. POST /api/risk-score — LOW scenario
  4. SSE stream — proactive depth trigger presence
  5. SSE stream — ADWIN drift detection presence
  6. Existing routes regression check
"""

import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0


def check(label, condition, got=None):
    global PASS, FAIL
    if condition:
        print(f"  [PASS] {label}")
        PASS += 1
    else:
        print(f"  [FAIL] {label}  ->  got: {got}")

        FAIL += 1


def post_json(path, body):
    payload = json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path, data=payload,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def get_json(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read())


# ── helpers ───────────────────────────────────────────────────────────────────
def stream_rows(n=250):
    """Consume exactly n SSE rows from the telemetry stream, return as list."""
    rows = []
    req = urllib.request.Request(BASE + "/api/stream/telemetry")
    with urllib.request.urlopen(req, timeout=130) as r:
        buf = ""
        while len(rows) < n:
            chunk = r.read(512).decode("utf-8", errors="ignore")
            if not chunk:
                break
            buf += chunk
            while "\n\n" in buf:
                event, buf = buf.split("\n\n", 1)
                for line in event.splitlines():
                    if line.startswith("data: "):
                        try:
                            rows.append(json.loads(line[6:]))
                        except json.JSONDecodeError:
                            pass
    return rows


# ═══════════════════════════════════════════════════════════════════════════════
print("=" * 60)
print("  NWIS v1.1.0 — Feature Integration Tests")
print("=" * 60)

# ── Feature 3: /api/risk-score ────────────────────────────────────────────────
print("\n[Feature 3] POST /api/risk-score")

# Test A — CRITICAL: deep danger zone, low MW, elevated torque, high density
body_critical = {
    "depth_m": 1140.0,
    "formation": "Jodhpur Sandstone",
    "fault_block": "FB-A",
    "mud_weight_sg": 1.15,
    "torque_knm": 7.2,
}
rs = post_json("/api/risk-score", body_critical)
print(f"  Input:  depth={body_critical['depth_m']}m  MW={body_critical['mud_weight_sg']}  torque={body_critical['torque_knm']}kNm")
print(f"  Result: score={rs['score']}  risk_level={rs['risk_level']}  factors={len(rs['top_factors'])}")
print(f"  Matching incidents: {rs['matching_count']}")
check("Score >= 75 (critical zone inputs)", rs["score"] >= 75, rs["score"])
check("risk_level == 'critical'", rs["risk_level"] == "critical", rs["risk_level"])
check("top_factors has >= 3 entries", len(rs["top_factors"]) >= 3, rs["top_factors"])
check("similar_incidents <= 3", len(rs["similar_incidents"]) <= 3)
check("recommendation starts with 'CRITICAL'", rs["recommendation"].startswith("CRITICAL"), rs["recommendation"][:30])
for f in rs["top_factors"]:
    print(f"    · {f}")

# Test B — HIGH: danger zone, low-ish MW, high torque
print()
body_high = {
    "depth_m": 1150.0,
    "formation": "Jodhpur Sandstone",
    "fault_block": "FB-B",
    "mud_weight_sg": 1.17,
    "torque_knm": 8.9,
}
rs2 = post_json("/api/risk-score", body_high)
print(f"  Input:  depth={body_high['depth_m']}m  MW={body_high['mud_weight_sg']}  torque={body_high['torque_knm']}kNm")
print(f"  Result: score={rs2['score']}  risk_level={rs2['risk_level']}")
check("Score >= 50 (high inputs)", rs2["score"] >= 50, rs2["score"])
check("risk_level in (high, critical)", rs2["risk_level"] in ("high", "critical"), rs2["risk_level"])

# Test C -- LOW: very shallow, no incidents in range, high MW, low torque
# Use Nagaur Sandstone at 600m -- no incidents exist there so density = 0.
# MW=1.22 (above both thresholds), torque=4.1 (below 7.0) -> only depth-zone
# check (600m is NOT in 1100-1200 danger zone) -> score = 0 -> LOW.
print()
body_low = {
    "depth_m": 600.0,
    "formation": "Nagaur Sandstone",
    "fault_block": "FB-C",
    "mud_weight_sg": 1.22,
    "torque_knm": 4.1,
}
rs3 = post_json("/api/risk-score", body_low)
print(f"  Input:  depth={body_low['depth_m']}m  MW={body_low['mud_weight_sg']}  torque={body_low['torque_knm']}kNm")
print(f"  Result: score={rs3['score']}  risk_level={rs3['risk_level']}  factors={len(rs3['top_factors'])}")
check("Score < 25 (genuinely low-risk params)", rs3["score"] < 25, rs3["score"])
check("risk_level == 'low'", rs3["risk_level"] == "low", rs3["risk_level"])
check("recommendation starts with 'LOW'", rs3["recommendation"].startswith("LOW"), rs3["recommendation"][:20])

# ── Features 1 & 2: SSE stream ────────────────────────────────────────────────
print("\n[Features 1+2] SSE stream — proactive trigger + ADWIN drift")
print("  Consuming 220 stream rows (approx 90s)…")

try:
    rows = stream_rows(220)
    print(f"  Consumed {len(rows)} rows")

    # Feature 1 — proactive depth trigger
    proactive_rows = [r for r in rows if r.get("proactive_alert") is True]
    check(
        "Proactive alert fired at least once",
        len(proactive_rows) >= 1,
        f"{len(proactive_rows)} proactive rows"
    )
    if proactive_rows:
        pr = proactive_rows[0]
        print(f"  First proactive row: row_id={pr['row_id']}  depth={pr['depth_m']}m")
        print(f"  Message: {pr['proactive_message'][:120]}…")
        check("proactive_message is non-empty", bool(pr.get("proactive_message")))
        check("historical_wells is a list", isinstance(pr.get("historical_wells"), list))
        check("historical_wells has >= 2 wells", len(pr.get("historical_wells", [])) >= 2,
              pr.get("historical_wells"))
        check("proactive fires at depth >= 1100m", pr["depth_m"] >= 1100.0, pr["depth_m"])

    # Feature 2 — ADWIN drift
    drift_rows = [r for r in rows if r.get("drift_detected") is True]
    nodrift_rows = [r for r in rows if r.get("drift_detected") is False]
    check(
        "drift_detected field present on all data rows",
        len(drift_rows) + len(nodrift_rows) >= 200,
        f"drift_true={len(drift_rows)} drift_false={len(nodrift_rows)}"
    )
    check(
        "ADWIN drift fires at least once (after torque spike)",
        len(drift_rows) >= 1,
        f"{len(drift_rows)} drift rows"
    )
    if drift_rows:
        dr = drift_rows[0]
        print(f"  First drift row: row_id={dr['row_id']}  depth={dr['depth_m']}m  magnitude={dr.get('drift_magnitude')}")
        print(f"  Drift message: {dr.get('drift_message', '')[:120]}…")
        check("drift_magnitude > 1.5", (dr.get("drift_magnitude") or 0) > 1.5, dr.get("drift_magnitude"))
        check("drift_message contains 'STATISTICAL DRIFT'",
              "STATISTICAL DRIFT" in dr.get("drift_message", ""))

except Exception as e:
    print(f"  [ERROR] Stream test failed: {e}")
    FAIL += 3

# ── Regression: existing routes ───────────────────────────────────────────────
print("\n[Regression] Existing routes still working")
h = get_json("/api/health")
check("GET /api/health -> ok", h["status"] == "ok")
check("GET /api/health -> 8 wells", h["wells"] == 8)
w = get_json("/api/wells")
check("GET /api/wells -> 8 results", len(w) == 8)
check("GET /api/wells -> has risk_level", "risk_level" in w[0])

# ── Summary ───────────────────────────────────────────────────────────────────
print()
print("=" * 60)
total = PASS + FAIL
print(f"  Results: {PASS}/{total} passed  {'ALL PASSED' if FAIL == 0 else str(FAIL) + ' FAILED'}")

print("=" * 60)
