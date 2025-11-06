-- d_document.admflag / d_module.performflag 列をモダナイズ版でも必須化する。
-- Ops では以下の存在確認クエリを事前に実行し、欠損している環境に対して本マイグレーションを適用する。
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'd_document' AND column_name = 'admflag';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'd_module' AND column_name = 'performflag';

ALTER TABLE IF EXISTS d_document
    ADD COLUMN IF NOT EXISTS admflag VARCHAR(1);

ALTER TABLE IF EXISTS d_module
    ADD COLUMN IF NOT EXISTS performflag VARCHAR(1);
