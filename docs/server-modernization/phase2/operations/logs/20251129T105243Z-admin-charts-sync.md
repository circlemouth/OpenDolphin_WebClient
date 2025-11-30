# RUN_ID=20251129T105243Z — Administration ↔ Charts UI 説明書

## 1. 背景と参照チェーン
- Phase2 指示（`AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各チェックリスト）に従い、Web クライアント領域で Administration と Charts の連携 UX を明確化。
- 必須参照ドキュメント: `docs/web-client/ux/improvementPlan.md`（「管理画面（Administration）の信頼性強化」〜「管理画面改善ステップ」）および `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md`（Chart⇔Admin フロー）。監査方針は `docs/server-modernization/phase2/operations/logs/20251116T170500Z-orca-ui-sync.md` をベースに確認。
- Web クライアント資産に限定した変更であることを明記（admin UI および Charts 右ペインの表示内容／リンク設計）。

## 2. 実施内容
1. `web-client/src/features/administration/constants/adminChartsSync.ts` で RUN_ID/ログ URL/管理画面パスを定義し、両管理画面に `AdminRunIdBanner` コンポーネントを配置。`data-run-id` 属性付きバナーが RUN_ID=20251129T105243Z を `StatusBadge`・ログボタン・説明文で表示することで、`audit.logAdministrativeAction` 送信時の証跡を即時参照可能にした。
2. `web-client/src/features/charts/pages/ChartsPage.tsx` の右ペインに `ChartsAdminShortcutCard` を挿入して `StatusBadge`+RUN_ID/`data-run-id` と、`SystemPreferences` への遷移ボタン・`#charts-status-deep-link` / `#admin-danger-operations` へのログリンクを提供。OrderConsole と同列で表示されるカードなので Charts 画面からワンクリックで Administration の証跡へ辿れる。
3. UX/ガバナンス資料群 (`docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md`, `docs/web-client/README.md`, `docs/web-client/planning/phase2/DOC_STATUS.md`) を更新し、RUN_ID=20251129T105243Z の admin↔Charts deep link を言及すると同時に `docs/server-modernization/phase2/operations/logs/20251129T105243Z-admin-charts-sync.md` へのリンクを明示した。

## 3. 証跡と追跡
- 実装コード: `web-client/src/features/administration/constants/adminChartsSync.ts`、`web-client/src/features/administration/components/AdminRunIdBanner.tsx`、`web-client/src/features/administration/pages/SystemPreferencesPage.tsx` / `UserAdministrationPage.tsx`、`web-client/src/features/charts/pages/ChartsPage.tsx`（OrderResultsColumn/ChartsAdminShortcutCard の追加）。
- ドキュメント: `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` §(admin-charts)、`docs/web-client/README.md` UX/LEGACY セクション、`docs/web-client/planning/phase2/DOC_STATUS.md` の RUN_ID 行にリンクを追記済み。
- 証跡ファイル: 本ファイル。ADMIN Danger 操作説明は `#admin-danger-operations` セクション、Charts 側ショートカットは `#charts-status-deep-link` セクションで補足。
- 監査方針: `docs/server-modernization/phase2/operations/logs/20251116T170500Z-orca-ui-sync.md` で採用した RUN_ID 表示とログ deep link のコントロールを継承。

## 4. 次の確認/実装アクション
- Implementation/UX チームレビューで SystemPreferences/UserAdministration の `AdminRunIdBanner` と Charts 右ペインの `ChartsAdminShortcutCard` を確認し、RUN_ID/ログ deep link の一貫性とアクセス性（`data-run-id` 属性、ボタンの遷移パス、Tooltip 表示）を担保すること。レビューでは `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` §admin-charts を合わせて参照し、証跡リンク（本 log + doc anchors）に齟齬がないかをチェックする。
- Playwright test を追加して、Charts 右ペインカードの表示と `SystemPreferences` へのショートカット、`docs/server-modernization/phase2/operations/logs/20251129T105243Z-admin-charts-sync.md#charts-status-deep-link` / `#admin-danger-operations` へのログリンクが `target=_blank` で開けることを担保するシナリオを検討する。また、AdminRunIdBanner の `data-run-id` 表示と log button をスクリーンショット付きで捕捉する stub/manager checklistを合わせて記録。

## admin-danger-operations
- `AdminRunIdBanner` で `data-run-id=20251129T105243Z` を付与し、StatusBadge 状態と「管理ログ」「Charts ログ」ボタンで `#admin-danger-operations` / `#charts-status-deep-link` への deep link を直接開けるようにした。Rails から `audit.logAdministrativeAction` への RUN_ID 送信時もこのカードを参照し、操作直後の証跡とスクリーンショットを張り合わせる。
- 2 段階確認（チェックボックス＋対象 ID 再入力）と Danger 操作中の RUN_ID 表示を必須化する運用は引き続き維持し、失敗・再実行時にもバナーで同じ RUN_ID とログボタンを再表示すること。

## charts-status-deep-link
- Charts 右ペインの `ChartsAdminShortcutCard` は `StatusBadge` を使って RUN_ID=20251129T105243Z を再掲し、`data-run-id` も付与されたカードとして `OrderResultsColumn` 内で常時表示される。カードの「管理画面を開く」ボタンとログリンクが `#charts-status-deep-link` / `#admin-danger-operations` への deep link を担保するので、カルテ側から直接証跡に戻れる。
- `StatusBadge` tooltip には RUN_ID/操作者/API route を含める設計を継続し、Charts の利用者が `audit.logAdministrativeAction` を追跡できる UX を維持する。
