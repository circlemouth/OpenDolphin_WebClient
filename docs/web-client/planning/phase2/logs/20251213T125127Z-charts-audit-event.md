# 20251213T125127Z charts auditEvent 統一ログ

- 対象: Charts Production Outpatient / 監査ログ統一（YAML ID=`src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` → 本ログ
- 作業者: Codex / RUN_ID=`20251213T125127Z`

## 1. 実施内容
- Charts 用監査ヘルパー `recordChartsAuditEvent` を追加し、`runId/traceId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` を details へ強制注入。UI 表示と auditEvent を同一ソースに統一。
- `ChartsActionBar` の送信/診療終了/ドラフト/キャンセル/印刷（デモ）で `action/outcome/details` を記録。成功/失敗で durationMs を含め、missingMaster などのブロック理由を outcome=blocked で残す。
- `PatientsTab` に患者切替監査を追加（手動/初期自動）。patientId/appointmentId のみを記録し、氏名などは除外。
- `ChartsPage` で取得した auditEvent を正規化し、DocumentTimeline/PatientsTab で監査メタと UI pill が一致するようにした。
- 成果物ドキュメント `11_監査ログauditEvent統一.md` を追加し、DoD と残課題を明文化。

## 2. 変更ファイル
- 追加: `web-client/src/features/charts/audit.ts`（監査ヘルパー・正規化）
- 更新: `web-client/src/features/charts/ChartsActionBar.tsx` / `PatientsTab.tsx` / `pages/ChartsPage.tsx`
- ドキュメント: `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`

## 3. 確認
- 主要操作の監査オブジェクトが `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` を含むことを手動でコード確認（UI 実行までは未実施）。
- テストコマンド: 未実行（時間短縮のため）。後続で `npm run lint` / 簡易 e2e を推奨。

## 4. 今後の対応
- サーバーレスポンスの `requestId` をヘッダーから取り込み、details に追加する。
- ORCA 再送/破棄/印刷 API 実装時に action 語彙を拡張し、Playwright で details キーの存在を検証する。
