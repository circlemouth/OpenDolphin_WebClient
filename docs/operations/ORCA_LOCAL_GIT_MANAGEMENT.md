# ORCA証明書ファイルのローカル管理ガイド（廃止）

## 概要

ORCA 接続は **WebORCA Trial の Basic 認証 + XML(UTF-8) を標準**とする方針へ移行したため、
`ORCAcertification/` 配下の証明書ファイル運用は **廃止** した。

## 現行方針

- `ORCAcertification/` はリポジトリから削除済みで、再配置しない。
- 証明書が必要な例外運用はマネージャー承認を必須とし、**リポジトリ内での管理は行わない**。
- 接続先・認証方式は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を唯一の参照元とする。

## 旧手順の扱い

このドキュメントに記載されていたローカル Git 管理手順は **過去の運用** であり、
今後の作業では使用しない。必要な場合は承認フローの上で別途手順を定義する。
