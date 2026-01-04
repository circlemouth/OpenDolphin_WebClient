# ORCA 接続検証ログ (RUN_ID=20260104T093925Z)

- 実施日: 2026-01-04 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（<MASKED>）
- 目的: Web クライアント非カルテ領域の Trial 連携 + 監査ログ到達確認

## 証跡
- Evidence root: `artifacts/orca-connectivity/20260104T093925Z/`
- DNS: `dns/resolve.log`
- TLS: `tls/openssl_s_client.log`
- system01dailyv2: `trial/system01dailyv2/{request.xml,response.xml,response.headers}`
- ServerInfo claim.conn: `serverinfo/claim_conn.json`
- UI screenshots: `screenshots/{reception,charts,patients,administration}.png`
- Audit (runId 一致): `audit/audit_events.tsv`

## 実行結果
- system01dailyv2: HTTP 200 / Api_Result=00（Information_Date=2026-01-04）
- claim.conn: `server` を確認
- UI RUN_ID: 20260104T100437Z

## UI 操作ログ（主要画面）
| 画面 | 操作 | 結果 | 証跡 |
| --- | --- | --- | --- |
| Reception | 画面表示・外来一覧取得 | 外来一覧取得が HTTP 404（UI バナー） | `screenshots/reception.png` |
| Charts | 画面表示・ORCA キュー状態確認 | 待ち/処理中/成功/失敗いずれも 0（UI 表示） | `screenshots/charts.png` |
| Patients | 画面表示・患者一覧取得 | 患者取得が HTTP 404（UI バナー） | `screenshots/patients.png` |
| Administration | 配信フォーム表示 | ORCA 接続先表示が `https://localhost:9080/openDolphin/resources`（Trial と差分） | `screenshots/administration.png` |

## 監査ログ到達（runId 一致）
- `audit/audit_events.tsv` に `runId=20260104T100437Z` を含む `ORCA_CLAIM_OUTPATIENT` / `ORCA_MEDICAL_GET` 等のイベントを確認。

## ブロッカー / 差分
- Reception/Patients の外来・患者 API が HTTP 404 で返却（Trial 連携の実データ反映は未確認）。
- Administration 画面の ORCA 接続先表示が `https://localhost:9080/openDolphin/resources` のまま（Trial URL との差分）。
- Charts 印刷は患者未選択のため未実施（印刷導線はガード状態）。
