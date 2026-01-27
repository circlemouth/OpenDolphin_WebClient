# 04 CLAIM設定テンプレDB整理

- RUN_ID: 20260127T033859Z
- 作業日: 2026-01-27
- 作業ディレクトリ: `.worktrees/task-1769485044966-09f1ed`
- 前提ドキュメント: `docs/server-modernization/orca-claim-deprecation/03_CLAIM設定と環境変数の整理.md`

## 目的
CLAIM 廃止方針に合わせて、`claim.*` 設定キー参照、CLAIM 前提テンプレ参照、`claimDate` 等の DB/フラグ依存を整理し、API-only 起動を阻害しない状態にする。

## 実施内容（設定/テンプレ/DB）
- `claim.*` 設定参照の撤去:
  - `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java`
  - `server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java`
  - `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
  - `server-modernized/src/main/java/open/dolphin/touch/EHTResource.java`
- CLAIM 前提テンプレ/手順の整理:
  - `ops/tests/api-smoke-test/api_inventory.yaml` から CLAIM エンドポイント記載を削除
  - `ops/tests/api-smoke-test/README.manual.md` の CLAIM/JMS 手順を廃止告知へ置換
  - `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の CLAIM 送信ケースを削除
  - `ops/tools/jms-probe.sh` を API-only 前提の廃止スタブへ差し替え
  - `ops/modernized-server/docker/Dockerfile` の `dolphin.claim` ロガー設定を削除
- `claimDate` / `sendClaim` 依存の整理:
  - `common/src/main/java/open/dolphin/infomodel/DocInfoModel.java` の `claimDate` を `@Transient` 化
  - `common/src/main/java/open/dolphin/infomodel/DocumentModel.java` の `claimClone()` から `claimDate` 引き継ぎを削除
  - `server-modernized/src/main/java/open/dolphin/*/converter/IDocInfo.java` から `sendClaim` / `claimDate` 連携を削除
  - `server-modernized/src/main/java/open/dolphin/*/converter/IDiagnosisSendWrapper.java` から `sendClaim` 連携を削除
  - `server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java` の `claimDate` 初期化を削除
  - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java` の `lastUpdated` を `confirmDate` 基準へ変更
  - `ops/tests/storage/attachment-mode/{run.sh,smoke_existing_stack.sh}` の `sendClaim` フィールドを削除
  - `ops/db/local-baseline/e2e_repro_seed.sql` から `claimdate` カラム投入を削除

## DBマイグレーション
- 追加:
  - `server-modernized/src/main/resources/db/migration/V0232__drop_document_claimdate.sql`
  - `server-modernized/tools/flyway/sql/V0232__drop_document_claimdate.sql`
- 内容:
  - `ALTER TABLE d_document DROP COLUMN IF EXISTS claimdate;`

## 削除記録（抜粋）
- 設定キー参照削除: `claim.jdbc.*` / `claim.user` / `claim.password` / `claim.conn` / `claim.host` / `claim.send.*`
- テンプレ/手順参照削除: CLAIM 送信/JMS 手順、CLAIM エンドポイント在庫
- DB依存整理: `claimDate` の永続化撤去（`@Transient` + Flyway drop）

## 証跡
- 設定キー参照の探索ログ:
  - `artifacts/claim-deprecation/20260127T033859Z/rg-claim-settings.txt`
- `claimDate` / `sendClaim` 参照の探索ログ:
  - `artifacts/claim-deprecation/20260127T033859Z/rg-claimdate-sendclaim.txt`

## 検証
- 実行コマンド: `mvn -pl server-modernized -am -DskipTests compile`
- 結果: BUILD SUCCESS
- ログ: `artifacts/claim-deprecation/20260127T033859Z/mvn-compile.txt`

## 影響メモ
- `V0224__document_module_tables.sql` には `claimDate` が残るが、`V0232__drop_document_claimdate.sql` で後段撤去される。
- 旧来の確定ビット（state=2/4）は互換のため `PVTServiceBean` / `ChartEventServiceBean` で "legacy finalized" として扱う。
