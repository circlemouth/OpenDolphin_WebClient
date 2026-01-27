# 08 追加 API 実環境テスト

- RUN_ID: 20260127T052033Z
- 作業日: 2026-01-27
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/08_追加API実環境テスト.md
- 対象IC: IC-55
- 前提ドキュメント: docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する。

## 実施内容
- Trial で正常応答が確認済みの追加 API は既存証跡を採用してスキップ。
- 例: `system01dailyv2`（Api_Result=00）, `medicationgetv2`（Api_Result=000）
- Trial で正常応答が未確認/不安定な API を localhost WebORCA で実測。
- 対象例: `patientmemomodv2`, `/orca/tensu/etensu`

## 環境調整（自律対応）
- `setup-modernized-env.sh` 実行時に Flyway の重複バージョン（V0232）が検出されたため、
  `drop_document_claimdate` を V0233 へ改番して環境起動を完走させた。
- `server-modernized/src/main/resources/db/migration/V0233__drop_document_claimdate.sql`
- `server-modernized/tools/flyway/sql/V0233__drop_document_claimdate.sql`
- localhost WebORCA は `/api` プレフィックスが必要だったため、ORCA 設定を以下へ統一。
- `ORCA_MODE=weborca`
- `ORCA_API_PATH_PREFIX=/api`

## 実測結果（localhost WebORCA）

### 証跡サマリ
- `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/summary.md`

### Trial未確認/不安定APIの実測

#### patientmemomodv2（正常応答を確認）
- 前提: patientmodv2（最小XML）で Patient_ID を採番（Patient_ID=00010, Api_Result=K0）
- endpoint: `POST /orca06/patientmemomodv2`
- HTTP: 200
- Api_Result: `000`
- Api_Result_Message: `メモ登録終了`
- request: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/requests/patientmemomodv2_request.xml`
- response headers: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmemomodv2.headers`
- response body: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmemomodv2.body.xml`
- status: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/patientmemomodv2.status`

#### /orca/tensu/etensu（Trial未確認の例）
- endpoint: `GET /orca/tensu/etensu?asOf=20260127&page=1&size=20`
- HTTP: 404
- 解釈: localhost環境では etensu マスタが未投入/ヒットなしの可能性が高い。
- request URL: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/requests/orca_tensu_etensu.url.txt`
- response headers: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/orca_tensu_etensu.headers`
- response body: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/orca_tensu_etensu.body.json`
- status: `artifacts/orca-preprod/20260127T052033Z/08-additional-api-live/responses/orca_tensu_etensu.status`

## Api_Result 記録（本タスク観点）
- 正常応答を証跡化できた Trial未確認API: `patientmemomodv2`（Api_Result=`000`, HTTP 200）
- 追加観測: `patientmodv2`（前提データ作成, Api_Result=`K0`, HTTP 200, 同一患者警告）

## 追加調査: medicationgetv2 疎通確認（RUN_ID=20260127T063205Z）
- 参照仕様: `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/medicationgetv2.md`
- 事象: `POST /api01rv2/medicationgetv2` が 404
- 原因: `OrcaAdditionalApiResource` が `web.xml` の `resteasy.resources` に未登録
- 修正: `server-modernized/src/main/webapp/WEB-INF/web.xml` に `open.dolphin.rest.OrcaAdditionalApiResource` を追加
- 再ビルド: `docker compose ... build --no-cache server-modernized-dev` と `up -d --force-recreate` を実施
- 実測: `POST http://localhost:19082/openDolphin/resources/api/api01rv2/medicationgetv2`
- HTTP: 200
- Api_Result: `000`
- Api_Result_Message: `処理終了`
- request: `artifacts/orca-preprod/20260127T063205Z/medicationgetv2/request.xml`
- response headers: `artifacts/orca-preprod/20260127T063205Z/medicationgetv2/headers.txt`
- response body: `artifacts/orca-preprod/20260127T063205Z/medicationgetv2/response.xml`
- status: `artifacts/orca-preprod/20260127T063205Z/medicationgetv2/status.txt`

