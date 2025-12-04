# 04B2 WEBクライアントCharts/Patients UX実装

- **RUN_ID=20251212T090000Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` の参照チェーンに従い、`docs/web-client/ux/charts-claim-ui-policy.md`／`docs/web-client/ux/patients-admin-ui-policy.md` と整合しながら DocumentTimeline/OrderConsole/Patients の ORCA tone を実装しました。`auth-service` の `tone=server` フラグを起点とし、missingMaster/ dataSourceTransition=server の状態を UI に展開して Reception 側の `role=alert` + `aria-live` ルールと一致させています。
- 実装の観測記録は `artifacts/webclient/ux-notes/20251212T090000Z-orca-flags.md` に残し、`docs/web-client/ux/ux-documentation-plan.md` へスクリーンショット付きマイルストーンを追記。進捗ログは `docs/server-modernization/phase2/operations/logs/20251212T090000Z-charts-orca.md` でまとめ、`docs/web-client/planning/phase2/DOC_STATUS.md` の Web クライアント UX 行にも RUN_ID/証跡を追記済みです。

## 1. 実装ハイライト
1. DocumentTimeline の missingMaster バナーは `missingMaster=true` 受信時に `Warning`(琥珀) tone + `aria-live=assertive` で即時表示し、`data-run-id` を `DocumentTimeline` → `Reception` へ carry over する仕組みを追加。`auth-service` で `tone=server` が有効な場合はバナー色を変えて `dataSourceTransition=server` ルートを明示するとともに、`aria-atomic=false` で二重読み上げを抑止しています。
2. OrderConsole/OrcaSummary の `DataSourceBanner` と `FilterBadge` は `missingMaster`/`cacheHit`/`dataSourceTransition` を受信すると `tone`/`aria-live`/`audit.meta` を更新し、`auth-service` の `tone=server` フラグが立っていると `warning`→`info` へ tone 遷移を統一。`dataSourceTransition=server` 表示時には `reason`/`from`/`to` を `aria-live=polite` で通知し、監査ログ（`action/patientId/queueStatus/tone/ariaLive/runId`）へも連携しています。
3. Patients タブではヘッダーと行単位の missingMaster バナーを揃え、`dataSourceTransition=server` 時の口頭説明・`cacheHit` green label などを `auth-service` tone フラグで切り替え。`missingMaster` 時は `aria-live=assertive` で 1 回だけ読み上げ、復帰時は `aria-live=polite` で「マスタ取得済み」へ移行する UX を導入しました。

## 2. 観測・ステージ手順
- Stage/Preview は `VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources` で起動し、DocumentTimeline 上で ORCA Queue を操作して `missingMaster` → `dataSourceTransition=server` の変化を再現。`cacheHit=false` → `cacheHit=true` の遷移で Patients/OrderConsole のトーンが `Warning`→`Info` に切り替わることを確認しました。
- ORCA から `cacheHit`/`missingMaster`/`dataSourceTransition` を受信したタイミングを `artifacts/webclient/ux-notes/20251212T090000Z-orca-flags.md` に記録。tone 遷移（警告→復旧）、監査 meta、`auth-service` flag の状態、捕捉したスクリーンショットのパスも併記して観察ログとして保存しました。

## 3. ドキュメント・ログ連携
- `docs/web-client/ux/ux-documentation-plan.md` に RUN_ID=`20251212T090000Z` セクションを追加し、今回の tone 実装と `artifacts/webclient/ux-notes/20251212T090000Z-orca-flags.md` のスクリーンショット/ログ参照先を記載しました。
- `docs/server-modernization/phase2/operations/logs/20251212T090000Z-charts-orca.md` には実装内容・観測結果・doc status 連携手順をまとめ、README/DOC_STATUS の RUN_ID を更新するエビデンスとしました。
- `docs/web-client/planning/phase2/DOC_STATUS.md` の Web クライアント UX 行に本 RUN_ID を追記し、`docs/web-client/ux/ux-documentation-plan.md`（新セクション）、artifact、ログへのリンクを追加して統一しました。

## 4. 次のステップ
1. `auth-service` フラグの有無による tone 切替が Stage/Playwright で期待通り動作するか Playwright case で補足検証し、`docs/web-client/ux/playwright-scenarios.md` へ `missingMaster` alert tone の観測ポイントを明記する予定です。
2. 書き出した artifact/ステージログを `docs/server-modernization/phase2/operations/logs/` の別ファイルで定期的にアーカイブするとともに、次段階の `ChartsPage` 実装で同じ tone ルールを維持できているかレビューを続けます。
