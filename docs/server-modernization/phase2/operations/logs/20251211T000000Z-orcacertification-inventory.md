# RUN_ID=20251211T000000Z ORCAcertification情報棚卸しログ
- 期間: 2025-12-11 09:00 - 2025-12-12 09:00 JST / 目的: 証明書・接続先・認証方式・RUN_ID 記録先の棚卸し (ドキュメント整理のみ、接続試験なし)。
- 参照: `src/orca_prod_bridge/planning/ORCAcertification情報棚卸し.md`

## 実施内容
- `ORCAcertification/README_PASSPHRASE.md` を確認し、`https://weborca.cloud.orcamo.jp` 向けに PKCS#12 (`103867__JP_u00001294_client3948.p12`) と Basic 認証を環境変数から読み込む手順が現存することを確認。
- 過去証跡として `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md` / `2025-11-19-phr-seq-phaseCDE.md` の `curl --cert-type P12` 利用記録を洗い出し。
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` が ORCA_CERTIFICATION_ONLY.md の Basic 認証手順への参照を要求している一方、当該ファイルと `20251203T134014Z-orcacertification-only.md` 証跡がリポジトリ上に存在しないことを確認。

## 機微情報の扱い
- ORCAcertification 配下の秘匿ファイルは git 管理外で `.gitignore` 済み。操作時のみ環境変数へ読み込み、ログには `<MASKED>` で記録する運用を再確認。
- 証跡保存先: `artifacts/orca-connectivity/<RUN_ID>/`（httpdump/trace/data-check 等）、Runbook ログ: `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md`。

## フォローアップ
- 欠損している `operations/ORCA_CERTIFICATION_ONLY.md` と `operations/logs/20251203T134014Z-orcacertification-only.md` の復旧または正式手順の提示が必要。
- PKCS#12 パスフレーズ/Basic 情報の最新ソースを ORCAcertification/ 配下で確認し、未記載の場合はセキュアストアへの格納を依頼する。
