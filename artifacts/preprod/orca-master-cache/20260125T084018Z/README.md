# ORCA master キャッシュ検証ログ

- RUN_ID: 20260125T084018Z
- 作業日: 2026-01-25
- 対象IC: IC-20 / IC-21 / IC-22
- 参照タスク: src/orca_preprod_issue_catalog_resolution_20260123/03_orca_master/02_キャッシュ検証と判定仕様.md

## 実データ検証（200 応答）
- 対象: `/orca/master/etensu`
- 証跡: `artifacts/api-stability/20251124T111500Z/benchmarks/20251223T104902Z/etensu-size20.headers.txt`
  - Cache-Control: `public, max-age=300, stale-while-revalidate=86400`
  - ETag: `"01be3aa7ae75c1bf19dc73de5c76e42225f331f28ed97898e9dfb9248be472ad"`
  - X-Orca-Cache-Hit: `false`
  - Vary: `userName,password`
- 補足: size=2000 のヘッダも同一 TTL/ETag 形式で確認（`artifacts/api-stability/20251124T111500Z/benchmarks/20251223T104902Z/etensu-size2000.headers.txt`）。

## 304 応答検証（If-None-Match）
- 検証: `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`
  - `getGenericClass_ifNoneMatch_returnsNotModified`
  - `getEtensu_ifNoneMatch_returnsNotModifiedWithCacheHitHeader`
- 実行ログ: `artifacts/preprod/orca-master-cache/20260125T084018Z/logs/mvn-test.log`
- 期待挙動:
  - 304 応答 + ETag 保持
  - `Cache-Control: public, max-age=300, stale-while-revalidate=86400`
  - `/orca/master/etensu` は `X-Orca-Cache-Hit: true`

## 空結果・missingMaster 判定
- 空結果 (list): 200 + items=[] + emptyResult=true + missingMaster=false
  - 例: ORCA-05/06 list 系（`/orca/master/generic-class` など）
- 404 (lookup): missingMaster=true/fallbackUsed=true
  - 例: `/orca/master/address`・`/orca/master/etensu`（`TENSU_NOT_FOUND`）
- 200 (lookup fallback): missingMaster=true/fallbackUsed=true
  - 例: `/orca/master/generic-price`（未収載薬）

## 実行コマンド
- `mvn -pl server-modernized -Dtest=OrcaMasterResourceTest test`
