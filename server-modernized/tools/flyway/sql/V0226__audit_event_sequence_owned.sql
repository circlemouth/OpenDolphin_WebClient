-- Align AuditEvent ID generation between ORM and database sequence

ALTER SEQUENCE IF EXISTS d_audit_event_id_seq
    OWNED BY d_audit_event.id;

ALTER TABLE IF EXISTS d_audit_event
    ALTER COLUMN id SET DEFAULT nextval('d_audit_event_id_seq');