## 追加実測: Trial未確認APIのlocalhost正常応答（RUN_ID=20260127T075253Z）
- 事象: スリープ復帰後に `localhost:19082` への到達性が不安定となったため、`server-modernized-dev` を再起動して復旧。
- ORCA DB を参照する etensu も確認できるよう、`docker-compose.override.dev.yml` に ORCA DB 接続（`ORCA_DB_*`）を追加。
- ORCADS 接続確認: WildFly CLI の `test-connection-in-pool` が `true` を返すことを確認。
- 証跡サマリ: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/summary.md`

### 正常応答を確認できたAPI
- systeminfv2
- endpoint: `POST /api/api01rv2/systeminfv2`
- HTTP: 200
- Api_Result: `0000`
- Api_Result_Message: `処理終了`
- request: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/requests/systeminfv2.xml`
- response headers: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/systeminfv2.headers`
- response body: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/systeminfv2.body.xml`
- status: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/systeminfv2.status`

- masterlastupdatev3
- endpoint: `POST /api/orca51/masterlastupdatev3`
- HTTP: 200
- Api_Result: `000`
- Api_Result_Message: `正常終了`
- request: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/requests/masterlastupdatev3.xml`
- response headers: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/masterlastupdatev3.headers`
- response body: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/masterlastupdatev3.body.xml`
- status: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/masterlastupdatev3.status`

- insuranceinf1v2
- endpoint: `POST /api/api01rv2/insuranceinf1v2`
- HTTP: 200
- Api_Result: `00`
- Api_Result_Message: `処理終了`
- request: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/requests/insuranceinf1v2.xml`
- response headers: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/insuranceinf1v2.headers`
- response body: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/insuranceinf1v2.body.xml`
- status: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/insuranceinf1v2.status`

### 追加観測（未達）
- etensu は `keyword` と `asOf` を絞っても HTTP 404（ヒットなし）。
- request URL: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/requests/etensu.url.txt`
- response headers: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/etensu.headers`
- response body: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/etensu.body.json`
- status: `artifacts/orca-preprod/20260127T075253Z/additional-api-live/responses/etensu.status`

## 追加実測: etensu 404/503 解消と 200 ヒット確認（RUN_ID=20260127T082046Z）

### 原因と修正
- 原因1（404）: `OrcaResource` の `@Path("/orca")` が `OrcaMasterResource` の `@Path("/")` を食い、`/orca/master/*` が未マッチになっていた。
- 対応1: `OrcaMasterResource` の基底@Pathを `/orca/master` に変更し、`/api/orca/master/*` と `/orca/tensu/etensu` は alias リソースに分離。
- 原因2（503）: `TBL_ETENSU_2_SAMPLE` の列名が `RENNUM` なのに `RENUM` を参照してSQLエラーになっていた。
- 対応2: `EtensuDao.loadSpecimens` の列参照を `RENNUM` に修正。

### 実測コマンド（localhost / server-modernized-dev）
```bash
curl -sS -u "dolphindev:dolphindev" \
  -H "X-Facility-Id: 1.3.6.1.4.1.9414.10.1" \
  "http://localhost:8080/openDolphin/resources/orca/master/etensu?keyword=113006810&asOf=20110401&page=1&size=1" \
  -w "\nHTTP_STATUS:%{http_code}\n"
```

### 実測結果（Api_Result相当の観測）
- HTTP: 200
- totalCount: 1
- items[0].tensuCode: `113006810`
- 証跡: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/etensu-curl-final.txt`

### ORCA DB 側の裏取り証跡
- count 裏取り: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/orca-db-etensu-count-after-path-fix.txt`
- 行裏取り: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/orca-db-etensu-row-final.txt`
- スキーマ裏取り（RENNUM）: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/orca-db-etensu-2-sample-schema.txt`

### サーバーログ証跡（エラー→成功の遷移）
- 404/503原因追跡ログ: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/server-logs-after-path-fix-extract.txt`
- 成功ログ（ORCA_MASTER_FETCH outcome=SUCCESS）: `artifacts/orca-preprod/20260127T082046Z/etensu-debug/server-logs-final-extract.txt`
