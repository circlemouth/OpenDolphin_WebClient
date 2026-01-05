# ORCA 接続検証（WebORCA Trial）RUN_ID=20260104T204535Z

- 実施日: 2026-01-04 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（ユーザー=<MASKED> / パスワード=<MASKED>）
- 目的: Web クライアント非カルテ領域の Trial 連携と監査ログ到達確認（DB 初期化後の再検証）

## 1. DB スキーマ生成 / 初期化
- legacy schema dump を適用: `artifacts/orca-connectivity/20260104T204535Z/db/schema_restore.log`
- search_path 設定: `artifacts/orca-connectivity/20260104T204535Z/db/search_path.log`
- local_synthetic_seed 反映: `artifacts/orca-connectivity/20260104T204535Z/seed/local_synthetic_seed.log`
- Trial 用 facility / user 作成:
  - `artifacts/orca-connectivity/20260104T204535Z/db/setup_orca_trial_user.log`
  - `artifacts/orca-connectivity/20260104T204535Z/db/setup_orca_trial_admin.log`

## 2. API 再試行
- `/api/user/...`（Vite proxy 経由）: HTTP 200
  - headers: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/api_user_headers.txt`
  - body: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/api_user_body.json`
  - status: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/api_user_status.txt`
- `/serverinfo/claim/conn`: HTTP 200 / body=`server`
  - headers: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/claim_conn_headers.txt`
  - body: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/claim_conn.json`
  - status: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/claim_conn_status.txt`

## 3. UI 主要画面（system_admin ロール）
- UI RUN_ID: 20260104T205318Z
- 画面証跡:
  - Reception: `artifacts/orca-connectivity/20260104T204535Z/screenshots/reception.png`
  - Charts: `artifacts/orca-connectivity/20260104T204535Z/screenshots/charts.png`
  - Patients: `artifacts/orca-connectivity/20260104T204535Z/screenshots/patients.png`
  - Administration: `artifacts/orca-connectivity/20260104T204535Z/screenshots/administration.png`
- Patients 保存失敗の UI 証跡: `artifacts/orca-connectivity/20260104T204535Z/screenshots/patients_save_error.png`

## 4. 監査ログ到達（d_audit_event）
- `opendolphin.d_audit_event` で UI runId と一致する監査ログを確認。
  - 証跡: `artifacts/orca-connectivity/20260104T204535Z/audit/d_audit_event_runid_20260104T205318Z_opendolphin.log`

## 5. ORCA 反映 / キュー / 印刷の再検証
- 外来/患者 API の一部が HTTP 500（ORCA transport settings incomplete）:
  - `/api01rv2/patient/outpatient`: `artifacts/orca-connectivity/20260104T204535Z/patient/patient_outpatient_status.txt`
  - 保存 `/orca12/patientmodv2/outpatient/mock`: UI で 500（Patients 画面の auditEvent 表示参照）
- 影響:
  - 患者選択/保存の実データ反映が未完了。
  - Charts の印刷/エクスポートは患者未選択のため実行できず。

## 6. ブロッカー
- ORCA API の認証情報（ORCA_API_USER/ORCA_API_PASSWORD）未設定。
- `custom.properties.dev` に `orca.id` / `orca.password` が存在せず、RestOrcaTransport が `ORCA transport settings are incomplete` を返す。
- Trial の公開認証情報: ユーザー=<MASKED> / パスワード=<MASKED>（API 接続のみ、CLAIM 不使用）。
