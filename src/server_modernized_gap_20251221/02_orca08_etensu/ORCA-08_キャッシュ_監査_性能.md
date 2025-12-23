# ORCA-08 キャッシュ/監査/性能
- 期間: 2025-12-30 09:00 - 2025-12-31 09:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`

## 目的
- ORCA-08 (ETENSU) 応答の ETag/TTL/監査メタを本番仕様に合わせる。
- 大型レスポンス時の性能劣化を抑止するための設計と計測ポイントを整理する。

## 実装状況
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
  - ETag 生成・`Cache-Control` ヘッダー・`stale-while-revalidate` 設定を実装済み。
  - `/orca/tensu/etensu` の監査イベント記録（`recordMasterAudit`）を実装済み。
  - TTL は `address/hokenja=7日`, それ以外 `5分` の方針で実装済み。
  - 監査メタに `status` / `traceId` / `totalCount` / `rowCount` / `dbTimeMs` / `loadFailed` を追加。
  - `size` 上限 2000 を DB 取得前に適用し、監査メタの `size` にも反映。
  - バリデーションエラー (422) 時の監査記録を追加（`validationError`/`errorCode` を details に出力）。
  - ETENSU 応答に `X-Orca-Db-Time` / `X-Orca-Row-Count` / `X-Orca-Total-Count` / `X-Orca-Cache-Hit` を付与。
- `server-modernized/src/main/java/open/orca/rest/EtensuDao.java`
  - 取得結果の `dbTimeMs` を集計し、監査/ヘッダ連携へ渡す。
  - 大量データ時のメモリ負荷を抑えるため、コレクション初期容量を調整。

## 決定事項
- `/api/orca/master/etensu` は Modernized REST の対象外とし、404 を仕様として許容する。
  - 根拠: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の ORCA-08 は `/orca/tensu/etensu` のみ定義。
  - ブリッジ/クライアントは `/orca/tensu/etensu` を正規経路として維持する。

## DB 型変更メモ
- `d_audit_event.payload` は `text` への移行が必要（OID ロブ→文字列）。
  - Flyway: `server-modernized/tools/flyway/sql/V0227__audit_event_payload_text.sql`
  - 既存 DB で `payload` が OID の場合のみ適用。新規環境で `text` 済みなら不要。

## 切り分け/対処
- 500: `OrcaResource` の同時アクセスロック (`WFLYEJB0241`) が発生。
- 503: ORCADS のコネクションプール枯渇 (`IJ000655: No managed connections available`) により `EtensuDao` が取得失敗。
- 直接原因: `EtensuDao` が `Connection` を close しておらず、リクエスト回数に比例して ORCADS が枯渇。
- 暫定対処: `/subsystem=datasources/data-source=ORCADS:flush-all-connection-in-pool` を実行すると単発 200 が復帰。
- 注意: `claim.jdbc.*` は無視され、ORCADS の JNDI 設定（`DB_NAME` 既定 `opendolphin_modern`）が優先。

## 未実施
- autocannon 等の負荷計測でエラーなしの P99 再計測（`EtensuDao` の接続リーク修正→再デプロイが必要）。
- 実データ/大量件数投入後の大容量レスポンス検証（size=2000 でも実件数は少数のまま）。

## 実測/証跡
- RUN_ID=`20251223T013000Z`:
  - EtensuDao の接続 close 修正は反映済みだが、WAR 再ビルドが mvn 未導入で失敗。
  - ホットデプロイ/再計測は未実施。
  - ビルドログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T013000Z/mvn_package.log`
- RUN_ID=`20251222T234349Z`（ローカル）: autocannon による P99 計測を実施。
  - 実行ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251222T234349Z/autocannon.log`
  - 設定: `artifacts/api-stability/20251124T111500Z/benchmarks/20251222T234349Z/bench.config.json`
  - 対象パス: `/api/orca/master/{generic-class,address,etensu}`（`/orca/tensu/etensu` は 404 のため暫定で `api/orca/master/etensu` を使用）
- メモリスナップショット: `artifacts/api-stability/20251124T111500Z/benchmarks/20251222T234349Z/docker-stats.txt`
- 参考: `docker compose -f docker-compose.modernized.dev.yml build server-modernized-dev` が Maven プラグイン取得失敗で中断（`repo.maven.apache.org` 解決失敗）。
- RUN_ID=`20251223T004500Z`:
  - `/orca/tensu/etensu` P99/メモリ実測（size=20/2000）。
  - autocannon: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T004500Z/autocannon.log`
  - 設定: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T004500Z/bench.config.json`
  - 実行スクリプト: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T004500Z/autocannon-orca08.js`
  - メモリスナップショット: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T004500Z/docker-stats.txt`
  - 追加ヘッダ採取: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T004500Z/etensu-{small,large}.headers.txt`
  - 結果: P99=5592ms (size=20), 5579ms (size=2000)、errors=2/timeouts=2。
  - 最大メモリ: 1.185GiB（2025-12-23T13:43:59 時点）。
  - 備考: 500/503 が混在し、正常応答の P99 は再計測が必要。
- RUN_ID=`20251223T010500Z`:
  - 原因切り分け:
    - ORCADS 状態: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/orcads-status.log`
    - サーバーログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/server{.log,.after.log,.bench.log}`
    - DB ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/db{.log,.after.log}`
  - 暫定対処（200 復帰）: ORCADS flush 実行ログ
    - `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/orcads-flush{,-after}.log`
  - ORCA DB 仮セットアップ:
    - SQL: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/orca-db-bootstrap.sql`
    - 実行ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/orca-db-bootstrap.log`
  - 正常応答の簡易 P99（seq10/curl、10 サンプル）
    - 計測: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/seq10-curl.csv`
    - 集計: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T010500Z/seq10-curl-summary.csv`
    - 結果: P99=119ms (size=20), 206ms (size=2000)、200=10/10。
    - メモリ: 最大 1.368GiB（`docker-stats-seq10-curl.txt`）。
- RUN_ID=`20251223T001200Z`:
  - WAR 更新: `docker build -f ops/modernized-server/docker/Dockerfile` で再ビルド後、`opendolphin-server.war` を稼働コンテナへホットデプロイ。
    - ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/docker-build.log`
    - WAR: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/opendolphin-server.war`
  - 互換対応:
    - `DatasourceMetricsRegistrar`/`OrcaDatasourceMetricsRegistrar` の DataSource 注入へ変更。
    - `/orca/tensu/etensu` を `open.orca.rest.OrcaResource` から `OrcaMasterResource` へ橋渡し。
  - DB 作業:
    - `TBL_ETENSU_1~5`（＋`TBL_ETENSU_3_1~3_4`）作成。
      - SQL: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/create-etensu-tables.sql`
      - ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/db-etensu-create.log`
    - seed-orca08.sql 最小投入。
      - ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/seed-orca08.log`
    - 監査テーブル修正（payload 型を text 化）。
      - ログ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/db-audit-payload-fix.log`
  - 検証（ORCA_MASTER_BASIC_USER/PASSWORD 既定値）:
    - `/openDolphin/resources/orca/tensu/etensu` は 200（2件）。
      - 証跡: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/etensu-orca-tensu-master-auth.txt`
    - `/openDolphin/resources/api/orca/master/etensu` は 404。
      - 証跡: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/etensu-api-master-master-auth.txt`
    - 差分: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T001200Z/etensu-compare-master-auth.txt`

## 参照
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`
- `docs/DEVELOPMENT_STATUS.md`
