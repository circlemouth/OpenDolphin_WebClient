-- Ensure the audit event payload column stores plain text instead of OID blobs.
DO $$
DECLARE
    payload_type text;
    rec RECORD;
BEGIN
    SELECT data_type INTO payload_type
    FROM information_schema.columns
    WHERE table_schema = 'opendolphin'
      AND table_name = 'd_audit_event'
      AND column_name = 'payload';

    IF payload_type = 'oid' THEN
        EXECUTE 'CREATE TEMP TABLE tmp_audit_payload_oids (oid OID) ON COMMIT DROP';
        EXECUTE 'INSERT INTO tmp_audit_payload_oids SELECT payload FROM d_audit_event WHERE payload IS NOT NULL';
        EXECUTE $mig$
            ALTER TABLE d_audit_event
                ALTER COLUMN payload TYPE text
                USING CASE
                    WHEN payload IS NOT NULL THEN convert_from(lo_get(payload), 'UTF8')
                    ELSE NULL
                END
        $mig$;
        FOR rec IN EXECUTE 'SELECT oid FROM tmp_audit_payload_oids WHERE oid IS NOT NULL' LOOP
            PERFORM lo_unlink(rec.oid);
        END LOOP;
    END IF;
END
$$;
