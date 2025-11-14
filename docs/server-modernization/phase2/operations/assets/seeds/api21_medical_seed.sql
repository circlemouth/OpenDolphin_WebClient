-- Seed: API21 medical patient (8 桁患者番号 `00000001`)
-- 利用制限（2025-11-15 更新）:
--   * WebORCA 本番は既存データ参照を優先し、本ファイルによる seed 投入は Ops から明示的な許可が出た場合のみ実施する。
--   * P0 API RUN の通常フローでは seed を投入しないため、欠落データを確認した場合は `DOC_STATUS.md` と ORCA 週次ログへ報告して RUN を延期する。
--   * 下記手順はアーカイブ目的の備忘録として保持し、実行時は `ORCA_CONNECTIVITY_VALIDATION.md` 最新版と Ops ガイドラインに従うこと。
-- 適用手順（WebORCA クラウド本番のみ / ローカル ORCA コンテナは禁止）:
--   1. `ORCAcertification/` 配下の PKCS#12 と Basic 情報を読み込み、`ORCA_CONNECTIVITY_VALIDATION.md` §4.4 の手順で
--      WebORCA 本番 (`https://weborca.cloud.orcamo.jp:443`) へ到達できる `psql` 経路を準備する。
--   2. Ops 指定の bastion もしくは TLS トンネル上で `psql "sslmode=verify-full ..."` を実行し、
--      `\i docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` で投入する。
--   3. `docker/orca/jma-receipt-docker` などローカル WebORCA コンテナを起動して `docker exec ... psql` を実行する手順は廃止済み。
-- Evidence: `artifacts/orca-connectivity/20251113TorcaSeed7DigitZ1/seed_psql.log`
-- 再投入時の注意:
--   * hospnum=1, ptid=1 の患者/保険/公費レコードを DELETE → INSERT で置き換えるため、既存データをバックアップしてから実行する。
--   * `ORCBPTNUMCHG (kbncd=1065)` で 7 桁化されていない環境へ適用すると `Api_Result=P1`（桁数エラー）が発生するため、事前に ORCA 側設定を確認する。
\set ON_ERROR_STOP on
BEGIN;

-- NOTE: ORCBPTNUMCHG (kbncd=1065) で患者番号が 7 桁 + 追加1桁 = 8 桁となるため
--       公式 seed と同じ `00000001` を patient_id_1 / ptnum へ投入する。
DELETE FROM public.tbl_ptinf
 WHERE hospnum = 1 AND ptid = 1;
INSERT INTO public.tbl_ptinf (
    hospnum,
    ptid,
    kananame,
    name,
    sex,
    birthday,
    job,
    email,
    termid,
    opid,
    creymd,
    upymd,
    uphms
) VALUES (
    1,
    1,
    'Test Patient 00000001',
    'Test Patient 00000001',
    '1',
    '19800101',
    'Employee',
    'test00000001@example.com',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '092900'
);

-- Ensure patient number mapping and insurance linkage
DELETE FROM public.tbl_ptnum
 WHERE hospnum = 1 AND ptid = 1;
INSERT INTO public.tbl_ptnum (
    hospnum,
    ptid,
    ptnum,
    hknid,
    kohid,
    autocombinum,
    manucombinum,
    termid,
    opid,
    creymd,
    upymd,
    uphms
) VALUES (
    1,
    1,
    '00000001',
    1,
    0,
    0,
    0,
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093100'
);

-- Primary health insurance seed
DELETE FROM public.tbl_pthkninf
 WHERE hospnum = 1 AND ptid = 1 AND hknid = 1;
INSERT INTO public.tbl_pthkninf (
    hospnum,
    ptid,
    hknid,
    hknnum,
    hknjanum,
    hihknjaname,
    honkzkkbn,
    hojokbn,
    contkbn,
    kigo,
    num,
    skkgetymd,
    tekstymd,
    tekedymd,
    kakuninymd,
    sakjokbn,
    termid,
    opid,
    creymd,
    upymd,
    uphms,
    edaban
) VALUES (
    1,
    1,
    1,
    '001',
    '06123456',
    'National Health Insurance',
    '1',
    '0',
    '0',
    'AB',
    '1234567',
    '20250401',
    '20250401',
    '20260331',
    '20251113',
    '0',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093200',
    '00'
);

