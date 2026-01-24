-- Ensure the audit event payload column stores plain text instead of OID blobs.
CREATE TEMP TABLE tmp_audit_payload_oids (oid OID) ON COMMIT DROP;
INSERT INTO tmp_audit_payload_oids
SELECT payload FROM d_audit_event WHERE payload IS NOT NULL;

ALTER TABLE d_audit_event
    ALTER COLUMN payload TYPE text
    USING CASE
        WHEN payload IS NOT NULL THEN convert_from(lo_get(payload), 'UTF8')
        ELSE NULL
    END;

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT oid FROM tmp_audit_payload_oids WHERE oid IS NOT NULL LOOP
        PERFORM lo_unlink(rec.oid);
    END LOOP;
END
$$;
