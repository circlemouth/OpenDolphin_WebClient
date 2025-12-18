# 証跡ログ: Charts 外来受診コンテキスト確立（受付ID/診療日/患者）

- RUN_ID: `20251218T082404Z`
- 対象: Web クライアント（Charts / Reception）
- 目的: Reception→Charts の遷移で受付ID/診療日/患者の来院コンテキストを URL/タブ/復元で破綻させず、別患者混入を防ぐ。

---

## 変更概要
1. Reception→Charts の遷移を **URL クエリ（patientId/appointmentId/receptionId/visitDate）** ベースに変更。
2. Charts 側で **URL → sessionStorage（タブ単位）→ location.state** の順に復元し、URL を `replace` で正規化。
3. **未保存ドラフト/処理中（UI ロック）** のときは URL 由来の患者切替（戻る/進む）をブロックし、URL を現在のコンテキストに戻す（別患者混入防止）。
4. UI 表示:
   - DocumentTimeline の進捗表示を `受付→診療→会計` に統一
   - ActionBar に患者/受付ID/診療日/現在ステータスを常時表示

## 変更ファイル
- `web-client/src/features/charts/encounterContext.ts`
- `web-client/src/features/reception/pages/ReceptionPage.tsx`
- `web-client/src/features/charts/pages/ChartsPage.tsx`
- `web-client/src/features/charts/DocumentTimeline.tsx`
- `web-client/src/features/charts/PatientsTab.tsx`
- `src/charts_production_outpatient/workflow/30_外来受診コンテキスト確立.md`
- `docs/web-client/planning/phase2/DOC_STATUS.md`
- `docs/web-client/README.md`

## 動作確認（ローカル・最小）
- 受付リストの行ダブルクリックで `/charts?...` に遷移し、URL に `receptionId` / `visitDate` が含まれること。
- `/charts` をリロードしても同一患者/同一受付ID の選択が維持されること（URL から復元）。
- 新しいタブで同一 URL を開いても同一コンテキストになること。
- `draftDirty=true`（Patients のメモ編集）状態で戻る/進む操作をしても、URL 由来の患者切替がブロックされること。
- DocumentTimeline の進捗が `受付/診療/会計` の 3 ステップで表示されること。

## 実行コマンド（予定/実施）
- `cd web-client && npm ci --cache ../tmp/npm-cache --prefer-offline`
  - 背景: `~/.npm/_cacache` で `EACCES` が発生したため、リポジトリ配下のキャッシュに切替。
- `cd web-client && npm run typecheck`（pass）
- `cd web-client && npm test`（pass）

※ 本ログは「実装と同期」の証跡であり、Stage/Preview（`VITE_DISABLE_MSW=1`）の実 API 検証は別 RUN で実施する。
