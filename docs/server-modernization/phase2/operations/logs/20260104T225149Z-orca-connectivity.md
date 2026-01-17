# ORCA 接続検証（WebORCA Trial）RUN_ID=20260104T225149Z

- 実施日: 2026-01-04 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照）
- 目的: Web クライアント非カルテ領域の Trial 連携と監査ログ到達確認（DB 初期化後の再検証）
- UI RUN_ID: 20260104T231148Z

## 1. DB スキーマ生成 / 初期化
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` 実行ログ: `artifacts/orca-connectivity/20260104T225149Z/db/setup-modernized-env.log`

## 2. API 再試行
- `/api/user`: HTTP 200
  - headers/body/status: `artifacts/orca-connectivity/20260104T225149Z/serverinfo/api_user_*`
- `/serverinfo/claim/conn`: HTTP 200 / body=`server`
  - headers/body/status: `artifacts/orca-connectivity/20260104T225149Z/serverinfo/claim_conn_*`
- `/orca/appointments/list`: HTTP 200 / recordsReturned=1
  - request/response: `artifacts/orca-connectivity/20260104T225149Z/api/appointment_outpatient_list_*`
- `/orca/queue`: HTTP 200 / entries=0
  - response: `artifacts/orca-connectivity/20260104T225149Z/queue/orca_queue_body_2.json`

## 3. UI 主要画面（system_admin ロール）
- Reception: `artifacts/orca-connectivity/20260104T225149Z/screenshots/reception.png`
- Charts: `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts.png`
- Patients: `artifacts/orca-connectivity/20260104T225149Z/screenshots/patients.png`
- Administration: `artifacts/orca-connectivity/20260104T225149Z/screenshots/administration.png`

## 4. 監査ログ到達（d_audit_event）
- runId=20260104T231148Z を payload に含む監査イベントを確認。
  - `artifacts/orca-connectivity/20260104T225149Z/audit/d_audit_event_runid_20260104T231148Z.log`
  - `artifacts/orca-connectivity/20260104T225149Z/audit/d_audit_event_trace_2abf6f07.log`

## 5. ORCA 反映 / キュー / 印刷の再検証
- ORCA キュー UI 表示: entries=0（API と一致）。
- 印刷/エクスポート:
  - 確認モーダル: `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_confirm.png`
  - 印刷ページ: `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_page.png`

## 6. 補足
- Administration の ORCA 接続先フォームは `https://localhost:9080/openDolphin/resources` 表示のまま（UI 表示差分）。
  - 原因: `/api/admin/config` が HTTP 404 のためサーバー設定が取得できず、UI は `VITE_ORCA_ENDPOINT` の既定値（`AdministrationPage.tsx` の fallback）を表示。
  - 証跡:
    - `artifacts/orca-connectivity/20260104T225149Z/api/admin_config_status.txt` (404)
    - `artifacts/orca-connectivity/20260104T225149Z/api/admin_config_body.json`
