# ORCA マスターブリッジ CI/品質ゲート案（draft）
- RUN_ID: `20251124T140500Z`（親=`20251124T000000Z`）
- 対象ブランチ: `feature/orca-master-*`（pull_request / push）
- 目的: ORCA マスター補完ブリッジの OpenAPI 再生成・MSW フィクスチャ整合・シードテンプレ lint・型整合を自動検証するドラフト。まだ `.github/workflows/` には配置しない。

## Secrets / Env 一覧
| Key | 必須 | 用途 | 例 | 備考 |
| --- | --- | --- | --- | --- |
| `ORCA_API_BASE` | △ (server-proxy matrix 時のみ) | server 経由検証時の API ベース URL | `https://orca-dev.example.com` | MSW モードでは参照しない。envsubst で `.env.ci` に反映可。 |
| `ORCA_SEED_CHECK_DSN` | ○ | psql dry-run 用の read-only 接続文字列 | `postgres://ora_check:***@db.example.com:5432/orca` | ROLLBACK 前提。権限は SELECT のみにする。`web-client/.env.ci.example` にサンプルを配置。 |
| `SNAPSHOT_VERSION` | 任意 | MSW フィクスチャ検証時の snapshotVersion 期待値 | `2025-11-23` | 未指定なら `auto`（ファイルから推定）として扱う想定。 |
| `MSW_ON` | 任意 | 1=MSW, 0=実サーバー | `1` | matrix で `1/0` を切り替え。 |
| `RUN_ID` | 任意 | 監査メタ埋め込み | `20251124T140500Z` | 既定は `github.run_id`。 |

## ローカル検証コマンド（サンプル）
- OpenAPI 再生成差分検知（root 実行）
  ```bash
  cd web-client
  npm run openapi:orca-master
  git diff -- web-client/src/generated/orca-master.ts docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml
  ```
- MSW フィクスチャ検証（監査メタ必須＋sha256 出力）
  ```bash
  RUN_ID=20251124T150000Z SNAPSHOT_VERSION=auto \
  node scripts/verify-msw-fixtures.mjs \
    --fixtures web-client/src/mocks/fixtures/orcaMaster.ts \
    --require runId,snapshotVersion,dataSource,cacheHit,missingMaster,fallbackUsed \
    --expect-run-id "$RUN_ID" \
    --expect-snapshot-version "$SNAPSHOT_VERSION" \
    --hash-out artifacts/ci/msw-fixtures.sha256
  ```
- シードテンプレ psql dry-run（単一トランザクション+ROLLBACK）
  ```bash
  SEED_DSN="postgres://ora_check:***@db.example.com:5432/orca"
  for f in artifacts/api-stability/20251124T130000Z/seed/templates/*.sql; do
    { cat "$f"; echo "ROLLBACK;"; } | psql "$SEED_DSN" \
      --single-transaction --no-psqlrc --set ON_ERROR_STOP=1 --set client_min_messages=warning --echo-all
  done
  ```
- 型整合
  ```bash
  cd web-client
  npm run typecheck
  ```

## チェック項目と所要時間目安
| # | チェック | コマンド/ステップ | キャッシュ | 所要時間目安 |
| --- | --- | --- | --- | --- |
| 1 | OpenAPI 再生成差分 | `npm run openapi:orca-master` → `git diff --exit-code src/generated/orca-master.ts` | npm cache | 1.5 分 |
| 2 | MSW フィクスチャ監査メタ＋sha256 | `node scripts/verify-msw-fixtures.mjs --hash-out artifacts/ci/msw-fixtures.sha256` | なし | 0.5 分 |
| 3 | Seed SQL/CSV lint (psql ROLLBACK) | `psql --single-transaction --set ON_ERROR_STOP=1 ... && ROLLBACK` | apt cache（postgresql-client） | 2.0 分 |
| 4 | TypeScript 型整合 | `npm run typecheck` | npm cache | 2.5 分 |
| 5 | アーティファクト集約 | upload `openapi.diff` / `msw-fixtures.sha256` / `seed-dryrun.log` / `src/generated/orca-master.ts` | なし | 0.3 分 |

## 実行フロー（テキスト図）
```
checkout
  ↓
setup-node (cache npm) + npm ci
  ↓
OpenAPI regenerate → diff fail で stop
  ↓
MSW fixture verify (runId / snapshotVersion / sha256)
  ↓
seed templates dry-run (psql single-transaction + ROLLBACK)
  ↓
TypeScript typecheck
  ↓
upload artifacts (openapi.diff, fixture hash, seed log, generated ts)
```

## envsubst での API ベース切替例
CI 内では matrix で `MSW_ON`/`ORCA_API_BASE` を切替。ローカルで `.env.ci` を生成する場合は以下を想定。
```bash
env ORCA_API_BASE="https://orca-dev.example.com" MSW_ON=0 envsubst < web-client/.env.ci.template > web-client/.env.ci
```

## .env.ci.example からの DSN 設定サンプル
read-only DSN など CI 前提の値をローカル検証で使う場合は、テンプレートをコピーして編集する。
```bash
cp web-client/.env.ci.example web-client/.env.ci
# 必要に応じて ORCA_SEED_CHECK_DSN / ORCA_API_BASE を書き換え
```

## 参考
- ワークフロー雛形: `docs/server-modernization/phase2/operations/assets/ci/orca-master-bridge-ci.yaml`
- OpenAPI/型生成ハブ: `../openapi/README.md`
- ブリッジ計画: `../../../../../../src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
