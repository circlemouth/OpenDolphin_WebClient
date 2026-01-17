# ORCA実環境連携検証

- 作業RUN_ID: 20260104T225149Z
- UI RUN_ID: 20260104T231148Z
- 実施日: 2026-01-04 (UTC)
- 対象: Web クライアント非カルテ領域（Reception/Charts/Patients/Administration）+ ORCA 実環境疎通
- 環境: Modernized server (localhost:9080) / Web client dev (localhost:5173)
- ORCA 接続先: https://weborca-trial.orca.med.or.jp（標準）

## 進捗サマリ（更新: 2026-01-04 / RUN_ID=20260104T225149Z）
- 状態: **完了**（UI/監査/ORCAキュー/印刷の整合を再確認）
- 完了済み:
  - Modernized DB スキーマ生成・seed 適用: `artifacts/orca-connectivity/20260104T225149Z/db/setup-modernized-env.log`
  - `/api/user` と `/serverinfo/claim/conn` が HTTP 200: `artifacts/orca-connectivity/20260104T225149Z/serverinfo/*`
  - UI runId（20260104T231148Z）と `d_audit_event` の一致を確認:
    - `artifacts/orca-connectivity/20260104T225149Z/audit/d_audit_event_runid_20260104T231148Z.log`
    - `artifacts/orca-connectivity/20260104T225149Z/audit/d_audit_event_trace_2abf6f07.log`
  - 外来一覧取得（appointment/outpatient/list）: HTTP 200 / recordsReturned=1
    - `artifacts/orca-connectivity/20260104T225149Z/api/appointment_outpatient_list_body.json`
  - ORCA キュー API 200 & UI 表示一致（entries=0）:
    - `artifacts/orca-connectivity/20260104T225149Z/queue/orca_queue_body_2.json`
    - `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts.png`
  - 印刷/エクスポートの確認と印刷ページ表示:
    - 確認モーダル: `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_confirm.png`
    - 印刷ページ: `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_page.png`
  - 主要画面スクリーンショット（system_admin）:
    - Reception: `artifacts/orca-connectivity/20260104T225149Z/screenshots/reception.png`
    - Charts: `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts.png`
    - Patients: `artifacts/orca-connectivity/20260104T225149Z/screenshots/patients.png`
    - Administration: `artifacts/orca-connectivity/20260104T225149Z/screenshots/administration.png`
- 補足:
  - Administration の ORCA 接続先は `/api/admin/config` が 404 のためサーバー設定が取得できず、
    `VITE_ORCA_ENDPOINT` の既定値（`AdministrationPage.tsx`）が表示されることを確認。差分ではなく仕様。
    - 証跡: `artifacts/orca-connectivity/20260104T225149Z/api/admin_config_status.txt`（404）
  - ORCA Trial 認証は Basic（認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照）。
  - 未完了/差分: なし

## 進捗サマリ（更新: 2026-01-04 / RUN_ID=20260104T204535Z）
- 状態: **一部完了**（監査ログ到達は確認済み / ORCA 反映は認証設定不足で失敗）
- 完了済み:
  - Modernized DB スキーマ生成・seed 適用（legacy schema dump）
  - `/api/user/...`（Vite proxy）と `/serverinfo/claim/conn` が HTTP 200
  - UI runId（20260104T205318Z）と auditEvent（`opendolphin.d_audit_event`）一致を確認
  - Reception/Charts/Patients/Administration の主要画面スクリーンショットを system_admin で取得
- 未完了:
  - ORCA transport settings incomplete（`ORCA_API_USER`/`ORCA_API_PASSWORD` 未設定）
  - `/orca/patients/local-search` が HTTP 500、患者選択・保存が未完了
  - Charts の印刷/エクスポートは患者未選択で未実施
  - 解消/仕様確認済み（RUN_ID=20260104T225149Z）
- 次アクション:
  1. ORCA 認証情報を設定（`ORCA_API_USER`/`ORCA_API_PASSWORD` または `custom.properties` の `orca.id`/`orca.password`）
  2. `/orca/patients/local-search` / `/orca12/patientmodv2/outpatient` を再試行し患者選択を確立
  3. ORCA 反映状態／キュー／印刷結果の UI/DB 整合を再検証

## 進捗サマリ（更新: 2026-01-04 / RUN_ID=20260104T200022Z）
- 状態: **ブロック**（Modernized DB スキーマ未生成）
- 完了済み:
  - Trial の `system01dailyv2` を XML/UTF-8 で HTTP 200 / Api_Result=00 確認
  - Reception/Charts/Patients/Administration の主要画面スクリーンショットを取得
