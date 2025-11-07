# テストデータ棚卸し（2026-06-14 更新、担当: Worker D）

`ops/tests/` 配下の資材と関連ドキュメントを整理し、API スモークテスト／API パリティチェッカー／監査ログ検証に必要なデータセットと Python 実行制約時の代替手順を明文化する。

## 1. API スモークテスト（ops/tests/api-smoke-test）

| 資材 | 内容 / 用途 | 備考 |
| --- | --- | --- |
| `api_inventory.yaml` | REST エンドポイント 300+ 件のメタデータ。`resource` / `http_method` / `path_template` / `requires_body` を保持。 | `generate_config_skeleton.py` がこのファイルからケース雛形を生成。 |
| `test_config.sample.yaml` | 手動実行時のテンプレート。`defaults.headers` に Legacy 認証ヘッダーを定義。 | `docs/web-client/operations/TEST_SERVER_DEPLOY.md` セクション 0 の初期アカウント（施設 ID: `1.3.6.1.4.1.9414.72.103`, doctor1 など）を転記して使用。 |
| `test_config.ci.yaml` | GitHub Actions 用の最小ケース。`cases` に `/dolphin` / `/serverinfo/*` の疎通確認を定義。 | 認証値 (`userName`, `password`, `clientUUID`) は CI 専用。Ops が本番 API を検証する際は `clientUUID` を固有値に置換。 |
| `test_config.manual.csv` | Python 禁止時のチェックリスト。`id,method,path,headers_profile,payload_template,expectation` を列挙。 | 2026-06-15 追加。`headers/` `payloads/` とペアで使用し、`artifacts/...` の保存先や監査ログ要否を把握する。 |
| `docker-compose.yml` | `../base`（PostgreSQL）, `../legacy-server`, `../modernized-server` のサービスを合成。 | Compose で両サーバーを順に起動し、`run_smoke.py` で比較できる。 |
| `run_smoke.py` / `generate_config_skeleton.py` | Python 3.11 で動作。`requirements.txt`（httpx / PyYAML）を事前インストール。 | 本プロジェクトでは Python 実行には明示許可が必要。Ops 実行時は承認取得または代替手順を利用。 |
| `headers/*.headers` | `userName`/`password`/`facilityId` などのヘッダー束。`legacy-default` / `adm20-admin` など複数プロフィールを管理。 | `PARITY_HEADER_FILE` 環境変数で `ops/tools/send_parallel_request.sh` から読み込む。 |
| `payloads/` | ADM20/FIDO2 などボディが必要なケース用 JSON。 | `test_config.manual.csv` の `payload_template` と一致させる。 |
| `README.manual.md` | Python 未使用時の実行手順。環境変数設定から差分比較までステップを記載。 | `BASE_URL_LEGACY` / `BASE_URL_MODERN` を切り替える際のチェックリストとして運用。 |

### Python 実行制約時の代替フロー
1. `test_config.manual.csv` の `headers_profile`／`payload_template` を確認し、必要なファイルを `headers/` や `payloads/` から選択する。
2. `BASE_URL_LEGACY` / `BASE_URL_MODERN` / `PARITY_HEADER_FILE` / `PARITY_BODY_FILE` を設定したうえで `ops/tools/send_parallel_request.sh <METHOD> <PATH> [ID]` を実行し、`artifacts/parity-manual/<ID>/<legacy|modern>/` にレスポンス・ヘッダー・メタ情報を保存する。
3. `diff -u artifacts/parity-manual/<ID>/legacy/response.json artifacts/parity-manual/<ID>/modern/response.json` を行い、差分が残った場合は `README.manual.md` に記録しつつ、`artifacts/manual/<ID>/` へコピーしてレビュー資料化する。
4. 監査ログ確認が必要なケース（例: `/20/adm/factor2/*`）は `psql -h localhost -U opendolphin -d opendolphin -c "SELECT action FROM d_audit_event ORDER BY event_time DESC LIMIT 5;"` を実行し、結果を `artifacts/manual/audit_log.txt` に追記。`PARITY_HEADER_FILE` の `clientUUID` をケース毎に変えるとトレースが容易。

## 2. API パリティチェッカー（scripts/api_parity_response_check.py）

