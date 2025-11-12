BEGIN;

-- facility=9001 の利用者（9001:doctor1）を seed する。既存 Trace Clinic (`1.3.6.1.4.1.9414.72.103`) を
-- クローンし、remoteUser の facility 部分と URL パラメータが揃うようにしておく。
INSERT INTO d_facility (
    id,
    address,
    facilityid,
    facilityname,
    facsimile,
    membertype,
    registereddate,
    s3accesskey,
    s3secretkey,
    s3url,
    telephone,
    url,
    zipcode
)
SELECT
    9001,
    address,
    '9001',
    'OpenDolphin Facility 9001',
    facsimile,
    membertype,
    registereddate,
    s3accesskey,
    s3secretkey,
    s3url,
    telephone,
    url,
    zipcode
FROM d_facility
WHERE facilityid = '1.3.6.1.4.1.9414.72.103'
  AND NOT EXISTS (SELECT 1 FROM d_facility WHERE facilityid = '9001');

INSERT INTO d_users (
    id,
    commonname,
    department,
    departmentcodesys,
    departmentdesc,
    email,
    factor2auth,
    givenname,
    license,
    licensecodesys,
    licensedesc,
    mainmobile,
    membertype,
    memo,
    orcaid,
    password,
    registereddate,
    sirname,
    submobile,
    usedrugid,
    userid,
    facility_id
)
SELECT
    91001,
    commonname,
    department,
    departmentcodesys,
    departmentdesc,
    email,
    factor2auth,
    givenname,
    license,
    licensecodesys,
    licensedesc,
    mainmobile,
    membertype,
    memo,
    orcaid,
    password,
    registereddate,
    sirname,
    submobile,
    usedrugid,
    '9001:doctor1',
    (SELECT id FROM d_facility WHERE facilityid = '9001' LIMIT 1)
FROM d_users
WHERE userid = '1.3.6.1.4.1.9414.72.103:doctor1'
  AND NOT EXISTS (SELECT 1 FROM d_users WHERE userid = '9001:doctor1');

INSERT INTO d_roles (id, user_id, c_role, c_user)
SELECT
    9001,
    '9001:doctor1',
    c_role,
    91001
FROM d_roles
WHERE user_id = '1.3.6.1.4.1.9414.72.103:doctor1'
  AND NOT EXISTS (SELECT 1 FROM d_roles WHERE user_id = '9001:doctor1' AND c_role = d_roles.c_role);

-- Stamp 公開系 REST（facility=9001/9002）向け PublishedTree / SubscribedTree のサンプルデータ。
-- 前提: `ops/db/local-baseline/local_synthetic_seed.sql` 適用済みで
--       `d_users.userId in ('1.3.6.1.4.1.9414.72.103:doctor1', 'LOCAL.FACILITY.0001:dolphin')` が存在すること。

INSERT INTO d_published_tree (
    id,
    user_id,
    name,
    publishType,
    category,
    partyName,
    url,
    description,
    publishedDate,
    treeBytes,
    lastUpdated
) VALUES
    (
        65001,
        (SELECT id FROM d_users WHERE userId='1.3.6.1.4.1.9414.72.103:doctor1' LIMIT 1),
        'Stamp Catalog 9001',
        '9001',
        'karte',
        'OpenDolphin Trace Clinic',
        'https://localhost/stamp/9001/catalog',
        'facility=9001 published tree（REST 選択肢B用）',
        DATE '2025-11-10',
        decode('PHN0YW1wVHJlZSBuYW1lPSJjbGluaWNfOTAwMSI+PGZvbGRlciBuYW1lPSJzaGFyZWQiLz48L3N0YW1wVHJlZT4=', 'base64'),
        DATE '2025-11-12'
    ),
    (
        65002,
        (SELECT id FROM d_users WHERE userId='LOCAL.FACILITY.0001:dolphin' LIMIT 1),
        'Stamp Catalog 9002',
        '9002',
        'karte',
        'OpenDolphin Legacy Clinic',
        'https://localhost/stamp/9002/catalog',
        'facility=9002 published tree（REST 選択肢B用）',
        DATE '2025-11-10',
        decode('PHN0YW1wVHJlZSBuYW1lPSJjbGluaWNfOTAwMiI+PGZvbGRlciBuYW1lPSJzaGFyZWQiLz48L3N0YW1wVHJlZT4=', 'base64'),
        DATE '2025-11-12'
    ),
    (
        65000,
        (SELECT id FROM d_users WHERE userId='LOCAL.FACILITY.0001:dolphin' LIMIT 1),
        'Global Reference Catalog',
        'global',
        'karte',
        'OpenDolphin Global Catalog',
        'https://localhost/stamp/global/catalog',
        '公開タブ 200 応答を比較するグローバル基準データ',
        DATE '2025-11-10',
        decode('PHN0YW1wVHJlZSBuYW1lPSJnbG9iYWxfcmVmZXJlbmNlIj48Zm9sZGVyIG5hbWU9ImJhc2VsaW5lIi8+PC9zdGFtcFRyZWU+', 'base64'),
        DATE '2025-11-12'
    )
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    publishType = EXCLUDED.publishType,
    category = EXCLUDED.category,
    partyName = EXCLUDED.partyName,
    url = EXCLUDED.url,
    description = EXCLUDED.description,
    publishedDate = EXCLUDED.publishedDate,
    treeBytes = EXCLUDED.treeBytes,
    lastUpdated = EXCLUDED.lastUpdated;

INSERT INTO d_subscribed_tree (
    id,
    user_id,
    treeId
) VALUES
    (
        66001,
        (SELECT id FROM d_users WHERE userId='1.3.6.1.4.1.9414.72.103:doctor1' LIMIT 1),
        65002
    ),
    (
        66002,
        (SELECT id FROM d_users WHERE userId='LOCAL.FACILITY.0001:dolphin' LIMIT 1),
        65001
    )
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    treeId = EXCLUDED.treeId;

COMMIT;
