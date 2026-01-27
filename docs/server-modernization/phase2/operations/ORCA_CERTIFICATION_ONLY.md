# ORCA 接続標準（WebORCA Trial）

> ⚠️ **Legacy/Archive**: 現行の接続情報は `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` を参照すること。  
> 本ファイルは履歴保持のため残すが、具体値は `<MASKED>` に置き換える。

## 目的
- WebORCA Trial 環境への接続手順・認証情報の参照元を **このファイルに集約**する。
- 取得した証跡は RUN_ID で統一し、機微情報は `<MASKED>` で記録する。

## 接続先（標準）
- ベース URL: `<MASKED>`
- Trial 環境への接続を **標準** とする（本番/証明書接続は必要になった時点で別途指示）。

## 認証方式
- **Basic 認証のみ**（証明書は不要）。
- Trial 接続の Basic 認証は以下で統一する（現行方針）。
  - Basic auth: `<MASKED>` / `<MASKED>`

## 通信方式（標準）
- **API のみ使用**（CLAIM は使用しない）。
- **POST + XML（UTF-8）** を標準とする。
- `system01dailyv2` は `?class=00` を付けない（公式仕様に準拠）。
- `Accept: application/xml` / `Content-Type: application/xml; charset=UTF-8` を統一する。

## Trial 初期データ（参照）
- 初期データの一次情報は `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` に保存されている（WebORCA Trial 公開ページのスナップショット）。
- 代表的な初期データ（抜粋）:
  - 医療機関情報: 医療機関コード `1234567` / 医療法人オルカクリニック / 院内処方 / 端数区分は「10円未満」系
  - 患者番号の桁数: 5
  - 職員情報: `doctor1` (内科) / `doctor3` (精神科) / `doctor5` (整形外科) / `doctor6` (外科) / `doctor10` (眼科) など
  - 患者初期データ: `00001`〜`00011`（事例 一〜十一）
- 実測ログ（Trial API で患者一覧を取得した記録）は `docs/server-modernization/phase2/operations/logs/` の RUN_ID を参照すること。

## 環境変数（接続に必要な最小セット）
- `ORCA_TRIAL_USER=<MASKED>`（Basic ユーザー）
- `ORCA_TRIAL_PASS=<MASKED>`（Basic パスワード）
- `ORCA_API_USER=<MASKED>` / `ORCA_API_PASSWORD=<MASKED>`（server-modernized の ORCA API 連携用）

## 証跡・ログのルール
- RUN_ID は `YYYYMMDDThhmmssZ` を使用し、証跡とログを同一 ID で揃える。
- 取得物は `artifacts/orca-connectivity/<RUN_ID>/` 配下に保存する。
- 監査・手順ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に記録する。
- **API 接続前提**のため、CLAIM 経由のログ/証跡は残さない。

## 禁止事項
- CLAIM 経由の接続・検証を行わない。
- `ORCAcertification/` 配下の証明書ファイルをリポジトリに置かない。

## 参照
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