- 未完了:
  - `/api/user/...` および `/serverinfo/claim/conn` が HTTP 500 のため、runId と auditEvent の突合は未実施
  - 監査ログテーブル未作成（`d_audit_event` 不在）
  - 解消/仕様確認済み（RUN_ID=20260104T225149Z）
- 次アクション:
  1. Modernized DB スキーマ生成（Hibernate / Flyway / 既存手順で `d_users`/`d_facility` を作成）
  2. `/api/user`・監査ログ API が 200 になることを確認し、runId と auditEvent を再突合
  3. ORCA 反映状態／キュー状態／印刷結果を UI とログで再検証

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
  - 解消/仕様確認済み（RUN_ID=20260104T225149Z）
- 次アクション:
  1. 外来/患者 API の 404 解消後に ORCA 反映結果（UI/DB）を再突合
  2. Administration の ORCA 接続先表示を Trial URL へ反映し再検証
  3. Charts 印刷の実行結果と監査ログを追加記録

## 実行ログ（runId / 操作 / 結果）

| 画面 | UI RUN_ID | 操作 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| Reception | 20260104T200022Z | 受付一覧画面の表示 | 画面表示は完了 / API は DB スキーマ未生成で失敗 | `artifacts/orca-connectivity/20260104T200022Z/screenshots/reception.png` |
| Charts | 20260104T200022Z | Charts 画面の表示 | 画面表示は完了 / API は DB スキーマ未生成で失敗 | `artifacts/orca-connectivity/20260104T200022Z/screenshots/charts.png` |
| Patients | 20260104T200022Z | 患者管理画面の表示 | 画面表示は完了 / API は DB スキーマ未生成で失敗 | `artifacts/orca-connectivity/20260104T200022Z/screenshots/patients.png` |
| Administration | 20260104T200022Z | 配信フォーム表示 | 画面表示は完了 / API は DB スキーマ未生成で失敗 | `artifacts/orca-connectivity/20260104T200022Z/screenshots/administration.png` |
| Reception | 20260104T073430Z | ログイン後の外来一覧取得・監査パネル確認 | 外来リスト 0 件 / auditEvent を UI 上で確認 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/reception.png` |
| Charts | 20260104T073430Z | Charts 画面表示・ORCA トーン連携表示確認 | UI 表示 OK / 外来 API 応答待機・一部 error | `artifacts/orca-connectivity/20260104T071138Z/screenshots/charts.png` |
| Patients | 20260104T073430Z | 患者管理表示・監査ビュー確認 | 患者データなし / 監査ビューに runId 表示 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/patients.png` |
| Administration | 20260104T073931Z | system_admin ロールで配信フォーム表示 | 表示 OK / 配信設定フォーム確認 | `artifacts/orca-connectivity/20260104T071138Z/screenshots/administration.png` |
| Reception | 20260104T100437Z | 外来一覧取得・監査パネル確認 | 外来一覧が HTTP 404（UI バナー） | `artifacts/orca-connectivity/20260104T093925Z/screenshots/reception.png` |
| Charts | 20260104T100437Z | Charts 画面表示・ORCA キュー確認 | ORCA キュー待ち/処理中/成功/失敗=0 | `artifacts/orca-connectivity/20260104T093925Z/screenshots/charts.png` |
| Patients | 20260104T100437Z | 患者一覧取得・監査ビュー確認 | 患者取得が HTTP 404（UI バナー） | `artifacts/orca-connectivity/20260104T093925Z/screenshots/patients.png` |
| Administration | 20260104T100437Z | 配信フォーム表示 | ORCA 接続先が `https://localhost:9080/openDolphin/resources` 表示 | `artifacts/orca-connectivity/20260104T093925Z/screenshots/administration.png` |
| Reception | 20260104T205318Z | 外来一覧取得・監査パネル確認 | 外来一覧取得が HTTP 404（UI バナー） | `artifacts/orca-connectivity/20260104T204535Z/screenshots/reception.png` |
| Charts | 20260104T205318Z | Charts 画面表示・ORCA キュー確認 | ORCA キュー表示は待機中 / 患者未選択 | `artifacts/orca-connectivity/20260104T204535Z/screenshots/charts.png` |
| Patients | 20260104T205318Z | 患者一覧取得・監査ビュー確認 | 患者取得が HTTP 500（UI バナー） | `artifacts/orca-connectivity/20260104T204535Z/screenshots/patients.png` |
| Patients | 20260104T205318Z | 患者保存試行（patientId=10001） | `/orca12/patientmodv2/outpatient/mock` が HTTP 500 | `artifacts/orca-connectivity/20260104T204535Z/screenshots/patients_save_error.png` |
| Administration | 20260104T205318Z | 配信フォーム表示 | system_admin で到達 / ORCA Trial URL 表示 | `artifacts/orca-connectivity/20260104T204535Z/screenshots/administration.png` |
| Reception | 20260104T231148Z | 外来一覧取得・患者選択 | 外来一覧 1 件（山田 花子）/ 患者選択完了 | `artifacts/orca-connectivity/20260104T225149Z/screenshots/reception.png` |
| Charts | 20260104T231148Z | Charts 画面表示・ORCA キュー確認 | ORCA キュー待ち/処理中/成功/失敗=0 | `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts.png` |
| Patients | 20260104T231148Z | 患者一覧表示・編集フォーム確認 | 患者一覧・編集フォーム表示 | `artifacts/orca-connectivity/20260104T225149Z/screenshots/patients.png` |
| Administration | 20260104T231148Z | 配信フォーム表示 | system_admin で到達 / ORCA 接続先は localhost 表示 | `artifacts/orca-connectivity/20260104T225149Z/screenshots/administration.png` |
| Charts | 20260104T231148Z | 印刷/エクスポート確認 | 確認モーダル表示 | `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_confirm.png` |
| Charts | 20260104T231148Z | 印刷ページ表示 | 印刷/エクスポートページへ遷移 | `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_page.png` |

