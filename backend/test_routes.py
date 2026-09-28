import urllib.request
import json

BASE = "http://localhost:8000"


def get(path, label):
    try:
        with urllib.request.urlopen(BASE + path) as r:
            data = json.loads(r.read())
        print("[PASS]", label)
        return data
    except Exception as e:
        print("[FAIL]", label, ":", e)
        return None


def post(path, body, label):
    try:
        payload = json.dumps(body).encode()
        req = urllib.request.Request(
            BASE + path,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
        print("[PASS]", label)
        return data
    except Exception as e:
        print("[FAIL]", label, ":", e)
        return None


print("=" * 56)
print("  NWIS Route Tests")
print("=" * 56)

# 1. Health
h = get("/api/health", "GET /api/health")
if h:
    print("       wells =", h["wells"], "  incidents =", h["incidents"])

# 2. All wells with risk_level
w = get("/api/wells", "GET /api/wells")
if w:
    risks = [(x["well_id"], x["risk_level"]) for x in w]
    for rid, rl in risks:
        print("      ", rid, "->", rl)

# 3. Nearby wells
nb = get(
    "/api/wells/nearby?lat=28.4&lon=73.2&radius_km=30",
    "GET /api/wells/nearby (30 km)"
)
if nb:
    print("       found", nb["count"], "well(s) within 30 km")
    for ww in nb["wells"]:
        print("       -", ww["well_id"], ww["name"], ww["distance_km"], "km")

# 4. Incidents for one well
i1 = get("/api/incidents?well_id=OIL-001", "GET /api/incidents?well_id=OIL-001")
if i1:
    print("      ", len(i1), "incident(s) for OIL-001")
    for inc in i1:
        print("       -", inc["incident_id"], inc["incident_type"], "@", inc["depth_m"], "m")

# 5. All incidents
ia = get("/api/incidents", "GET /api/incidents (all)")
if ia:
    print("       total incidents:", len(ia))

# 6. Geological depth filter
df = get(
    "/api/incidents/by-depth?depth_m=1140&formation=Jodhpur+Sandstone&fault_block=FB-A",
    "GET /api/incidents/by-depth"
)
if df:
    print("       matched", df["count"], "incident(s)")
    for inc in df["incidents"]:
        print("       -", inc["incident_id"], inc["incident_type"],
              "@ depth", inc["depth_m"], "m  diff =", inc["depth_diff_m"], "m")

# 7. Natural language query
q = post(
    "/api/query",
    {"question": "what happened at 1150m in Jodhpur Sandstone?"},
    "POST /api/query"
)
if q:
    print("       matched", len(q["matched_incidents"]), "incident(s)")
    print("       --- Answer (first 6 lines) ---")
    for line in q["answer"].split("\n")[:6]:
        print("      ", line)
    print("       ...")

print()
print("All route tests complete.")
