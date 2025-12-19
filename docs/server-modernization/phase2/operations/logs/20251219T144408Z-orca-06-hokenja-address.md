# ORCA-06 保険者・住所マスタ実装ログ
- RUN_ID: 20251219T144408Z
- 対象: ORCA-06 `/orca/master/hokenja` `/orca/master/address`
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1766155101276-5b06c9
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → docs/managerdocs/PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md

## 実施内容
- ORCA-06 の hokenja/address を `OrcaMasterResource` に追加。
- `InsurerEntry`/`AddressEntry` 相当 DTO（`OrcaInsurerEntry`/`OrcaAddressEntry`）を追加。
- 404/503/空レスの差分を監査ログへ反映するため、`ORCA_MASTER_FETCH` 監査イベントを追加（httpStatus/emptyResult などを details に記録）。
- アドレス/保険者の MSW fixture 読み込みに対応し、スナップショットが不正フォーマットの場合は fallback するように調整。

## 追加・更新ファイル
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaInsurerEntry.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaAddressEntry.java`
- `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`

## テスト
- 実行していない（コード変更のみ）。

## 補足
- 住所の空レスポンスは 200 `{}`、未登録 zip は 404 を返却。
- 監査ログ details: `masterType`, `httpStatus`, `emptyResult`, `dataSource`, `snapshotVersion`, `version`, `queryPref/keyword/zip` を記録。