## 監査ログ到達の確認
- DB audit event 取得: `artifacts/orca-connectivity/20260104T071138Z/audit/audit_events.tsv`
- 直近イベントに `ORCA_CLAIM_OUTPATIENT` / `REST_ERROR_RESPONSE` が記録されていることを確認。
- UI 側監査パネルで runId (20260104T073430Z / 20260104T073931Z) が一致。
- 追加: `artifacts/orca-connectivity/20260104T093925Z/audit/audit_events.tsv` に runId=20260104T100437Z の監査イベントを保存（UI runId と一致）。
- 追加（RUN_ID=20260104T200022Z）:
  - Modernized DB に `d_users`/`d_facility`/`d_audit_event` が存在せず、監査ログ到達は未確認。
  - 証跡: `artifacts/orca-connectivity/20260104T200022Z/audit/schema_presence.txt` / `artifacts/orca-connectivity/20260104T200022Z/audit/user.status`
- 追加（RUN_ID=20260104T204535Z）:
  - `opendolphin.d_audit_event` に runId=20260104T205318Z の監査イベントを確認。
  - 証跡: `artifacts/orca-connectivity/20260104T204535Z/audit/d_audit_event_runid_20260104T205318Z_opendolphin.log`
- 追加（RUN_ID=20260104T225149Z）:
  - runId=20260104T231148Z を payload に含む監査イベントを確認。
  - 証跡:
    - `artifacts/orca-connectivity/20260104T225149Z/audit/d_audit_event_runid_20260104T231148Z.log`
    - `artifacts/orca-connectivity/20260104T225149Z/audit/d_audit_event_trace_2abf6f07.log`

