# Karte Revision API (Phase1)

server-modernized Phase1 の「append-only 版管理」閲覧系 API 追加。

## 目的

- encounter 単位でカルテ文書の revision 履歴を参照できるようにする
- 特定 revision のスナップショットを取得できるようにする
- 2 revision 間の差分を best-effort で要約できるようにする
- 監査ログ payload.details に `sourceRevisionId` / `baseRevisionId` / `createdRevisionId` を載せられる設計を確定する（cmd21 Do転記整合）

## Phase1 の encounter キー

Phase1 は `karteId + visitDate(YYYY-MM-DD)` を encounter の識別子として扱う。

- `visitDate`: `DocumentModel.started` がこの日付の範囲にある `DocumentModel` を対象にする
- `encounterId` は Phase1 の互換用エイリアスとして `visitDate` と同義で受け付ける（将来削除予定）

## エンドポイント

### 1) 履歴一覧

`GET /karte/revisions?karteId={karteId}&visitDate={YYYY-MM-DD}`

- Response: `KarteRevisionHistoryResponse`
  - `groups[]`: rootRevisionId（linkIdチェーンの根）単位で group 化
  - `items[]`: revision のリスト（confirmed 昇順）

### 2) 版取得（スナップショット）

`GET /karte/revisions/{revisionId}`

- Response: `DocumentModel`
- Phase1 のレスポンスは heavy bytes を返さない
  - `AttachmentModel.bytes = null`
  - `SchemaModel.jpegByte = null`

### 3) 差分（best-effort）

`GET /karte/revisions/diff?fromRevisionId={id}&toRevisionId={id}`

- Response: `KarteRevisionDiffResponse`
- module entity + schema/attachment の metadata digest による要約差分
  - full textual diff を保証しない（Phase1 の意図的制約）

## 監査ログ（payload.details）

各 API 呼び出しで `AuditTrailService` に記録する。payload.details は Map のため、以下の id フィールドを将来の write 系（append-only 作成）でも同様に格納可能。

- `sourceRevisionId`: Do転記などの source（原典）
- `baseRevisionId`: 差分/改訂の base
- `createdRevisionId`: 新規に作成された revision

Phase1 の閲覧系では以下のように埋める（例）:

- GET revision: `createdRevisionId = revisionId`
- diff: `baseRevisionId = fromRevisionId`, `createdRevisionId = toRevisionId`

