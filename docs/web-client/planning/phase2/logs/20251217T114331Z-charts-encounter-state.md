# RUN_ID=20251217T114331Z / Charts 診療開始・終了状態遷移の整理

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`。
- 対象: Charts 本番外来の「診療開始→診療終了（完了/中止）」状態遷移を UI（Timeline/StatusBadge/ToneBanner）と監査で整合させ、終了ガード条件を明文化。

## 決めたことサマリ
1. 状態を OPEN / DIRTY(flag) / QUEUE_PENDING(flag) / CLOSING / CLOSED / ABORTED の 5+2 に統一し、ActionBar・Timeline・監査が同一メタから描画する。`DIRTY` と `QUEUE_PENDING` は終了禁止フラグとして扱う。
2. 終了ボタンのブロック理由を固定: missingMaster/fallbackUsed, 未保存ドラフト, ORCA送信待ち, セッション・コンテキスト欠損。ブロック時はリクエストを送らず `outcome=blocked` を audit へ記録し、ToneBanner で理由を assertive 表示。
3. 終了処理はサーバー応答がソースオブトゥルース。`CLOSING`→`CLOSED/ABORTED` は確定レスポンスまたは再取得で確認できたときのみ遷移し、通信断/timeout では OPEN に巻き戻して再取得 CTA を出す。`closeRequestId`（runId 由来）で idempotency を担保。
4. UI 同期: ヘッダーピルに `encounterState` を追加、DocumentTimeline に `ENCOUNTER_STATE` 行を新設、ActionBar disable 理由と ToneBanner 文言を同一データで生成。aria-live は ToneBanner 優先、Pill は off。
5. 復元戦略: `fetchOrcaOutpatientSummary` 再取得で `encounterState` とキュー状態を復元、React Query に `closeRequestId` を保持。ロールバック時は Timeline に `rollback` 行を追加し、成功後に上書き。

## 変更ファイル
- `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md` — 状態モデル・遷移・UI/A11y・復元方針を新規作成。

## 未実施
- コード実装・Playwright フィクスチャ追加は未着手。ActionBar/Timeline/Audit への反映は次タスクで実装。

## 同期
- README/DOC_STATUS へ RUN_ID とドキュメントリンクを追加予定。
