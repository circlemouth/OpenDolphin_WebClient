# Charts セッション/権限ガード整理ログ（RUN_ID=`20251213T000432Z`）

- 目的: Charts 本番外来での主要アクションを権限ガードし、セッション無効化時に runId/患者コンテキストを安全に破棄する運用要件を整理する。Topbar/ヘッダーに「誰が/いつ/どの runId」を表示する要件を固定する。
- 成果物: `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## 対象/インプット
- `docs/web-client/planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md`（Charts 権限制御/ナビ/Topbar 要件）
- `docs/web-client/ux/charts-claim-ui-policy.md`（権限別アクション、ARIA/トーンの方針）
- 現行実装: `web-client/src/features/charts/ChartsActionBar.tsx`, `PatientsTab.tsx`, `pages/ChartsPage.tsx`, `features/auth/AuthServiceProvider.tsx`

## 決定サマリ
1. 権限ガード: 診療終了/送信/患者編集/印刷を role 別に活性化。非活性は disabled のまま tooltip＋`aria-describedby` で理由表示し、`audit.logUiState(action=CHARTS_ACTION_DISABLED, reason, runId, facilityId, userId)` を送る。
2. セッション/施設/ユーザー不一致: `runId`・選択患者・ドラフト・予約/請求キャッシュを即破棄し、ブロッカーモーダル（`role=alertdialog`, `aria-live=assertive`）でログアウト誘導。`queryClient` の Charts key をクリアする。
3. 監査表示: Topbar に facility/user/role/runId/issuedAt を並列表示し、`runId` pill はコピー可＋異常時は赤バッジ。Charts ヘッダーにも runId と患者文脈を表示し、差異検知で警告を出す。

## 次の実装タスク指針
- `usePermissionGuard`（権限+セッション+missingMaster）を共通化し、理由テキストと `aria-describedby` ID を返す。
- `AuthServiceProvider` にセッション無効ハンドラを置き、401/419/施設不一致/ユーザー変更時に state 破棄→ログアウト誘導を行う。
- Topbar の `RunIdPill` に `issuedAt` と role/facility/user 情報を追加し、Charts ヘッダーで同値かどうかを監視する。
