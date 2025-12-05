# 20251214T090000Z Integration QA（Stage Outpatient API）

- RUN_ID: 20251214T090000Z
- 期間: 2025-12-14 09:00 - 2025-12-15 09:00 JST 予定
- 目的: Stage の Reception→Charts→Patients シナリオで `/api01rv2/claim/outpatient/*` / `/orca21/medicalmodv2/outpatient` を `dataSourceTransition=server` ルートで実行し、`tone=server` banner、`cacheHit`/`missingMaster`/`resolveMasterSource` 表示、telemetry funnel（`resolve_master`→`charts_orchestration`）を検証する。`docs/web-client/ux/reception-schedule-ui-policy.md` の tone=server 要件と `docs/web-client/ux/ux-documentation-plan.md` の検証観点を参照。

## 検証対象
1. Reception で `ToneBanner`/`ResolveMasterBadge`/`StatusBadge` が Stage で `dataSourceTransition=server`/`missingMaster`/`cacheHit` を正しく carry over すること。
2. Charts の DocumentTimeline/OrderConsole/OrcaSummary/Patients のバナーと `resolveMasterSource('server')` 表示が tone=server の連鎖を辿ること。
3. `/api01rv2/claim/outpatient/*` と `/orca21/medicalmodv2/outpatient` から返るレスポンスヘッダー/ボディに `dataSourceTransition=server`/`cacheHit`/`missingMaster` を含め、Playwright/curl から取得した `stage.log` に記録。
4. `web-client/src/libs/telemetry/telemetryClient.ts` の `recordOutpatientFunnel('resolve_master', …)` → `charts_orchestration` のフラグセットが Stage でも `telemetry.json` に残ること。

## 実行ステータス
- Stage ORCA 証明書・接続権限が現在の Codex CLI 環境にはないため、2025-12-14 09:00（JST）以降の本番 Stage 実行は未実施。
- `artifacts/webclient/e2e/20251214T090000Z-integration/` 配下に既存の placeholder ファイル（`README.md` / `telemetry.json`）があるので、実行後に以下のファイルを上書きしてください:
  - `stage.log`（Reception→Charts→Patients の HTTP リクエスト/telemetry/resolveMaster flag）
  - `telemetry.json`（resolve_master → charts_orchestration の flag/ runId/ tone）
  - `reception-tone.png` / `charts-tone.png`（tone=server banner + badge）

## 次のアクション
1. Stage 環境へのアクセス権限と ORCA 証明書 (`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の手順) を持つワーカーが、`VITE_DISABLE_MSW=1`、`VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources` などの指示に従って Stage を起動し、Reception→Charts→Patients を順次操作。Playwright で `PLAYWRIGHT_BASE_URL=https://localhost:4173` を使って telemetry funnel を観察する。
2. `docs/web-client/ux/reception-schedule-ui-policy.md` の tone/badge要件、`docs/web-client/ux/ux-documentation-plan.md` の telemetry 観点、`docs/web-client/planning/phase2/DOC_STATUS.md` の「Web クライアント UX/Features」行、および `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の進捗ポイントに RUN_ID=20251214T090000Z を記載。
3. 実行結果（stage.log、telemetry snapshot、スクリーンショット）を `artifacts/webclient/e2e/20251214T090000Z-integration/` に追加し、観察の所見・不安定点をこのログファイルに追記。
4. 完了時点で `docs/server-modernization/phase2/operations/logs/20251214T090000Z-integration-qa.md` のステータスを更新し、DOC_STATUS/manager checklist へリンク。

## 証跡リンク（暫定）
- `artifacts/webclient/e2e/20251214T090000Z-integration/README.md`（placeholder 状況）
- `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md`（検証計画と制約）
