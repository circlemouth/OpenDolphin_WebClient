# Charts: ORCA送信フロー（送信前チェック）ログ（RUN_ID=`20251217T233430Z`）

## 目的
- Charts の「ORCA 送信」操作について、**送信不可条件を UI で明確にブロック**し、開始→進行中→成功/失敗の状態を一貫表示する。
- 失敗時に「次にやること」を提示し、**証跡（runId / traceId / requestId）**を画面上で確認できるようにする。

## 変更サマリ
- `missingMaster=true` / `fallbackUsed=true` / 未保存ドラフト / 通信オフライン / 通信不安定（直近の取得エラー） / 権限不足（401/403 または認証情報未設定）などを **送信前チェックとして列挙しブロック**。
- 送信中はトーストで進行状態を表示し、**「送信を中断」**（Abort）を提供。
- 送信成功/失敗時はトーストに `runId` / `traceId` / `requestId` を併記し、失敗時は **次にやること（再ログイン/再取得/Receptionへ戻る など）**を文言で固定。

## 実装メモ
- 送信前チェック（UI ブロック表示）: `web-client/src/features/charts/ChartsActionBar.tsx`
  - `role="note"` のガード領域に「理由 + 次にやること」を **複数件**表示。
  - `aria-describedby` で送信ボタンからガードに紐付け（読み上げの一貫性を維持）。
- 未保存ドラフト検知:
  - `web-client/src/features/charts/PatientsTab.tsx` がメモ欄編集を契機に `draftDirty` を更新。
  - `web-client/src/features/charts/pages/ChartsPage.tsx` が `draftState` を保持し、ActionBar に `hasUnsavedDraft` として注入。
  - ActionBar の「ドラフト保存」成功時に `onDraftSaved` で dirty を解消（送信前ブロック解除）。
- 権限不足:
  - `web-client/src/libs/http/httpClient.ts` に `hasStoredAuth()` を追加し、ChartsPage で `hasPermission` を算出。
  - 送信 API が 401/403 の場合は `permissionDenied=true` をラッチして以降の送信をブロック。
- 通信不安定:
  - ChartsPage 側で直近の外来取得（claim/summary/appointments）のエラーを監視し、`networkDegradedReason` として ActionBar へ渡す。
  - ActionBar 側は `navigator.onLine` を監視し、offline を即ブロック。
- 送信 API:
  - 現段階は `GET /api/orca/queue?patientId=...&retry=1` を “再送/再試行” として呼び出し、成功後に `onAfterSend()` で claim/summary/appointments を同時再取得して状態反映を促す。
  - 実装差分を吸収するため、応答ボディは成功判定のみに利用し、詳細は claim 側再取得で確認する方針。

## 仕様ドキュメント
- 成果物: `src/charts_production_outpatient/workflow/33_ORCA送信フロー_送信前チェック.md`

## 変更ファイル
- `web-client/src/features/charts/ChartsActionBar.tsx`
- `web-client/src/features/charts/pages/ChartsPage.tsx`
- `web-client/src/features/charts/PatientsTab.tsx`
- `web-client/src/libs/http/httpClient.ts`

## 検証（ローカル）
- `npm --prefix web-client test -- src/features/charts/__tests__/chartsAccessibility.test.tsx`（PASS）
- `npm --prefix web-client run typecheck`（PASS）

