"""
NWIS — Nearby Wells Intelligence System
Data Generator Script

Generates:
  - backend/data/wells.json       (8 oil wells, Bikaner-Nagaur basin, Rajasthan)
  - backend/data/incidents.json   (20 drilling incidents across those wells)
  - backend/data/telemetry.csv    (200 rows of simulated drilling sensor data)

Usage:
  python generate_data.py

Dependencies: Python standard library only (json, csv, random, datetime, os)
"""

import json
import csv
import random
import os
from datetime import date, timedelta

# ── Reproducible randomness ───────────────────────────────────────────────────
random.seed(42)

# ── Output paths (relative to this script's location) ────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(SCRIPT_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

WELLS_PATH     = os.path.join(DATA_DIR, "wells.json")
INCIDENTS_PATH = os.path.join(DATA_DIR, "incidents.json")
TELEMETRY_PATH = os.path.join(DATA_DIR, "telemetry.csv")


# ═══════════════════════════════════════════════════════════════════════════════
#  1. WELLS
# ═══════════════════════════════════════════════════════════════════════════════
def noise(value, pct=0.02):
    """Apply ±pct random noise to a numeric value."""
    return round(value * (1 + random.uniform(-pct, pct)), 4)


WELLS_RAW = [
    {
        "well_id": "OIL-001",
        "name": "Baghewala-1",
        "lat": 28.45,
        "lon": 73.21,
        "depth_m": 1280,
        "formation": "Jodhpur Sandstone",
        "tvd_band": "1050-1300",
        "fault_block": "FB-A",
        "spud_date": "2019-03-12",
        "completion_date": "2019-08-22",
        "status": "producer",
    },
    {
        "well_id": "OIL-002",
        "name": "Baghewala-2",
        "lat": 28.51,
        "lon": 73.35,
        "depth_m": 1195,
        "formation": "Bilara Limestone",
        "tvd_band": "950-1200",
        "fault_block": "FB-A",
        "spud_date": "2019-11-04",
        "completion_date": "2020-04-17",
        "status": "producer",
    },
    {
        "well_id": "OIL-003",
        "name": "Jaisalmer-Deep-1",
        "lat": 27.83,
        "lon": 72.68,
        "depth_m": 1350,
        "formation": "Nagaur Sandstone",
        "tvd_band": "1200-1400",
        "fault_block": "FB-B",
        "spud_date": "2020-02-19",
        "completion_date": "2020-09-08",
        "status": "producer",
    },
    {
        "well_id": "OIL-004",
        "name": "Pugal-North-1",
        "lat": 28.14,
        "lon": 73.02,
        "depth_m": 1120,
        "formation": "Jodhpur Sandstone",
        "tvd_band": "900-1150",
        "fault_block": "FB-A",
        "spud_date": "2020-07-10",
        "completion_date": "2020-12-29",
        "status": "injector",
    },
    {
        "well_id": "OIL-005",
        "name": "Kolayat-1",
        "lat": 27.96,
        "lon": 73.57,
        "depth_m": 1260,
        "formation": "Bilara Limestone",
        "tvd_band": "1000-1280",
        "fault_block": "FB-B",
        "spud_date": "2021-01-15",
        "completion_date": "2021-07-03",
        "status": "producer",
    },
    {
        "well_id": "OIL-006",
        "name": "Nagaur-West-1",
        "lat": 27.22,
        "lon": 73.81,
        "depth_m": 1310,
        "formation": "Nagaur Sandstone",
        "tvd_band": "1150-1350",
        "fault_block": "FB-C",
        "spud_date": "2021-05-20",
        "completion_date": "2021-11-14",
        "status": "producer",
    },
    {
        "well_id": "OIL-007",
        "name": "Bikaner-South-1",
        "lat": 28.78,
        "lon": 73.44,
        "depth_m": 1175,
        "formation": "Jodhpur Sandstone",
        "tvd_band": "1000-1200",
        "fault_block": "FB-C",
        "spud_date": "2021-09-03",
        "completion_date": "2022-02-18",
        "status": "injector",
    },
    {
        "well_id": "OIL-008",
        "name": "Deshnok-1",
        "lat": 27.47,
        "lon": 72.94,
        "depth_m": 1230,
        "formation": "Bilara Limestone",
        "tvd_band": "1050-1250",
        "fault_block": "FB-C",
        "spud_date": "2022-03-07",
        "completion_date": "2022-09-25",
        "status": "producer",
    },
]


