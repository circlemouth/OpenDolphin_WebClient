# ORCA POST 実装切替
- 期間: 2026-01-09 17:00 - 2026-01-12 17:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_POST_実装切替.md`

## 目的
- ORCA POST 系 API を stub から実実装へ切替する。

## 現行コードからの把握（2025-12-25 時点）
- `/orca/chart/subjectives` と `/orca/medical/records` は **feature flag による stub/real 切替が実装済み**。
  - 既定値: subjectives は **stub**、medical records は **real**。
  - 切替は `ORCA_POST_MODE` / `ORCA_POST_SUBJECTIVES_*` / `ORCA_POST_MEDICAL_RECORDS_*` で制御。
- `/orca/medical-sets` `/orca/tensu/sync` `/orca/birth-delivery` は **stub 固定実装**。
- `/orca/disease` `/orca/patient/mutation` は DB を使った実装があり **stub 固定ではない**。

## 残タスク（未完）
- subjectives の **実接続運用**の可否確認（ORCA 側 POST 開放状況、実測・監査証跡）。
- medical records の **実接続検証**（監査ログ/レスポンス差分の証跡取得）。
- stub 固定の POST（medical-sets / tensu / birth-delivery）の **実実装可否と切替方針**の確定。
- フラグ運用方針（既定値・環境変数の設定手順）の **文書化/共有**。

## 参照
- `src/server_modernized_gap_20251221/05_orca_wrappers/SpecBased_API_解放条件整理.md`
- `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_監査補完.md`
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_Vault_Secrets連携.md`
- `docs/DEVELOPMENT_STATUS.md`
 - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPostFeatureFlags.java`
 - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaSubjectiveResource.java`
 - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java`
 - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalAdministrationResource.java`
 - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaDiseaseResource.java`
 - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPatientResource.java`
 - `server-modernized/config/server-modernized.env.sample`
