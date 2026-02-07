# Phase1 版管理UI（閲覧のみ）実装メモ
RUN_ID=20260206T153023Z-cmd_20260206_23_sub_5-charts-revision-history

目的:
- `VITE_CHARTS_REVISION_HISTORY=1` のとき、Charts SOAP 記載カードに「版履歴」Drawer（閲覧のみ）を表示。
- server API が未提供/失敗/HTML返却でも UI が落ちない（best-effort で表示）。

実装概要:
- 表示トリガ:
  - `web-client/src/features/charts/SoapNotePanel.tsx` に `VITE_CHARTS_REVISION_HISTORY` を追加。
  - 有効時、ヘッダに「版履歴」ボタンを追加し Drawer を開く。

- Drawer UI:
  - `web-client/src/features/charts/revisions/RevisionHistoryDrawer.tsx`
  - 表示内容（Phase1）:
    - revisionId / parentRevisionId
    - who/when/op（operation）
    - changed sections + char delta（best-effort diff）
    - Phase2/3 操作は disabled（誤操作防止）

- 版取得（server, best-effort）:
  - `web-client/src/features/charts/revisions/revisionHistoryApi.ts`
  - `GET /api/charts/revisions?...` を試行し、失敗/非JSONは握りつぶして `server unavailable` として表示。

- server API 未提供時のフォールバック:
  - SOAP履歴（ローカル）から revision を擬似生成:
    - `web-client/src/features/charts/revisions/soapRevisionHistory.ts`
    - `SoapEntry.authoredAt` 単位でグルーピング → `revisionId=soap:<authoredAt>`
    - 親子: 前回groupを parentRevisionId
    - diff: section別の文字数差分（char delta）

- CSS:
  - `web-client/src/features/charts/styles.ts` に `.revision-drawer*` を追加。

テスト:
- `web-client/src/features/charts/__tests__/soapRevisionHistory.test.ts`（グルーピング/parent/delta）
- `npm -C web-client test -- src/features/charts/__tests__/soapRevisionHistory.test.ts` PASS
- `npm -C web-client run -s typecheck` PASS

非実装（Phase2/3）:
- 改訂版追加/復元/競合解決は未実装。
- UI上は disabled ボタンのみ（Phase2/3フラグ追加時に差し替え想定）。
