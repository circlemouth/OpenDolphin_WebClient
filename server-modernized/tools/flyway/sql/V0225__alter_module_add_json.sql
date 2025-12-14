-- Add JSON column for ModuleModel and relax binary constraint
ALTER TABLE d_module
    ALTER COLUMN beanBytes DROP NOT NULL;

ALTER TABLE d_module
    ADD COLUMN IF NOT EXISTS beanJson TEXT;
