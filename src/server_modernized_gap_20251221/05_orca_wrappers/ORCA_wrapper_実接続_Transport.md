# ORCA wrapper 実接続 Transport 実装
- 期間: 2025-12-29 17:00 - 2026-01-01 17:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_実接続_Transport.md`

## 目的
- ORCA wrapper の transport を stub から実接続へ切替する。

## 実装状況（現行コード）
- `RestOrcaTransport` が `@ApplicationScoped` で実装済み（HTTP 経由、Basic 認証、リトライ設定、`ExternalServiceAuditLogger` による監査ログ出力）。
- `StubOrcaTransport` は `@Vetoed` のため CDI 対象外で、実運用では選択されない。
- `OrcaWrapperService` は CDI で `OrcaTransport` を解決するため、デフォルトは `RestOrcaTransport` が選択される構成。

## 実装メモ（2025-12-24）
- `OrcaAcceptanceListResource` の stub fallback を廃止し、`OrcaTransport` 実接続に統一。
- acceptlstv2 の成功/失敗で監査詳細（status / httpStatus / errorCode / errorMessage）を記録。
- errorCode/errorMessage を監査エンベロープにも反映。

## 補足
- 実接続の疎通・レスポンス検証・監査ログの証跡取得（RUN_ID 付き）は証跡統合タスクへ移管。

## 完了条件
- Stub/実接続の切替条件と有効化手段が明文化されていること（完了: `ORCA_wrapper_実接続_運用条件明文化.md`）。
- 実接続時の設定手順（優先順位・禁止事項）が明文化されていること（完了: `ORCA_wrapper_実接続_運用条件明文化.md`）。

## 参照
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_Vault_Secrets連携.md`
- `src/server_modernized_gap_20251221/05_orca_wrappers/SpecBased_API_解放条件整理.md`
- `docs/DEVELOPMENT_STATUS.md`
