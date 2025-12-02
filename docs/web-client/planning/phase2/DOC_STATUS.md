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

## トラッキング対象（2025-12-11 更新）
| ドキュメント | スコープ | ステータス | 最終レビュー | 備考 / 次アクション |
| --- | --- | --- | --- | --- |
| [`docs/web-client/README.md`](../README.md) | ログイン専用ハブ | Active | 2025-11-30 | RUN_ID=`20251130T120000Z`。AGENTS → README → Phase2 INDEX → マネージャーチェックリストのチェーンを再確認。ログイン以外のドキュメントはすべて削除済み。 |
| [`docs/web-client/planning/phase2/DOC_STATUS.md`](../planning/phase2/DOC_STATUS.md) | ドキュメント棚卸し | Active | 2025-12-11 | 本ファイル。RUN_ID=`20251130T120000Z` を維持し、更新の度に README へリンク。A/B 反映を追記し、RUN_ID=`20251202T090000Z` の UX/証跡同期を確認。Playwright実行結果/モック分岐検証反映を短報で継続。Playwrightテスト追加/モック分岐強化/監査ログ正規化を反映。 |
| [`docs/web-client/planning/phase2/LOGIN_REWORK_PLAN.md`](../planning/phase2/LOGIN_REWORK_PLAN.md) | 実装計画 | Active | 2025-11-30 | ログイン再構成のバックグラウンドと今後の管理方針を記述。RUN_ID=`20251130T120000Z`、証跡は下記ログ参照。 |
| [`docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md`](../planning/phase2/LEGACY_ARCHIVE_SUMMARY.md) | Legacy アーカイブ | Active | 2025-11-30 | RUN_ID=`20251130T120000Z` で削除した旧資料の一覧と復活手順を整理。README/DOC_STATUS/LOGIN_REWORK_PLAN との連結を維持。 |
| [`docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md`](../planning/phase2/screens/RECEPTION_SCREEN_PLAN.md) | 受付状況処理画面 設計ドラフト | Active | 2025-11-30 | 空枠テンプレート。ログイン後の受付画面実装方針を記述予定。RUN_ID=`20251130T120000Z`。 |
| [`docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md`](../planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md) | カルテ記入画面 設計ドラフト | Active | 2025-11-30 | 空枠テンプレート。カルテ入力・スタンプ・シェーマを統合する画面の計画。RUN_ID=`20251130T120000Z`。 |
| [`docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md`](../planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md) | カルテ全般管理画面 設計ドラフト | Active | 2025-11-30 | 空枠テンプレート。カルテ管理・監査・エクスポート等の方針を記述予定。RUN_ID=`20251130T120000Z`。 |
| [`docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md`](../planning/phase2/logs/20251130T120000Z-login-rework.md) | 証跡ログ | Active | 2025-11-30 | コマンド履歴・ビルド確認を記録。Phase2 ガバナンスに従い、README/DOC_STATUS/PLAN とのリンクを維持。 |
| [`src/webclient_screens_plan/00_RUN_IDと参照チェーン整理.md`](../../../../src/webclient_screens_plan/00_RUN_IDと参照チェーン整理.md) | RUN_ID／参照チェーン整理メモ | Active | 2025-12-01 | RUN_ID=`20251201T053420Z`。AGENTS→README→INDEX→manager checklist のチェーン整備完了。証跡: `docs/server-modernization/phase2/operations/logs/20251201T053420Z-run-id-chain.md`。README/INDEX/manager checklist へ同日付で同期。 |
| [`src/webclient_screens_plan/01_phase2_screens 3 文書の棚卸.md`](../../../../src/webclient_screens_plan/01_phase2_screens 3 文書の棚卸.md) | 受付・カルテ・管理画面のユースケース/API整理と UX ドラフト連携リンク | Active | 2025-12-02 | RUN_ID=`20251202T090000Z`。証跡: `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`。README / manager checklist へ screens 棚卸開始とログリンクを同期。 |
| [`src/webclient_screens_plan/02_画面別 API マッピングとバージョン整合.md`](../../../../src/webclient_screens_plan/02_画面別 API マッピングとバージョン整合.md) | 画面別 API マッピングと監査メタ整合 | Active | 2025-12-02 | RUN_ID=`20251202T083708Z`。A/B反映済み・ハブ同期済み。orca05 hash/diff 再取得済み（証跡: `docs/server-modernization/phase2/operations/logs/20251202T083708Z-api-mapping.md`）。 |
| [`docs/web-client/ux/ux-documentation-plan.md`](../../ux/ux-documentation-plan.md) | Web クライアント UX/Features | Active | 2025-12-09 | RUN_ID=`20251202T090000Z`。棚卸しを Reception/Charts/Patients+Administration の UX 草稿（`ux/reception-schedule-ui-policy.md` / `ux/charts-claim-ui-policy.md` / `ux/patients-admin-ui-policy.md`）へ反映済み。UX草稿へ検証観点/未決事項を追記済み（RUN_ID=20251202T090000Z）。Playwrightシナリオ案/配信タイミング検証計画を追加（RUN_ID=20251202T090000Z）。Playwright実装準備メモ/配信観測計画詳細化を追記。Playwrightヘルパー試作案/フラグ設計メモを追加（RUN_ID=20251202T090000Z）。Playwrightヘルパー実装着手/フィクスチャ計画追記。Playwright設定フラグ/未実装ヘルパー実装完了。ヘッダー切替案・ヘルパー通し検証準備を追記。A/B: 管理配信検証計画・ORCA キュー/配信フラグ設計と Playwright シナリオ叩き台（`ux/admin-delivery-validation.md` / `ux/config-toggle-design.md` / `ux/playwright-scenarios.md`）を追加し、README/manager checklist/証跡ログに同期。ヘッダー付与検証/モックON/OFFチェックリスト追記。Patients→Reception 戻り導線・配信遅延警告/リトライ導線・モックON/OFFレスポンス差分/監査ログ項目を追記。Reception/Charts の ORCA エラー・未紐付・送信キュー遅延バナー tone/`aria-live`/carry over 方針とステータス遷移・ロール別可否・自動/手動更新の監査ログ出力を追記し、Playwright シナリオへモック ON/OFF と診療終了解除パスを追加。証跡: `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`。 |
| [`docs/archive/2025Q4/web-client/legacy-archive.md`](../../archive/2025Q4/web-client/legacy-archive.md) | Legacy Archive | Archive | 2025-11-30 | 削除された documentation 一式と再開条件、RUN_ID=`20251130T120000Z` を記録。README でリンク。 |
