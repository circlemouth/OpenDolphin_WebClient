# 2025-11-21 PHR Phase-A/B Trial 再測ログ (RUN_ID=20251121TrialPHRSeqZ1-A/B)
- 対象タスク: 【ワーカー指示】Task-D「PHR Phase-A/B Trial 実測証跡取得」
- 手順: `scripts/orca_prepare_next_run.sh` で RUN テンプレートを初期化 → `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/` へ `crud/httpdump/trace/logs/screenshots` を作成 → `curl -u <MASKED>:<MASKED>`（Basic、Shift_JIS→UTF-8 固定）で Phase-A/B API を叩き、HTTP/TRACE/ボディを保存。
- 参照: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`（Snapshot Summary 行2-7: 「一部の管理業務を除き自由にお使いいただけます」「登録なさった情報は誰でも参照でき」「管理者によって定期的にすべて消去」）

## 1. 実測サマリ
| API (Phase) | メソッド/URL | HTTP | 応答抜粋 | 証跡 |
| --- | --- | --- | --- | --- |
| PHR-02 (Phase-A Register) | `PUT /20/adm/phr/accessKey` | 405 | `{"Code":405,"Message":"Method Not Allowed"}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr02_accessKey/`
| PHR-03 (Phase-A Update) | `GET /20/adm/phr/accessKey/PHR-WEB1001-20251115` | 404 | `{"Code":404,"Message":"Not Found"}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr03_accessKey_lookup/`
| PHR-10 (Phase-A Delete補助) | `GET /20/adm/phr/patient/WEB1001` | 404 | `{"Code":404,"Message":"Not Found"}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr10_patient/`
| PHR-02 DELETE (Phase-A Delete) | `DELETE /20/adm/phr/accessKey/PHR-WEB1001-20251115` | 405 | `{"Code":405,...}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr02_accessKey_delete/`
| PHR-01 (Phase-B Register) | `GET /20/adm/phr/abnormal/WEB1001?docSince=2025-05-01` | 404 | `{"Code":404,...}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr01_abnormal/`
| PHR-04 (Phase-B Update) | `GET /20/adm/phr/allergy/WEB1001?docSince=2025-05-01` | 404 | `{"Code":404,...}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr04_allergy/`
| PHR-05 (Phase-B Update) | `GET /20/adm/phr/disease/WEB1001?docSince=2025-05-01` | 404 | `{"Code":404,...}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr05_disease/`
| PHR-08 (Phase-B Delete) | `GET /20/adm/phr/labtest/WEB1001?labSince=2025-05-01` | 404 | `{"Code":404,...}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr08_labtest/`
| PHR-09 (Phase-B Delete) | `GET /20/adm/phr/medication/WEB1001?docSince=2025-05-01` | 404 | `{"Code":404,...}` | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr09_medication/`

- `logs/curl_summary.log` に HTTP コードと本文を追記済み。
- UI スクリーンショットは GUI 端末不足につき placeholder (`screenshots/phase-*.png`) を使用。mac-dev-login 現行手順を README に引用し、後続で本番 UI を再取得する。

## 2. Blocker 判定
- `trialsite.md` Snapshot Summary（行 2-7）にあるように Trial サイトは「一部の管理業務を除き自由にお使いいただけます」が `/20/adm/phr/*` を提供していないため、Phase-A/B API は 404/405 となる。`docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` の Blocker 区分に `TrialEndpointMissing` を追加。
- 代替案: Modernized RESTEasy (WildFly 33) 経路で Phase-A/B を実装し、Trial 404 を Evidence として `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に転記。

## 3. 次アクション
1. Modernized 環境で PHR-02/03/10 + 01/04/05/08/09 を e2e 検証し、`PHR_ACCESS_KEY_*` / `PHR_*_TEXT` 監査を `audit/sql/PHR_*.sql` に採取。
2. GUI 端末（Chrome 1024x768）で Trial にログインし、UI before/after を撮影 → placeholder を差し替え。
3. Task-D の進捗を `PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md` と `DOC_STATUS.md` W22 行へ反映（RUN_ID=`20251121TrialPHRSeqZ1-A/B`、Evidence 路径、Blocker）。

## 4. Task-E Secrets/Context 再検証 (RUN_ID=20251121TrialPHRSeqZ1-CTX)

- Modernized WildFly (`opendolphin-server-modernized-dev`) に対し、`serverinfo/claim/conn` を `1.3.6.1.4.1.9414.72.103:admin`（MD5=`e88df8596ff8847e232b1e4b1b5ffde2`）で再取得し、レスポンス `server` と SHA256 ハッシュを `artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CTX/serverinfo/claim_conn.{json,sha256}` に保存。TraceId は `RUN_ID-*` で統一し、`wildfly/phr_20251121TrialPHRSeqZ1-CTX.log` に BASIC 認証ヘッダーの INFO ログと対応させた。
- BASIC 認証 CRUD: `/20/adm/phr/allergy|medication|labtest|abnormal|{facility,patient}` を `curl -H userName -H password` で実行し、HTTP200（例: アレルギー=「登録なし」、labtest/abnormal=2024-11-02 実測値、`container`= JSON 1146byte）を `crud/phr-*/response.{headers,json}` へ記録。WildFly 側では `open.dolphin` ログと JMS 監査 (`PHR_ALLERGY_TEXT` など) が出力され、`docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md#task-e` に一覧を追記した。
- Secrets fail-fast: `POST /20/adm/phr/export`・`GET /status/{jobId}`・`GET /export/{jobId}/artifact` を試行し、`wildfly/phr_status_20251121TrialPHRSeqZ1-CTX.log` に例外を採取。`PHR_EXPORT_SIGNING_SECRET` 未設定時は `HmacSignedUrlService` が `IllegalStateException` を投げる想定だが、現状は `PHRKey` と `PHRAsyncJob` が PersistenceUnit に登録されておらず Hibernate が `UnknownEntityException` で fail-fast してしまうため、SignedUrl フェーズまで進めなかった。回避策として `phr_async_job` に SUCCEEDED 行を直接挿入 → `GET /status/<uuid>` を実行し、同じ例外が発生することを再現済み。
- 今後は `server-modernized` の `persistence.xml` に対象エンティティを追加したうえで `PHR_EXPORT_SIGNING_SECRET` を Secrets から供給し、`PHR_SIGNED_URL_ISSUE_FAILED` / `PHR_SIGNED_URL_NULL_FALLBACK` 監査の取得と `ops/check-secrets.sh --profile phr-export` 成功ログを Evidence に含める。
