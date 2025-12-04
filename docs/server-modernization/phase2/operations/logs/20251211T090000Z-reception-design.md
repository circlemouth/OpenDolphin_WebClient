# RUN_ID=20251211T090000Z Reception UX 設計とステークホルダー同期（04A1準備）

- 期間: 2025-12-11 09:00 - 2025-12-12 09:00 JST（優先度: high / 緊急度: medium）。CodexCLI1 `04A1` タスクでは Reception/OrderConsole を `tone=server` バナー・`aria-live` 共通ルール・`dataSourceTransition` 監査メタでつなぎ、ステークホルダー向けレビュー資料と実装手引きを同時に整備する。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/ux/ux-documentation-plan.md` → `docs/web-client/ux/reception-schedule-ui-policy.md` → `artifacts/webclient/ux-notes/20251211T090000Z-reception-design.md`。

## 1. 要件詰め
- Reception バナーは `docs/web-client/ux/reception-schedule-ui-policy.md §5` の Error=赤／Warning=琥珀／Info=青、`role=alert` + `aria-live`、`[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション]` の文言構造を OrderConsole の ORCA 送信結果にそのまま持ち込み、チャプター間で `tone=server` だけが `aria-live=assertive` になるように調整する。
- OrderConsole の `FilterBadge`/`DataSourceBanner` では `missingMaster`/`fallbackUsed`/`dataSourceTransition` の変化が `aria-live=polite` で、`tone=server` は `dataSourceTransition=server` かつ `missingMaster=false` になる条件で Warning/赤に切り替わる。Playwright/Stage の `data-run-id` を用いて Reception 復帰時に carry over する処理も確認する。
- `resolveMasterSource(masterType)`（`src/LEGACY:webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`）の MSW→snapshot→server→fallback フローを OrderConsole 側にも複写し、`dataSourceTransition` と `tone=server` が同時に発火する `AuditEvent` を `audit.logUiState` に記録する。`Web=server` への遷移で `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を `OrderConsole` の `logOrcaQuery`/`AuditSummary` に添付する。

## 2. API・監査依存
- Reception: 受付一覧/予約/ステータス変更 API（GET/POST/PUT/DELETE）を使い `queueStatus` `patientId` `facilityId` `tone` `runId` を返却。OrderConsole へは同じ JSON を `AuditEvent` に押し込み `audit.logUiState` で `bannerVisible` を同期する。
- Patients/Insurance 連携: Reception 右パネルが表示する基本情報/保険リストを OrderConsole へ引き継ぎ、ORCA 送信時に `patientId`/`insuranceMode`/`selfPayFlag` を `audit.logOrcaQuery` に書き込む。
- ORCA 連携: `logOrcaQuery`/`send`/`resend` のエンドポイントで `tone=server` のエラーコード、`dataSourceTransition`（server⇄snapshot⇄fallback）を送信。`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` で定義された外来エンドポイントを参照しつつ、`dataSourceTransition` の from/to/reason をログに添える。
- `docs/web-client/architecture/web-client-api-mapping.md` の `resolveMasterSource` 図を UX 側でも再利用し、`dataSourceTransition=server` の瞬間に `tone=server`（警告/再送）＋ `audit.logUiState` の metadata が出てくることを本文で説明する。

## 3. 証跡整備
- artifacts: `artifacts/webclient/ux-notes/20251211T090000Z-reception-design.md` にスクリーンショット候補（Reception header + OrderConsole tone=server バナー）、コード/図の参照、監査 metadata の取り扱いメモ等をまとめる。
- operations log: 本ファイルに要件・API 依存・監査メタ設計・Stage/Playwright 観察の結果を記録し、manager checklist で RUN_ID を共有する。
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` の `Web クライアント UX/Features` 行に RUN_ID=`20251211T090000Z` のログ・artifact・doc を追記し、`docs/web-client/ux/ux-documentation-plan.md` reception セクションでも本 RUN_ID を明記する。
- doc: `src/outpatient_ux_modernization/04A1_WEBクライアント受付UX設計とステークホルダー同期.md` で deliverable と参照チェーンを整理し、レビュー/検証に必要なリンクをまとめる。

## 4. 次のアクション
1. Stage/Preview で `tone=server` + `aria-live` + `dataSourceTransition=server` の連鎖を Playwright で再現し、スクリーンショット/ログを artifacts に保存。`data-run-id` の carry over を確認する。
2. `OrderConsole` の `AuditEvent` 送信時に `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を `audit.logUiState` へ確実に乗せる回帰ケースを `docs/web-client/ux/reception-schedule-ui-policy.md` に追記し、`OrderConsole` でも同じ tone/ARIA を採用する旨を明記。
3. `docs/server-modernization/phase2/operations/logs/20251211T090000Z-reception-design.md` に本 RUN_ID の証跡（スクリーンショットパス・ログ・次アクション）を追記し、`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` にも RUN_ID/証跡パスをリンクする。
