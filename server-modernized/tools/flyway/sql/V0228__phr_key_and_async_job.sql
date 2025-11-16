CREATE TABLE IF NOT EXISTS d_phr_key (
    id BIGINT PRIMARY KEY,
    facilityid VARCHAR(255) NOT NULL,
    patientid VARCHAR(255) NOT NULL,
    accesskey VARCHAR(255) NOT NULL,
    secretkey VARCHAR(255) NOT NULL,
    registered TIMESTAMP WITHOUT TIME ZONE
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.sequences
        WHERE sequence_schema = current_schema
          AND sequence_name = 'd_phr_key_seq'
    ) THEN
        EXECUTE 'CREATE SEQUENCE d_phr_key_seq START WITH 1 INCREMENT BY 1';
        EXECUTE 'ALTER SEQUENCE d_phr_key_seq OWNED BY d_phr_key.id';
    END IF;
    EXECUTE 'ALTER TABLE d_phr_key ALTER COLUMN id SET DEFAULT nextval(''d_phr_key_seq'')';
END;
$$ LANGUAGE plpgsql;

CREATE UNIQUE INDEX IF NOT EXISTS idx_d_phr_key_facility_patient
    ON d_phr_key (facilityid, patientid);

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

CREATE INDEX IF NOT EXISTS idx_phr_async_job_state
    ON phr_async_job (state);

CREATE INDEX IF NOT EXISTS idx_phr_async_job_facility
    ON phr_async_job (facility_id, queued_at DESC);

ALTER TABLE phr_async_job
    ALTER COLUMN patient_scope
    TYPE JSONB
    USING patient_scope::jsonb;
