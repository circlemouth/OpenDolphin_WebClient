# server-modernized: append-only カルテ版管理（設計/実装案）

RUN_ID=20260206T151158Z-cmd_20260206_23_sub_1-server-versioning

## 0. 目的（cmd_20260206_23_sub_1）

server-modernized の「カルテ（DocumentModel）」を append-only で版管理できるようにする。

- 履歴（誰が/いつ/何を）を取得できる
- 任意版の取得ができる
- 差分（最低限: 変更量/変更セクション、可能なら before/after）を取得できる
- restore は「過去へ巻き戻す」ではなく **過去版を元に新revisionを追加**（上書き禁止）
- 過去版編集も **改訂版の新規追加**（上書き禁止）
- cmd_20260206_21 Do転記（過去記載の適用）は `sourceRevisionId` を監査へ残す

本メモは「設計 + Phase1（閲覧: 履歴 + 差分）までの実装方針」を主眼とする。

## 1. 現状確認（server-modernized の永続化/API）

### 1.1 永続化モデル（抜粋）

Document は `common/src/main/java/open/dolphin/infomodel/DocumentModel.java` で `d_document` に保存される。

- revision の親参照:
  - `KarteEntryBean.linkId` が **親エントリの PK** を保持
  - `DocumentModel.toPersist()` で `linkId = docInfo.parentPk` を永続化
  - すなわち `d_document.linkId` を `parentRevisionId` として再利用できる
- module:
  - `d_module.bean_json` が存在（`common/.../ModuleModel.java`）
  - 差分・ハッシュの基礎データとして利用しやすい

### 1.2 保存API（抜粋）

- `POST /karte/document` → `KarteServiceBean.addDocument(document)`
  - `docInfo.parentPk != 0` の場合、親を `status=M` / `ended=<confirmed>` にし、関連 module/schema/attachment も同様に `M` 化する
  - 「修正版 = 新規 Document 追加」という意味では、既に append-only の片鱗がある
- `PUT /karte/document` → `KarteServiceBean.updateDocument(document)`
  - 既存行を `merge` で更新する（= in-place update）
  - append-only 版管理の観点では **最も危険**（歴史が潰れる）
