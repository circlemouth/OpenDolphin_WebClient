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
- `server-modernized/src/main/java/open/orca/rest/OrcaResource.java` の `claim.host` フォールバックを削除し、API-only で接続先を確定。
