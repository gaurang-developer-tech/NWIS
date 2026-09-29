import json
import csv
from collections import Counter

# ── Validate wells.json ───────────────────────────────────────────────
with open('data/wells.json') as f:
    wells = json.load(f)

faults = sorted(set(w['fault_block'] for w in wells))
forms  = sorted(set(w['formation']   for w in wells))
lats   = [w['lat'] for w in wells]
lons   = [w['lon'] for w in wells]
statuses = Counter(w['status'] for w in wells)

print('=' * 52)
print('  wells.json')
print('=' * 52)
print('  Total wells   :', len(wells))
print('  Fault blocks  :', faults)
print('  Formations    :', forms)
print('  Lat range     :', min(lats), '-', max(lats), '  (expected 27-29)')
print('  Lon range     :', min(lons), '-', max(lons), '  (expected 72-74)')
print('  Statuses      :', dict(statuses))

# ── Validate incidents.json ───────────────────────────────────────────
with open('data/incidents.json') as f:
    incs = json.load(f)

type_counts = Counter(i['incident_type'] for i in incs)
stuck  = [i for i in incs if i['incident_type'] == 'stuck_pipe']
losses = [i for i in incs if i['incident_type'] == 'mud_loss']
kicks  = [i for i in incs if i['incident_type'] == 'kick']
overp  = [i for i in incs if i['incident_type'] == 'overpressure_zone']

print()
print('=' * 52)
print('  incidents.json')
print('=' * 52)
print('  Total incidents :', len(incs))
for t, c in sorted(type_counts.items()):
    print('  {:<16}: {}'.format(t, c))

stuck_depths = [i['depth_m'] for i in stuck]
loss_depths  = [i['depth_m'] for i in losses]
kick_depths  = [i['depth_m'] for i in kicks]
overp_depths = [i['depth_m'] for i in overp]

print('  stuck_pipe depth  :', min(stuck_depths), '-', max(stuck_depths), 'm  (expected 1100-1200)')
print('  mud_loss depth    :', min(loss_depths),  '-', max(loss_depths),  'm  (expected 900-1050)')
print('  kick depth        :', min(kick_depths),  '-', max(kick_depths),  'm  (expected 1200-1300)')
print('  overpressure depth:', min(overp_depths), '-', max(overp_depths), 'm  (expected 1100-1200)')

# ── Validate telemetry.csv ────────────────────────────────────────────
with open('data/telemetry.csv') as f:
    rows = list(csv.DictReader(f))

alert_0 = [r for r in rows if r['alert_flag'] == '0']
alert_1 = [r for r in rows if r['alert_flag'] == '1']
depths  = [float(r['depth_m'])       for r in rows]
torques = [float(r['torque_knm'])    for r in rows]
mws     = [float(r['mud_weight_sg']) for r in rows]
temps   = [float(r['temp_c'])        for r in rows]

print()
print('=' * 52)
print('  telemetry.csv')
print('=' * 52)
print('  Total rows     :', len(rows))
print('  alert_flag = 0 :', len(alert_0), 'rows  (expected 149)')
print('  alert_flag = 1 :', len(alert_1), 'rows  (expected 51)')
print('  depth range    :', round(min(depths), 1), '-', round(max(depths), 1), 'm  (expected 1050-1250)')
print('  max torque     :', round(max(torques), 4), 'kNm  (expected ~9.2+)')
print('  min mud_weight :', round(min(mws), 4), 'SG   (expected ~1.12)')
print('  temp_c range   :', round(min(temps), 1), '-', round(max(temps), 1), 'C  (expected 48-52)')

all_ok = (
    len(wells) == 8 and
    len(incs) == 20 and
    len(rows) == 200 and
    len(alert_0) == 149 and
    len(alert_1) == 51 and
    max(torques) > 9.0 and
    min(mws) < 1.13
)
print()
print('  All checks PASSED.' if all_ok else '  WARNING: some checks failed.')
