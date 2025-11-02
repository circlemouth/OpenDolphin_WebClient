-- Phase 3.7 security/compliance schema updates

CREATE TABLE IF NOT EXISTS d_factor2_credential (
    id BIGSERIAL PRIMARY KEY,
    user_pk BIGINT NOT NULL,
    credential_type VARCHAR(32) NOT NULL,
    label VARCHAR(255),
    credential_id VARCHAR(512),
    public_key TEXT,
    secret TEXT,
    sign_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    transports TEXT,
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_factor2_credential_user ON d_factor2_credential(user_pk);
CREATE INDEX IF NOT EXISTS idx_factor2_credential_id ON d_factor2_credential(credential_id);

CREATE TABLE IF NOT EXISTS d_factor2_challenge (
    id BIGSERIAL PRIMARY KEY,
    user_pk BIGINT NOT NULL,
    challenge_type VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) NOT NULL UNIQUE,
    challenge_payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    rp_id VARCHAR(255),
    origin VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_factor2_challenge_user ON d_factor2_challenge(user_pk);
CREATE INDEX IF NOT EXISTS idx_factor2_challenge_type ON d_factor2_challenge(challenge_type);

CREATE TABLE IF NOT EXISTS d_audit_event (
    id BIGSERIAL PRIMARY KEY,
    event_time TIMESTAMPTZ NOT NULL,
    actor_id VARCHAR(128),
    actor_display_name VARCHAR(255),
    actor_role VARCHAR(128),
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(255),
    patient_id VARCHAR(64),
    request_id VARCHAR(64),
    ip_address VARCHAR(64),
    user_agent VARCHAR(512),
    payload_hash VARCHAR(128) NOT NULL,
    previous_hash VARCHAR(128),
    event_hash VARCHAR(128) NOT NULL,
    payload TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_event_time ON d_audit_event(event_time);
CREATE INDEX IF NOT EXISTS idx_audit_event_action ON d_audit_event(action);

CREATE TABLE IF NOT EXISTS d_third_party_disclosure (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(128),
    actor_role VARCHAR(128),
    recipient VARCHAR(255) NOT NULL,
    purpose VARCHAR(512),
    description TEXT,
    legal_basis VARCHAR(255),
    disclosed_at TIMESTAMPTZ NOT NULL,
    reference_id VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_third_party_disclosure_patient ON d_third_party_disclosure(patient_id);
CREATE INDEX IF NOT EXISTS idx_third_party_disclosure_time ON d_third_party_disclosure(disclosed_at);

ALTER TABLE d_factor2_backupkey ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE d_factor2_backupkey ADD COLUMN IF NOT EXISTS hash_algorithm VARCHAR(32);

-- force re-issue of legacy plaintext backup codes
DELETE FROM d_factor2_backupkey;
