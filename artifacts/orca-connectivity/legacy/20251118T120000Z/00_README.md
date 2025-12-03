# ORCA Connectivity Evidence Template

## RUN_ID / タイムスタンプ命名ルール
- Evidence ディレクトリは `RUN_ID=YYYYMMDDThhmmssZ`（UTC、例: `20251112T090000Z`）で作成する。
- 推奨手順:
  1. `export RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)`
  2. `mkdir -p artifacts/orca-connectivity/${RUN_ID}`
  3. `cp -R artifacts/orca-connectivity/TEMPLATE/ artifacts/orca-connectivity/${RUN_ID}`（初期ファイルをコピー）

## 各ファイルの役割
| ファイル | 目的 |
| --- | --- |
| `01_docker_ps.txt` | ORCA / DB / OpenDolphin サービスの稼働状態 (`docker ps --format ...`) を保存し、実行中コンテナの証跡を残す。 |
| `02_serverinfo_claim_conn.json` | `GET /openDolphin/resources/serverinfo/claim/conn` のレスポンス JSON。`claim.conn` / `claim.host` などの設定値を記録する。 |
| `03_api01rv2_patientgetv2_response.json` | `api01rv2 patientgetv2` の代表レスポンス（例: `/orca/api01rv2/patientgetv2`) を保存し、ORCA API 疎通証跡に使う。 |
| `config_diff.txt` | `git diff --no-index ops/shared/docker/custom.properties ops/modernized-server/docker/custom.properties` の結果。Legacy/Modernized の ORCA 設定差分を比較する。 |
| `audit_event.sql` | `d_audit_event` など ORCA 連携関連テーブルの確認クエリ／INSERT 文。問題切り分け時に再実行できる形で保存する。 |
| `00_README.md` | 本テンプレートの使い方と RUN_ID 命名ルールのメモ。更新時は DOC_STATUS への反映も忘れないこと。 |

## 命名検証 (`scripts/tools/orca-artifacts-namer.js`)
1. テンプレートをコピーした後、Evidence 一式を作成する前に `node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` を実行する。
2. 命名規則に違反するディレクトリがある場合は一覧が表示され、推奨名が提示される。修正後に再実行して終了コード 0 を確認する。
3. CI でも同スクリプトを利用するため、ローカルでエラーが出た場合は必ず手元で解決してから成果物をコミットする。

placeholder: curl output sample
