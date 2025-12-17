# RUN_ID=20251217T212600Z / Charts ドラフト保存と復元 設計メモ

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`
- 対象: Charts 本番外来のドラフト保存/復元（所見・メモ・チェック項目・処方/オーダー入力）

## 決定事項サマリ
1. ドラフトキーを `charts:draft:<facilityId>:<userId>:<runId>:<patientId>:<receptionId>:<encounterDate>` で固定し、キー不一致は自動復元しない。missingMaster/fallbackUsed=true でも復元しない。
2. 保存媒体は localStorage を一次、React Query キャッシュを二次。payload は `{version, updatedAt, contentHash, content, dataSourceTransition, missingMaster, fallbackUsed, dirty:true}`。
3. 監査 action を `DRAFT_SAVE|DRAFT_RESTORE|DRAFT_DISCARD` で統一し、details に `draftKey/contentHash/source/outcome/reason` を必須とする。autosave でも outcome を記録。
4. UI: autosave 30s（エラー時 60s/120s バックオフ）、Ctrl/Cmd+S 手動保存、初回ロード時の復元モーダル、保存成功トースト 3 秒、復元後は DIRTY=true で明示保存を促す ToneBanner。
5. 失敗時: quota/blocked/invalid_schema は破棄＋ToneBanner warning、audit outcome=error。セッション無効/runId変化で即破棄し、10章ガード経路へ委譲。

## 次アクション
- `web-client/src/features/charts/draft/useDraftStore.ts` 実装（draftKey生成・autosave・復元判定・audit送信・telemetry）
- ChartsActionBar に下書き保存ボタン＋Ctrl/Cmd+S、disable 理由の tooltip/audit
- fetch 層へ `documentRevision` を返すメタを追加し、復元コンフリクト判定に利用
- Playwright/MSW で quota error / scope mismatch / restore success の 3 ケースを追加

## 関連ドキュメント
- 成果物: `src/charts_production_outpatient/workflow/32_ドラフト保存と復元.md`
- 参照: `11_監査ログauditEvent統一.md`, `12_エラーハンドリングとリトライ規約.md`, `13_データ取得レイヤの統一_fetchWithResolver.md`, `31_診療開始終了の状態遷移.md`
