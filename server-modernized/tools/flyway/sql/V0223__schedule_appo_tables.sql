-- Ensure JPQL entities for Schedule/Appo endpoints have backing tables in modernized schema.
CREATE SEQUENCE IF NOT EXISTS hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_patient_visit (
    id BIGINT NOT NULL DEFAULT nextval('hibernate_sequence'),
    patient_id BIGINT NOT NULL,
    facilityId VARCHAR(255) NOT NULL,
    number INTEGER,
    pvtDate VARCHAR(32) NOT NULL,
    appointment VARCHAR(255),
    department VARCHAR(255),
    status INTEGER NOT NULL DEFAULT 0,
    insuranceUid VARCHAR(64),
    deptCode VARCHAR(64),
    deptName VARCHAR(255),
    doctorId VARCHAR(64),
    doctorName VARCHAR(255),
    jmariNumber VARCHAR(64),
    firstInsurance VARCHAR(255),
    memo TEXT,
    watingTime VARCHAR(32),
    CONSTRAINT d_patient_visit_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_patient_visit_patient FOREIGN KEY (patient_id) REFERENCES d_patient(id)
);

CREATE INDEX IF NOT EXISTS d_patient_visit_facility_date_idx
    ON d_patient_visit (facilityId, pvtDate);
CREATE INDEX IF NOT EXISTS d_patient_visit_doctor_idx
    ON d_patient_visit (doctorId);

CREATE TABLE IF NOT EXISTS d_appo (
    id BIGINT NOT NULL DEFAULT nextval('hibernate_sequence'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status CHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    patientId VARCHAR(255),
    c_name VARCHAR(255) NOT NULL,
    memo TEXT,
    c_date DATE NOT NULL,
    CONSTRAINT d_appo_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_appo_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_appo_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id)
);

CREATE INDEX IF NOT EXISTS d_appo_karte_date_idx
    ON d_appo (karte_id, c_date);
CREATE INDEX IF NOT EXISTS d_appo_patient_idx
    ON d_appo (patientId);