| 資材 | 内容 / 用途 | 備考 |
| --- | --- | --- |
| `scripts/api_parity_response_check.py` | Legacy / Modernized 両方へ同一リクエストを送付し、レスポンス差分を判定。 | `configs/api_targets.json` を入力。`--fail-fast` 等のオプションあり。 |
| `scripts/api_parity_targets.sample.json` | ターゲット定義サンプル。`defaults` セクションで Accept や比較モードを指定。 | `ignore_keys` に時刻系フィールドを列挙可能。 |
| `docs/server-modernization/operations/API_PARITY_RESPONSE_CHECK.md` | セットアップ手順と出力の読み方。 | Jenkins/GitHub Actions 導入に転用可。 |
| `ops/tools/send_parallel_request.sh` | curl で Legacy/Modernized へ同時送信し、レスポンス/ヘッダー/メタ情報を自動保存。 | `PARITY_OUTPUT_DIR`（default: `artifacts/parity-manual`）配下へ整形保存。`BASE_URL_*`、`PARITY_HEADER_FILE`、`PARITY_BODY_FILE` を環境変数で受け取る。 |

### 推奨データセット

- 認証情報: `docs/web-client/operations/TEST_SERVER_DEPLOY.md` の管理者／医師ユーザー、および `ops/tests/api-smoke-test/test_config.sample.yaml` のヘッダー値。
- エンドポイント: `/serverinfo/*`, `/user/{userId}`, `/chart/{karteId}` などレイテンシ差異が小さい API から先行。
- ベースライン成果物: `ops/tests/api-smoke-test/run_smoke.py --artifact-dir artifacts/legacy` で取得した旧サーバー結果を `--baseline-dir` として再利用すると、Python 実行を 1 回で済ませられる。

### Python 実行制約時の代替
- `scripts/api_parity_targets.sample.json` を `jq '.targets[] | "\(.method) \(.path)"'` で展開し、`xargs -I{} ./ops/tools/send_parallel_request.sh {}` を使って `curl` を並列送信する。
- 取得したレスポンスは `artifacts/parity-manual/<endpoint>/<legacy|modern>/response.json` に保存される。必要に応じて `meta.json`（HTTP ステータス・所要時間）と `headers.txt` を添付し、`diff` で比較。
- `ops/postman/DemoResourceAsp.postman_collection.json` を Postman CLI で実行する方法も可。CLI 実行ログを証跡として保管。

## 3. 監査ログ・外部副作用検証

| 項目 | データ / 手順 | 備考 |
| --- | --- | --- |
| 監査対象 API | `/20/adm/factor2/totp/*`, `/20/adm/factor2/fido2/*`, `/20/adm/phr/*` など ADM20 系。 | `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の備考欄で監査要件を確認。 |
| DB 検証 | `SELECT action, trace_id FROM d_audit_event ORDER BY event_time DESC LIMIT 20;` | `docs/server-modernization/api-smoke-test.md` 11 章にも SQL 例あり。 |
| テストデータ | `docs/web-client/operations/TEST_SERVER_DEPLOY.md` のテスト患者 `WEB1001`〜`WEB1010`、TOTP/FIDO2 設定キー。 | 2FA キーは `.env` または Secrets Manager に 32 byte Base64 で登録。 |
| 自動化候補 | `ops/tests/api-smoke-test/test_config.ci.yaml` に ADM20 ケースを追加予定。 | 監査ログ差分は `psql` の結果を `artifacts/audit/d_audit_event_<timestamp>.csv` へ保存。 |

### Python 実行制約時の代替
1. `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に沿って `custom.properties`／Secrets を確認し、Plivo/ORCA 等の外部連携が正しく設定されていることを確認。
2. `curl -X POST https://<host>/20/adm/factor2/totp/challenge -H 'userName: ...' ...` のように手動で API を呼び出し、レスポンスと `server-modernized` ログ（`RequestMetricsFilter` 出力）を `tmp/manual-audit/` に保存。
3. `psql` で `d_audit_event` を抽出し、`trace_id` と REST ログの `traceId` を突合。結果は `docs/server-modernization/phase2/notes/test-data-inventory.md` へ追記。

## 4. フォローアップ
- Ops/QA は本ノートを基に `ops/tests/` へ README / サンプルデータを追加し、Python スクリプト実行が許可されない期間でも再現性を確保する。
- 追加で必要なサンプル（例: Chart UI 用カルテデータ）は `docs/web-client/operations/TEST_SERVER_DEPLOY.md` に追記し、本ノートからリンクする。
- 更新や新規データセットを登録した際は更新日・担当・参照パスを本ノートに追記すること。
