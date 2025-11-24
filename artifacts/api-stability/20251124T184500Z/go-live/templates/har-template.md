# HAR 採取テンプレート

- RUN_ID: 20251124T184500Z（親=20251124T000000Z）
- masterType: (orca05|orca06|orca08|mixed)
- scenario: (canary|ramp25|ramp50|ramp100|rollback|other)
- env:
  - VITE_DEV_PROXY_TARGET:
  - VITE_ORCA_MASTER_BRIDGE:
  - VITE_DISABLE_MSW (0/1):
- 認証: Basic user= / cert(mTLS)=yes|no
- ブラウザ: Chrome ___ / OS ___ / SW unregister 済み? yes|no

## 手順チェック
- [ ] DevTools Network で `Preserve log` ON、`Disable cache` ON
- [ ] フィルタ `orca/master` or `tensu` 適用
- [ ] 対象リクエストに `Authorization` / `traceId` / `runId` / `dataSource` / `cacheHit` / `missingMaster` / `fallbackUsed` / `snapshotVersion` が含まれることを確認
- [ ] `Timing` タブで TTFB/Largest/Total を確認しメモ
- [ ] `Export HAR` を実行しファイル名を規約に従って保存

## メトリクス記録
- リクエスト: (例 `/orca/master/address?zip=1000001`)
- p99 / p95 / avg / max (ms):
- 5xx count / 4xx count / 429 count:
- response size (KB):
- dataSource / cacheHit / missingMaster / fallbackUsed:
- snapshotVersion:
- traceId:

## 保存パス
- `artifacts/api-stability/20251124T184500Z/go-live/<date>/` に HAR を配置
- ログへのリンク: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#run-20251124t184500z`
