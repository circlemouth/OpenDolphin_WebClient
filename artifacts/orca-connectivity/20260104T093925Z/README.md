# ORCA 接続検証（RUN_ID=20260104T093925Z）

## 概要
- 実施日: 2026-01-04 (UTC)
- 接続先: WebORCA Trial（https://weborca-trial.orca.med.or.jp）
- 認証: Basic（<MASKED>）
- 対象: Web クライアント非カルテ領域（Reception / Charts / Patients / Administration）
- UI RUN_ID: 20260104T100437Z（system_admin セッション）

## 実行結果サマリ
- DNS/TLS: `dns/resolve.log`, `tls/openssl_s_client.log`
- Trial `system01dailyv2` (XML/UTF-8): HTTP 200 / Api_Result=00
  - request: `trial/system01dailyv2/request.xml`
  - response: `trial/system01dailyv2/response.xml`
  - headers: `trial/system01dailyv2/response.headers`
- ServerInfo claim.conn: `serverinfo/claim_conn.json`
- UI 主要画面スクリーンショット:
  - Reception: `screenshots/reception.png`
  - Charts: `screenshots/charts.png`
  - Patients: `screenshots/patients.png`
  - Administration: `screenshots/administration.png`
- 監査ログ（runId 一致確認）:
  - `audit/audit_events.tsv` に runId=20260104T100437Z の auditEvent を保存

## UI 操作メモ（runId=20260104T100437Z）
- Reception: 外来リスト取得は HTTP 404（UI バナーで確認）
- Charts: ORCA キューは待ち/処理中/成功/失敗すべて 0（UI 表示）
- Patients: 患者情報取得は HTTP 404（UI バナーで確認）
- Administration: 権限 system_admin で表示可能、配信フォームの ORCA 接続先は `https://localhost:9080/openDolphin/resources` と表示（要差分確認）

## 監査ログ一致の証跡
- `audit/audit_events.tsv` に `runId=20260104T100437Z` を含む `ORCA_CLAIM_OUTPATIENT` / `ORCA_MEDICAL_GET` 等のイベントが記録されていることを確認。
