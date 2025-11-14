-- Query: Layer ID audit trail (PHR_LAYER_ID_TOKEN_ISSUE)
-- Executed: $(date -u +%Y-%m-%dT%H:%M:%SZ)
SELECT action, trace_id, event_time FROM d_audit_event WHERE action='PHR_LAYER_ID_TOKEN_ISSUE' ORDER BY event_time DESC LIMIT 10;
 action | trace_id | event_time 
--------+----------+------------
(0 rows)

