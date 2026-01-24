\set ON_ERROR_STOP on
\pset pager off
\echo '== modernized db init repair =='

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'opendolphin') THEN
        CREATE SCHEMA opendolphin;
    END IF;
END$$;

ALTER ROLE opendolphin SET search_path TO opendolphin,public;

CREATE SEQUENCE IF NOT EXISTS opendolphin.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS opendolphin.d_patient_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS opendolphin.d_karte_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS opendolphin.d_audit_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

DO $$
BEGIN
    IF to_regclass('opendolphin.d_audit_event') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE opendolphin.d_audit_event ALTER COLUMN id '
            || 'SET DEFAULT nextval(''opendolphin.d_audit_event_id_seq'')';
    END IF;
END$$;

DO $$
DECLARE
    max_id BIGINT := 1;
    patient_max BIGINT := 1;
    karte_max BIGINT := 1;
    audit_max BIGINT := 1;
BEGIN
    IF to_regclass('opendolphin.d_facility') IS NOT NULL THEN
        SELECT GREATEST(max_id, COALESCE((SELECT max(id) FROM opendolphin.d_facility), 0)) INTO max_id;
    END IF;
    IF to_regclass('opendolphin.d_users') IS NOT NULL THEN
        SELECT GREATEST(max_id, COALESCE((SELECT max(id) FROM opendolphin.d_users), 0)) INTO max_id;
    END IF;
    IF to_regclass('opendolphin.d_roles') IS NOT NULL THEN
        SELECT GREATEST(max_id, COALESCE((SELECT max(id) FROM opendolphin.d_roles), 0)) INTO max_id;
    END IF;
    IF to_regclass('opendolphin.d_patient') IS NOT NULL THEN
        SELECT COALESCE((SELECT max(id) FROM opendolphin.d_patient), 0) INTO patient_max;
        SELECT GREATEST(max_id, patient_max) INTO max_id;
    END IF;
    IF to_regclass('opendolphin.d_karte') IS NOT NULL THEN
        SELECT COALESCE((SELECT max(id) FROM opendolphin.d_karte), 0) INTO karte_max;
        SELECT GREATEST(max_id, karte_max) INTO max_id;
    END IF;
    IF to_regclass('opendolphin.d_audit_event') IS NOT NULL THEN
        SELECT COALESCE((SELECT max(id) FROM opendolphin.d_audit_event), 0) INTO audit_max;
    END IF;

    PERFORM setval('opendolphin.hibernate_sequence', GREATEST(max_id, 1), true);
    PERFORM setval('opendolphin.d_patient_seq', GREATEST(patient_max, 1), true);
    PERFORM setval('opendolphin.d_karte_seq', GREATEST(karte_max, 1), true);
    PERFORM setval('opendolphin.d_audit_event_id_seq', GREATEST(audit_max, 1), true);
END$$;

SELECT current_setting('search_path') AS search_path;
SELECT to_regclass('opendolphin.d_users') AS d_users;
SELECT to_regclass('public.d_users') AS public_d_users;
SELECT to_regclass('opendolphin.d_audit_event') AS d_audit_event;
SELECT to_regclass('opendolphin.hibernate_sequence') AS hibernate_sequence;
SELECT to_regclass('public.hibernate_sequence') AS public_hibernate_sequence;
SELECT to_regclass('opendolphin.d_patient_seq') AS d_patient_seq;
SELECT to_regclass('opendolphin.d_karte_seq') AS d_karte_seq;
SELECT to_regclass('opendolphin.d_audit_event_id_seq') AS d_audit_event_id_seq;
