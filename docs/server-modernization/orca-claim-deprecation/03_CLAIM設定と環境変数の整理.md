# CLAIM設定と環境変数の整理（前提ドキュメント）

## 目的
- CLAIM 関連の設定/環境変数を撤去し、API-only 起動を保証する。

## 参照
- `docs/server-modernization/orca-claim-deprecation/02_CLAIM送受信コードの削除.md`

## 前提
- CLAIM 送受信コードは削除済みであること。

## 作業内容
- CLAIM 用の設定キー、環境変数、起動オプションの洗い出し。
- 既存設定の削除または無効化。
- 起動手順の API-only 化。

## 完了条件
- CLAIM 依存設定が無くなり、API-only で起動できる。

## 成果物
- 設定一覧と削除確認メモ

## 実施メモ（RUN_ID=20260105T105641Z）
- `ops/shared/docker/custom.properties` から `claim.*` を削除し、`orca.orcaapi.*` / `orca.id` / `orca.password` に統一。
- `setup-modernized-env.sh` の生成テンプレートを `orca.orcaapi.*` / `orca.id` / `orca.password` へ移行（`ORCA_API_*` を優先）。
- `setup-modernized-env.sh` の接続先参照を `ORCA_CERTIFICATION_ONLY.md` に統一し、Trial 標準の URL を読み込むよう更新。
- `server-modernized/src/main/java/open/orca/rest/OrcaResource.java` の `claim.host` フォールバックを削除し、API-only で接続先を確定。

## 実施メモ（RUN_ID=20260127T033859Z）
- `ORCAConnection` / `ServerInfoResource` / `adm20|touch EHTResource` の `claim.*` 秘匿ロジックを撤去し、`.jdbc.` / `password` / `token` / `secret` を汎用的に遮断する形へ置換。
- `DocInfoModel.claimDate` を `@Transient` 化し、`V0232__drop_document_claimdate.sql` を追加して DB カラムを撤去。
- `IDocInfo` / `IDiagnosisSendWrapper` から `sendClaim` / `claimDate` 連携を除去し、`JsonTouchResource` / `OrcaMedicalResource` の `claimDate` 参照を削除。
- CLAIM 送信/JMS 前提の ops テンプレ参照を整理し、`ops/tools/jms-probe.sh` を API-only 前提の廃止スタブへ差し替え。
- 削除確認ログ: `artifacts/claim-deprecation/20260127T033859Z/rg-claim-settings.txt` / `artifacts/claim-deprecation/20260127T033859Z/rg-claimdate-sendclaim.txt`
- 作業記録: `src/orca_preprod_issue_catalog_resolution_20260123/10_claim_deprecation/04_CLAIM設定テンプレDB整理.md`
