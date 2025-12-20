# ORCA-05/06/08 Cache + ETag ベンチ検証

## 目的
- ORCA-05/06/08 の master API に ETag/TTL を付与し、HTTP 304 を活用したキャッシュヒットを確認する。
- 監査ログに `cacheHit`/`snapshotVersion` を残し、ベンチのメタ検証を行う。

## 実装概要
- 対象: `/orca/master/*` (ORCA-05/06), `/orca/tensu/etensu` (ORCA-08)
- 付与ヘッダー: `ETag`, `Cache-Control`
  - `Cache-Control: public, max-age=<TTL>, stale-while-revalidate=86400`
  - TTL: address/hokenja=7日、それ以外=5分
- ETag 生成: `route + masterType + dataSource + snapshotVersion + version + query` の SHA-256
- 監査ログ: `cacheHit` は **ETag一致で 304 を返した場合に true**

## ベンチ（未実施）
- k6/autocannon で 200/304 混在時の P99 を測定する。
- 取得結果は別途記録し、監査ログ（`cacheHit`, `snapshotVersion`）と照合する。
