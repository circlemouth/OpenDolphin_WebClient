-- Align FK targets to opendolphin schema (avoid public.* mismatch)
ALTER TABLE opendolphin.d_document DROP CONSTRAINT IF EXISTS fk6s9ifrm58t6jr9qamv7ey83lm;
ALTER TABLE opendolphin.d_document DROP CONSTRAINT IF EXISTS fk_d_document_karte;
ALTER TABLE opendolphin.d_document DROP CONSTRAINT IF EXISTS fk_d_document_creator;
ALTER TABLE opendolphin.d_document DROP CONSTRAINT IF EXISTS fkf9jkp9t07q15ubahu0lgt7kpk;

ALTER TABLE opendolphin.d_document
    ADD CONSTRAINT fk_d_document_karte FOREIGN KEY (karte_id) REFERENCES opendolphin.d_karte(id) NOT VALID;
ALTER TABLE opendolphin.d_document
    ADD CONSTRAINT fk_d_document_creator FOREIGN KEY (creator_id) REFERENCES opendolphin.d_users(id) NOT VALID;

ALTER TABLE opendolphin.d_module DROP CONSTRAINT IF EXISTS fk8snks9qh1q0itl4l2mpmnp06y;
ALTER TABLE opendolphin.d_module DROP CONSTRAINT IF EXISTS fk_d_module_karte;
ALTER TABLE opendolphin.d_module DROP CONSTRAINT IF EXISTS fk_d_module_creator;
ALTER TABLE opendolphin.d_module DROP CONSTRAINT IF EXISTS fke7g6rg8pl0jaw2h0df9jymei5;

ALTER TABLE opendolphin.d_module
    ADD CONSTRAINT fk_d_module_karte FOREIGN KEY (karte_id) REFERENCES opendolphin.d_karte(id) NOT VALID;
ALTER TABLE opendolphin.d_module
    ADD CONSTRAINT fk_d_module_creator FOREIGN KEY (creator_id) REFERENCES opendolphin.d_users(id) NOT VALID;
