WITH facility AS (
    INSERT INTO public.d_facility (
        id,
        address,
        facilityid,
        facilityname,
        membertype,
        registereddate,
        telephone,
        zipcode
    )
    VALUES (
        nextval('hibernate_sequence'),
        'Tokyo',
        '1.3.6.1.4.1.9414.10.1',
        'ORCA Trial Clinic',
        'PROCESS',
        CURRENT_DATE,
        '03-0000-0000',
        '000-0000'
    )
    ON CONFLICT (facilityid) DO UPDATE
        SET facilityname = EXCLUDED.facilityname,
            address = EXCLUDED.address,
            telephone = EXCLUDED.telephone,
            zipcode = EXCLUDED.zipcode,
            membertype = EXCLUDED.membertype,
            registereddate = EXCLUDED.registereddate
    RETURNING id
),
facility_id AS (
    SELECT id FROM facility
    UNION ALL
    SELECT id FROM public.d_facility
     WHERE facilityid = '1.3.6.1.4.1.9414.10.1'
     LIMIT 1
),
user_upsert AS (
    INSERT INTO public.d_users (
        id,
        commonname,
        email,
        membertype,
        password,
        registereddate,
        userid,
        facility_id
    )
    VALUES (
        nextval('hibernate_sequence'),
        'Dolphin Dev',
        'dolphindev@example.com',
        'PROCESS',
        '1cc2f4c06fd32d0a6e2fa33f6e1c9164',
        CURRENT_DATE,
        '1.3.6.1.4.1.9414.10.1:dolphindev',
        (SELECT id FROM facility_id)
    )
    ON CONFLICT (userid) DO UPDATE
        SET commonname = EXCLUDED.commonname,
            email = EXCLUDED.email,
            membertype = EXCLUDED.membertype,
            password = EXCLUDED.password,
            registereddate = EXCLUDED.registereddate,
            facility_id = EXCLUDED.facility_id
    RETURNING id, userid
),
user_id AS (
    SELECT id, userid FROM user_upsert
    UNION ALL
    SELECT id, userid FROM public.d_users
     WHERE userid = '1.3.6.1.4.1.9414.10.1:dolphindev'
     LIMIT 1
)
INSERT INTO public.d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), roles.role, u.userid, u.id
  FROM user_id u
  CROSS JOIN (VALUES ('system_admin'), ('admin'), ('user')) AS roles(role)
 WHERE NOT EXISTS (
    SELECT 1
      FROM public.d_roles r
     WHERE r.c_user = u.id
       AND r.c_role = roles.role
);
