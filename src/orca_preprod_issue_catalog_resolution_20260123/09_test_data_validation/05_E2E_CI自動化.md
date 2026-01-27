# 05 E2E/CI 自動化

- RUN_ID: 20260127T204518Z
- 作業日: 2026-01-27
- 期間: 2026-02-01 09:00 - 2026-02-03 09:00
- 優先度: medium
- 緊急度: medium
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/05_E2E_CI自動化.md
- 対象IC: IC-65
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769545659075-12fcb2
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/validation/E2E_統合テスト実施.md
  - docs/web-client/operations/reception-billing-flow-status-20260120.md

## 目的
- E2E 実行の「起動/seed/実行/証跡保存」を標準化し、継続的な回帰検証を可能にする。
- CI での E2E 実行フローを固定し、再現性のある証跡を残す。

## CI 統合（実ファイル）
- GitHub Actions: `.github/workflows/e2e.yml`
- 必須要素: 依存導入 / RUN_ID 採番 / Playwright 実行 / 成果物アップロード
- 収集対象: `artifacts/validation/e2e/<RUN_ID>/` と `test-results/`

## 実行バリエーション（MSW / Live 差分）
| 項目 | MSW（既定/CI推奨） | Live（実接続） |
| --- | --- | --- |
| 目的 | UI/ロジック回帰の安定検証 | 実 API / ORCA 連携の疎通確認 |
| 必須環境 | node + Playwright | Modernized 起動 + ORCA 接続 |
| MSW | 有効（`VITE_DISABLE_MSW` 未指定） | 無効（`VITE_DISABLE_MSW=1`） |
| Vite proxy | 不要 | 必須（`VITE_DEV_PROXY_TARGET=...`） |
| seed | 不要（MSW fixture） | 可能なら `scripts/seed-e2e-repro.sh` |
| 想定時間 | 短い | 長い（依存起動/データ準備） |

## 標準 RUN_ID / 証跡パス
- RUN_ID 形式: `YYYYMMDDThhmmssZ` (UTC)。
- 推奨: `PLAYWRIGHT_ARTIFACT_DIR=artifacts/validation/e2e/<RUN_ID>` を指定し、
  `artifacts/validation/e2e/<RUN_ID>/{msw-on|msw-off}/` 配下に統一保存する。
- `PLAYWRIGHT_ARTIFACT_DIR` 未指定時は
  `artifacts/webclient/e2e/<RUN_ID>/{msw-on|msw-off}/` が自動採用される（互換運用）。

### 証跡保存仕様（表）
| 種別 | 既定/上書き | 出力パス | 用途 |
| --- | --- | --- | --- |
| Playwright HAR | fixtures.ts | `.../<mode>/har/` | API 呼び出し/失敗時解析 |
| スクリーンショット | fixtures.ts | `.../<mode>/screenshots/` | UI 証跡 |
| 動画 | fixtures.ts | `.../<mode>/videos/` | 失敗時の遷移確認 |
| test-results | Playwright 既定 | `test-results/` | 失敗時トレース/レポート |

- `test-results/` は Playwright の trace/レポート格納先。失敗時の解析に必須。

## CI 用 標準フロー（MSW）
### 1. 依存導入
```bash
npm ci
(cd web-client && npm ci)
```

### 2. RUN_ID 採番
```bash
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
```

### 3. Playwright 実行（MSW）
```bash
RUN_ID=${RUN_ID} \
PLAYWRIGHT_ARTIFACT_DIR=artifacts/validation/e2e/${RUN_ID} \
VITE_DEV_USE_HTTPS=0 \
npx playwright test tests/e2e --reporter=list
```

### 4. 証跡保存/収集
- Playwright 自動出力:
  - `artifacts/validation/e2e/<RUN_ID>/msw-on/har/`
  - `artifacts/validation/e2e/<RUN_ID>/msw-on/screenshots/`
  - `artifacts/validation/e2e/<RUN_ID>/msw-on/videos/`
