# 4xx/5xx TraceId 監査到達確認
- 期間: 2026-01-13 09:00 - 2026-01-14 09:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T132546Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/4xx5xx_TraceId_監査到達確認.md`

## 目的
- 4xx/5xx の TraceId が監査ログへ到達することを確認し、証跡を取得する。
- 例外パスのメタ整合（TraceId / FacilityId / requestId）を確認する。

## 前提
- `src/server_modernized_gap_20251221/07_quality_release/4xx5xx_監査_統一.md` の方針に従う。
- サーバー起動は未起動時のみ実施し、起動済みなら再起動しない。

## 実施手順（証跡取得）
1. 4xx/5xx を意図的に発生させる API を決定（例: 不正パラメータ/認証不足）。
2. `X-Trace-Id` / `X-Request-Id` / `X-Facility-Id` を付与し、複数 API で実行。
3. 監査ログ（`d_audit_event`）とサーバーログで TraceId の到達を確認。
4. 監査ログと HTTP ログを対応付け、証跡を保存。

## Evidence 記録（取得物の保存先）
- HTTP:
  - `artifacts/parity-manual/traceid-4xx5xx/<RUN_ID>/http/`
- 監査ログ:
  - `artifacts/parity-manual/traceid-4xx5xx/<RUN_ID>/logs/d_audit_event_4xx5xx.csv`
- サーバーログ:
  - `artifacts/parity-manual/traceid-4xx5xx/<RUN_ID>/logs/server_4xx5xx.log`

## 実装状況
- 未着手（RUN_ID 付与のみ、実測は未実施）。

## 次アクション
1. 4xx/5xx の代表ケースを最低 3 パターン実行。
2. TraceId が監査ログへ到達していることを証跡化。

## 参照
- `src/server_modernized_gap_20251221/07_quality_release/4xx5xx_監査_統一.md`
- `docs/DEVELOPMENT_STATUS.md`
