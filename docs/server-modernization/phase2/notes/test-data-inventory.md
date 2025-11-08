# テストデータ棚卸し（2026-06-14 更新、担当: Worker D）

`ops/tests/` 配下の資材と関連ドキュメントを整理し、API スモークテスト／API パリティチェッカー／監査ログ検証に必要なデータセットと Python 実行制約時の代替手順を明文化する。

## 1. API スモークテスト（ops/tests/api-smoke-test）

| 資材 | 内容 / 用途 | 備考 |
| --- | --- | --- |
| `api_inventory.yaml` | REST エンドポイント 300+ 件のメタデータ。`resource` / `http_method` / `path_template` / `requires_body` を保持。 | `generate_config_skeleton.py` がこのファイルからケース雛形を生成。 |
| `test_config.sample.yaml` | 手動実行時のテンプレート。`defaults.headers` に Legacy 認証ヘッダーを定義。 | `docs/web-client/operations/TEST_SERVER_DEPLOY.md` セクション 0 の初期アカウント（施設 ID: `1.3.6.1.4.1.9414.72.103`, doctor1 など）を転記して使用。 |
| `test_config.ci.yaml` | GitHub Actions 用の最小ケース。`cases` に `/dolphin` / `/serverinfo/*` の疎通確認を定義。 | 認証値 (`userName`, `password`, `clientUUID`) は CI 専用。Ops が本番 API を検証する際は `clientUUID` を固有値に置換。 |
| `test_config.manual.csv` | Python 禁止時のチェックリスト。`id,method,path,headers_profile,payload_template,expectation,trace-id` を列挙。 | 2026-06-15 追加。`headers/` `payloads/` とペアで使用し、`artifacts/...` の保存先や監査ログ要否を把握する。`trace-id` 列には `X-Trace-Id` に載せる推奨値を記録し、`SessionTraceManager`／JMS ログの突合に再利用する。 |
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

### 1.3 `headers/` プロファイル棚卸し（2026-06-16 時点）

| ファイル | 対象ロール / 用途 | 主なヘッダー | 備考 |
| --- | --- | --- | --- |
| `headers/legacy-default.headers` | `doctor1` の一般 API。`test_config.manual.csv` の `serverinfo`/`chart_summary` などで使用。 | `userName` / `password` / `clientUUID` / `facilityId` | `ops/tests/api-smoke-test/headers/legacy-default.headers` をそのまま `PARITY_HEADER_FILE` へ指定する。 |
| `headers/adm20-admin.headers` | ADM20 受付・2FA 系 FIDO/TOTP テスト用。 | `userName` / `password` / `clientUUID` / `facilityId` / `factor2-mode` | `/20/adm/factor2/*` を叩く際の最小構成。`factor2-mode` を他値に差し替えてユーザー属性を再現する。 |
| `headers/javatime-stage.headers.template` | JavaTime（ORCA・Touch） Stage 監視。Bearer トークンを後から埋め込み。 | `Content-Type` / `X-Trace-Id` / `Authorization: Bearer ...` | `.template` を複製して `javatime-stage.headers` をローカル作成（`.gitignore` 済）。Stage トークンは Secrets で配布。 |

### 1.4 `payloads/` テンプレート棚卸し

| ファイル | 対象 API | 紐付くケース | 備考 |
| --- | --- | --- | --- |
| `payloads/fido2_enroll.json` | `/20/adm/factor2/fido2/enroll`（旧 REST 名称）。 | `fido2_enroll`（`ops/tests/api-smoke-test/test_config.manual.csv`） | `challenge` に `/registration/options` 応答の Base64 を代入してから使用する。現行 API では `/registration/finish` へ合わせる必要あり。 |
| `payloads/javatime_orca_interaction.json` | `/orca/interaction` | `JAVATIME_ORCA_001` | `issuedAt` を ISO8601 で毎回更新。 |
| `payloads/javatime_touch_sendPackage.json` | `/touch/sendPackage` | `JAVATIME_TOUCH_001` | `bundleList` にサンプルイベントを追加予定。 |

