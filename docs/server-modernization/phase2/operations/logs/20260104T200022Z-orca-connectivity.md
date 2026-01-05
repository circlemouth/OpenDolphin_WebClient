# ORCA 接続検証（WebORCA Trial）RUN_ID=20260104T200022Z

- 実施日: 2026-01-04 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（<MASKED>）
- 目的: Web クライアント非カルテ領域の Trial 連携と監査ログ到達確認

## 1. Trial API（system01dailyv2）
- リクエスト: `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/request.xml`
- レスポンス: HTTP 200 / Api_Result=00
- 証跡:
  - `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/response.xml`
  - `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/response.headers`
  - `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/http_status.txt`

## 2. Web クライアント（Reception/Charts/Patients/Administration）
- 環境: Modernized server `http://localhost:29180/openDolphin/resources` / Web client dev `http://localhost:5176`
- ORCA 表示: `VITE_ORCA_ENDPOINT=https://weborca-trial.orca.med.or.jp`
- 証跡（スクリーンショット）:
  - `artifacts/orca-connectivity/20260104T200022Z/screenshots/reception.png`
  - `artifacts/orca-connectivity/20260104T200022Z/screenshots/charts.png`
  - `artifacts/orca-connectivity/20260104T200022Z/screenshots/patients.png`
  - `artifacts/orca-connectivity/20260104T200022Z/screenshots/administration.png`

## 3. 監査ログ到達の確認
- `/openDolphin/resources/api/user/...` が HTTP 500 となり、監査ログ出力の前提となる DB スキーマが未作成。
- `d_users` / `d_facility` / `d_audit_event` テーブル未検出: `artifacts/orca-connectivity/20260104T200022Z/audit/schema_presence.txt`
- 監査ログ到達確認はブロック（DB スキーマ作成後に再試行）。

## 4. 追加確認
- `/serverinfo/claim/conn` 取得: HTTP 500
  - `artifacts/orca-connectivity/20260104T200022Z/serverinfo/claim_conn.json`
  - `artifacts/orca-connectivity/20260104T200022Z/serverinfo/claim_conn.status`

## 5. ブロッカー
- Modernized DB のスキーマ未作成により、ユーザー API / 監査ログが 500。
- 監査ログ到達・runId 対応の突合は未達（DB 初期化が必要）。
