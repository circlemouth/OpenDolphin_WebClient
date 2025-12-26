# ORCA_CERTIFICATION_ONLY（現行接続手順）

## 目的
- ORCA certification 環境への接続手順・認証情報の参照元を **このファイルに集約**する。
- 取得した証跡は RUN_ID で統一し、機微情報は `<MASKED>` で記録する。

## 接続先（唯一の許可先）
- ベース URL: `https://weborca.cloud.orcamo.jp:443`
- WebORCA トライアル／別環境への接続は禁止。

## 認証情報の取得元
**ORCAcertification 配下の情報のみを使用する。**  
以下のファイルから値を取得し、**平文はログに残さない**。

- `ORCAcertification/README_PASSPHRASE.md`（参照ガイド）
- `ORCAcertification/新規 テキスト ドキュメント.txt`（git 管理外・機微情報）
- `ORCAcertification/103867__JP_u00001294_client3948.p12`（PKCS#12）

## 環境変数（接続に必要な最小セット）
値の取得手順は `ORCAcertification/README_PASSPHRASE.md` を参照。  
**値は `<MASKED>` でログに記載し、平文は保存しない。**

- `ORCA_PROD_CERT`（PKCS#12 ファイルパス）
- `ORCA_PROD_CERT_PASS`（PKCS#12 パスフレーズ）
- `ORCA_PROD_BASIC_USER`（Basic ユーザー）
- `ORCA_PROD_BASIC_KEY`（Basic パスワード/API キー）

## 証跡・ログのルール
- RUN_ID は `YYYYMMDDThhmmssZ` を使用し、証跡とログを同一 ID で揃える。
- 取得物は `artifacts/orca-connectivity/<RUN_ID>/` 配下に保存する。
- 監査・手順ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に記録する。

## 禁止事項
- ORCAcertification 以外の接続情報を使用しない。
- 認証情報・証明書の平文保存や Git 追加を行わない。
- `<MASKED>` なしで証跡に認証値を残さない。

## 参照
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
- `ORCAcertification/README_PASSPHRASE.md`
