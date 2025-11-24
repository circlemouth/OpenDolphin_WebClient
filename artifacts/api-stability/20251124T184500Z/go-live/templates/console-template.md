# Console ログテンプレート

- RUN_ID: 20251124T184500Z
- masterType:
- scenario:
- env: VITE_DEV_PROXY_TARGET / VITE_ORCA_MASTER_BRIDGE / VITE_DISABLE_MSW
- 認証: Basic user= / cert=yes|no

## 取得条件
- [ ] Console filter を `orc` / `audit` / `network` に設定
- [ ] `Preserve log` ON
- [ ] WARN/ERROR のみエクスポート（INFO 多量時は除外可）
- [ ] `dataSourceTransition` / `missingMaster` / `fallbackUsed` / `cacheHit` / `runId` / `traceId` を含むログを確認

## 記録フォーマット
```
TIMESTAMP	LEVEL	MESSAGE	traceId	dataSource	cacheHit	missingMaster	fallbackUsed	snapshotVersion
```
- 例: `2025-11-24T09:48:00Z	WARN	orc-master fallback to snapshot	3ad1... 	snapshot	false	true	true	2025-11-23`

## 保存手順
- DevTools Console 右クリック → `Save as...`
- ファイル名: `<RUN_ID>_console_<masterType>_<scenario>.log`
- 保存先: `artifacts/api-stability/20251124T184500Z/go-live/<date>/`
- ログファイル先頭に env とブラウザバージョンをコメントで追記すること。
