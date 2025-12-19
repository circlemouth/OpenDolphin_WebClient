# ORCA-02 `/orca/stamp` date 追補回収ログ（RUN_ID=20251219T223000Z）

## 目的
- `/orca/stamp/{param}` の `date` 仕様をドキュメントとスモークテスト台帳へ統一反映する。

## 実施内容
- `docs/server-modernization/server-api-inventory.md` に `param=setCd,stampName[,date]` と `date` クエリ優先の仕様を追記。
- `ops/tests/api-smoke-test/api_inventory.yaml` の `OrcaResource#getStamp` notes/signature を `date` クエリ対応へ更新。

## 更新ファイル
- `docs/server-modernization/server-api-inventory.md`
- `ops/tests/api-smoke-test/api_inventory.yaml`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
- `docs/web-client/planning/phase2/DOC_STATUS.md`

## テスト
- 未実施（ドキュメント追補のみ）。

## 補足
- Docker/サーバー起動は行っていない。
