# ORCA実環境連携検証

- 作業RUN_ID: 20260104T071138Z
- 実施日: 2026-01-04 (UTC)
- 対象: Web クライアント非カルテ領域（Reception/Charts/Patients/Administration）+ ORCA 実環境疎通
- 環境: Modernized server (localhost:19090) / Web client dev (localhost:5176)
- ORCA 接続先: https://weborca-trial.orca.med.or.jp（標準）

## 進捗サマリ（更新: 2026-01-04 / RUN_ID=20260104T085941Z）
- 状態: **未完了**（Trial 疎通は成功、主要操作の ORCA 反映と監査ログ一致の証跡が不足）
- 完了済み:
  - Trial の `system01dailyv2` を XML/UTF-8 で HTTP 200 確認
  - 主要画面スクリーンショットの保存
  - UI runId と auditEvent の一致確認（UI/DB）
- 未完了:
  - Reception/Charts/Patients/Administration の主要操作が ORCA（Trial）へ反映されることの証跡
  - ORCA 反映結果と監査ログの整合確認（runId/auditEvent の実測紐付け）
  - 反映・キュー・印刷結果の一致記録（Trial 環境での実測）
- 次アクション:
  1. Trial 接続で主要操作を再実行し、ORCA 反映結果を `artifacts/orca-connectivity/<RUN_ID>/` に保存
  2. 監査ログ（DB）と UI runId の突合を再記録
  3. 本ドキュメントの「実行ログ」「ブロッカー/差分」を更新

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

## ORCA 反映状態 / キュー状態 / 印刷結果
- Reception/Charts/Patients の UI で ORCA 反映は「未取得/取得中/一部 error」を表示。
- ORCA キューは UI 上で「取得中」または「待ち:0 / 処理中:0 / 成功:0 / 失敗:0」を確認。
- 印刷結果: 患者未選択のため未実施（Charts の印刷ボタンはガードで無効）。

## サーバー設定確認
- claim.conn: `artifacts/orca-connectivity/20260104T071138Z/serverinfo/claim_conn.json` (=server)

## ブロッカー / 差分
- ORCA 実環境 API (system01dailyv2) が HTTP 502 で失敗（旧方針・参考 / Trial 標準に移行）。
- Trial ORCA API は XML UTF-8 / class なしで HTTP 200 を確認済み。
- Web クライアント側の外来一覧取得が HTTP 404 を返すケースが発生（Reception 画面でエラー表示）。
- Patients/Charts の ORCA 反映が `error` を含むため、実 ORCA 反映の完全一致確認は未完了。
- Administration 画面の ORCA 接続先フィールドは初期値 `https://localhost:9080/openDolphin/resources` のまま（実環境値未反映）。
