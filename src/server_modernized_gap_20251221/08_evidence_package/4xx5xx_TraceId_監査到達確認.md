# 4xx/5xx TraceId 監査到達確認
- 期間: 2026-01-13 09:00 - 2026-01-14 09:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T153311Z
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
- 実施済み（2025-12-27 00:36 JST / RUN_ID=20251226T153311Z）。

## Evidence 記録（実測結果）
- 実施日時: `2025-12-27 00:36 JST`
- 実施者: `Codex`
- RUN_ID: `20251226T153311Z`
- サーバー: `opendolphin-server-modernized-dev`（起動済みのため再起動なし）
- 接続先: `http://localhost:9080/openDolphin/resources`
- 付与ヘッダ: `X-Trace-Id` / `X-Request-Id` / `X-Facility-Id` / `userName` / `password` / `clientUUID`
- HTTP（4xx/5xx）:
  - 404: `GET /20/adm/phr/accessKey/PHR-NOT-FOUND-20251226T153311Z`
    - TraceId: `trace-4xx-404-20251226T153311Z` / RequestId: `req-404-20251226T153311Z`
    - 証跡: `artifacts/parity-manual/traceid-4xx5xx/20251226T153311Z/http/phr_accessKey_not_found/`
  - 400: `PUT /20/adm/phr/accessKey`（invalid JSON）
    - TraceId: `trace-4xx-400-20251226T153311Z` / RequestId: `req-400-20251226T153311Z`
    - 証跡: `artifacts/parity-manual/traceid-4xx5xx/20251226T153311Z/http/phr_accessKey_invalid_payload/`
  - 503: `POST /20/adm/phr/identityToken`（空ボディ）
    - TraceId: `trace-5xx-503-20251226T153311Z` / RequestId: `req-503-20251226T153311Z`
    - 証跡: `artifacts/parity-manual/traceid-4xx5xx/20251226T153311Z/http/phr_identityToken_unavailable/`
- 監査ログ（d_audit_event）:
  - `artifacts/parity-manual/traceid-4xx5xx/20251226T153311Z/logs/d_audit_event_4xx5xx.csv`
  - `PHR_ACCESS_KEY_FETCH` / `PHR_ACCESS_KEY_UPSERT` / `PHR_IDENTITY_TOKEN` の trace_id が一致。
- サーバーログ:
  - `artifacts/parity-manual/traceid-4xx5xx/20251226T153311Z/logs/server_4xx5xx.log`
  - `trace-4xx-404-*` / `trace-4xx-400-*` / `trace-5xx-503-*` のログ出力を確認。

## 次アクション
- 完了（追加対応なし）。

## 参照
- `src/server_modernized_gap_20251221/07_quality_release/4xx5xx_監査_統一.md`
- `docs/DEVELOPMENT_STATUS.md`
