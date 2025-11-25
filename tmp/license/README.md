# tmp/license テンプレ利用ガイド

`license.properties` と `system_license_post_body.txt` の一時保管場所。Vault から取り出した値を検証やデプロイに使う際だけ作成し、リポジトリへは **決してコミットしない**。

## 1. 想定ファイル
| ファイル | 用途 | 作成元 |
| --- | --- | --- |
| `license.properties` | `license.key` と `license.secret` を WildFly へ配置する際の一時ファイル | Vault `kv/modernized-server/license/<env>` |
| `system_license_post_body.txt` | `POST /dolphin/license` の body（UID 文字列） | Vault `license.uid_seed` + RUN_ID サフィックス |

## 2. 取り扱いルール
- 平文ファイルを生成したら `chmod 600` とし、作業完了後 24 時間以内に `shred -u` で削除する。
- `git status -- tmp/license` に表示された場合は必ず `git restore --staged tmp/license/*` で除外し、コミット前に `rm` で消す。
- RUN_ID を含む UID を再利用する場合は `docs/server-modernization/phase2/notes/license-config-check.md` の記録と突合してから実行する。
- 詳細な運用手順は `docs/server-modernization/phase2/operations/SECURITY_SECRET_HANDLING.md` の「License Secrets」節を参照する。

## 3. 手順サマリ
1. `vault kv get -format=json kv/modernized-server/license/<env>` を実行し、`license.key` / `license.secret` / `license.uid_seed` を取得する。
2. 取得値を `license.properties` / `system_license_post_body.txt` に流し込み、`docker cp` または `OPS_SECRET_FETCH` 経由でサーバーへコピーする。
3. `ops/tests/api-smoke-test/configs/system_license_post.config` で `POST /dolphin/license` を実行し、`artifacts/parity-manual/license/<RUN_ID>/` へ証跡を保存する。
4. 作業完了後は本ディレクトリを空にし、空のテンプレのみ残す。
