# ORCA 接続標準（WebORCA Trial）

## 目的
- WebORCA Trial 環境への接続手順・認証情報の参照元を **このファイルに集約**する。
- 取得した証跡は RUN_ID で統一し、機微情報は `<MASKED>` で記録する。

## 接続先（標準）
- ベース URL: `https://weborca-trial.orca.med.or.jp`
- Trial 環境への接続を **標準** とする（本番/証明書接続は必要になった時点で別途指示）。

## 認証方式
- **Basic 認証のみ**（証明書は不要）。
- Trial の公開認証情報（秘匿不要）:
  - ユーザー: `trial`
  - パスワード: `weborcatrial`

## 通信方式（標準）
- **API のみ使用**（CLAIM は使用しない）。
- **POST + XML（UTF-8）** を標準とする。
- `system01dailyv2` は `?class=00` を付けない（公式仕様に準拠）。
- `Accept: application/xml` / `Content-Type: application/xml; charset=UTF-8` を統一する。

## 環境変数（接続に必要な最小セット）
**Trial の公開認証情報はそのまま記載して良い。**

- `ORCA_TRIAL_USER=trial`（Basic ユーザー）
- `ORCA_TRIAL_PASS=weborcatrial`（Basic パスワード）
- `ORCA_API_USER=trial` / `ORCA_API_PASSWORD=weborcatrial`（server-modernized の ORCA API 連携用）

## 証跡・ログのルール
- RUN_ID は `YYYYMMDDThhmmssZ` を使用し、証跡とログを同一 ID で揃える。
- 取得物は `artifacts/orca-connectivity/<RUN_ID>/` 配下に保存する。
- 監査・手順ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に記録する。
- **API 接続前提**のため、CLAIM 経由のログ/証跡は残さない。

## 禁止事項
- CLAIM 経由の接続・検証を行わない。

## 参照
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