def generate_wells():
    with open(WELLS_PATH, "w") as f:
        json.dump(WELLS_RAW, f, indent=2)
    print(f"  [wells.json]     {len(WELLS_RAW)} wells written.")


# ═══════════════════════════════════════════════════════════════════════════════
#  2. INCIDENTS
# ═══════════════════════════════════════════════════════════════════════════════
INCIDENTS_RAW = [
    # ── stuck_pipe (8 incidents, 1100-1200m, Jodhpur Sandstone) ──────────────
    {
        "incident_id": "INC-001",
        "well_id": "OIL-001",
        "incident_type": "stuck_pipe",
        "depth_m": 1148,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-A",
        "mud_weight_sg": 1.18,
        "torque_knm": 8.4,
        "description": (
            "Stuck pipe encountered while drilling through high-density oil zone. "
            "Viscosity of crude estimated at 11000 cP. Resolved by increasing mud "
            "weight to 1.25 SG and applying 50000 lbs overpull."
        ),
        "mitigation": (
            "Increase mud weight by 0.07 SG. Apply overpull of 50000 lbs. "
            "Reduce ROP to 3 m/hr."
        ),
        "date": "2019-06-14",
    },
    {
        "incident_id": "INC-003",
        "well_id": "OIL-002",
        "incident_type": "stuck_pipe",
        "depth_m": 1162,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-A",
        "mud_weight_sg": 1.17,
        "torque_knm": 9.1,
        "description": (
            "Differential sticking occurred at 1162m in the upper Jodhpur Sandstone "
            "member. Drill string held fast for 4 hours. High overbalance pressure "
            "(450 psi) identified as primary cause."
        ),
        "mitigation": (
            "Spot diesel oil pill. Reduce mud weight by 0.05 SG. Apply jar sequence "
            "(150 klbs up-jar). Consider freeing agent if jars ineffective after 3 hrs."
        ),
        "date": "2020-02-11",
    },
    {
        "incident_id": "INC-005",
        "well_id": "OIL-003",
        "incident_type": "stuck_pipe",
        "depth_m": 1135,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-B",
        "mud_weight_sg": 1.19,
        "torque_knm": 8.9,
        "description": (
            "Mechanical stuck pipe at 1135m due to wellbore instability in shale "
            "intercalations within the Jodhpur Sandstone. String rotated but could "
            "not be reciprocated. Formation collapse suspected."
        ),
        "mitigation": (
            "Increase mud weight to 1.24 SG. Apply spotting fluid. Ream past stuck "
            "zone at reduced WOB (5 tonnes). Consider casing point evaluation."
        ),
        "date": "2020-05-17",
    },
    {
        "incident_id": "INC-009",
        "well_id": "OIL-005",
        "incident_type": "stuck_pipe",
        "depth_m": 1155,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-B",
        "mud_weight_sg": 1.18,
        "torque_knm": 8.7,
        "description": (
            "Differential sticking at 1155m following a 2-hour connection. "
            "High differential pressure of 480 psi across permeable Jodhpur Sandstone "
            "contributed to pipe embedment in filter cake."
        ),
        "mitigation": (
            "Spot diesel soak pill immediately. Reduce static overbalance. Apply "
            "combination jar sequence. Review mud programme to reduce filtrate invasion."
        ),
        "date": "2021-03-22",
    },
    {
        "incident_id": "INC-012",
        "well_id": "OIL-006",
        "incident_type": "stuck_pipe",
        "depth_m": 1170,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.17,
        "torque_knm": 9.4,
        "description": (
            "Stuck pipe at 1170m during wiper trip. Differential pressure of 500 psi "
            "across thick permeable sand interval. Pipe embedded in thick filter cake "
            "after 3-hour static period."
        ),
        "mitigation": (
            "Spot crude oil pill to reduce differential sticking. Apply slow rotation "
            "at 20 RPM. Apply up-jar first then down-jar. Increase mud weight minimally "
            "to avoid further losses."
        ),
        "date": "2021-08-03",
    },
    {
        "incident_id": "INC-015",
        "well_id": "OIL-007",
        "incident_type": "stuck_pipe",
        "depth_m": 1143,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.18,
        "torque_knm": 8.6,
        "description": (
            "Key seating and differential sticking combination at 1143m during slide "
            "drilling. Dog-leg severity of 3.2 deg/30m at 1100m contributed to key "
            "seating in the build section."
        ),
        "mitigation": (
            "Ream key seat with dedicated reamer. Reduce WOB and RPM. Spot lubricating "
            "pill (10% diesel + pipe lax). Consider trajectory redesign to reduce DLS."
        ),
        "date": "2021-12-14",
    },
    {
        "incident_id": "INC-017",
        "well_id": "OIL-007",
        "incident_type": "stuck_pipe",
        "depth_m": 1128,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.19,
        "torque_knm": 8.2,
        "description": (
            "Stuck pipe at 1128m following loss of circulation and subsequent wellbore "
            "instability. Shale sloughing into borehole blocked drill string movement "
            "both upward and downward."
        ),
        "mitigation": (
            "Pump high-viscosity sweep to clean hole. Increase mud inhibition. Apply "
            "potassium chloride-PHPA mud system to stabilise reactive shales."
        ),
        "date": "2022-02-01",
    },
    {
        "incident_id": "INC-018",
        "well_id": "OIL-008",
        "incident_type": "stuck_pipe",
        "depth_m": 1158,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.18,
        "torque_knm": 9.0,
        "description": (
            "Stuck pipe at 1158m in thinly interbedded sand-shale of Jodhpur Sandstone. "
            "High torque and drag observed on the previous run. Pipe embedment in thick "
            "filter cake after 4-hour survey at 1150m."
        ),
        "mitigation": (
            "Spot diesel oil pill. Apply jar sequence. If unsuccessful within 6 hours, "
            "deploy fishing team. Review filter cake quality and reduce HPHT filtrate "
            "below 4 ml."
        ),
        "date": "2022-06-11",
    },
    # ── mud_loss (6 incidents, 900-1050m, Bilara Limestone) ──────────────────
    {
        "incident_id": "INC-002",
        "well_id": "OIL-001",
        "incident_type": "mud_loss",
        "depth_m": 980,
        "formation": "Bilara Limestone",
        "fault_block": "FB-A",
        "mud_weight_sg": 1.15,
        "torque_knm": 4.2,
        "description": (
            "Partial mud losses of 12 bbl/hr observed while drilling through fractured "
            "Bilara Limestone. Pit volume dropped by 8 bbl over 45 minutes. Losses "
            "attributed to natural fracture network near fault zone."
        ),
        "mitigation": (
            "Pump LCM pill (50 lb/bbl mica blend). Reduce ECD. Monitor returns closely. "
            "Stand by with blind drilling procedure."
        ),
        "date": "2019-07-02",
    },
    {
        "incident_id": "INC-006",
        "well_id": "OIL-003",
        "incident_type": "mud_loss",
        "depth_m": 1020,
        "formation": "Bilara Limestone",
        "fault_block": "FB-B",
        "mud_weight_sg": 1.16,
        "torque_knm": 4.5,
        "description": (
            "Total mud loss at 1020m in cavernous Bilara Limestone karst zone. Returns "
            "ceased completely for 3 hours. Estimated loss volume 120 bbl. No WBM "
            "returns to surface."
        ),
        "mitigation": (
            "Pump cement plug. Switch to managed pressure drilling. Reduce fluid weight. "
            "Use oil-based LCM with coarse walnut shells at 30 lb/bbl concentration."
        ),
        "date": "2020-06-30",
    },
    {
        "incident_id": "INC-008",
        "well_id": "OIL-004",
        "incident_type": "mud_loss",
        "depth_m": 960,
        "formation": "Bilara Limestone",
        "fault_block": "FB-A",
        "mud_weight_sg": 1.14,
        "torque_knm": 3.8,
        "description": (
            "Seepage mud losses of 8 bbl/hr at 960m in fractured Bilara Limestone. "
            "ECD estimated to exceed fracture gradient. Losses correlated with high "
            "pump pressure readings (SPP: 2200 psi)."
        ),
        "mitigation": (
            "Reduce pump rate by 20%. Spot LCM pill (calcium carbonate, 25 lb/bbl). "
            "Reduce mud weight by 0.04 SG to lower ECD below fracture gradient."
        ),
        "date": "2020-11-12",
    },
    {
        "incident_id": "INC-011",
        "well_id": "OIL-005",
        "incident_type": "mud_loss",
        "depth_m": 1005,
        "formation": "Bilara Limestone",
        "fault_block": "FB-B",
        "mud_weight_sg": 1.15,
        "torque_knm": 4.0,
        "description": (
            "Partial mud losses observed while drilling through vuggy Bilara Limestone. "
            "Loss rate of 15 bbl/hr at 1005m. Losses associated with naturally fractured "
            "interval identified on nearby OIL-003 logs."
        ),
        "mitigation": (
            "Mix and pump LCM pill with combination of mica, cellophane, and walnut shells. "
            "Reduce ECD by lowering flow rate to 350 gpm."
        ),
        "date": "2021-05-10",
    },
    {
        "incident_id": "INC-014",
        "well_id": "OIL-006",
        "incident_type": "mud_loss",
        "depth_m": 935,
        "formation": "Bilara Limestone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.16,
        "torque_knm": 3.6,
        "description": (
            "Severe mud losses of 30 bbl/hr at 935m in karstic Bilara Limestone. "
            "Loss zone coincides with sub-surface solution cavity identified on seismic "
            "section. Total losses over 8 hours: 240 bbl."
        ),
        "mitigation": (
            "Switch to synthetic-base LCM squeeze. Pump two cement plugs across loss zone. "
            "Consider casing shoe depth revision. Increase formation integrity test frequency."
        ),
        "date": "2021-10-07",
    },
    {
        "incident_id": "INC-019",
        "well_id": "OIL-008",
        "incident_type": "mud_loss",
        "depth_m": 1040,
        "formation": "Bilara Limestone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.15,
        "torque_knm": 4.3,
        "description": (
            "Gradual mud losses of 10 bbl/hr at 1040m in fractured Bilara Limestone. "
            "ECD modelling indicates fracture gradient exceeded by 0.03 SG. Total losses "
            "estimated at 80 bbl before zone was isolated."
        ),
        "mitigation": (
            "Reduce pump rate by 15%. Pump LCM pills with coarse calcium carbonate. "
            "Evaluate potential for MPD application. Set casing before re-drilling "
            "through loss zone."
        ),
        "date": "2022-07-28",
    },
    # ── kick (4 incidents, 1200-1300m, Nagaur Sandstone) ─────────────────────
    {
        "incident_id": "INC-004",
        "well_id": "OIL-002",
        "incident_type": "kick",
        "depth_m": 1215,
        "formation": "Nagaur Sandstone",
        "fault_block": "FB-A",
        "mud_weight_sg": 1.14,
        "torque_knm": 5.7,
        "description": (
            "Gas influx detected at 1215m while drilling Nagaur Sandstone. Pit gain of "
            "6 bbl observed. Flow check confirmed well was flowing. Shut-in SIDP 180 psi, "
            "SICP 230 psi indicating underbalanced conditions."
        ),
        "mitigation": (
            "Shut in well immediately using annular BOP. Execute driller's method kill "
            "procedure. Increase mud weight to 1.22 SG. Conduct FIT at shoe before resuming."
        ),
        "date": "2020-03-28",
    },
    {
        "incident_id": "INC-010",
        "well_id": "OIL-005",
        "incident_type": "kick",
        "depth_m": 1238,
        "formation": "Nagaur Sandstone",
        "fault_block": "FB-B",
        "mud_weight_sg": 1.13,
        "torque_knm": 6.1,
        "description": (
            "Oil and gas influx at 1238m in Nagaur Sandstone high-pressure zone. Pit gain "
            "of 9 bbl observed within 15 minutes of losing returns. Influx rate estimated "
            "at 0.6 bbl/min."
        ),
        "mitigation": (
            "Immediate well shut-in. Record SIDP and SICP. Kill well using driller's method "
            "with kill mud weight 1.23 SG. Notify company man and OIM."
        ),
        "date": "2021-04-18",
    },
    {
        "incident_id": "INC-013",
        "well_id": "OIL-006",
        "incident_type": "kick",
        "depth_m": 1260,
        "formation": "Nagaur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.14,
        "torque_knm": 5.5,
        "description": (
            "Formation gas influx at 1260m while making a connection. Observed 7 bbl pit "
            "gain. Flow check confirmed uncontrolled flow from Nagaur Sandstone reservoir "
            "with reservoir pressure estimated at 1.22 SG EMW."
        ),
        "mitigation": (
            "Close annular preventer. Record SIDP/SICP. Increase kill mud weight to 1.24 SG. "
            "Execute driller's method; circulate out kick in two stages."
        ),
        "date": "2021-09-20",
    },
    {
        "incident_id": "INC-020",
        "well_id": "OIL-008",
        "incident_type": "kick",
        "depth_m": 1245,
        "formation": "Nagaur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.13,
        "torque_knm": 6.3,
        "description": (
            "Gas kick at 1245m in overpressured Nagaur Sandstone pay zone. Pit gain of "
            "11 bbl observed. Reservoir pressure gradient estimated at 1.24 SG EMW, "
            "significantly exceeding current mud weight of 1.13 SG."
        ),
        "mitigation": (
            "Shut in well immediately. Increase kill mud weight to 1.27 SG. Execute "
            "wait-and-weight kill method. Bleed off annular pressure gradually using "
            "adjustable choke manifold."
        ),
        "date": "2022-08-15",
    },
    # ── overpressure_zone (2 incidents, 1100-1200m, Jodhpur Sandstone) ────────────
    {
        "incident_id": "INC-007",
        "well_id": "OIL-004",
        "incident_type": "overpressure_zone",
        "depth_m": 1185,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-A",
        "mud_weight_sg": 1.18,
        "torque_knm": 12.3,
        "description": (
            "Unexpected high pressure zone encountered at 1185m. Signs of overpressure "
            "detected via connection gas peaks and d-exponent reversal."
        ),
        "mitigation": (
            "Increase mud weight proactively. Circulate bottoms up. Monitor gas levels "
            "and flow rates closely before continuing drilling."
        ),
        "date": "2020-09-05",
    },
    {
        "incident_id": "INC-016",
        "well_id": "OIL-007",
        "incident_type": "overpressure_zone",
        "depth_m": 1195,
        "formation": "Jodhpur Sandstone",
        "fault_block": "FB-C",
        "mud_weight_sg": 1.17,
        "torque_knm": 11.8,
        "description": (
            "Overpressure zone transition identified at 1195m. Sudden increase in ROP "
            "and background gas. Wellbore stability issues initiated."
        ),
        "mitigation": (
            "Control drill the transition zone. Adjust mud weight to manage pore pressure. "
            "Ensure MPD system is fully operational and choke is adjusted."
        ),
        "date": "2022-01-19",
    },
]


