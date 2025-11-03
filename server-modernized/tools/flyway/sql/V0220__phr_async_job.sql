CREATE TABLE IF NOT EXISTS phr_async_job (
    job_id UUID PRIMARY KEY,
    job_type VARCHAR(64) NOT NULL,
    facility_id VARCHAR(32) NOT NULL,
    patient_scope JSONB NOT NULL,
    state VARCHAR(16) NOT NULL,
    progress SMALLINT NOT NULL DEFAULT 0,
    result_uri TEXT,
    error_code VARCHAR(32),
    error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    retry_count SMALLINT NOT NULL DEFAULT 0,
    locked_by VARCHAR(64),
    heartbeat_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_phr_async_job_state ON phr_async_job(state);
CREATE INDEX IF NOT EXISTS idx_phr_async_job_facility ON phr_async_job(facility_id, queued_at DESC);
