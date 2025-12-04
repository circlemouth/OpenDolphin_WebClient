# 04A1 WEBクライアント受付UX設計とステークホルダー同期

- **RUN_ID=20251211T090000Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`の参照チェーンに従い、`docs/web-client/ux/reception-schedule-ui-policy.md` と Reception/OrderConsole 周りの UX を再整理する。
- 期間: 2025-12-11 09:00 - 2025-12-12 09:00 JST（優先度: high / 緊急度: medium）。
- YAML ID: `src/outpatient_ux_modernization/04A1_WEBクライアント受付UX設計とステークホルダー同期.md`。

## 1. 目的
1. Reception ヘッダー直下のバナー（Error=赤／Warning=琥珀／Info=青）と `tone=server` 表現を `docs/web-client/ux/reception-schedule-ui-policy.md` に従って OrderConsole の ORCA 送信結果へ carry over し、文言構造 `[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション]` と `role=alert` + `aria-live` を共有する。
2. `dataSourceTransition`／`resolveMasterSource(masterType)` が `tone=server` に直結する監査メタの流れを確認し、OrderConsole や `audit.logUiState` の `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を最新 RUN_ID で確実に流すためのコード/監査設計を整理する。
3. 上記を踏まえたスクリーンショット・コード参照を `artifacts/webclient/ux-notes/20251211T090000Z-reception-design.md` にまとめ、`docs/server-modernization/phase2/operations/logs/20251211T090000Z-reception-design.md` に詰めた要件・API 依存・次アクションを記録する。
4. `docs/web-client/ux/ux-documentation-plan.md` の reception セクション・`docs/web-client/planning/phase2/DOC_STATUS.md` `Web クライアント UX/Features` 行に RUN_ID/証跡を追記し、マネージャーチェックリスト/証跡共有のための準備を整える。

## 2. 証跡対応／共有
- artifact: `artifacts/webclient/ux-notes/20251211T090000Z-reception-design.md`（スクリーンショット候補・コード参照・監査メタメモ）。
- operations log: `docs/server-modernization/phase2/operations/logs/20251211T090000Z-reception-design.md`（要件整理・API依存・DOC_STATUS/run id 反映ステータス）。
- doc plan: reception セクションに `tone=server` + `dataSourceTransition` の補足を追記し、この RUN_ID を示す箇所を追加。
- DOC_STATUS: `Web クライアント UX/Features` 行に `RUN_ID=20251211T090000Z` と `log/artifact/doc` のリンクを追加。
