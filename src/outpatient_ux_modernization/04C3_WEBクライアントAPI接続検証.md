# 04C3 WEBクライアントAPI接続検証（RUN_ID=20251214T090000Z、ローカルモダナイズサーバー接続）

- 期間: 2025-12-14 09:00 - 2025-12-15 09:00（JST）
- 優先度: high / 緊急度: medium
- 関連ドキュメント: `docs/web-client/ux/reception-schedule-ui-policy.md`（tone=server および missingMaster/banner 要件）、`docs/web-client/ux/ux-documentation-plan.md`（検証観点）、`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（接続ポリシー）

## 1. 目的
1. Reception→Charts→Patients の一連シナリオを、`setup-modernized-env.sh` でローカル起動したモダナイズ版サーバー（`http://localhost:${MODERNIZED_APP_HTTP_PORT:-9080}/openDolphin/resources`）に接続して実行し、`tone=server` banner と `cacheHit`/`missingMaster`/`resolveMasterSource` が整合していることを確認。
2. Telemetry funnel に `cacheHit`/`missingMaster`/`resolveMasterSource('server')` イベントが含まれることをローカル接続で確認し、`docs/web-client/ux/ux-documentation-plan.md` で示した telemetry 設計（resolve_master → charts_orchestration）が再現するかを記録。
3. `artifacts/webclient/e2e/20251214T090000Z-integration/` にローカル接続ログ・スクリーンショットを残し、`docs/server-modernization/phase2/operations/logs/20251214T090000Z-integration-qa.md` で接続安定性・バナー表示・telemetry フラグの観測結果を整理。Stage/Preview での検証は 06_STAGE検証タスクへ委譲。

## 2. 環境と前提
- ローカル環境: `setup-modernized-env.sh` を使用してモダナイズ版サーバーをローカル起動（デフォルト `MODERNIZED_APP_HTTP_PORT=9080`）。Web クライアントは `VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources` とし、`VITE_DISABLE_MSW` を 0/1 で切り替えて挙動を比較。
- ブラウザ/Playwright: `http://localhost:4173`（通常）または `http://localhost:4174`（MSW 無効プレビュー）で確認。
- ORCA 接続: 本タスクではローカルモダナイズサーバー経由のみを対象とし、外部 Stage/Preview への直接接続は行わない（Stage 検証は 06_STAGE検証タスクで扱う）。証明書取り扱いは `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の手順に従う。
- Telemetry: `web-client/src/libs/telemetry/telemetryClient.ts` の `recordOutpatientFunnel('resolve_master', …)` → `charts_orchestration` がローカルでも発火することを DevTools console / network log で確認。`window.datadogRum` が無効な場合は stub（無例外）であることを確認。

## 3. シナリオ手順
1. `setup-modernized-env.sh` を実行し、ローカルモダナイズ版サーバーと Web クライアントを起動する（npm / docker どちらでも可）。
2. Reception 画面で外来患者一覧を開き、`dataSourceTransition=server` を返す POST/GET が発生するケースで tone=server banner と `missingMaster`/`cacheHit`/`resolveMasterSource` 表示の整合を確認。
3. `resolveMasterSource('case')` から `dataSourceTransition=server` に至る遷移（`missingMaster` true→false、`cacheHit` true/false）を観測し、DevTools もしくは Playwright console で telemetry funnel（resolve_master → charts_orchestration）の発火を確認。
4. Charts へ遷移し、DocumentTimeline/OrderConsole で `cacheHit`/`missingMaster`/`resolveMasterSource` の表示と `tone=server` banner が Reception と同じトーンで引き継がれることを確認。
5. Patients タブへ移動し、保険/フィルタを保持したまま戻る際にも telemetry の順序が維持されるかを観察。`cacheHit=false` のままの場合のバナー残留有無も記録。
6. 必要に応じて `curl http://localhost:9080/openDolphin/resources/api01rv2/claim/outpatient/...` などで HTTP レスポンスの `dataSourceTransition`/`cacheHit`/`missingMaster`/`resolveMasterSource` を取得し、console ログと突合する。

## 4. 収集対象
- Local log: `artifacts/webclient/e2e/20251214T090000Z-integration/local.log`（Reception→Charts→Patients の HTTP リクエスト＆telemetry トリガーの断面）。
- Screenshot: `artifacts/webclient/e2e/20251214T090000Z-integration/reception-tone.png` / `charts-tone.png`（tone=server banner + `resolveMasterSource` badge + funnel step）。
- Telemetry snapshot: `artifacts/webclient/e2e/20251214T090000Z-integration/telemetry.json`（resolve_master → charts_orchestration で記録された flag set）。
- QA log: `docs/server-modernization/phase2/operations/logs/20251214T090000Z-integration-qa.md` に接続安定性・バナー表示・telemetry flag などの検証メモ。

## 5. 本回の状況
- 本検証は 2025-12-14 開始にリスケ済み（`RUN_ID=20251214T090000Z`）。04A3/04B3 と同様にローカルモダナイズ版サーバー接続を前提に進める。Stage/Preview への直接接続は本タスク範囲外。
- 現状はローカル実接続の事前準備（環境変数の整理、MSW 無効時の手順確認）のみ完了。`artifacts/webclient/e2e/20251214T090000Z-integration/` のファイルは後続ワーカーが上書きするプレースホルダー。
- 後続ワーカー（例: gemini cli）への引き継ぎ: 1) `setup-modernized-env.sh` でローカルサーバー＋Web クライアントを起動し、2) 上記シナリオを走らせてログ・スクショ・telemetry を保存、3) `docs/server-modernization/phase2/operations/logs/20251214T090000Z-integration-qa.md` に所見・問題点・RUN_ID をまとめる。Stage 接続が必要になった場合は 06_STAGE検証タスクで扱う。
- RUN_ID=`20251205T171500Z` で MSW 事前検証を実施（/outpatient-mock）。A/B シナリオで `tone=server` マーカー、missingMaster/cacheHit 表示、telemetry (`resolve_master`→`charts_orchestration`) を確認。証跡: `docs/server-modernization/phase2/operations/logs/20251205T171500Z-outpatient-mock.md`、スクリーンショット/ログ: `artifacts/webclient/e2e/20251205T171500Z-outpatient-mock/`。
