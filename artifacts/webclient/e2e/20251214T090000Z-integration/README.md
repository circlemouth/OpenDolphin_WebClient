# 20251214T090000Z Integration Artifacts

## 状況
- RUN_ID=20251214T090000Z の Stage 外来 API シナリオを想定（Reception→Charts→Patients、`dataSourceTransition=server`、`tone=server`、`cacheHit`/`missingMaster`/`resolveMasterSource` 表示の検証）。
- この環境（Codex CLI）からは ORCA 証明書・Stage 接続ができないため、ファイルはプレースホルダーとして作成されています。実際のログ/スクリーンショットは Stage 実行後に以下のパスを上書きしてください。

## 期待ファイル
1. `stage.log` – Stage での HTTP リクエスト/telemetry payload（Reception→Charts→Patients）の抜粋
2. `telemetry.json` – `recordOutpatientFunnel('resolve_master', …)` → `charts_orchestration` の flag / runId / tone 情報
3. `reception-tone.png` / `charts-tone.png` – tone=server banner + `resolveMasterSource` badge + `dataSourceTransition=server` badge を含むスクリーンショット

## 今後の実行手順
1. Stage に接続（`VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET=<ステージURL>` + `PLAYWRIGHT_BASE_URL=https://localhost:4173`）で Reception/Charts/Patients を一巡。
2. `/api01rv2/claim/outpatient/*` と `/orca21/medicalmodv2/outpatient` を呼び出し、`cacheHit`/`missingMaster` と `dataSourceTransition` を確認。
3. Telemetry funnel の `resolve_master` → `charts_orchestration` で `cacheHit`/`missingMaster` が追跡されているかを `telemetry.json` へ記録。
4. スクリーンショットと Stage log を本ディレクトリへ保存し、`docs/server-modernization/phase2/operations/logs/20251214T090000Z-integration-qa.md` に観測所見を追記。
