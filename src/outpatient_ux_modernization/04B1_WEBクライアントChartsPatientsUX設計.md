# 04B1 WEBクライアントCharts/Patients UX設計

- **RUN_ID=20251204T093820Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`の参照チェーンに従い、`docs/web-client/ux/charts-claim-ui-policy.md`／`docs/web-client/ux/reception-schedule-ui-policy.md`／`docs/web-client/ux/patients-admin-ui-policy.md`と整合しながら DocumentTimeline／OrderConsole／Patients の missingMaster バナーと `dataSourceTransition=server` のトーンを統一します。
- 本設計を起点に `artifacts/webclient/ux-notes/20251204T093820Z-charts-design.md` で観測項目を整理し、`docs/server-modernization/phase2/operations/logs/20251204T093820Z-charts-design.md` にログを残しながら DOC_STATUS `Web クライアント UX/Features` 行に RUN_ID・ログ・artifact を追記します。

## 1. DocumentTimeline/OrderConsole/Patients のトーン・traceability
1. DocumentTimelinePanel は `docs/web-client/ux/charts-claim-ui-policy.md §10` に従い、ORCA 状態ごとの `tone`（Error=赤/Warning=琥珀/Info=青）と `aria-live`（Error/Warning=`assertive`、Info=`polite`）を `data-run-id` 付き `role=alert` で表示します。Reception 側 `Error/Warning=assertive`・`Info=polite` のルール（`docs/web-client/ux/reception-schedule-ui-policy.md §5`）をそのままコピーし、Charts と Patients の共有バナーにも `data-run-id` を carry over して最新版を Reception へ自動復帰させます。
2. OrderConsole の `FilterBadge`・`DataSourceBanner` は `missingMaster`/`fallbackUsed`/`dataSourceTransition` を `aria-live=polite` で更新し、`dataSourceTransition=server` に移行した瞬間は `Warning` トーンで色を変えて `dataSourceTransition.from→to/reason` を明記します。この情報を OrcaSummary に渡し、監査ログ（`action/patientId/queueStatus/tone/ariaLive/runId`）と `audit.logUiState`/`audit.logOrcaQuery` に meta を残して `Patients` のヘッダーや ORCA 設定画面でも同じテキスト・color/tone を再現させます。
3. Patients 画面では Reception から渡された患者ID・保険/自費モードの metadata を `DocumentTimeline` と共有し、`missingMaster`/`dataSourceTransition` バナーを右上のステータス領域＆患者リスト行のいずれにも設置します。`docs/web-client/ux/patients-admin-ui-policy.md` の戻り導線・権限トーンと合わせ、ORCA バナーが表示中は `data-run-id` を含めて `aria-live=assertive` で一度だけ読み上げ、帰還時に Reception の `role=alert` 部分が上書きされるよう調整します。

## 2. ORCA cacheHit/missingMaster フラグ受信タイミングと UI 要件
- ORCA からの `Queue` 追加／再送コマンドで DocumentTimeline が `OrcaQueue` ステータスを取得したタイミングで `cacheHit`/`missingMaster`/`dataSourceTransition` を読み出す。`missingMaster=true` なら `Warning`/`aria-live=assertive` のバナーを即時表示し、`cacheHit=false` で `dataSourceTransition` が `snapshot→server` へ移行することで `OrcaSummary` の `DataSourceBanner` に `server` トーンを点灯させる。ORCA が `cacheHit=true` を返す場合は `Info` トーンで document 中央の「マスタキャッシュを使用」ラベルを表示し、`OrcaSummary` と `Patients` 側の履歴にも `cacheHit` true を渡す。
- `missingMaster` と `cacheHit` の組み合わせが変化するたびに `OrderConsole` も `FilterBadge` を更新し、`dataSourceTransition=server` ルートへの移行・再取得の reason（`retry`/`fallback`/`snapshot`）を `audit.meta` に載せる。`Patients` ヘッダーの ORCA 状態もこの監査メタを使い、`dataSourceTransition`/`missingMaster`/`cacheHit` の 3 値を患者リスト行の tooltips で説明する。「マスタ欠落」時は `AriaLabel=missingMaster` で `assertive` で読み上げ、復旧したら `aria-live=polite` で「マスタ取得済み」へ切替える。

## 3. Stage/Preview 観測項目（`artifacts/webclient/ux-notes/20251204T093820Z-charts-design.md` に転記）
1. Stage/Preview を `VITE_DISABLE_MSW=1`＋`VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources` で起動し、DocumentTimeline で ORCA `Queue` を操作して `missingMaster=true` を出現させる。`dataSourceTransition` が `snapshot→server` へ移行した時点の赤/琥珀のバナーと `aria-live` を録り、ステージログに `data-run-id` や `cacheHit`/`missingMaster`/`fallbackUsed` の値を残す。
2. 同時に OrderConsole の `FilterBadge` と OrcaSummary の `DataSourceBanner` で `missingMaster`/`dataSourceTransition` 値を観察し、`data-run-id` が DocumentTimeline と一致して `aria-atomic=false` で二重読み上げを防いでいることを確認。`cacheHit` 真偽が変わるたびに Patients のヘッダーと列でトーン・バナーの色が合致することも記録する。
3. Patients 画面では `missingMaster` バナー（`Warning/aria-live=polite`）、`cacheHit` 緑ラベル、`dataSourceTransition=server` の理由（例: `retry after fallback`）を一貫して表示し、Reception に戻った際には同じ `data-run-id` で `Reception` 側バナーが上書きされることを確認。戻りルートの `filter/sort` 状態を保持する観測も含める。
4. ORCA 応答の JSON（`/resources/api/orca/master/*` など）を記録し、`cacheHit`/`missingMaster`/`dataSourceTransition` を `artifacts/webclient/ux-notes/20251204T093820Z-charts-design.md` のメモ欄に残す。`OrcaSummary` で `dataSourceTransition=server` に変わる際の `cacheHit`/`missingMaster` の組み合わせを当該 run で 3 回以上撮ること。
5. Stage log には `dataSourceTransition` の from/to/reason、`missingMaster` が出た時刻、`cacheHit` の最終値を記録し、`docs/server-modernization/phase2/operations/logs/20251204T093820Z-charts-design.md` で簡潔にまとめる。

## 4. 実装・検証への引き継ぎ
- artifact: `artifacts/webclient/ux-notes/20251204T093820Z-charts-design.md` に Stage 観測項目と UI 表示レベルのスクショ/ログパスを添える。
- ログ: `docs/server-modernization/phase2/operations/logs/20251204T093820Z-charts-design.md` に本設計のトレーサビリティ・Stage 観測結果・次ステップを記録し、DOC_STATUS `Web クライアント UX/Features` 行に RUN_ID=`20251204T093820Z` + 本ログ + artifact を追加する。
