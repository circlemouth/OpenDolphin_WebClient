-- NOTE: Some execution environments disable \tee (e.g., when psql runs via sudo or restricted shells).
--       Pass -v disable_tee=on to skip \tee blocks; stdout will still show the same statements.
-- FUTURE COMPAT: Once the baseline psql version >= 16, migrate these blocks to \gset FILE or server-side COPY.
\set ON_ERROR_STOP on

\pset pager off

\copy (SELECT * FROM d_audit_event ORDER BY id) TO :audit_event_backup_file CSV HEADER

SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM d_audit_event \gset
SELECT MIN(id) AS min_id,
       MAX(id) AS max_id,
       COUNT(*) AS total_rows
FROM d_audit_event;
SELECT last_value,
       is_called
FROM d_audit_event_id_seq;
SELECT :'next_id'::bigint AS suggested_next_id;

BEGIN;
LOCK TABLE d_audit_event IN EXCLUSIVE MODE;
SELECT :'next_id'::bigint AS calculated_next_id,
       setval('d_audit_event_id_seq', :'next_id', true) AS sequence_after_setval;

WITH inserted AS (
    INSERT INTO d_audit_event (
        event_time,
        actor_id,
        actor_display_name,
        actor_role,
        action,
        resource,
        patient_id,
        request_id,
        ip_address,
        user_agent,
        payload_hash,
        previous_hash,
        event_hash,
        payload
    ) VALUES (
        now(),
        'SEQ_SMOKE',
        'Sequence Smoke Test',
        'system',
        'SEQ_SMOKE',
        '{"path":"/internal/seq-check"}',
        NULL,
        'trace-seq-smoke',
        '127.0.0.1',
        'reset_d_audit_event_seq.sql',
        'SEQ_SMOKE_PAYLOAD_HASH',
        'SEQ_SMOKE_PREV_HASH',
        'SEQ_SMOKE_EVENT_HASH',
        '{"note":"validation row created by reset_d_audit_event_seq.sql"}'
    )
    RETURNING id, event_time, request_id
)
SELECT id AS validation_id,
       event_time,
       request_id
FROM inserted;

COMMIT;

SELECT id,
       action,
       request_id,
       event_time
FROM d_audit_event
WHERE action = 'SEQ_SMOKE'
ORDER BY event_time DESC
LIMIT 5;

