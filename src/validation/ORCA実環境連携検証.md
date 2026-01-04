# ORCA実環境連携検証

- 作業RUN_ID: 20260104T093925Z
- 実施日: 2026-01-04 (UTC)
- 対象: Web クライアント非カルテ領域（Reception/Charts/Patients/Administration）+ ORCA 実環境疎通
- 環境: Modernized server (localhost:19090) / Web client dev (localhost:5176)
- ORCA 接続先: https://weborca-trial.orca.med.or.jp（標準）

## 進捗サマリ（更新: 2026-01-04 / RUN_ID=20260104T093925Z）
- 状態: **一部完了**（Trial 疎通/監査ログ一致は確認済み、ORCA 反映の実データ整合が未完了）
- 完了済み:
  - Trial の `system01dailyv2` を XML/UTF-8 で HTTP 200 / Api_Result=00 確認
  - Reception/Charts/Patients/Administration の主要画面を system_admin ロールで表示しスクリーンショットを取得
  - UI runId（20260104T100437Z）と auditEvent（DB）一致を確認
- 未完了:
  - Reception/Patients の外来/患者 API が HTTP 404 のため、ORCA 反映の実データ確認が未達
  - Administration 画面の ORCA 接続先が Trial URL と不一致（`https://localhost:9080/openDolphin/resources` 表示）
  - Charts 印刷/エクスポートは患者未選択で未実施
- 次アクション:
  1. 外来/患者 API の 404 解消後に ORCA 反映結果（UI/DB）を再突合
  2. Administration の ORCA 接続先表示を Trial URL へ反映し再検証
  3. Charts 印刷の実行結果と監査ログを追加記録

## 実行ログ（runId / 操作 / 結果）

| 画面 | UI RUN_ID | 操作 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| Reception | 20260104T073430Z | ログイン後の外来一覧取得・監査パネル確認 | 外来リスト 0 件 / auditEvent を UI 上で確認 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/reception.png` |
| Charts | 20260104T073430Z | Charts 画面表示・ORCA トーン連携表示確認 | UI 表示 OK / 外来 API 応答待機・一部 error | `artifacts/orca-connectivity/20260104T071138Z/screenshots/charts.png` |
| Patients | 20260104T073430Z | 患者管理表示・監査ビュー確認 | 患者データなし / 監査ビューに runId 表示 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/patients.png` |
| Administration | 20260104T073931Z | system_admin ロールで配信フォーム表示 | 表示 OK / 配信設定フォーム確認 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/administration.png` |
| Reception | 20260104T100437Z | 外来一覧取得・監査パネル確認 | 外来一覧が HTTP 404（UI バナー） | `artifacts/orca-connectivity/20260104T093925Z/screenshots/reception.png` |
| Charts | 20260104T100437Z | Charts 画面表示・ORCA キュー確認 | ORCA キュー待ち/処理中/成功/失敗=0 | `artifacts/orca-connectivity/20260104T093925Z/screenshots/charts.png` |
| Patients | 20260104T100437Z | 患者一覧取得・監査ビュー確認 | 患者取得が HTTP 404（UI バナー） | `artifacts/orca-connectivity/20260104T093925Z/screenshots/patients.png` |
| Administration | 20260104T100437Z | 配信フォーム表示 | ORCA 接続先が `https://localhost:9080/openDolphin/resources` 表示 | `artifacts/orca-connectivity/20260104T093925Z/screenshots/administration.png` |

## 監査ログ到達の確認
- DB audit event 取得: `artifacts/orca-connectivity/20260104T071138Z/audit/audit_events.tsv`
- 直近イベントに `ORCA_CLAIM_OUTPATIENT` / `REST_ERROR_RESPONSE` が記録されていることを確認。
- UI 側監査パネルで runId (20260104T073430Z / 20260104T073931Z) が一致。
- 追加: `artifacts/orca-connectivity/20260104T093925Z/audit/audit_events.tsv` に runId=20260104T100437Z の監査イベントを保存（UI runId と一致）。

