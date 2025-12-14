-- Make d_module.beanBytes nullable and add beanJson column for JSON payloads
ALTER TABLE d_module
    ALTER COLUMN beanBytes DROP NOT NULL;

ALTER TABLE d_module
    ADD COLUMN IF NOT EXISTS beanJson TEXT;
