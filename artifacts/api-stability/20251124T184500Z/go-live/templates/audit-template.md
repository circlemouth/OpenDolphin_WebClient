# 監査 / HTTP ログテンプレート

- RUN_ID: 20251124T184500Z
- masterType:
- scenario:
- backend: (modernized-dev / stage / other)
- env flags: VITE_ORCA_MASTER_BRIDGE= / VITE_DISABLE_MSW= / VITE_DEV_PROXY_TARGET=
- 認証: Basic user= / cert=yes|no

## 必須フィールド（1 レコードあたり）
```json
{
  "timestamp": "2025-11-24T09:50:12.345Z",
  "runId": "20251124T184500Z",
  "parentRunId": "20251124T000000Z",
  "masterType": "orca06",
  "endpoint": "/orca/master/address",
  "params": {"zip": "1000001"},
  "status": 200,
  "p99": 320,
  "p95": 280,
  "avg": 180,
  "errorRate": 0.0,
  "rate429": 0,
  "dataSource": "server",
  "dataSourceTransition": "snapshot->server",
  "cacheHit": false,
  "missingMaster": false,
  "fallbackUsed": false,
  "snapshotVersion": "2025-11-23",
  "traceId": "3ad1...",
  "user": "doctor1",
  "facility": "9001",
  "alertsFired": ["orca-master-p99-high"],
  "notes": ""
}
```

## 保存規約
- 拡張子: `.json`（配列可、1 行 1 レコード）
- ファイル名: `<RUN_ID>_audit_<masterType>_<scenario>.json`
- 保存先: `artifacts/api-stability/20251124T184500Z/go-live/<date>/`
- 記録後、対応する HAR/console と同じシナリオ名で紐付ける。
