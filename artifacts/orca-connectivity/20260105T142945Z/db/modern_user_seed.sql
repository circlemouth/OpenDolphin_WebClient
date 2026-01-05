SET search_path = public;

DO $$
DECLARE
    max_id BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'hibernate_sequence' AND relkind = 'S'
    ) THEN
        CREATE SEQUENCE IF NOT EXISTS hibernate_sequence
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
    END IF;

    SELECT GREATEST(
        COALESCE((SELECT max(id) FROM d_facility), 0),
        COALESCE((SELECT max(id) FROM d_users), 0),
        COALESCE((SELECT max(id) FROM d_roles), 0),
        1
    ) INTO max_id;

    PERFORM setval('hibernate_sequence', max_id, true);
END$$;

INSERT INTO d_facility (id, facilityid, facilityname, membertype, registereddate, zipcode, address, telephone)
SELECT nextval('hibernate_sequence'), '1.3.6.1.4.1.9414.10.1', 'OpenDolphin Clinic', 'PROCESS', now(), '000-0000', 'Tokyo', '03-0000-0000'
WHERE NOT EXISTS (SELECT 1 FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.10.1');

INSERT INTO d_users (
    id, userid, password, commonname, facility_id, membertype, registereddate,
    sirname, givenname, email
)
SELECT
    nextval('hibernate_sequence'),
    'dolphindev',
    '1cc2f4c06fd32d0a6e2fa33f6e1c9164',
    'Dolphin Dev',
    (SELECT id FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.10.1'),
    'PROCESS',
    now(),
    'Dolphin', 'Dev', 'dev@example.com'
WHERE NOT EXISTS (SELECT 1 FROM d_users WHERE userid = 'dolphindev');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'admin', 'dolphindev', id
FROM d_users WHERE userid = 'dolphindev'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = 'dolphindev' AND c_role = 'admin');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'user', 'dolphindev', id
FROM d_users WHERE userid = 'dolphindev'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = 'dolphindev' AND c_role = 'user');

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), 'doctor', 'dolphindev', id
FROM d_users WHERE userid = 'dolphindev'
AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = 'dolphindev' AND c_role = 'doctor');