-- Public expense / copay seed (dummy)
DELETE FROM public.tbl_ptkohinf
 WHERE hospnum = 1 AND ptid = 1 AND kohid = 1;
INSERT INTO public.tbl_ptkohinf (
    hospnum,
    ptid,
    kohid,
    kohnum,
    paykbn,
    ftnjanum,
    jkysnum,
    tekstymd,
    tekedymd,
    kakuninymd,
    sakjokbn,
    termid,
    opid,
    creymd,
    upymd,
    uphms,
    tekedchkkbn
) VALUES (
    1,
    1,
    1,
    '001',
    '12',
    '12345678',
    '0000000000',
    '20250401',
    '20260331',
    '20251113',
    '0',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093300',
    '0'
);

-- Ensure acceptance entry exists for the patient on Perform_Date
DELETE FROM public.tbl_uketuke
 WHERE hospnum = 1 AND ukeymd = '20251113' AND ukeid = 1;
INSERT INTO public.tbl_uketuke (
    hospnum,
    ukeymd,
    ukeid,
    uketime,
    ptid,
    name,
    sryka,
    drcd,
    srflg,
    termid,
    opid,
    creymd,
    upymd,
    uphms,
    srynaiyo
) VALUES (
    1,
    '20251113',
    1,
    '093000',
    1,
    'Test Patient 00000001',
    '01',
    '00001',
    '00',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093000',
    '01'
);

-- Ensure doctor list entry for department 01
DELETE FROM public.tbl_list_doctor
 WHERE hospnum = 1 AND sryka = '01' AND rennum = 1;
INSERT INTO public.tbl_list_doctor (
    hospnum,
    sryka,
    rennum,
    drcd,
    termid,
    opid,
    creymd,
    upymd,
    uphms
) VALUES (
    1,
    '01',
    1,
    '00001',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093000'
);

-- Ensure public patient identifier entry for API prefix
DELETE FROM public.tbl_ptnum_public
 WHERE hospnum = 1 AND ptid = 1;
INSERT INTO public.tbl_ptnum_public (
    hospnum,
    ptid,
    patient_id_1,
    termid,
    opid,
    creymd,
    upymd,
    uphms,
    agreement
) VALUES (
    1,
    1,
    '00000001',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093200',
    '1'
);

-- Track department usage per patient
DELETE FROM public.tbl_srykarrk
 WHERE hospnum = 1 AND ptid = 1 AND sryka = '01';
INSERT INTO public.tbl_srykarrk (
    ptid,
    sryka,
    syosinymd1,
    syosinymd2,
    lastymd,
    termid,
    opid,
    creymd,
    upymd,
    uphms,
    hospnum
) VALUES (
    1,
    '01',
    '20251113',
    '20251113',
    '20251113',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '093500',
    1
);

-- Seed a minimal medical act row
DELETE FROM public.tbl_sryact
 WHERE hospnum = 1
   AND nyugaikbn = 'O'
   AND ptid = 1
   AND sryka = '01'
   AND sryym = '202511'
   AND zainum = 1
   AND rennum = 1;
INSERT INTO public.tbl_sryact (
    nyugaikbn,
    ptid,
    sryka,
    sryym,
    zainum,
    rennum,
    srykbn,
    srycd1,
    srysuryo1,
    srykaisu1,
    meiskyflg1,
    termid,
    opid,
    creymd,
    upymd,
    uphms,
    hospnum
) VALUES (
    'O',
    1,
    '01',
    '202511',
    1,
    1,
    '11',
    '110000010',
    1,
    1,
    '0',
    'W41',
    'api21',
    '20251113',
    '20251113',
    '094000',
    1
);

COMMIT;
