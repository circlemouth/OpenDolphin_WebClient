\echo '== d_audit_event_id_seq batch reset (tee-less) =='
\set ON_ERROR_STOP on

\if :{?audit_event_backup_file}
\else
\set audit_event_backup_file '/tmp/d_audit_event_before_seq_reset.csv'
\endif

\if :{?audit_event_status_log}
\else
\set audit_event_status_log '/tmp/d_audit_event_seq_status.txt'
\endif

\if :{?audit_event_validation_log}
\else
\set audit_event_validation_log '/tmp/d_audit_event_seq_validation.txt'
\endif

\pset pager off

\qecho Backing up d_audit_event to :audit_event_backup_file
\copy (SELECT * FROM d_audit_event ORDER BY id) TO :audit_event_backup_file CSV HEADER

\qecho Calculating next candidate id...
SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM d_audit_event \gset audit_next_
\set audit_next_value :audit_next_next_id

SELECT
    COALESCE(MIN(id), 0)    AS min_id,
    COALESCE(MAX(id), 0)    AS max_id,
    COUNT(*)                AS total_rows
FROM d_audit_event
\gset audit_table_

SELECT last_value,
       is_called
FROM d_audit_event_id_seq
\gset audit_seq_

\qecho d_audit_event rows: min=:audit_table_min_id max=:audit_table_max_id total=:audit_table_total_rows
\qecho d_audit_event_id_seq last_value=:audit_seq_last_value is_called=:audit_seq_is_called
\qecho suggested next_id=:audit_next_value

\qecho Writing status snapshot to :audit_event_status_log
\o :audit_event_status_log
\qecho d_audit_event rows: min=:audit_table_min_id max=:audit_table_max_id total=:audit_table_total_rows
\qecho d_audit_event_id_seq last_value=:audit_seq_last_value is_called=:audit_seq_is_called
\qecho suggested next_id=:audit_next_value
\o

\qecho Applying LOCK + setval(:audit_next_value)...
BEGIN;
LOCK TABLE d_audit_event IN EXCLUSIVE MODE;
SELECT :audit_next_value::bigint AS calculated_next_id,
       setval('d_audit_event_id_seq', :audit_next_value, true) AS sequence_after_setval;

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
        trace_id,
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
        'trace-seq-smoke-batch',
        'trace-seq-smoke-batch',
        '127.0.0.1',
        'reset_d_audit_event_seq_batch.sql',
        'SEQ_SMOKE_PAYLOAD_HASH',
        'SEQ_SMOKE_PREV_HASH',
        'SEQ_SMOKE_EVENT_HASH',
        '{"note":"validation row created by reset_d_audit_event_seq_batch.sql"}'
    )
    RETURNING id AS validation_id, event_time, request_id
)
SELECT validation_id, event_time, request_id FROM inserted \gset audit_validation_

\qecho Writing validation snapshot to :audit_event_validation_log
\o :audit_event_validation_log
\qecho validation_id=:audit_validation_validation_id
\qecho event_time=:audit_validation_event_time
\qecho request_id=:audit_validation_request_id
\o

COMMIT;

\qecho Most recent SEQ_SMOKE audit rows:
SELECT id,
       action,
       request_id,
       event_time
FROM d_audit_event
WHERE action = 'SEQ_SMOKE'
ORDER BY event_time DESC
LIMIT 5;

\qecho Backup file saved to :audit_event_backup_file
\qecho Status log saved to :audit_event_status_log
\qecho Validation log saved to :audit_event_validation_log
