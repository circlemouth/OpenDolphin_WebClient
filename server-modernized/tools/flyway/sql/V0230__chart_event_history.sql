-- ChartEvent history persistence (IC-36)
CREATE SEQUENCE IF NOT EXISTS chart_event_seq;

CREATE TABLE IF NOT EXISTS chart_event_history (
    event_id BIGINT PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL,
    issuer_uuid VARCHAR(64),
    event_type INTEGER,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chart_event_history_facility_event
    ON chart_event_history (facility_id, event_id);

CREATE INDEX IF NOT EXISTS idx_chart_event_history_created_at
    ON chart_event_history (created_at);
