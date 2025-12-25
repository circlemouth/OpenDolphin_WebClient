# ORCA wrapper 監査補完
- 期間: 2026-01-01 17:00 - 2026-01-02 17:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_監査補完.md`

## 目的
- ORCA wrapper API の監査イベント不足分を補完する。

## 実装状況（現行コード）
- `OrcaAppointmentResource` / `OrcaPatientBatchResource` / `OrcaVisitResource` は入力バリデーション後に `OrcaWrapperService` を呼び出す構成。
- 上記 REST リソース内で `SessionAuditDispatcher` 等の監査イベント記録は行っていない。
- バリデーション失敗は `AbstractResource#restError` により 4xx を返すが、監査イベント記録は未実装。

## 補足
- 監査イベントの実測証跡（ログ/レスポンス差分）の取得と RUN_ID 記載は証跡統合タスクへ移管済み。

## 完了条件
- 監査イベントの実装が完了し、traceId/facilityId の引き回しが整合していること。
- 証跡取得は証跡統合タスクで実施すること。

## 参照
- `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_実接続_Transport.md`
- `docs/DEVELOPMENT_STATUS.md`