- ORCA order bundle 系など、ドキュメントを “更新” として `updateDocument` を使っている箇所がある
  - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaOrderBundleResource.java`（operation=`update`）

### 1.3 監査（Audit）

`d_audit_event.payload` は TEXT（JSON文字列）で柔軟。
`AuditEventPayload.details` は `Map<String,Object>` で、フィールド追加による破壊が起きにくい。

cmd_20260206_21 の要件（Do転記の sourceRevisionId 監査）を満たすには、サーバ側でも以下の共通キーを採用すると整合しやすい:

- `details.operationPhase`: `do` | `edit` | `restore`
- `details.sourceRevisionId`: Do/restore の転記元
- `details.baseRevisionId`: 改訂作業の開始元
- `details.createdRevisionId`: 追加された新revision

## 2. 用語/要件（本提案での定義）

- `revisionId`: immutable な版ID
  - Phase1 では **`d_document.id`（BIGINT）を revisionId とする**（最小変更）
- `parentRevisionId`: 親revision（改訂元）
  - Phase1 では **`d_document.linkId` を parentRevisionId とする**
- `rootRevisionId`: revision chain の根（`parentRevisionId=0` へ辿る）
  - `rootRevisionId` は API レベルで返す（DB列は Phase2+ で検討）
- `latestRevisionId`: その版グループの最新版

版グループ（revision group）のキーは Phase1 では以下を推奨:

- `rootRevisionId` をグループIDとして扱う（= 一意で、既存データから導出可能）

## 3. Append-only 版管理のデータモデル案

### 3.1 Phase1 推奨: 「既存スナップショット + meta テーブル」

本文は既存のスナップショット（`d_document` + `d_module` + `d_image` + `d_attachment`）で保持されている。
Phase1 では “差分格納” まで踏み込まず、メタ情報のみ新規テーブルへ持つ。

例: `d_document_revision_meta`（名称は案）

- `revision_id` (BIGINT, PK, FK -> d_document.id)
- `root_revision_id` (BIGINT, index)
- `parent_revision_id` (BIGINT, nullable)
- `karte_id` (BIGINT, index)
- `created_at` (TIMESTAMPTZ)  ※ `d_document.confirmed` でも代用可
- `created_by` (VARCHAR)  ※ `actorId`（例: facility:userId）
- `operation` (VARCHAR32): `create` | `revise` | `restore` | `do_copy`
- `base_revision_id` (BIGINT, nullable)  ※ 競合検知用
- `source_revision_id` (BIGINT, nullable) ※ cmd21 Do/restore
- `summary` (TEXT, nullable) ※ 変更要約（将来 UI 表示）
- `content_hash` (VARCHAR64/128) ※ 版内容のハッシュ（ETag/差分高速化）
- `diff_meta` (JSON/TEXT, nullable) ※ 「変更量/変更セクション」程度（Phase1）

補足:
- `content_hash` は “安定した canonicalize” が重要。Phase1 は「module 代表フィールド + beanJson の hash」程度で良い。
- `diff_meta` は `fromRevisionId/toRevisionId` の計算キャッシュ用途。Phase1 ではサーバ計算でも可。

### 3.2 Phase2+（案）: ハッシュ/ルートの永続化強化

- `d_document` へ `root_revision_id` / `revision_uuid` を追加する（検索/参照を高速化）
- あるいは `d_document_revision_meta` を “正” とし、DocumentModel は従来のままでもよい

### 3.3 Phase3+（案）: 差分格納（必要なら）

差分格納は設計/運用が難しい（可逆性・マージ・性能・監査整合）。
Phase3 以降に限定し、当面は “スナップショット + diff計算” を推奨。

## 4. API案（Phase1/2の最小）

### 4.1 履歴一覧（History）

UI が「最新版 revisionId」を持っている前提で、root を基点に履歴を返す:

1) `GET /karte/revisions?revisionId=<anyRevisionId>`
- server が root を探索し、`rootRevisionId` 配下の chain を返す
- 返却: `[{ revisionId, parentRevisionId, rootRevisionId, createdAt, createdBy, operation, summary, contentHash }]`

2) `GET /karte/revisions?rootRevisionId=<rootRevisionId>`
- 返却: 同上

補足:
- “karteId/encounterId” で引ける API は Phase2 以降（DBリンクが未整備のため）

### 4.2 版取得（Get revision）

`GET /karte/revision/{revisionId}`
- 返却: DocumentModel（既存 `GET /karte/documents/{ids}` を流用でも良い）
- 推奨: `ETag: <contentHash>` を付与

### 4.3 差分（Diff）

`GET /karte/revision/diff?from=<revA>&to=<revB>`

Phase1 の最小レスポンス例:

```json
{
  "from": 101,
  "to": 102,
  "summary": {
    "module": { "added": 2, "removed": 1, "changed": 3 },
    "attachment": { "added": 0, "removed": 0, "changed": 0 },
    "schema": { "added": 0, "removed": 0, "changed": 1 }
  },
  "changedEntities": ["treatmentOrder", "medOrder"],
  "notes": ["Phase1: module.beanJson hash compare (best-effort)"]
}
```

差分アルゴリズム（Phase1 推奨）:
- module を `entity + stampRole + stampNumber` で近似キー化
- キー一致の `beanJson` の hash を比較して changed 判定
- “正確なテキスト diff” は Phase2+（必要になったら）

### 4.4 restore（新revision追加）

`POST /karte/revision/{revisionId}/restore`

- `revisionId` を source にして、新revisionを作る（=上書き禁止）
- 監査:
  - `details.operationPhase='restore'`
  - `details.sourceRevisionId=<revisionId>`
  - `details.createdRevisionId=<newRevisionId>`

### 4.5 過去版編集（改訂版追加）

UI は「過去版を編集可能だが保存は新revision」。
サーバは以下の “競合検知” を提供する。

`POST /karte/revision`

payload 例（概念）:

```json
{
  "operation": "revise",
  "baseRevisionId": 101,
  "document": { "...": "DocumentModel snapshot" }
}
```

- server は `baseRevisionId` の “最新版一致” を検証
  - 一致しない場合は 409 conflict（UIはガイドして別改訂として保存するか選択）
- Do転記（cmd21）と整合する場合:
  - `operation='do_copy'` のとき `sourceRevisionId` 必須

## 5. 排他/競合（最低限案）

### 5.1 If-Match（ETag） + baseRevisionId

Phase1/2 の最小:
- 読み出し: `ETag=<contentHash>`
- 保存: `If-Match=<baseContentHash>` または `baseRevisionId` のいずれか必須
- server で `baseRevisionId == latestRevisionId` を原則とし、違反は 409

### 5.2 “競合時の方針”

禁止して止めるより “安全に並存” を優先:

- 409 のデフォルト: 保存を止め、UI が「最新版との差分」を提示して判断させる
- 運用上どうしても止めたくない場合の逃げ道:
  - `allowFork=1` で base 不一致でも “分岐改訂” として保存（監査に `forked=true` を残す）

## 6. 監査/ログ設計（cmd21 Do転記: sourceRevisionId必須）

### 6.1 監査イベント（例）

Action（例）:
- `KARTE_REVISION_CREATE`
- `KARTE_REVISION_REVISE`
- `KARTE_REVISION_RESTORE`
- `KARTE_REVISION_DO_COPY`（cmd21）

details（共通）:
- `operationPhase`: `edit` | `restore` | `do`
- `karteId`
- `patientId`（取れる場合）
- `revisionId` / `createdRevisionId`
- `parentRevisionId`
- `baseRevisionId`
- `sourceRevisionId`（Do/restore は必須）
- `contentHash`

### 6.2 Do転記（cmd21）の具体

Do転記の “適用（publish）” 時点で、サーバへ `sourceRevisionId` を送る。

- UI: Doプレビューで「転記元 revisionId」を可視化
- server: `operation='do_copy'` の保存 API では `sourceRevisionId` を必須バリデーション
- audit: `details.sourceRevisionId` を必ず格納

## 7. 実装方針（Phase1: 閲覧のみ）

### 7.1 追加する最小コンポーネント

- `KarteRevisionService`（新規）
  - root 探索（`parentRevisionId` を辿る）
  - 履歴取得（root 配下を `started/confirmed` で並べる）
  - diff 計算（beanJson hash compare）
  - contentHash 計算（Document+Modules の canonical hash）
- `KarteRevisionResource`（新規 REST）
  - `GET /karte/revisions`
  - `GET /karte/revision/{revisionId}`
  - `GET /karte/revision/diff`

### 7.2 影響範囲（Phase1）

- 既存の保存API（`POST/PUT /karte/document`）は触らない（Phase2 で append-only 強制へ）
- ただし “履歴/差分” のために DB から module.beanJson を取得する導線は必要

## 8. 実装方針（Phase2: append-only の強制）

### 8.1 updateDocument の取り扱い

方針案:
- `PUT /karte/document` を “draft専用” に限定
  - `status='T'`（暫定）以外の更新は 405/409 で拒否
- final（`status='F'`）の更新は必ず `POST /karte/revision`（=新revision追加）へ寄せる

### 8.2 既存エンドポイントの段階移行

- `OrcaOrderBundleResource` の operation=`update` は “改訂” に置換
  - 既存 doc を親 (`parentRevisionId=documentId`) として新 doc を add
  - audit に `baseRevisionId` / `createdRevisionId` / `sourceRevisionId`（Doの場合）を残す

## 9. 既知のリスク/未決事項

- revision group のキー:
  - Phase1 は `rootRevisionId` でよいが、`karteId + encounter` で引ける導線（UI要件）を満たすには DBリンクが必要
- module 差分の精度:
  - `entity + stampRole + stampNumber` は近似。将来 “stable module key” が必要になる可能性
- attachment/schema の差分:
  - bytes を含めず digest/metadata で比較する（機微/サイズ問題）

