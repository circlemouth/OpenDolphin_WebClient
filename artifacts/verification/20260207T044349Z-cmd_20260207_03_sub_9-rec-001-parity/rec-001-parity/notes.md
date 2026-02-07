# REC-001 parity (Reception list today -> open visit -> Charts)

RUN_ID: 20260207T044349Z-cmd_20260207_03_sub_9-rec-001-parity

## Minimal operation set (legacy -> Web)
1. Open Reception (today).
2. Pick a visit from the list (optionally via search/filter if used).
3. Navigate to Charts (open the visit).
4. Confirm Charts shows a valid patient/encounter context (at minimum: page loads, patient context/guard state is consistent).

## Evidence
- 01-reception.png: Reception page with today's list.
- 02-forward-to-charts.png: navigation from Reception to Charts.
- 03-charts.png: Charts page rendered after the transition.
- 04-back-to-reception.png: back navigation sanity check.

Note on sensitive data:
- Screenshots are from verification artifacts using test/dummy data flows; no real PHI is intended to be present.

## Conclusion
- The Web client satisfies the core legacy workflow "open today's reception list and open a visit in Charts".
- Remaining parity gaps (if any) are about legacy CLAIM-centric status/icons vs Web ORCA-queue centric representation; this is tracked in parity/backlog as a separate decision item.