def generate_incidents():
    for inc in INCIDENTS_RAW:
        well_num = inc["well_id"].split("-")[1]
        inc["document_source"] = f"WCR-Well-{well_num}.pdf"
        
    with open(INCIDENTS_PATH, "w") as f:
        json.dump(INCIDENTS_RAW, f, indent=2)
    print(f"  [incidents.json] {len(INCIDENTS_RAW)} incidents written.")


# ═══════════════════════════════════════════════════════════════════════════════
#  3. TELEMETRY
# ═══════════════════════════════════════════════════════════════════════════════
TELEMETRY_COLUMNS = [
    "row_id", "timestamp", "depth_m", "mud_weight_sg",
    "torque_knm", "rop_m_hr", "wob_tonnes", "spp_psi", "temp_c", "alert_flag",
]

# Base timestamp: drilling session starts 2021-07-15 06:00:00
BASE_DT = date(2021, 7, 15)


def generate_telemetry():
    rows = []
    total_rows = 200

    # depth increases linearly from 1050 to 1250 m over 200 rows
    depth_start = 1050.0
    depth_end   = 1250.0
    depth_step  = (depth_end - depth_start) / (total_rows - 1)

    for i in range(total_rows):
        row_id    = i + 1                       # 1-indexed
        row_idx   = i                            # 0-indexed helper
        # One reading every 15 minutes
        minutes   = row_idx * 15
        h, m      = divmod(minutes, 60)
        timestamp = "{} {:02d}:{:02d}:00".format(BASE_DT.isoformat(), (6 + h) % 24, m)

        depth_m   = round(depth_start + row_idx * depth_step, 2)

        # ── mud_weight_sg ─────────────────────────────────────────────────────
        # Stays ~1.15-1.18 until row 140, then drops to 1.12 at row 150
        if row_id <= 140:
            mw_base = random.uniform(1.15, 1.18)
        elif row_id <= 149:
            # Gradual linear drop from 1.165 at row 141 to 1.12 at row 150
            frac    = (row_id - 140) / 9.0
            mw_base = 1.165 - frac * (1.165 - 1.12)
        else:
            mw_base = 1.12
        mud_weight_sg = round(noise(mw_base), 4)

        # ── torque_knm ────────────────────────────────────────────────────────
        # Stays ~5-6 until row 150, then SPIKES to 9.2 at row 155
        if row_id <= 150:
            torque_base = random.uniform(5.0, 6.0)
        elif row_id <= 154:
            # Ramp from 6 to 9.2
            frac        = (row_id - 150) / 5.0
            torque_base = 6.0 + frac * (9.2 - 6.0)
        else:
            torque_base = 9.2
        torque_knm = round(noise(torque_base), 4)

        # ── rop_m_hr ─────────────────────────────────────────────────────────
        # Normal: 8-12 m/hr; reduces after alert
        if row_id < 150:
            rop_base = random.uniform(8.0, 12.0)
        else:
            rop_base = random.uniform(2.5, 4.5)   # reduced ROP post-incident
        rop_m_hr = round(noise(rop_base), 4)

        # ── wob_tonnes ────────────────────────────────────────────────────────
        # Normal: 12-18 t; reduced post-alert
        if row_id < 150:
            wob_base = random.uniform(12.0, 18.0)
        else:
            wob_base = random.uniform(6.0, 10.0)
        wob_tonnes = round(noise(wob_base), 4)

        # ── spp_psi (standpipe pressure) ─────────────────────────────────────
        # Normal: 1800-2200 psi; spikes post-alert
        if row_id < 150:
            spp_base = random.uniform(1800.0, 2200.0)
        else:
            spp_base = random.uniform(2300.0, 2700.0)
        spp_psi = round(noise(spp_base), 2)

        # ── temp_c (Thar Desert surface conditions) ───────────────────────────
        # Peaks 48-52°C; simulate diurnal variation over 50-row cycle
        hour_frac   = (row_idx % 96) / 96.0     # diurnal cycle ~24 hrs
        temp_peak   = 48.0 + 4.0 * abs(hour_frac - 0.5) * 2.0   # 48–52°C midday
        temp_c      = round(noise(temp_peak, 0.02), 2)

        # ── alert_flag ────────────────────────────────────────────────────────
        alert_flag  = 0 if row_id <= 149 else 1

        rows.append([
            row_id, timestamp, depth_m, mud_weight_sg,
            torque_knm, rop_m_hr, wob_tonnes, spp_psi, temp_c, alert_flag,
        ])

    with open(TELEMETRY_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(TELEMETRY_COLUMNS)
        writer.writerows(rows)

    print(f"  [telemetry.csv]  {len(rows)} rows written.")


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating NWIS synthetic data …")
    generate_wells()
    generate_incidents()
    generate_telemetry()
    print("Data generated successfully")
