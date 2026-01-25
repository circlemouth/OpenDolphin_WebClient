# 03_masterSource切替キャッシュ更新

- RUN_ID: 20260125T005112Z
- 作業日: 2026-01-25
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/08_sync_cache/03_masterSource切替キャッシュ更新.md
- 対象IC: IC-52
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/web-client/architecture/web-client-api-mapping.md
  - docs/web-client/architecture/doctor-workflow-status-20260120.md
  - docs/preprod/implementation-issue-inventory/webclient-sync-cache.md

## 実施内容
- Charts の masterSource 切替を queryKey に含め、policy 別にキャッシュを分離した。
- masterSource の変更検知時に claim/appointment/summary を invalidate し、即時再取得させる設計を追加した。
- fallback 指定時は `preferredSourceOverride=mock` を維持しつつ、policy 自体を key に入れて cache 混在を防止した。

## キャッシュ更新ルール
- queryKey は `chartsMasterSourcePolicy` を含める。
  - `['charts-claim-flags', chartsMasterSourcePolicy]`
  - `['charts-appointments', today, chartsMasterSourcePolicy]`
  - `['orca-outpatient-summary', runId, chartsMasterSourcePolicy]`
- masterSource が `auto/server/snapshot/mock/fallback` のいずれかへ切替わったら、以下の prefix を invalidate して再取得を強制する。
  - `['charts-claim-flags']`
  - `['charts-appointments']`
  - `['orca-outpatient-summary']`
- これにより、Charts の `dataSourceTransition`/`cacheHit`/`missingMaster` が masterSource 切替直後に最新状態へ揃う。

## 変更ファイル
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/features/charts/__tests__/orderBundleBodyPart.test.tsx

## 検証
- 実行コマンド:
  - (web-client) npm test -- charts
- 結果: パス

## 追記（追加対応）
- RUN_ID: 20260125T011950Z
- 実施内容:
  - masterSource 切替時の invalidate/re-fetch を検証するテストを追加。
  - 簡易検証として、切替時に claim/appointment/summary が再取得されることを確認。
  - `docs/preprod/implementation-issue-inventory/webclient-sync-cache.md` に切替時ルールと影響範囲を追記。
- 検証:
  - (web-client) npm test -- charts
