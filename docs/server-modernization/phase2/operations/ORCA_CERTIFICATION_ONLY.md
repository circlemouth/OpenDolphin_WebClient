# ORCA 接続標準（WebORCA Trial）

## 目的
- WebORCA Trial 環境への接続手順・認証情報の参照元を **このファイルに集約**する。
- 取得した証跡は RUN_ID で統一し、機微情報は `<MASKED>` で記録する。

## 接続先（標準）
- ベース URL: `https://weborca-trial.orca.med.or.jp`
- Trial 環境への接続を **標準** とする（本番/証明書接続は必要になった時点で別途指示）。

## 認証方式
- **Basic 認証のみ**（証明書は不要）。
- 認証値は `<MASKED>` で記録し、平文はログに残さない。

## 通信方式（標準）
- **POST + XML（UTF-8）** を標準とする。
- `system01dailyv2` は `?class=00` を付けない（公式仕様に準拠）。
- `Accept: application/xml` / `Content-Type: application/xml; charset=UTF-8` を統一する。

## 環境変数（接続に必要な最小セット）
**値は `<MASKED>` でログに記載し、平文は保存しない。**

- `ORCA_TRIAL_USER`（Basic ユーザー）
- `ORCA_TRIAL_PASS`（Basic パスワード）

## 証跡・ログのルール
- RUN_ID は `YYYYMMDDThhmmssZ` を使用し、証跡とログを同一 ID で揃える。
- 取得物は `artifacts/orca-connectivity/<RUN_ID>/` 配下に保存する。
- 監査・手順ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に記録する。

## 禁止事項
- 認証情報の平文保存や Git 追加を行わない。
- `<MASKED>` なしで証跡に認証値を残さない。

## 参照
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
