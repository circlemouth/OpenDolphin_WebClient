ALTER TABLE IF EXISTS d_audit_event
    ADD COLUMN IF NOT EXISTS trace_id VARCHAR(64);

UPDATE d_audit_event
   SET trace_id = COALESCE(trace_id, request_id)
 WHERE trace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_event_trace_id
    ON d_audit_event(trace_id);
