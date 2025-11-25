-- Stamp tree parity helper (bytea → oid 暗黙キャスト)。
-- Legacy / Modernized どちらの Postgres でも同じ内容を適用する。

CREATE OR REPLACE FUNCTION bytea_to_oid(bytea) RETURNS oid AS $$
  SELECT lo_from_bytea(0, $1);
$$ LANGUAGE sql STRICT;

DROP CAST IF EXISTS (bytea AS oid);

CREATE CAST (bytea AS oid) WITH FUNCTION bytea_to_oid(bytea) AS IMPLICIT;