### 1.5 `README.manual.md` の重要ポイント（抜粋）

- `ops/tests/api-smoke-test/README.manual.md` で `BASE_URL_LEGACY` / `BASE_URL_MODERN` / `PARITY_HEADER_FILE` の設定から `diff` 取得、監査ログ採取まで 6 手順に分けて説明（1〜6 行目）。
- JavaTime の Stage 実行手順は Bearer トークンを `javatime-stage.headers` にのみ保存し、`issuedAt` を `date --iso-8601=seconds` で更新するよう明示（「JavaTime 手動ケースの準備」節）。
- Stage 実行時の証跡（`tmp/java-time/*`）を 30 日以内に Evidence ストレージへ転記し、`docs/server-modernization/phase2/notes/worker-directives-20260614.md` へリンクを残すことを周知（同節末尾）。

### 1.6 命名規則とフォルダ構成

- `ops/tests/api-smoke-test/headers/<system>-<role>.headers` を小文字ハイフン区切りで作成し、秘密情報を含むものは `.gitignore` で除外する（Stage/本番は `.headers.template` をコミット）。
- `payloads/<feature>_<operation>.json` はスネークケースで命名し、`test_config.*` の `payload_template` パスと一致させる。チャレンジ／署名のように都度変わる値は `PLACEHOLDER` を含め、実行直前にスクリプトで差し替える。
- `artifacts/parity-manual/<ID>/<legacy|modern>/` にレスポンス／ヘッダー／メタを保存する構成を README で標準化済み。CI では `PARITY_OUTPUT_DIR=artifacts/ci-smoke` など別ディレクトリを推奨。
- JavaTime 固有の証跡は `tmp/java-time/` 配下に置き、後続ドキュメント（Runbook §4.3 等）からリンクする。

### 1.7 CI 連携前提（環境変数・シークレット）

| 種別 | 名称 / 例 | 用途 | 備考 |
| --- | --- | --- | --- |
| 環境変数 | `BASE_URL_LEGACY`, `BASE_URL_MODERN` | `ops/tools/send_parallel_request.sh` と `run_smoke.py` の送信先 URL。 | GitHub Actions では Compose サービス名（`http://legacy-server:8080` 等）を設定。 |
| 環境変数 | `PARITY_HEADER_FILE`, `PARITY_BODY_FILE`, `PARITY_OUTPUT_DIR` | 追加ヘッダーとボディテンプレート、成果物保存先。 | ボディが不要な場合は `PARITY_BODY_FILE` を未設定にする。 |
| シークレット | Legacy/Modern 認証情報（`SMOKE_USER_NAME`、`SMOKE_PASSWORD`、`SMOKE_CLIENT_UUID`、`SMOKE_FACILITY_ID`） | `headers/*.headers` を CI 上で生成するための元データ。 | `test_config.ci.yaml` の `defaults.headers`（`ops/tests/api-smoke-test/test_config.ci.yaml`）を参照し、テンプレートから置換。 |
| シークレット | `JAVATIME_STAGE_BEARER` | `javatime-stage.headers` 生成用。 | Stage トークンはリポジトリへコミットしない。 |
| シークレット | 2FA シード（TOTP/FIDO2） | `/20/adm/factor2/*` の再現に必要なテストアカウント秘密情報。 | `docs/web-client/operations/TEST_SERVER_DEPLOY.md` 記載のキーを Secrets Manager に保管し、ジョブ開始時に `payloads/*` へ流し込む。 |
| 作業用ファイル | `artifacts/ci-smoke/` | CI パリティ比較結果の保存先。 | `actions/upload-artifact` で保存し、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ10-2の証跡とする。 |

### 1.8 不足ケース一覧（ADM20/FIDO2 など）

