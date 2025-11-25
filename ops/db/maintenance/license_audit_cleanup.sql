\set ON_ERROR_STOP on
\echo '== license_audit_cleanup: start =='

-- このスクリプトは SYSTEM_LICENSE_CHECK の履歴を JSON 形式・trace_id 付きへ統一し、
-- ハッシュチェーン (payload_hash / previous_hash / event_hash) を再構築する。
-- 実行対象: Legacy / Modernized 両 Postgres。

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 対象行を一時テーブルへ控える。
DROP TABLE IF EXISTS tmp_license_audit_cleanup_targets;
CREATE TEMP TABLE tmp_license_audit_cleanup_targets AS
SELECT id,
       payload,
       trace_id,
       request_id,
       event_time
  FROM d_audit_event
 WHERE action = 'SYSTEM_LICENSE_CHECK'
   AND payload ~ '^[0-9A-Za-z:-]+$';

\echo '  -> target rows: ' :ROWCOUNT

-- trace_id が空/NULL のものを補完し、payload を JSON へ変換。
WITH base AS (
  SELECT id,
         payload,
         trace_id,
         request_id,
         event_time,
         jsonb_build_object(
             'status', 'unknown',
             'actionType', 'backfilled_numeric_payload',
             'uid', payload,
             'note', 'converted-from-legacy-numeric',
             'backfill_at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
         ) AS new_payload,
         COALESCE(NULLIF(trace_id, ''), request_id,
                  CONCAT('license-backfill-', to_char(event_time AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISS"Z"'), '-', id)) AS new_trace_id
  FROM tmp_license_audit_cleanup_targets
)
UPDATE d_audit_event dst
   SET payload = new_payload::text,
       trace_id = new_trace_id
  FROM base
 WHERE dst.id = base.id;

\echo '  -> payload/trace_id updated rows: ' :ROWCOUNT

-- ハッシュチェーンを再計算。
DO $$
DECLARE
  rec RECORD;
  prev_hash TEXT := '';
  new_payload_hash TEXT;
  new_event_hash TEXT;
  actor_id_safe TEXT;
  millis BIGINT;
BEGIN
  FOR rec IN
    SELECT id, event_time, COALESCE(actor_id, '') AS actor_id, payload
      FROM d_audit_event
     ORDER BY event_time, id
  LOOP
    new_payload_hash := encode(digest(COALESCE(rec.payload, ''), 'sha256'), 'hex');
    millis := FLOOR(EXTRACT(EPOCH FROM rec.event_time) * 1000)::bigint;
    actor_id_safe := COALESCE(rec.actor_id, '');
    new_event_hash := encode(digest(prev_hash || new_payload_hash || millis::text || actor_id_safe, 'sha256'), 'hex');
    UPDATE d_audit_event
       SET previous_hash = prev_hash,
           payload_hash = new_payload_hash,
           event_hash = new_event_hash
     WHERE id = rec.id;
    prev_hash := new_event_hash;
  END LOOP;
END$$;

COMMIT;

-- サマリを出力。
\echo '== license_audit_cleanup: summary =='
SELECT COUNT(*) AS total_backfilled
  FROM tmp_license_audit_cleanup_targets;
SELECT COUNT(*) AS missing_trace
  FROM d_audit_event
 WHERE action = 'SYSTEM_LICENSE_CHECK'
   AND (trace_id IS NULL OR trace_id = '');
\echo '== license_audit_cleanup: done =='
