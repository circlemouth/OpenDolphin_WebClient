-- CLAIM廃止に伴い、未使用となった文書のclaimDateカラムを撤去する
ALTER TABLE d_document
    DROP COLUMN IF EXISTS claimdate;