| 区分 | API / 手順 | 現状ギャップ | 必要資材 | 参照 |
| --- | --- | --- | --- | --- |
| FIDO2 登録 | `/20/adm/factor2/fido2/registration/options` / `.../finish` | `test_config.manual.csv` には `fido2_enroll` のみで、現行 2 フェーズ API を網羅できていない。 | `payloads/fido2_registration_finish.json`（仮）と `headers/adm20-admin.headers` の派生。`registration/options` 応答を保存する仕組み。 | `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` §5 |
| FIDO2 認証 | `/20/adm/factor2/fido2/assertion/options` / `.../finish` | ログインフローの検証ケースが存在せず、監査ログ比較が不可能。 | WebAuthn テストクライアント or モック応答、`payloads/fido2_assertion_finish.json`。 | 同上 |
| TOTP | `/20/adm/factor2/totp/registration` / `.../verification` | `headers/adm20-admin.headers` のみで TOTP 登録〜検証のスクリプト・payload が未整備。 | `payloads/totp_registration.json`（仮）、TOTP 秘密鍵の管理ルール、`psql` 採取テンプレ。 | `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`、`test_config.manual.csv` |
| SMS/端末管理 | `/20/adm/factor2/code`, `/20/adm/factor2/device`, `/20/adm/user/factor2/device`, `/20/adm/user/factor2/backup` | 端末紐付け/バックアップコード解除の実データがなく、`README.manual.md` でも手順未定義。 | SMS 送信モック（`ops/mock/sms` など）と `headers/adm20-operator.headers`。 | AdmissionResource 一覧 |
| ADM20 受付系 | `/20/adm/carePlan`, `/20/adm/nurseProgressCourse`, `/20/adm/ondoban` など | カルテ受付・温度板データの payload が 0 件のため、フェールセーフ確認ができない。 | `payloads/adm20_careplan_upsert.json` 等と、`docs/web-client/operations/TEST_SERVER_DEPLOY.md` の患者データを流用した CSV。 | 同上 |

### 1.9 拡充計画（フェーズ10-2 対応）

| タスク | 優先度 | 担当（案） | 必要モック / 準備 | 成果物 |
| --- | --- | --- | --- | --- |
| FIDO2 登録フロー整備（`registration/options`→`finish`） | High | Worker D（ADM20 担当） | WebAuthn サンプルレスポンス、`payloads/fido2_registration_finish.json`／`headers/adm20-admin.headers` 複製、自動 `challenge` 差替えスクリプト。 | `test_config.manual.csv` へ `fido2_registration_options`/`fido2_registration_finish` 追加、README へ手順追記。 |
| FIDO2 認証フロー整備（`assertion/options`→`finish`） | High | Worker Q（Security QA） | ソフトウェア認証器（Yubico demo など）と `payloads/fido2_assertion_finish.json`、監査ログ採取 SQL。 | `artifacts/parity-manual/fido2_assertion_*` のベースライン + `docs/server-modernization/phase2/notes/test-data-inventory.md` 更新。 |
| TOTP/SMS 端末管理ケース | Medium | Worker L（Ops Automation） | TOTP シード（`WEB1001` など）、SMS モック、`payloads/totp_registration.json`・`payloads/totp_verification.json`。 | `headers/adm20-operator.headers`、`test_config.manual.csv` に `totp_registration` ほか追加、`README.manual.md` に `psql` 取得テンプレ。 |
| ADM20 受付ドメイン（carePlan/nurseProgressCourse/ondoban） | Medium | Worker P（業務ドメイン） | `docs/web-client/operations/TEST_SERVER_DEPLOY.md` の患者データ、`payloads/adm20_careplan_upsert.json`、`payloads/nurseProgress_sample.json`。 | モダン/Legacy それぞれのレスポンス保存、ArchiMate での業務フローリンク。 |

