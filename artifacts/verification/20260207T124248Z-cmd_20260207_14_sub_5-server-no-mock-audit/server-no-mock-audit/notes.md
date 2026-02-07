# server-no-mock-audit (cmd_20260207_14_sub_5)

## Scope
- server-modernized major endpoints (ORCA integration, Karte, Images)
- Check for accidental dummy/fixed/seed responses mixing into normal API
- Normalize error classification so front-end can display consistently
- Do not resurrect CLAIM endpoints

## Findings (static scan)
- ダミー/モック混入リスク（主要）:
  - `/resources/api/orca/queue`:
    - `x-use-mock-orca-queue` ヘッダ or AdminConfig の `useMockOrcaQueue` により、通常呼び出しでも `source=mock` を返し得た（混入リスク）。
    - 対策: `OPENDOLPHIN_ALLOW_MOCK_ORCA_QUEUE=1` を明示した場合のみ mock を許可するように変更（デフォルトは常に live）。
  - `OrcaAdditionalApiResource`:
    - `x-use-mock-orca-queue` ヘッダが ORCA transport の stub 切替に流用されており、意図せぬ stub 応答を返し得た（混入リスク）。
    - 対策: `OPENDOLPHIN_ALLOW_STUB_ORCA_TRANSPORT=1` を明示した場合のみ stub を許可するように変更（デフォルトは常に stub 無効）。
- 参考（混入ではなく明示的/legacy）:
  - `PatientModV2OutpatientResource` は `/mock` を持つが、`StubEndpointExposureFilter` により環境でブロック可能（本タスクでは仕様変更なし）。
  - `OrcaMasterResource` には snapshot/msw-fixture 読み込みの仕組みがあるが、現状コード上 `loadEntries()` が未使用のため通常経路では混入しない（ただし将来有効化時は gate 追加を推奨）。
  - `NLabServiceBean#getConstrainedPatients` は未登録患者を `fullName=\"未登録\"` のダミーで返す（legacy系。web-client主要経路ではない想定）。

## Findings (curl)
- `curl.summary.txt` 参照（抜粋）:
  - `08_queue_ok_with_orca_basic_headers 200` / body: `source=live`（mock header無し）
  - `09_queue_mock_header_but_disabled 200` / body: `source=live` + header `x-orca-queue-mode: live`（`x-use-mock-orca-queue: 1` を付けても mock にならない）
  - `04_orca_master_validation_422 422`（ORCA master validation）
  - `05_orca_master_ok 200`（ORCA master ok）
  - `01_queue_default 401` など未認証系も JSON body が正規化され `errorCode`/`errorCategory`/`details` を含む

## Changes
- mock/stub混入防止:
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaQueueResource.java`
    - `OPENDOLPHIN_ALLOW_MOCK_ORCA_QUEUE` が truthy の場合のみ mock 有効（デフォルト live）
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaAdditionalApiResource.java`
    - `OPENDOLPHIN_ALLOW_STUB_ORCA_TRANSPORT` が truthy の場合のみ stub transport 有効（デフォルト無効）
- エラー分類の正規化（フロントが一貫表示できるための最小追加・互換維持）:
  - `server-modernized/src/main/java/open/dolphin/rest/AbstractResource.java`
    - error body に `errorCode`（=error）/ `errorCategory`（status由来）/ `details`（Map）を追加
    - 既存の top-level flatten も維持（ただし core field を上書きしない）
    - 既存で `details` キーを渡している呼び出しは `details` object にマージして二重ネストを回避
  - `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterErrorResponse.java`
    - ORCA master の独自エラーにも `error`/`errorCode`/`status`/`path`/`traceId`/`errorCategory` を追加（additive）
  - `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
    - 上記フィールドを error response にセット

## Compatibility
- 既存フィールド（`error`, `code`, `message`, `status`, `validationError` 等）は維持し、追加フィールドのみで正規化。
- `/api/orca/queue` の mock 応答は `OPENDOLPHIN_ALLOW_MOCK_ORCA_QUEUE=1` を設定しない限り返さない（意図せぬ混入防止）。
- CLAIM系の endpoint/応答追加は行っていない。