- CI 収集対象:
  - `artifacts/validation/e2e/<RUN_ID>/`
  - `test-results/`
- 実行サマリは `artifacts/validation/e2e/README.md` に追記する。

## ローカル/Live 実行フロー（MSW OFF）
### Live 実行の必須前提
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で Modernized を起動済み。
- Vite proxy を Modernized へ向けて有効化（`VITE_DEV_PROXY_TARGET`）。
- ORCA 接続は `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` の手順を遵守。

### 1. Modernized 環境起動
```bash
WEB_CLIENT_MODE=npm ./setup-modernized-env.sh
```

### 2. seed 投入（必要な場合）
```bash
RUN_ID=${RUN_ID} scripts/seed-e2e-repro.sh
```

### 3. Vite dev 起動（proxy 有効）
```bash
cd web-client
VITE_DISABLE_MSW=1 \
VITE_DEV_PROXY_TARGET=http://localhost:19082/openDolphin/resources \
VITE_DEV_USE_HTTPS=0 \
npm run dev -- --host --port 4173
```

### 4. Playwright 実行（既存 dev を再利用）
```bash
RUN_ID=${RUN_ID} \
PLAYWRIGHT_ARTIFACT_DIR=artifacts/validation/e2e/${RUN_ID} \
PLAYWRIGHT_BASE_URL=http://localhost:4173 \
PLAYWRIGHT_DISABLE_MSW=1 \
npx playwright test tests/e2e --reporter=list
```

## Seed 手順の実在化
- スクリプト: `scripts/seed-e2e-repro.sh`（存在確認済み）
- 依存データ: `ops/db/local-baseline/e2e_repro_seed.sql` + `local_synthetic_seed.sql`
- 期待状態（投入後）:
  - 患者ID: `10010/10011/10012/10013`
  - 受付/診療/会計/帳票の各シナリオが当日分で再現可能
  - Charts タイムラインに seed 文書が表示される
- 受付一覧は ORCA データが前提になるため、ORCA 未準備時は MSW で E2E 実施。

## CI 組み込みの最小ジョブ例（MSW）
```bash
set -euo pipefail
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)

npm ci
(cd web-client && npm ci)

RUN_ID=${RUN_ID} \
PLAYWRIGHT_ARTIFACT_DIR=artifacts/validation/e2e/${RUN_ID} \
VITE_DEV_USE_HTTPS=0 \
npx playwright test tests/e2e --reporter=list
```

## スモーク運用（短時間）
- 重点確認のみを CI に入れる場合は `e2e:smoke` を使う。

```bash
RUN_ID=${RUN_ID} \
PLAYWRIGHT_ARTIFACT_DIR=artifacts/validation/e2e/${RUN_ID} \
VITE_DEV_USE_HTTPS=0 \
npm run e2e:smoke -- --grep @master-bridge --reporter=list
```

## エラー時の復旧ガイド
- Playwright ブラウザ未導入:
  - `npx playwright install --with-deps` を実行。
- dev server 未起動:
  - Playwright の `webServer` が起動失敗する場合、`web-client` で `npm run dev -- --host --port 4173` を手動起動。
- Vite proxy misconfig:
  - `VITE_DEV_PROXY_TARGET` が `http://localhost:19082/openDolphin/resources` を指しているか確認。
  - ORCA 直結時は `ORCA_CERTIFICATION_ONLY.md` の接続情報に合わせて更新。
- MSW 無効化漏れ（Live で MSW が動いている）:
  - `VITE_DISABLE_MSW=1` と `PLAYWRIGHT_DISABLE_MSW=1` の両方を付与して再実行。

## 完了条件
- CI 実行の具体ファイルが追加されている（または標準 CI に合わせた実体ファイル）。
- MSW/Live の差分と証跡収集が表で整理されている。
- Seed 手順が実行可能な形で明示されている。

## 更新ファイル
- src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/05_E2E_CI自動化.md
- .github/workflows/e2e.yml