> これらのタスク完了後、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` のフェーズ10-2 行（テストデータ・モック整理）を `[x]` へ更新できる状態になる。

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

### 3.1 監査ログ・外部副作用テスト設計（/20/adm/factor2/*）

| Case ID | METHOD / Path | 監査アクション（`d_audit_event.action`） | 外部副作用 / 検証ポイント | マスキング / 保存先 |
| --- | --- | --- | --- | --- |
| `factor2_totp_registration` | `POST /20/adm/factor2/totp/registration` | `TOTP_REGISTER_INIT` | `d_factor2_challenge` へシードを生成、`d_factor2_credential` に未検証レコードが増える | `payload.secret`、`provisioningUri`、`Factor2SecretProtector` が出力する AES-GCM ciphertext は `***masked***` に置換。レスポンス：`artifacts/parity-manual/factor2_totp_registration/*`、監査 SQL：`artifacts/manual/audit_log.txt` |
| `factor2_totp_verification` | `POST /20/adm/factor2/totp/verification` | `TOTP_REGISTER_COMPLETE` / `...FAILED` | `d_factor2_credential.verified=true`、`d_factor2_backupkey` にハッシュ化バックアップコード | `payload.backupCodes[]`、`code` は全てマスキング。`tmp/manual-audit/<date>/psql_factor2_totp_verification.sql` へ未加工を保管し、Evidence へ暗号化転送。|
| `factor2_fido2_assert_finish` | `POST /20/adm/factor2/fido2/assertion/finish` | `FIDO2_ASSERT_COMPLETE` / `...FAILED` | `d_factor2_challenge` の `request_id` が消費され、`d_factor2_credential.sign_count` が +1 | `clientDataJSON`、`authenticatorData`、`signature` を公開レポートではトークン化（先頭 6 文字 + `…`）。証跡は `artifacts/parity-manual/factor2_fido2_assert_finish/*` と `tmp/manual-audit/<date>/factor2_fido2_assert_finish.psql` に保存。|

#### 実施手順
1. **前提準備**
   - `docker compose` もしくはローカル WildFly で Legacy/Modernized の両方を起動し、`BASE_URL_LEGACY`（例: `http://localhost:8080`）と `BASE_URL_MODERN`（例: `http://localhost:18080`）を決定する。現状リポジトリには `server-modernized/db-baseline/` の DDL が含まれていないため、Secrets Storage からベースラインスキーマを取得して適用する必要がある（未取得の場合は `ERROR: relation "d_audit_event" does not exist` で失敗する）。
   - Secrets: `FACTOR2_AES_KEY_B64`, `FIDO2_RP_ID`/`NAME`/`ALLOWED_ORIGINS` を `.env` か Vault から投入。`ops/check-secrets.sh` で欠損を検出する。
   - ヘッダー: `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/adm20-admin.headers` をベースに `clientUUID` をケースごとに固有化（`factor2-totp-registration-<date>` など）し、`X-Trace-Id` も `factor2-<case>-<timestamp>` 形式で追加すると `RequestMetricsFilter` と突合しやすい。
2. **API 送信**
   ```bash
   BASE_URL_LEGACY=http://localhost:8080 \
   BASE_URL_MODERN=http://localhost:18080 \
   PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/adm20-admin.headers \
   PARITY_BODY_FILE=tmp/manual-audit/totp_registration.json \
     ./ops/tools/send_parallel_request.sh POST /20/adm/factor2/totp/registration factor2_totp_registration
   ```
   - ボディは `tmp/manual-audit/<case>.json` に保存し、使い回し禁止。
   - スクリプトは `artifacts/parity-manual/<ID>/<legacy|modern>/response.json|headers.txt|meta.json` を自動生成する。
3. **監査ログ採取**
   ```bash
   PGPASSWORD=opendolphin psql -h localhost -U opendolphin -d opendolphin <<'SQL' | tee tmp/manual-audit/factor2_totp_registration.psql
   \\pset format aligned
   SELECT event_time, action, request_id, payload
     FROM d_audit_event
    WHERE action IN ('TOTP_REGISTER_INIT','TOTP_REGISTER_COMPLETE','FIDO2_ASSERT_COMPLETE','FIDO2_ASSERT_COMPLETE_FAILED')
    ORDER BY event_time DESC
    LIMIT 20;
   SQL
   ```
   - `payload` は `jq` 等で `secret`, `backupCodes`, `challengePayload` を `\"***masked***\"` へ置換してから `artifacts/manual/audit_log.txt` へ貼り付ける。
   - `d_factor2_credential` / `d_factor2_challenge` / `d_factor2_backupkey` についても `\d` と `SELECT` の結果を `tmp/manual-audit/<date>/factor2_side_effects.sql` へ保存する。
4. **証跡の整理**
   - `artifacts/parity-manual/<case>/...`：HTTP 応答とヘッダー。
   - `artifacts/manual/audit_log.txt`：マスク済みの `psql` 実行ログとブロッカーの記録。最新版（2025-11-07）は `docker`/`ddl` 不足により API 実行が失敗したことを記録済み。
   - `tmp/manual-audit/<date>/`：未マスキングの SQL／curl ログ。Evidence ストレージへ暗号化転送後にローカルから削除。

#### 既知のブロッカー（2025-11-07 時点）
- Codespaces コンテナ内では `dockerd` 起動時に `iptables v1.8.7 (nf_tables): ... Permission denied` が発生し、`docker compose` で Legacy/Modernized を同時起動できない。ローカル実行者はホスト OS で Docker を起動するか、WildFly を直接セットアップする。
- `server-modernized/tools/flyway/sql/V0001__baseline_tag.sql` はベースラインの説明のみで DDL を含まず、`d_audit_event` などのテーブルが生成されない。Secrets ストレージの `server-modernized/db-baseline/` を展開し Flyway `baseline+migrate` を完了させるまで `psql` 採取は不可能。
- 上記ブロッカーの詳細と再現ログは `artifacts/manual/audit_log.txt`（ケース ID ごとに `status_code=000`, `exit_code=7` を記録）を参照。

## 4. フォローアップ
- Ops/QA は本ノートを基に `ops/tests/` へ README / サンプルデータを追加し、Python スクリプト実行が許可されない期間でも再現性を確保する。
- 追加で必要なサンプル（例: Chart UI 用カルテデータ）は `docs/web-client/operations/TEST_SERVER_DEPLOY.md` に追記し、本ノートからリンクする。
- 更新や新規データセットを登録した際は更新日・担当・参照パスを本ノートに追記すること。

## 5. Factor2 監査ログ設計（2026-06-16 追記）
- `ops/tests/security/factor2/*.http` はまだ存在しないため、当面は `ops/tools/send_parallel_request.sh` を直接叩く。2026-06-16 版で `--loop` オプションが追加され、`factor2_totp_registration_loop001` のようなサフィックスで連続リクエストを保存できる。
- HTTP 証跡: `artifacts/parity-manual/factor2_*/*/meta.json` に `exit_code=7`（接続不可）を残しており、環境復旧後は同じディレクトリへ成功レスポンスを上書き予定。
- 監査ログ／DB 副作用: `artifacts/parity-manual/audit/factor2-audit-plan.md` に採取テンプレートを作成。`d_audit_event`, `d_factor2_{credential,challenge,backupkey}` を `psql` でダンプし、マスク済みログを `artifacts/parity-manual/audit/` へ保管する。
- Secrets 欠落時の挙動は `docs/server-modernization/phase2/operations/FACTOR2_RECOVERY_RUNBOOK.md` に Runbook 化。`artifacts/parity-manual/secrets/wildfly-start.log` へ `scripts/start_legacy_modernized.sh start --build` 実行ログ（BuildKit がタイムアウトし WildFly 未起動）が保存されている。
- 今後の TODO:
  1. Docker が利用可能な環境で `/20/adm/factor2/*` を再実行し、`d_audit_event` への `TOTP_REGISTER_*` / `FIDO2_ASSERT_COMPLETE` 記録を採取。
  2. `ops/tests/security/factor2` ディレクトリを新設し、`.http` テンプレートと `README` を格納。
  3. `artifacts/parity-manual/observability/` で記録した `/actuator/metrics` 取得ログと突合し、2FA API 実行時に `Micrometer` メトリクスへ `traceId` が伝搬しているかを確認。

## 2. Factor2 セキュリティテスト（ops/tests/security/factor2）

| 資材 | 内容 / 用途 | 備考 |
| --- | --- | --- |
| `totp-registration.http` | `/20/adm/factor2/totp/registration` の REST 呼び出しテンプレート。ADM20 管理者ヘッダーと JSON ボディを同梱。 | レスポンスの `secret` / `credentialId` を保存し、`node` などで 6 桁 TOTP を生成する。 |
| `totp-verification.http` | `/factor2/totp/verification` でコード検証＆バックアップコード発行。 | `{{credentialId}}` と `{{code}}` を置換して利用。 |
| `fido-registration-*.http` | FIDO2 登録フロー（options/finish）。`requestId` と WebAuthn クライアントレスポンスを差し込む。 | WebAuthn テストハーネス（例: `webauthn-json` CLI）と組み合わせてレスポンスを生成。 |
| `fido-assertion-*.http` | FIDO2 認証フロー（options/finish）。 | 認証時の `requestId`／クライアントレスポンスを差し替え。 |
| `README.md` | 上記 `.http` の使い方、ヘッダー、注意事項をまとめたコンパニオン。 | Python 禁止ポリシーに従い、Node 系ユーティリティ（`npx otplib-cli` など）で TOTP を算出する手順を記載。 |

### 2.1 手動実行の流れ
1. `ops/tests/security/factor2/*.http` を VS Code REST Client 等で開き、`userPk` / `credentialId` / `requestId` をテストユーザーへ置換する。
2. TOTP 検証前に `npm install -g otplib-cli`（または `npx otplib-cli generate --secret <BASE32>`）でワンタイムコード生成器を用意し、`totp-verification.http` の `code` に転記する（Python 禁止時の代替手段）。
3. 各リクエストのレスポンスを `artifacts/parity-manual/factor2_<case>/` に保存する。例: `factor2_totp_registration/registration_success.json`、`factor2_fido2_assert_finish/assertion_response.json`。
4. 監査ログは `docker exec -e PGPASSWORD=opendolphin opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "\\timing off;SELECT event_time,action,trace_id,(details->>'status') AS status FROM d_audit_event WHERE action LIKE 'TOTP_%' OR action LIKE 'FIDO2_%' ORDER BY event_time DESC LIMIT 20;" > artifacts/parity-manual/audit/factor2_audit.sql` のように採取する。

### 2.2 現状のギャップ
- 2026-06-18 時点の `db-modernized` には `d_user` / `d_factor2_*` / `d_audit_event` が作成されておらず、2FA API は 500 で失敗する。`artifacts/parity-manual/factor2_totp_registration/registration_failure_no_data.log` および `artifacts/parity-manual/audit/d_audit_event_missing.log` に証跡を保存済み。
- Flyway ベースライン（`server-modernized/tools/flyway/sql/V0003__security_phase3_stage7.sql` 等）を適用し、`SELECT count(*) FROM d_audit_event;` が成功する状態になってから成功レスポンスと監査ログを再採取する。
- FIDO2 フローは WebAuthn クライアントレスポンスが必須のため、`fido-registration-finish.http` / `fido-assertion-finish.http` の `credentialResponse` にブラウザからコピーした JSON を Base64 URL セーフ化して埋め込む。CLI だけで完結させる場合は `@simplewebauthn/browser` などを用いた補助スクリプトが必要。

### 2.3 参考 SQL スニペット
```sql
SELECT event_time,
       action,
       details ->> 'status'       AS status,
       details #>> '{request,userPk}' AS user_pk,
       trace_id
  FROM d_audit_event
 WHERE action LIKE 'TOTP_%'
    OR action LIKE 'FIDO2_%'
 ORDER BY event_time DESC
 LIMIT 20;
```
※ 現状はテーブルが無いため `relation "d_audit_event" does not exist` が返る。Flyway 適用後に実行し、`artifacts/parity-manual/audit/factor2_*.sql` へ保存する。
