# ORCA wrapper 実接続 Transport 実装
- 期間: 2025-12-29 17:00 - 2026-01-01 17:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_実接続_Transport.md`

## 目的
- ORCA wrapper の transport を stub から実接続へ切替する。

## 実装状況（現行コード）
- `RestOrcaTransport` が `@ApplicationScoped` で実装済み（HTTP 経由、Basic 認証、リトライ設定、`ExternalServiceAuditLogger` による監査ログ出力）。
- `StubOrcaTransport` は `@Vetoed` のため CDI 対象外で、実運用では選択されない。
- `OrcaWrapperService` は CDI で `OrcaTransport` を解決するため、デフォルトは `RestOrcaTransport` が選択される構成。

## 未実施（明文化が必要な未対応）
- Stub/実接続の切替条件（どの設定で stub を有効化するか）の運用ルール記載。
- Stub を有効化する仕組み（`@Alternative`/設定フラグ/DI 切替など）の明文化・実装方針が未整備。
- 実接続時の設定手順（`ORCA_API_*` / `custom.properties` の優先順位・禁止事項）の明文化。
- 実接続の疎通・レスポンス検証・監査ログの証跡取得（RUN_ID 付き）は最終段階で実施。

## 完了条件
- Stub/実接続の切替条件と有効化手段が明文化されていること。
- 実接続時の設定手順（優先順位・禁止事項）が明文化されていること。
- 最終段階での実測証跡取得が完了していること。

## 参照
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_Vault_Secrets連携.md`
- `src/server_modernized_gap_20251221/05_orca_wrappers/SpecBased_API_解放条件整理.md`
- `docs/DEVELOPMENT_STATUS.md`
