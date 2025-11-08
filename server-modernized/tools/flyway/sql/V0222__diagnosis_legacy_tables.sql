-- Create diagnosis ledger table to mirror legacy schema requirements.
CREATE TABLE IF NOT EXISTS d_diagnosis (
    id BIGINT NOT NULL,
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    linkid BIGINT NOT NULL,
    linkrelation VARCHAR(255),
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(1) NOT NULL,
    department VARCHAR(255),
    departmentdesc VARCHAR(255),
    diagnosis VARCHAR(255) NOT NULL,
    diagnosiscategory VARCHAR(255),
    diagnosiscategorycodesys VARCHAR(255),
    diagnosiscategorydesc VARCHAR(255),
    diagnosiscode VARCHAR(255),
    diagnosiscodesystem VARCHAR(255),
    outcome VARCHAR(255),
    outcomecodesys VARCHAR(255),
    outcomedesc VARCHAR(255),
    firstencounterdate VARCHAR(255),
    relatedhealthinsurance VARCHAR(255),
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    CONSTRAINT d_diagnosis_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_diagnosis_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_diagnosis_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id)
);

CREATE SEQUENCE IF NOT EXISTS d_diagnosis_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE IF EXISTS d_diagnosis_seq OWNED BY d_diagnosis.id;

ALTER TABLE IF EXISTS d_diagnosis
    ALTER COLUMN id SET DEFAULT nextval('d_diagnosis_seq');

CREATE INDEX IF NOT EXISTS d_diagnosis_idx ON d_diagnosis (karte_id);