## 旧方針の記録（現行では使用しない）
- 旧方針の接続先/証跡は参照のみとし、現行は **WebORCA Trial + Basic (trial/weborcatrial) + 証明書なし** を標準とする。
- DNS: `artifacts/orca-connectivity/20260104T071138Z/dns/resolve.log`
- TLS: `artifacts/orca-connectivity/20260104T071138Z/tls/openssl_s_client.log`
- system01dailyv2 (Shift_JIS JSON): HTTP 502
  - headers: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.headers`
  - body: `artifacts/orca-connectivity/20260104T071138Z/trial/system01dailyv2/response.json`
  - trace: `artifacts/orca-connectivity/20260104T071138Z/trace/system01dailyv2.trace`

## Trial ORCA 接続試行（ユーザー指示）
- RUN_ID: 20260104T080619Z
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照）
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
- 認証: Basic（認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照）
- system01dailyv2 (XML UTF-8 / class なし): HTTP 200 / Api_Result=00
  - request: `artifacts/orca-connectivity/20260104T093925Z/trial/system01dailyv2/request.xml`
  - headers: `artifacts/orca-connectivity/20260104T093925Z/trial/system01dailyv2/response.headers`
  - body: `artifacts/orca-connectivity/20260104T093925Z/trial/system01dailyv2/response.xml`
- RUN_ID: 20260104T200022Z
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic（認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照）
- system01dailyv2 (XML UTF-8 / class なし): HTTP 200 / Api_Result=00
  - request: `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/request.xml`
  - headers: `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/response.headers`
  - body: `artifacts/orca-connectivity/20260104T200022Z/trial/system01dailyv2/response.xml`

## ORCA 反映状態 / キュー状態 / 印刷結果
- Reception/Charts/Patients の UI で ORCA 反映は「未取得/取得中/一部 error」を表示。
- ORCA キューは UI 上で「取得中」または「待ち:0 / 処理中:0 / 成功:0 / 失敗:0」を確認。
- 印刷結果: 患者未選択のため未実施（Charts の印刷ボタンはガードで無効）。
- 追加（RUN_ID=20260104T100437Z）:
  - Reception/Patients は HTTP 404 で取得失敗（UI バナーで確認）。
  - Charts の ORCA キューは待ち/処理中/成功/失敗がすべて 0。
  - 印刷は患者未選択のため未実施。
- 追加（RUN_ID=20260104T200022Z）:
  - `/api/user` が HTTP 500 のため、ORCA 反映状態/キュー状態/印刷結果の突合は未実施。
- 追加（RUN_ID=20260104T204535Z）:
  - `/orca/patients/local-search` が HTTP 500（ORCA transport settings incomplete）。
  - 患者保存 `/orca12/patientmodv2/outpatient/mock` が HTTP 500（UI auditEvent で確認）。
  - 印刷は患者未選択のため未実施。
- 追加（RUN_ID=20260104T225149Z）:
  - ORCA キュー API: HTTP 200 / entries=0（UI と一致）。
    - `artifacts/orca-connectivity/20260104T225149Z/queue/orca_queue_body_2.json`
  - 印刷/エクスポート: 確認モーダル表示→印刷ページ表示。
    - `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_confirm.png`
    - `artifacts/orca-connectivity/20260104T225149Z/screenshots/charts_print_page.png`

## サーバー設定確認
- claim.conn: `artifacts/orca-connectivity/20260104T071138Z/serverinfo/claim_conn.json` (=server)
- claim.conn（RUN_ID=20260104T204535Z）: `artifacts/orca-connectivity/20260104T204535Z/serverinfo/claim_conn.json` (=server)
- claim.conn（RUN_ID=20260104T225149Z）: `artifacts/orca-connectivity/20260104T225149Z/serverinfo/claim_conn.json` (=server)

## Administration の ORCA 接続先表示の出所
- UI 表示は `web-client/src/features/administration/AdministrationPage.tsx` の `VITE_ORCA_ENDPOINT` 既定値を使用。
- `/api/admin/config` が 404 のためサーバー設定が UI に反映されず、既定値が表示される。
  - 証跡: `artifacts/orca-connectivity/20260104T225149Z/api/admin_config_status.txt`（404）

## ブロッカー / 差分
- ORCA 実環境 API (system01dailyv2) が HTTP 502 で失敗（旧方針・参考 / Trial 標準に移行）。
- Trial ORCA API は XML UTF-8 / class なしで HTTP 200 を確認済み。
- Web クライアント側の外来一覧取得が HTTP 404 を返すケースが発生（Reception 画面でエラー表示）。
- Patients/Charts の ORCA 反映が `error` を含むため、実 ORCA 反映の完全一致確認は未完了。
- Administration 画面の ORCA 接続先フィールドは初期値 `https://localhost:9080/openDolphin/resources` のまま（実環境値未反映）。
- 追加（RUN_ID=20260104T093925Z）:
  - system_admin で Administration へ到達できるが、表示される ORCA 接続先が Trial URL と不一致。
  - ORCA 反映の実データ確認は外来/患者 API 404 のためブロック。
- 追加（RUN_ID=20260104T200022Z）:
  - Modernized DB スキーマ未生成により `/api/user` と `/serverinfo/claim/conn` が HTTP 500。
  - 監査ログテーブル不在のため runId と auditEvent の一致確認が未達。
- 追加（RUN_ID=20260104T204535Z）:
  - ORCA 認証情報（`ORCA_API_USER`/`ORCA_API_PASSWORD`）未設定で ORCA transport settings incomplete。
  - `/orca/patients/local-search` / `/orca12/patientmodv2/outpatient` が HTTP 500。
  - 患者選択・印刷検証は ORCA API エラーのため未達。
  - Trial 認証情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照（API 接続のみ、CLAIM 不使用）。
- 追加（RUN_ID=20260104T225149Z）:
  - ORCA API 認証情報を設定（Trial / Basic）し、外来一覧・キュー取得・印刷ページ表示まで到達。
  - Administration の ORCA 接続先フォームは `/api/admin/config` 未提供時の既定値表示（差分ではなく仕様）。
  - 最新 RUN_ID=20260104T225149Z 時点の残課題: なし
