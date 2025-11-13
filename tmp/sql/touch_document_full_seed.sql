BEGIN;

-- Ensure we use the opendolphin schema first so unqualified names resolve.
SET search_path TO opendolphin, public;

-- Normalize d_module.beanBytes to OID-based large objects for both schemas (legacy + public copies).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'opendolphin'
      AND table_name = 'd_module'
      AND column_name = 'beanbytes'
      AND data_type <> 'oid'
  ) THEN
    EXECUTE
      'ALTER TABLE opendolphin.d_module
         ALTER COLUMN beanbytes TYPE oid
         USING lo_from_bytea(0, COALESCE(beanbytes, ''\\x''::bytea))';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'd_module'
      AND column_name = 'beanbytes'
      AND data_type <> 'oid'
  ) THEN
    EXECUTE
      'ALTER TABLE public.d_module
         ALTER COLUMN beanbytes TYPE oid
         USING lo_from_bytea(0, COALESCE(beanbytes, ''\\x''::bytea))';
  END IF;
END
$$;

-- Align sequences used by handwritten seeds to avoid collisions when inserting new documents/modules.
SELECT setval('opendolphin.hibernate_sequence', GREATEST(nextval('opendolphin.hibernate_sequence'), 900000));
SELECT setval('opendolphin.d_document_seq', GREATEST(nextval('opendolphin.d_document_seq'), 900000));
SELECT setval('opendolphin.d_module_seq', GREATEST(nextval('opendolphin.d_module_seq'), 900000));

COMMIT;
