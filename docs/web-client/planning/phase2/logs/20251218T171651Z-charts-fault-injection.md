# Charts 障害注入（timeout/500/schema mismatch/queue stall）実装ログ（RUN_ID=`20251218T171651Z`）

## 目的
- Charts の外来フローで、意図的に **timeout / 500 / スキーマ不一致 / キュー滞留** を再現し、
  「落ちずに説明できる」こと・解除後に復帰できることを確認可能にする。
- 証跡（HAR/スクショ/runId/traceId）が同一 RUN_ID で `artifacts/` に残る導線を確立する。

## 実装
### 1) MSW 障害注入ヘッダー
- `web-client/src/libs/http/header-flags.ts`
  - localStorage/env から `mswFault` / `mswDelayMs` を読み、`x-msw-fault` / `x-msw-delay-ms` を全リクエストへ付与。

### 2) MSW ハンドラ（外来 API）
- `web-client/src/mocks/handlers/outpatient.ts`
  - `x-msw-fault` に応じて `timeout(504)` / `http-500(500)` / `schema-mismatch(200 + ERROR_SCHEMA_MISMATCH)` を注入。
  - `x-msw-delay-ms` が指定された場合は応答を遅延。

### 3) MSW ハンドラ（ORCA queue）
- `web-client/src/mocks/handlers/orcaQueue.ts`
  - `queue-stall` を指定すると `lastDispatchAt` が 5 分を超えたエントリを返し、Charts 側で滞留バッジが出る。

### 4) 設定 UI（Outpatient Mock）
- `web-client/src/features/outpatient/OutpatientMockPage.tsx`
  - `x-msw-fault` / `x-msw-delay-ms` を UI から設定・解除（localStorage へ保存）。

### 5) 自動確認（Playwright）
- `tests/e2e/charts-fault-injection.msw.spec.ts`
  - 4 パターンを MSW ヘッダーで切替し、エラー表示→解除→再取得で復帰することを確認。
  - Playwright 共通フィクスチャにより HAR/スクショは `artifacts/webclient/e2e/<RUN_ID>/msw-on/` に保存される。

## 手動検証メモ（実施時の観測ポイント）
- `timeout/http-500/schema-mismatch`:
  - DocumentTimeline に retry UI が出る（「請求バンドルを再取得」）
  - 医療記録パネルが「取得に失敗」表示へ遷移（白画面にならない）
- `queue-stall`:
  - DocumentTimeline に「滞留」バッジが出る
- 解除後:
  - 再取得でエラーが解消し、通常表示へ復帰する
  - ドラフトが保持される（未保存入力が消えない）

## 関連ドキュメント
- 手順書: `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`

