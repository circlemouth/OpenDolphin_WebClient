# ORCA実環境連携検証

- 作業RUN_ID: 20260104T071138Z
- 実施日: 2026-01-04 (UTC)
- 対象: Web クライアント非カルテ領域（Reception/Charts/Patients/Administration）+ ORCA 実環境疎通
- 環境: Modernized server (localhost:19090) / Web client dev (localhost:5176)
- ORCA 接続先: https://weborca.cloud.orcamo.jp:443

## 実行ログ（runId / 操作 / 結果）

| 画面 | UI RUN_ID | 操作 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| Reception | 20260104T073430Z | ログイン後の外来一覧取得・監査パネル確認 | 外来リスト 0 件 / auditEvent を UI 上で確認 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/reception.png` |
| Charts | 20260104T073430Z | Charts 画面表示・ORCA トーン連携表示確認 | UI 表示 OK / 外来 API 応答待機・一部 error | `artifacts/orca-connectivity/20260104T071138Z/screenshots/charts.png` |
| Patients | 20260104T073430Z | 患者管理表示・監査ビュー確認 | 患者データなし / 監査ビューに runId 表示 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/patients.png` |
| Administration | 20260104T073931Z | system_admin ロールで配信フォーム表示 | 表示 OK / 配信設定フォーム確認 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/administration.png` |

## 監査ログ到達の確認
- DB audit event 取得: `artifacts/orca-connectivity/20260104T071138Z/audit/audit_events.tsv`
- 直近イベントに `ORCA_CLAIM_OUTPATIENT` / `REST_ERROR_RESPONSE` が記録されていることを確認。
- UI 側監査パネルで runId (20260104T073430Z / 20260104T073931Z) が一致。

## ORCA 実環境疎通結果
- DNS: `artifacts/orca-connectivity/20260104T071138Z/dns/resolve.log`
- TLS: `artifacts/orca-connectivity/20260104T071138Z/tls/openssl_s_client.log`
- system01dailyv2 (Shift_JIS JSON): HTTP 502
  - headers: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.headers`
  - body: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.json`
  - trace: `artifacts/orca-connectivity/20260104T071138Z/trace/system01dailyv2.trace`

## ORCA 反映状態 / キュー状態 / 印刷結果
- Reception/Charts/Patients の UI で ORCA 反映は「未取得/取得中/一部 error」を表示。
- ORCA キューは UI 上で「取得中」または「待ち:0 / 処理中:0 / 成功:0 / 失敗:0」を確認。
- 印刷結果: 患者未選択のため未実施（Charts の印刷ボタンはガードで無効）。

## サーバー設定確認
- claim.conn: `artifacts/orca-connectivity/20260104T071138Z/serverinfo/claim_conn.json` (=server)

## ブロッカー / 差分
- ORCA 実環境 API (system01dailyv2) が HTTP 502 で失敗（要ネットワーク/接続先確認）。
- Web クライアント側の外来一覧取得が HTTP 404 を返すケースが発生（Reception 画面でエラー表示）。
- Patients/Charts の ORCA 反映が `error` を含むため、実 ORCA 反映の完全一致確認は未完了。
- Administration 画面の ORCA 接続先フィールドは初期値 `https://localhost:9080/openDolphin/resources` のまま（実環境値未反映）。
