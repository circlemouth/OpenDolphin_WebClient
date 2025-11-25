-- Query: Container fetch audit (PHR_CONTAINER_FETCH)
-- Executed: $(date -u +%Y-%m-%dT%H:%M:%SZ)
SELECT action, trace_id, event_time FROM d_audit_event WHERE action='PHR_CONTAINER_FETCH' ORDER BY event_time DESC LIMIT 10;
 action | trace_id | event_time 
--------+----------+------------
(0 rows)

