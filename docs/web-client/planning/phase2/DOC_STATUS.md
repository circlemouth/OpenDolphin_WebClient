# RUN_ID=`20251130T120000Z`。Web クライアントはログイン画面のみの構成に再編済みのため、関連ドキュメントは最小のハブ＋計画のセットのみを保持します。Phase2 のガバナンスチェーン（`AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → 各 manager checklist）と同一 RUN_ID/証跡を共有し、必要な証跡は `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` に記録しています。

## Phase2 ガバナンス必読チェーン
> 1. `AGENTS.md`（全体ガバナンス）
> 2. `docs/web-client/README.md`（本ハブ）
> 3. `docs/server-modernization/phase2/INDEX.md`
> 4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`（Web クライアント担当）
> 5. 担当者からのワーカー指示／報告で RUN_ID と証跡を同期する（本対応では RUN_ID=`20251130T120000Z` を維持）。

## ステータス定義
- **Active**: 現行のログイン構成と直接関係があり、本対応 (RUN_ID=`20251130T120000Z`) の範囲内で更新されているもの。
- **Dormant/Archive**: 本対応以前の資料はすべて削除済み。

## トラッキング対象（2025-11-30 更新）
| ドキュメント | スコープ | ステータス | 最終レビュー | 備考 / 次アクション |
| --- | --- | --- | --- | --- |
| [`docs/web-client/README.md`](../README.md) | ログイン専用ハブ | Active | 2025-11-30 | RUN_ID=`20251130T120000Z`。AGENTS → README → Phase2 INDEX → マネージャーチェックリストのチェーンを再確認。ログイン以外のドキュメントはすべて削除済み。 |
| [`docs/web-client/planning/phase2/DOC_STATUS.md`](../planning/phase2/DOC_STATUS.md) | ドキュメント棚卸し | Active | 2025-11-30 | 本ファイル。RUN_ID=`20251130T120000Z` を維持し、更新の度に README へリンク。 |
| [`docs/web-client/planning/phase2/LOGIN_REWORK_PLAN.md`](../planning/phase2/LOGIN_REWORK_PLAN.md) | 実装計画 | Active | 2025-11-30 | ログイン再構成のバックグラウンドと今後の管理方針を記述。RUN_ID=`20251130T120000Z`、証跡は下記ログ参照。 |
| [`docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md`](../planning/phase2/LEGACY_ARCHIVE_SUMMARY.md) | Legacy アーカイブ | Active | 2025-11-30 | RUN_ID=`20251130T120000Z` で削除した旧資料の一覧と復活手順を整理。README/DOC_STATUS/LOGIN_REWORK_PLAN との連結を維持。 |
| [`docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md`](../planning/phase2/screens/RECEPTION_SCREEN_PLAN.md) | 受付状況処理画面 設計ドラフト | Active | 2025-11-30 | 空枠テンプレート。ログイン後の受付画面実装方針を記述予定。RUN_ID=`20251130T120000Z`。 |
| [`docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md`](../planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md) | カルテ記入画面 設計ドラフト | Active | 2025-11-30 | 空枠テンプレート。カルテ入力・スタンプ・シェーマを統合する画面の計画。RUN_ID=`20251130T120000Z`。 |
| [`docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md`](../planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md) | カルテ全般管理画面 設計ドラフト | Active | 2025-11-30 | 空枠テンプレート。カルテ管理・監査・エクスポート等の方針を記述予定。RUN_ID=`20251130T120000Z`。 |
| [`docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md`](../planning/phase2/logs/20251130T120000Z-login-rework.md) | 証跡ログ | Active | 2025-11-30 | コマンド履歴・ビルド確認を記録。Phase2 ガバナンスに従い、README/DOC_STATUS/PLAN とのリンクを維持。 |
| [`docs/archive/2025Q4/web-client/legacy-archive.md`](../../archive/2025Q4/web-client/legacy-archive.md) | Legacy Archive | Archive | 2025-11-30 | 削除された documentation 一式と再開条件、RUN_ID=`20251130T120000Z` を記録。README でリンク。 |
