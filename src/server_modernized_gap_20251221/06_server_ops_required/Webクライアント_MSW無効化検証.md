# Web クライアント MSW 無効化検証

## 目的
- MSW を無効化して Charts/受付/ORCA の実 API を通す。
- Web/Server の同期ポイント（TraceId/監査）を確認（証跡は最終段階で取得）。

## 検証タスクの禁止事項
- 検証タスクは証跡・ログのみ（コード変更禁止）。
- 対象外: server-modernized / client / server の編集。
- 変更対象は artifacts/ と本ファイルのみ。
