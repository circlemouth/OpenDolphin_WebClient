ALTER TABLE IF EXISTS d_audit_event
    ADD COLUMN IF NOT EXISTS run_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS screen VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ui_action VARCHAR(64),
    ADD COLUMN IF NOT EXISTS outcome VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_audit_event_run_id ON d_audit_event(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_screen ON d_audit_event(screen);
CREATE INDEX IF NOT EXISTS idx_audit_event_ui_action ON d_audit_event(ui_action);
CREATE INDEX IF NOT EXISTS idx_audit_event_outcome ON d_audit_event(outcome);
