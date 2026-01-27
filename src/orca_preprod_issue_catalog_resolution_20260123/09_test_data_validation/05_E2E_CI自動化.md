# 05 E2E/CI 自動化

- RUN_ID: 20260127T203039Z
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

## 自動化対象（範囲）
- Playwright E2E: `tests/e2e/**`
- 実行プロファイル:
  - **MSW (既定/CI 推奨)**: バックエンド不要。`VITE_DISABLE_MSW` 未指定で実行。
  - **Live (任意)**: Modernized Server / ORCA 接続を使う検証。`VITE_DISABLE_MSW=1` + proxy を使用。
- 証跡保存: Playwright フィクスチャ `tests/playwright/fixtures.ts` を正本とする。

## 標準 RUN_ID / 証跡パス
- RUN_ID 形式: `YYYYMMDDThhmmssZ` (UTC)。
- 推奨: `PLAYWRIGHT_ARTIFACT_DIR=artifacts/validation/e2e/<RUN_ID>` を指定し、
  `artifacts/validation/e2e/<RUN_ID>/{msw-on|msw-off}/` 配下に統一保存する。
- `PLAYWRIGHT_ARTIFACT_DIR` 未指定時は
  `artifacts/webclient/e2e/<RUN_ID>/{msw-on|msw-off}/` が自動採用される（互換運用）。

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

## 完了条件
- MSW/Live 両方の標準フローが明文化されている。
- RUN_ID と証跡パスの統一ルールが明記されている。
- CI で回帰検証を継続するための最小手順が記載されている。

## 更新ファイル
- src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/05_E2E_CI自動化.md