## ORCA 実環境疎通結果（旧方針・参考）
- 接続先: https://weborca.cloud.orcamo.jp:443
- DNS: `artifacts/orca-connectivity/20260104T071138Z/dns/resolve.log`
- TLS: `artifacts/orca-connectivity/20260104T071138Z/tls/openssl_s_client.log`
- system01dailyv2 (Shift_JIS JSON): HTTP 502
  - headers: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.headers`
  - body: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.json`
  - trace: `artifacts/orca-connectivity/20260104T071138Z/trace/system01dailyv2.trace`

## Trial ORCA 接続試行（ユーザー指示）
- RUN_ID: 20260104T080619Z
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（ユーザー/パスワードは <MASKED>）
- DNS: `artifacts/orca-connectivity/20260104T080619Z/dns/resolve.log`
- TLS: `artifacts/orca-connectivity/20260104T080619Z/tls/openssl_s_client.log`
- system01dailyv2 (Shift_JIS JSON): HTTP 502
  - headers: `artifacts/orca-connectivity/20260104T080619Z/trial/system01dailyv2/response.headers`
  - body: `artifacts/orca-connectivity/20260104T080619Z/trial/system01dailyv2/response.json`
  - trace: `artifacts/orca-connectivity/20260104T080619Z/trace/system01dailyv2.trace`
- system01dailyv2 (XML UTF-8 / class パラメータなし): HTTP 200
  - request: `artifacts/orca-connectivity/20260104T080619Z/trial/system01dailyv2/request.xml`
  - headers: `artifacts/orca-connectivity/20260104T080619Z/trial/system01dailyv2/response-xml.headers`
  - body: `artifacts/orca-connectivity/20260104T080619Z/trial/system01dailyv2/response-xml.xml`
  - trace: `artifacts/orca-connectivity/20260104T080619Z/trace/system01dailyv2-xml.trace`
 - RUN_ID: 20260104T093925Z
 - 接続先: https://weborca-trial.orca.med.or.jp
 - 認証: Basic（ユーザー/パスワードは <MASKED>）
 - system01dailyv2 (XML UTF-8 / class なし): HTTP 200 / Api_Result=00
   - request: `artifacts/orca-connectivity/20260104T093925Z/trial/system01dailyv2/request.xml`
   - headers: `artifacts/orca-connectivity/20260104T093925Z/trial/system01dailyv2/response.headers`
   - body: `artifacts/orca-connectivity/20260104T093925Z/trial/system01dailyv2/response.xml`

## ORCA 反映状態 / キュー状態 / 印刷結果
- Reception/Charts/Patients の UI で ORCA 反映は「未取得/取得中/一部 error」を表示。
- ORCA キューは UI 上で「取得中」または「待ち:0 / 処理中:0 / 成功:0 / 失敗:0」を確認。
- 印刷結果: 患者未選択のため未実施（Charts の印刷ボタンはガードで無効）。
 - 追加（RUN_ID=20260104T100437Z）:
   - Reception/Patients は HTTP 404 で取得失敗（UI バナーで確認）。
   - Charts の ORCA キューは待ち/処理中/成功/失敗がすべて 0。
   - 印刷は患者未選択のため未実施。

## サーバー設定確認
- claim.conn: `artifacts/orca-connectivity/20260104T071138Z/serverinfo/claim_conn.json` (=server)

## ブロッカー / 差分
- ORCA 実環境 API (system01dailyv2) が HTTP 502 で失敗（旧方針・参考 / Trial 標準に移行）。
- Trial ORCA API は XML UTF-8 / class なしで HTTP 200 を確認済み。
- Web クライアント側の外来一覧取得が HTTP 404 を返すケースが発生（Reception 画面でエラー表示）。
- Patients/Charts の ORCA 反映が `error` を含むため、実 ORCA 反映の完全一致確認は未完了。
- Administration 画面の ORCA 接続先フィールドは初期値 `https://localhost:9080/openDolphin/resources` のまま（実環境値未反映）。
- 追加（RUN_ID=20260104T093925Z）:
  - system_admin で Administration へ到達できるが、表示される ORCA 接続先が Trial URL と不一致。
  - ORCA 反映の実データ確認は外来/患者 API 404 のためブロック。
