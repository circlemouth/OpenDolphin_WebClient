-- REST レスポンス最適化のための索引整備
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_appointment_karte_date
    ON appointment_model (karte_id, date);

CREATE INDEX IF NOT EXISTS idx_patient_visit_facility_date
    ON patient_visit_model (facility_id, pvt_date, status);

CREATE INDEX IF NOT EXISTS idx_document_karte_started_status
    ON document_model (karte_id, started, status);

CREATE INDEX IF NOT EXISTS idx_document_link
    ON document_model (link_id);

CREATE INDEX IF NOT EXISTS idx_nlabo_module_patient_date
    ON nlabo_module (patient_id, sample_date DESC);

CREATE INDEX IF NOT EXISTS idx_registered_diagnosis_karte_started
    ON registered_diagnosis_model (karte_id, started);

CREATE INDEX IF NOT EXISTS idx_patient_facility_kana_trgm
    ON patient_model USING gin (kana_name gin_trgm_ops)
    WHERE facility_id IS NOT NULL;
