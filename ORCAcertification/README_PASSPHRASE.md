# ORCAcertification 資格情報メモ

このディレクトリには WebORCA 本番接続で使用するクライアント証明書と、同証明書に紐付く資格情報メモを平文で管理している。証明書ファイルおよびメモファイルは `.gitignore` で保持し、リポジトリには本 README のみをコミット対象とする。

## 1. ローカルに存在するファイル
| ファイル | 用途 | 備考 |
| --- | --- | --- |
| `103867__JP_u00001294_client3948.p12` | WebORCA クラウド本番向けクライアント証明書（PKCS#12） | Windows 配下でも扱えるよう平文で配置。取り扱い時は `chmod 600` を徹底する。 |
| `新規 テキスト ドキュメント.txt` | PKCS#12 パスフレーズ／接続 URL／443 番ポート／施設ログイン ID（`jimu6482`）／ORCAMO ID／API キーをまとめたメモ | 1 行目=Base URL、3 行目=port、5 行目=施設ログイン ID（※BASIC 認証ユーザー）、8 行目以降に `ORCAMO ID:`（契約 ID）と `APIキー:`、最終行に `PKCS#12パスフレーズ:` が並ぶ。値の更新はこのファイルのみを編集する。 |

> **開発端末での利用に限定**: クラウド本番との疎通検証に使う開発環境のみで参照し、商用/共有ストレージへはコピーしない。暗号化は不要だが、利用後は `unset ORCA_PROD_*` を必ず実行する。

## 2. 取得例（環境変数）
```bash
export ORCA_PROD_CERT=ORCAcertification/103867__JP_u00001294_client3948.p12
export ORCA_PROD_CERT_PASS="$(rg -o 'PKCS#12パスフレーズ:(.*)' -r '$1' ORCAcertification/'新規 テキスト ドキュメント.txt' | tr -d ' ')"
export ORCA_PROD_BASIC_USER="$(sed -n '5p' ORCAcertification/'新規 テキスト ドキュメント.txt' | tr -d '\r\n')"   # jimu6482
export ORCA_PROD_BASIC_KEY="$(rg -o 'APIキー:(.*)' -r '$1' ORCAcertification/'新規 テキスト ドキュメント.txt' | tr -d ' ')"
```
- `rg` が使えない環境では `awk -F ':' '/APIキー/{print $2}'` 等でも可。
- CLI history への漏洩を避けるため `set +o history` を有効化してから export する。
- OpenSSL 3.x（macOS など）では RC2-40 がデフォルト無効化のため、PKCS#12 を展開するときは `-provider legacy -provider default` を付与する。

## 3. `curl --cert-type P12` の呼び出し
証跡採取時は Runbook 記載のコマンドに以下のように組み込む。
```bash
curl --cert-type P12 \
     --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
     -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
     -H 'Accept: application/json' \
     -H 'Content-Type: application/json; charset=Shift_JIS' \
     -X POST --data-binary '@/tmp/orca_request.json' \
     "https://weborca.cloud.orcamo.jp${API_PATH}"
```
- `--cert` には `ファイルパス:パスフレーズ` 形式を必ず指定する。
- 取得したレスポンスは `artifacts/orca-connectivity/<RUN_ID>/httpdump/<api>/` に保存し、ドキュメント更新時は本 README へ追記不要。

## 4. コミット方針と注意事項
- `README_PASSPHRASE.md` のみをコミット対象とし、PKCS#12 やテキストメモは Git に追加しない。
- 端末移行時はこの README を参照して証明書/メモを再配置し、ファイル名を変えない。
- 600 権限・平文管理は運用ルールで許可されている（開発環境限定）。秘密情報を別媒体へコピーした場合は台帳（`docs/web-client/planning/phase2/DOC_STATUS.md`）へ痕跡を残す。
