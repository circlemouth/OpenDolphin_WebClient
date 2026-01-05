DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'opendolphin') THEN
        EXECUTE 'CREATE SCHEMA opendolphin';
    END IF;
END$$;

CREATE SEQUENCE IF NOT EXISTS opendolphin.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

SELECT setval(
    'opendolphin.hibernate_sequence',
    GREATEST(
        COALESCE((SELECT MAX(id) FROM d_patient), 1),
        COALESCE((SELECT MAX(id) FROM d_karte), 1),
        COALESCE((SELECT MAX(id) FROM d_users), 1),
        COALESCE((SELECT MAX(id) FROM d_roles), 1)
    ),
    true
);
