# RUN_ID=`20251130T120000Z`。Web クライアントはログイン画面のみの構成に再編済みのため、関連ドキュメントは最小のハブ＋計画のセットのみを保持します。Phase2 のガバナンスチェーン（`AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → 各 manager checklist）と同一 RUN_ID/証跡を共有し、必要な証跡は `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` に記録しています。
RUN_ID=`20251202T090000Z` の screens 棚卸しを UX 草稿へ反映したため、下表に UX/Features 行と証跡ログ（`docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`）を追加しています。

## Phase2 ガバナンス必読チェーン
> 1. `AGENTS.md`（全体ガバナンス）
> 2. `docs/web-client/README.md`（本ハブ）
> 3. `docs/server-modernization/phase2/INDEX.md`
> 4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`（Web クライアント担当）
> 5. 担当者からのワーカー指示／報告で RUN_ID と証跡を同期する（本対応では RUN_ID=`20251130T120000Z` を維持）。

## ステータス定義
- **Active**: 現行のログイン構成と直接関係があり、本対応 (RUN_ID=`20251130T120000Z`) の範囲内で更新されているもの。
- **Dormant/Archive**: 本対応以前の資料はすべて削除済み。

## トラッキング対象（2025-12-03 更新）
| ドキュメント | スコープ | ステータス | 最終レビュー | 備考 / 次アクション |
| --- | --- | --- | --- | --- |
| [`docs/web-client/README.md`](../README.md) | ログイン専用ハブ | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/DOC_STATUS.md`](../planning/phase2/DOC_STATUS.md) | ドキュメント棚卸し | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/LOGIN_REWORK_PLAN.md`](../planning/phase2/LOGIN_REWORK_PLAN.md) | 実装計画 | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md`](../planning/phase2/LEGACY_ARCHIVE_SUMMARY.md) | Legacy アーカイブ | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md`](../planning/phase2/screens/RECEPTION_SCREEN_PLAN.md) | 受付状況処理画面 設計ドラフト | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md`](../planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md) | カルテ記入画面 設計ドラフト | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md`](../planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md) | カルテ全般管理画面 設計ドラフト | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md`](../planning/phase2/logs/20251130T120000Z-login-rework.md) | 証跡ログ | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`src/webclient_screens_plan/00_RUN_IDと参照チェーン整理.md`](../../../../src/webclient_screens_plan/00_RUN_IDと参照チェーン整理.md) | RUN_ID／参照チェーン整理メモ | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`src/webclient_screens_plan/01_phase2_screens 3 文書の棚卸.md`](../../../../src/webclient_screens_plan/01_phase2_screens 3 文書の棚卸.md) | 受付・カルテ・管理画面のユースケース/API整理と UX ドラフト連携リンク | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`src/webclient_screens_plan/02_画面別 API マッピングとバージョン整合.md`](../../../../src/webclient_screens_plan/02_画面別 API マッピングとバージョン整合.md) | 画面別 API マッピングと監査メタ整合 | Dormant/Archive | 2025-12-03 | Legacy参照専用／RUN_ID=`20251203T203000Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` |
| [`docs/web-client/ux/ux-documentation-plan.md`](../../ux/ux-documentation-plan.md) | Web クライアント UX/Features | Active | 2025-12-04 | RUN_ID=`20251203T222026Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T222026Z-run-id-chain.md` |
| [`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`](../../../server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md) | ORCA 接続ポリシー | Active | 2025-12-03 | RUN_ID=`20251203T134014Z`／証跡: `docs/server-modernization/phase2/operations/logs/20251203T134014Z-orcacertification-only.md` |
| [`docs/archive/2025Q4/web-client/legacy-archive.md`](../../archive/2025Q4/web-client/legacy-archive.md) | Legacy Archive | Archive | 2025-11-30 | 削除された documentation 一式と再開条件、RUN_ID=`20251130T120000Z` を記録。README でリンク。 |
