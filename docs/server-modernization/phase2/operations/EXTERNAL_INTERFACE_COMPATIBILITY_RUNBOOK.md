# 外部システム互換運用ランブック

- 作成日: 2025-11-03
- 対象: レガシーサーバー (`server/`) とモダナイズサーバー (`server-modernized/`) を切り替える際に、外部システムから見て同一インターフェースを維持するための手順。
- 前提: REST API の実装差分は `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` で把握済みとし、本ドキュメントでは運用手順を整理する。

## 1. 事前準備チェック

| 項目 | 内容 | 担当 | 状態 |
| --- | --- | --- | --- |
| API 移植状況確認 | `API_PARITY_MATRIX.md` を最新化し、未移植 API の代替策または実装完了を確認する。`✖ 未移植` 行が残る場合は切替対象から除外する。 | API チーム |  |
| 設定ファイル整備 | `custom.properties` / `env` 変数の値を旧サーバーから移行し、`ops/modernized-server/docker/custom.properties`（テンプレート）と差分を解消する。 | インフラ |  |
| 外部サービス接続 | ORCA、Plivo、S3／ファイル共有など外部連携先の資格情報を Secrets に登録し、`docs/server-modernization/external-integrations/3_6-external-service-modernization.md` の準備が完了していることを確認。 | 外部連携 |  |
| 監査・ログ設定 | `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` のとおり、監査ログ（`d_audit_event`）と Micrometer メトリクスを収集できることを確認。 | 運用 |  |
| Smoke テスト | `docs/server-modernization/api-smoke-test.md` の手順で旧サーバーのベースラインを取得し、モダナイズ版と差分がないことを確認。 | QA |  |

### 1.1 base_readonly スモーク採取ログ (2025-11-09)

- 目的: 認証ヘッダーのみで呼び出せる読取専用 API（`/dolphin`, `/serverinfo/jamri`, `/mml/patient/list/<fid>`）のレスポンスを Legacy/Modernized 両系統で比較し、CLI ベースの Runbook を固める。
- 前提:
  - `./scripts/start_legacy_modernized.sh start --build` で `opendolphin-postgres` / `opendolphin-postgres-modernized` / `opendolphin-server` / `opendolphin-server-modernized-dev` を起動。
  - `d_facility.id=5001` / `d_users.id in (9001,9002)` / `d_patient.id in (7001-7010)` をローカル合成ベースラインで投入（`1.3.6.1.4.1.9414.72.103:{doctor1,admin}` と 10 件の `WEB1001`〜`WEB1010`）。
- 実行コマンド:
  ```bash
  BASE_URL_LEGACY=http://localhost:8080/openDolphin/resources \
  BASE_URL_MODERN=http://localhost:9080/openDolphin/resources \
  ./ops/tests/api-smoke-test/run.sh --dual --scenario base_readonly
  ```
- 証跡: `artifacts/parity-manual/smoke/20251108T212422Z/{legacy,modernized}/`（`metadata.json` にシナリオ概要を記録）。詳細な差分メモは `docs/server-modernization/phase2/notes/touch-api-parity.md#7-base_readonly-スモーク-2025-11-09` を参照。
- 結果サマリ:
  - `/dolphin` のボディは完全一致。Modernized 側のみ `Referrer-Policy`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Trace-Id` を追加で返却（許容済み）。
  - `/serverinfo/jamri` は両系統とも空文字。`custom.properties` の `jamri.code` を設定しない限り値が得られないため、インフラが Secrets を更新するまで TODO として継続管理。
  - `/mml/patient/list/1.3.6.1.4.1.9414.72.103` は `7001`〜`7010` の CSV を返し、一致を確認。

## 2. 基本方針

1. **同一エンドポイント**: HTTP メソッド + パス + クエリ構造が一致することを保証し、ベース URL／コンテキストパスは旧サーバーと同一に設定する（例: `/opendolphin`）。  
2. **ヘッダー互換**: 認証ヘッダー（`userName` / `password` / `clientUUID` など Legacy ヘッダー）と Bearer トークンの双方を許可する。`MODERNIZED_REST_API_INVENTORY.md` の備考を参照し、リバースプロキシでヘッダーが除去されないようにする。  
3. **レスポンス形式**: 旧サーバー互換のため `application/octet-stream`／Shift_JIS CSV 等のコンテンツタイプは従来通り維持し、JSON のキー順序や日付フォーマットを変更しない。  
4. **外部依存**: Claim 電文、ラボ連携、SMS などの外部システム向け出力は同じキュー/HTTP 先へ配送されるようルーティングを揃える。`external-integrations` 配下の手順に従う。  
5. **監査証跡**: ログ、監査イベント、トレース ID を旧サーバーと同じ保管先（DB／ログ転送）へ送出する。Micrometer メトリクスは追加されても構わないが既存ログ出力を削除しない。
6. **ID 体系**: 医師コード・患者番号などの桁数/体系は ORCA 設定に従う。8 桁患者番号を要求する場合は ORCA 側の管理連番設定変更が前提で、モダナイズ側は ORCA 付与値をそのまま採用する。

## 3. 設定手順

### 3.1 ネットワーク・ドメイン
- フロントのロードバランサ／リバースプロキシで新旧サーバーを同一 FQDN（例: `api.example.jp`）配下に配置し、切替時は DNS TTL を 60 秒以下へ短縮。
- WildFly の `jboss.http.port` / `jboss.https.port` は旧サーバーと同じ値を利用する。`docker-compose.modernized.dev.yml` を参照し、`MODERNIZED_APP_HTTP_PORT` 環境変数で調整する。
- TLS 証明書とサーバー証明書チェーンは旧サーバーと同じものを導入し、クライアント証明書検証がある場合は `standalone.xml` の Undertow 設定を移植する。

### 3.2 アプリケーション設定
- `custom.properties` / `system-config.properties` の値を移行し、`claim.conn`、`claim.host`、`claim.send.encoding` 等のキーが一致しているか確認。  
- 監査ログやトレース ID は `LogFilter` が `X-Trace-Id` ヘッダーを前提としているため、リバースプロキシで当該ヘッダーを削除・書き換えしないよう設定を確認する。必要に応じて `x-trace-id` をサービスポートから上流に転送する。  
- `server-modernized/src/main/webapp/WEB-INF/web.xml` にある `deny-uncovered-http-methods` や CORS 設定は旧サーバーと等価であることを確認。必要に応じ `docs/server-modernization/phase2/foundation/JAKARTA_EE10_GAP_LIST.md` を参照。

### 3.3 データ・スキーマ
- DB マイグレーションは Flyway（`server-modernized/src/main/resources/db/migration` 想定）を実行し、レガシー DB のスキーマと一致させる。差分がある場合は `docs/server-modernization/persistence-layer/` の各メモで例外処理を確認。
- `ClaimItem` / `DocInfoModel` / `ModuleInfoBean` の追加フィールドに伴い、`d_document.admflag` と `d_module.performflag` 列の存在を確認する。以下の SQL を `information_schema` へ投げ、いずれかが返らない場合はモダナイズ側でカラム追加を実施する（`server-modernized/tools/sql/check_doc_module_flags.sql` へまとめ済み）。
  ```sql
  SELECT column_name FROM information_schema.columns WHERE table_name = 'd_document' AND column_name = 'admflag';
  SELECT column_name FROM information_schema.columns WHERE table_name = 'd_module' AND column_name = 'performflag';
  ```
  - 欠損が判明した環境では `server-modernized/tools/flyway/sql/V0221__doc_module_flag_columns.sql` を適用し、`VARCHAR(1)` で両カラムを作成する。マイグレーション適用後に再度上記 SQL で結果を確認し、本ランブックの検証ログへ記録する。
  - 値の初期化ポリシー（例: 外来 `'V'`, 実施 `'P'`）は環境ごとに異なるため、必要に応じて `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-A-M.md` の補足と Ops 判断を参照して実データ更新を行う。
- 添付ファイルや PDF など外部ストレージを利用するプロジェクトでは、`server-modernized/config/attachment-storage.sample.yaml` を参照し、S3 互換設定を旧環境と合わせる。
- 監査ログテーブル `d_audit_event` および支援テーブル（`d_audit_detail` 等）が旧サーバーと同じインデックス構成か確認する。

## 4. 検証フロー

1. **API パリティ確認**  
   - `API_PARITY_MATRIX.md` を開き、対象リリースで `✖ 未移植` が残っていないか確認。未移植が残る場合は代替策（例: リバースプロキシで旧サーバーへ迂回）を **明示的に記録** し、迂回設定が正しく動作するかをテストする。
   - `/pvt` 系エンドポイントはモダナイズ側で 11 パス（12 オペレーション）を提供。Legacy インベントリの 23 件には旧サーバー専用 (`/20/adm/eht/*` など) が含まれるため、詳細は `phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` を参照し対象外を明示すること。
2. **Smoke テスト実行**  
   - `docs/server-modernization/api-smoke-test.md` に従い、旧サーバー結果を `artifacts/baseline` に取得。  
   - モダナイズ版で `run_smoke.py --baseline-dir artifacts/baseline` を実行し、全エンドポイントが `SUCCESS` になることを確認。差分がある場合は再パス。
3. **監査・ログ検証**  
   - 代表的な 2FA API（例: `/20/adm/factor2/totp/verification`）とカルテ API（例: `/karte/pid/{pid,from}`）を手動で叩き、`d_audit_event` や `server.log` に旧サーバー同等の出力が残ることを確認。
   - 自動テスト (`mvn -f pom.server-modernized.xml test`) で `AdmissionResourceFactor2Test` / `TotpHelperTest` / `TotpSecretProtectorTest` を実行し、2FA API の互換性・監査ログの成否フラグが期待通りであることを確認。  
     - 2025-11-03 (Worker A): ローカル環境に `mvn` バイナリが存在せず `bash: mvn: command not found` で失敗。Maven 導入後に再試行すること。
4. **外部連携テスト**  
   - ORCA 連携: `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` のテスト手順に従い、CLAIM 電文が正しく送信されることを確認。  
   - SMS/メール: `AdmissionResource` の `sendPackage` など通知 API を実行し、Plivo やメールゲートウェイで実送信ログが確認できるかをテスト。
5. **レポート**  
   - テスト結果は `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に日付・担当・概要を追記し、次回以降のリリースノートに転記する。
6. **PHR 非同期ジョブ監視（2025-11-04 更新）**  
   1. **Flyway 適用確認**  
      - `docker compose exec modernized-db psql -U dolphin -c "\dt phr_async_job"` でテーブル有無を確認。存在しない場合は `docker compose exec modernized-backend flyway -configFiles=/opt/payara/tools/flyway/flyway.properties info` を実行し、`V0220__phr_async_job` が `Success` であることを確認する。未適用の場合のみ `flyway migrate` を実施。  
   2. **ジョブ作成 (POST /20/adm/phr/export)**  
      - 認証ヘッダー: Basic 認証（例: `-u F001:manager01:password`）、`X-Trace-Id`、`Accept: application/json`、`Content-Type: application/json` を付与。  
      - サンプル:  
        ```bash
        curl -u F001\\:manager01:password \
             -H 'X-Trace-Id: phr-export-$(date +%s)' \
             -H 'Content-Type: application/json' \
             -d '{"patientIds":["000001","000002"],"documentSince":"2024-01-01","labSince":"2024-01-01"}' \
             https://<backend>/resources/20/adm/phr/export
        ```  
      - レスポンスから `jobId` を控え、`phr_export` の監査イベントが `d_audit_event` に記録されていることを確認。  
   3. **ステータス確認 (GET /20/adm/phr/status/{jobId})**  
      - `curl -u ... https://<backend>/resources/20/adm/phr/status/{jobId}` を実行し、`state=SUCCEEDED` と `downloadUrl` が返ることを確認。  
      - DB: `select job_id,state,progress,result_uri from phr_async_job order by queued_at desc limit 5;` で進捗を確認。  
   4. **成果物ダウンロード**  
      - `downloadUrl` に含まれる `expires` と `token` パラメータを利用し、`curl -L -u ... "<downloadUrl>" -o phr-export.zip` で ZIP を取得。  
      - 取得後に `unzip -l phr-export.zip` で patient JSON が含まれることを確認。  
   5. **ジョブログ・監査確認**  
      - `select action,resource,payload from d_audit_event where resource like '%/20/adm/phr/%' order by event_time desc limit 10;`  
      - `grep -F 'PHR_EXPORT' server.log` でワーカー実行ログを確認。  
   6. **ジョブ取消 (DELETE /20/adm/phr/status/{jobId})**  
      - state=PENDING のジョブに対して `curl -X DELETE -u ... https://<backend>/resources/20/adm/phr/status/{jobId}` を実行し、`phr_async_job.state` が `CANCELLED` に遷移することを確認。  
   7. **自動テスト**  
      - `PHRResourceTest` を追加済み。`mvn -f pom.server-modernized.xml -pl server-modernized test -Dtest=PHRResourceTest` を実行して REST 層のリグレッションを確認する。  
      - 2025-11-04 時点のローカル開発環境には Maven が導入されておらず `bash: mvn: command not found` となるため、CI もしくは Maven 導入済み端末で実行しログを Runbook に添付すること。
   - **2025-11-06 追記**  
      - `PhrDataAssembler` で `NLaboModule` → `PHRLabModule` 変換を行うよう更新。ラボ結果のレスポンスでは `labList[].catchId` が `createLabModuleId` に基づく安定 ID となり、`testItems` 配列へ `lipemia` / `hemolysis` / `frequency` など追加プロパティが展開される。  
      - 互換確認時は `/20/adm/phr/container/{fid,pid,...}` を実行し、Legacy 側の XML → JSON 変換結果と `frequencyName`/`doseUnit` 等が一致するか CSV 比較すること。差異が出た場合は `common/src/main/java/open/dolphin/infomodel/ClaimItem.java` と `PHRClaimItem.java` の新規フィールドにマッピング漏れがないか確認する。  
      - Lab モジュール ID 生成で ORCA `tbl_syskanri (kanricd='1001')` から取得する JMARI コードが未設定の場合、施設 ID にフォールバックしている。検証環境では `custom.properties` の `healthcarefacility.code` を事前に投入する。
7. **2FA / 監査 / Secrets チェック（2026-06-05 更新）**  
   1. **Flyway スキーマ確認**  
      - `docker compose exec modernized-db psql -U dolphin -c "\dt d_factor2_*"` で 2FA 関連テーブルの存在を確認し、`docker compose exec modernized-backend flyway -configFiles=/opt/payara/tools/flyway/flyway.properties info | grep V0003__security_phase3_stage7` で適用済みステータスが `Success` であることを確認する。  
      - `docker compose exec modernized-db psql -U dolphin -c "SELECT indexname FROM pg_indexes WHERE tablename = 'd_audit_event';"` を実行し、`idx_audit_event_time` / `idx_audit_event_action` が作成されているか確認する。存在しない場合は Flyway の再適用を検討する。  
   2. **Secrets 整合性**  
      - `docker compose exec modernized-backend sh -lc 'printenv FACTOR2_AES_KEY_B64 FIDO2_RP_ID FIDO2_ALLOWED_ORIGINS PHR_EXPORT_SIGNING_SECRET'` で必須変数が空でないことを確認（値はターミナルに残さず、実行後は履歴を削除する）。  
      - `docker compose exec modernized-backend sh -lc 'echo -n \"$FACTOR2_AES_KEY_B64\" | wc -c'` を実行し、長さが 44（32 byte の Base64）であることを確認。`base64 -d` が失敗した場合は Secrets 登録をやり直す。`PHR_EXPORT_SIGNING_SECRET` も `wc -c` で 32 文字以上あることを確認する。  
      - `bash ops/check-secrets.sh` を CI と手動検証双方で実行し、以下の期待値を満たしているか自動判定する。スクリプトは欠損・形式不一致で非ゼロ終了となり、デプロイを中断する。  

        | 変数 | 期待値 | 備考 |
        | --- | --- | --- |
        | `FACTOR2_AES_KEY_B64` | Base64 44 文字（32 byte AES キー） | `base64 -d` が成功すること。 |
        | `FIDO2_RP_ID` | ドメイン形式（小文字英数字・ハイフン） | 例: `ehr.example.jp`。 |
        | `FIDO2_ALLOWED_ORIGINS` | `https://` で始まる URL のカンマ区切り | 例: `https://ehr.example.jp,https://ehr-stage.example.jp`。 |
        | `PHR_EXPORT_SIGNING_SECRET` | 32 文字以上のランダム値 | ローテーション時はダウンロード URL 有効性をリグレッション。 |
        | `PHR_EXPORT_STORAGE_TYPE` | `FILESYSTEM` または `S3` | `S3` を選択した場合は下記も必須。 |
        | `PHR_EXPORT_S3_BUCKET` | S3 バケット名（3〜63 文字） | 例: `opendolphin-phr-export-prod`。 |
        | `PHR_EXPORT_S3_REGION` / `AWS_REGION` | `ap-northeast-1` などのリージョン識別子 | SDK が参照するため双方を揃える。 |
        | `PHR_EXPORT_S3_PREFIX` | 任意。空の場合は `phr-exports/` などを推奨 | バケット直下のプレフィックス。 |
        | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM 認証情報（30+ 文字） | EC2 IAM ロール利用時は未設定で警告でも許容。 |

      - ドライラン結果（2026-06-07）: `FACTOR2_AES_KEY_B64` などにダミー値を設定して `bash ops/check-secrets.sh` を実行し、FILESYSTEM 運用で正常終了・S3 項目が警告になることを確認。S3 用 Secrets はステージ環境で投入後に再検証する。  
      - CI 失敗条件: ① 必須変数が未設定、② 正規表現（ドメイン/URL/Base64）に合致しない、③ `FACTOR2_AES_KEY_B64` Base64 デコードが失敗、④ `PHR_EXPORT_STORAGE_TYPE=S3` で S3 関連変数が欠損。失敗時は Slack `#ops-alert` と PagerDuty `Modernized Server` サービスへ通知し、Secrets を Vault `kv/modernized-server/<env>/` に再登録後ジョブを再実行する。  
   3. **2FA API 動作確認**  
      - `docs/server-modernization/api-smoke-test.md` の「2FA」シナリオ、または `mvn -f pom.server-modernized.xml test -Dtest=AdmissionResourceFactor2Test` を実行し、TOTP 登録・認証成功/失敗、FIDO2 登録・認証失敗ケースの監査ログが期待どおりであるか確認する。  
      - 手動確認時は `/20/adm/factor2/totp/registration` → `/verification` のフローでテスト用ユーザーを登録し、`select credential_type, verified from d_factor2_credential where user_pk=<pk>;` を実行して `verified=true` になっていることを確認。FIDO2 はステージ環境の Web クライアントから登録し、`d_factor2_challenge` の `expires_at` が 5 分以内で削除されることを確認する。  
   4. **監査ログハッシュ検証**  
      - `docker compose exec modernized-db psql -U dolphin -c "SELECT event_time, action, previous_hash, event_hash FROM d_audit_event ORDER BY event_time DESC LIMIT 20;"` を実行し、`previous_hash` と直前行の `event_hash` が一致していることを確認。  
      - 異常があれば `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md` の補正手順に従い、監査担当へエスカレーションする。  
      - ドライラン結果（2026-06-07）: ローカル検証環境では `d_audit_event` が空で比較対象なし。Stage DB リストア後にレコードを挿入してハッシュ破損を再現し、通知ルートを確認する。  
      - 改善提案: `AuditHashVerifier`（仮称）を Payara Timer で 5 分間隔に実行し、結果を `/health/audit-chain` で公開。異常検知時は PagerDuty/Slack 通知と同時に影響範囲を CSV へ書き出す。設計詳細は `phase2/notes/phr-2fa-audit-implementation-prep.md#audit-ops-003` を参照。  
   5. **バックアップコードローテーション確認**  
      - ローテーション直後に `select count(*) from d_factor2_backupkey;` で件数を確認し、必要なユーザー数と一致しているか評価。古いバックアップコードが残っている場合は削除・再発行計画を立てる。  
      - `d_factor2_code` に SMS コードが残存していないか（`expires_at` カラムが無い Legacy スキーマのため、運用で手動削除が必要）を確認し、不要なレコードはクリーニングする。
8. **Touch クライアント SSE 確認**  
   - `curl -N -H 'Accept: text/event-stream' -H "ClientUUID:$UUID" "$BASE_URL/chart-events"` で SSE 接続を開始し、起動直後にリプレイされるイベント `retry:` 行を確認。`Last-Event-ID` を指定した再接続も試行する。  
   - PVT 登録操作を実施し、`event: pvt.updated` が SSE 経由で届くこと、`data:` の JSON が `ChartEventModel` スキーマ（`server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java`）と一致することを確認。  
   - `event: chart-events.replay-gap` を受信した場合は対象施設の来院リストが欠落しているため、直ちに `curl -H "ClientUUID:$UUID" "$BASE_URL/rest/pvt2/pvtList"` で最新状態を再取得し、クライアントへフルリロードのガイダンスを表示する。処置内容をオペレーションログへ残す。Web/Touch のリロード UX は `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md#6-chart-eventsreplay-gap-受信時のリロード-ux` を参照して案内する。  
   - Touch UI 側で例外イベント (`event: error.*`) の通知が表示されることを Worker C のログに従いスクリーンショットで保存。SSE 切断時は `ChartEventSseSupport` ログ (`TouchSSE-...`) に WARN が出ないかを確認する。
   - メトリクス監視（実測: `tmp/chart-event-metrics-20260622.{csv,json}`）:  
     - `chartEvent.history.retained{facility=<fid>}`（`sequence - oldestHistoryId`）の 24h ローカル計測では平均 15 / p95 79 / 上限 100（欠落 6 回）であった。結果をもとに `ops/monitoring/chart-event-alerts.yml` へ Warning=85 (10 分継続)・Critical=98 (3 分継続) を設定済み。  
     - Alertmanager で `ChartEventHistoryRetentionWarning` を受信した場合: 10 分以内に `chart-events` SSE の Last-Event-ID を再確認し、受付/Touch UI の自動リロードが成功しているかを `ReceptionReloadAudit` ログから確認。必要に応じて `/rest/pvt2/pvtList` を手動実行し、結果を Ops Slack へ共有する。  
     - `ChartEventHistoryRetentionCritical` または `ChartEventHistoryGapDetected`（`increase(chartEvent.history.gapDetected[5m]) > 0`）が発火した場合: 直ちに対象施設の接続を停止→`/rest/pvt2/pvtList` を強制リロード→`chart-events.replay-gap` 通知に従いユーザーへ再同期を案内する。Incident 記録へ Alert ID・施設・`gapDetected` カウンター値を追記する。  
     - Counter `chartEvent.history.gapDetected{facility=<fid>}` が増加した場合はゼロから +1 された瞬間の `gapEvents`（Summary JSON）と突合し、Runbook この節の記録テンプレートに沿って Ops 日誌へ残す。  
   - 履歴バッファ検証:  
     1. SSE ストリームの `id:` 行から最新 ID を `LAST_ID` として控える。  
     2. `TEST_ID=$((LAST_ID-120))` を計算し、`curl -N -H 'Accept: text/event-stream' -H "ClientUUID:$UUID" -H "Last-Event-ID:$TEST_ID" "$BASE_URL/chart-events"` を再実行して 100 件（`HISTORY_LIMIT`）を超えるギャップを擬似的に作る。  
     3. 再接続時に `ChartEventSseSupport` が `WARN SSE history gap detected for facility ...` を出力し、Counter が +1 されることを確認（例: `promtool query instant 'chartEvent.history.gapDetected{facility="$FID"}'`）。  
     4. ギャップ > 100 で警告が出た場合はただちに `curl -H "ClientUUID:$UUID" "$BASE_URL/rest/pvt2/pvtList"` で来院リストをフルリロードし、オペレーションログへ「SSE gap >100 によりリロード実施」と記録する。  
     5. ギャップが 100 件未満であればカウンター増加は発生せず、そのまま SSE を継続しリロードは不要。  
   - 10 分以上の通信断や `Last-Event-ID` が大きく古い状態で復帰した場合は常に `/rest/pvt2/pvtList` を再取得し、`sequence` ギャップを Ops 手順書に記録すること。

### Touch 来院履歴 API（2025-11-04 更新）

- 対象エンドポイント: `GET /touch/patient/firstVisitors`, `/visit`, `/visitRange`, `/visitLast`。互換目的で `{param}` 版も並行提供するが、**新規実装は QueryParam 版を利用すること**。
- クエリパラメータ仕様
  - `facility`（任意）: 指定時は `HttpServletRequest#getRemoteUser()` の施設 ID と一致している必要がある。不一致の場合は 403 (`施設突合失敗`) を返し監査へ記録。
  - `offset` / `limit`: デフォルト 0 / 50。`limit` の最大値は 1000。上限超過時は 400 (`limit` エラー)。
  - `sort`: `firstVisit`（firstVisitors）, `pvtDate` or `patientKana`（visit 系）。`order` は `desc`（既定）/`asc`。
  - `from`/`to`: `visitRange`・`visitLast` の必須パラメータ。`yyyy-MM-ddTHH:mm:ss` を受け付け、日付のみ指定時は `T00:00:00`/`T23:59:59` に補完する。
  - `fallbackDays`: `visitLast` の再検索日数。既定 6 日・最大 14 日。結果が空でも 0 を指定した場合は再検索しない。
- 認可・監査・計測
  - ロール: `TOUCH_PATIENT_VISIT` または `ADMIN` を要求。未付与の場合は 403 とし、監査は `action=来院履歴照会` `details.reason=forbiddenRole` を記録。
  - 監査イベント: 成功時は `action=来院履歴照会`、施設不一致時は `action=施設突合失敗`。`visitLast` では `details.fallbackApplied` で前日再検索の有無を確認できる。
  - Micrometer: `touch_api_requests_total`（counter）、`touch_api_requests_error_total`、`touch_api_request_duration`（timer）へ `endpoint` / `outcome` / `error` タグ付きで送出する。
- テスト: `server-modernized/src/test/java/open/dolphin/touch/DolphinResourceVisitTest.java` に施設突合、権限不足、Fallback、XML 出力のケースを追加。Runbook 参照時は `mvn -pl server-modernized test -Dtest=DolphinResourceVisitTest` の実行ログを添付する。
- **2025-11-06 追記**  
  - `TouchModuleService` が `ModuleModel#getModel()` にキャッシュされた `StampModel` を扱う際、内部の Stamp XML を `IOSHelper#xmlDecode` で展開し `BundleDolphin` を復元するよう調整済み。レガシー版と同じ RP モジュール／Schema 変換が行われることを `TouchModuleResourceTest` で再確認する。  
  - 既存の `/touch/module/*` エンドポイント監査ログ（`TouchModuleAuditLogger`）に変更はないが、キャッシュヒット時も `bundle.getOrderName()` の補完が実行されるため、薬剤オーダーの `orderName` 欄が欠落しないことを UI でスポットチェックする。  
  - iOS Touch 向け JSON ペイロードのデシリアライズは `server-modernized/src/main/java/open/dolphin/adm10/converter/` 配下の `IMKDocument`・`IMKDocument2`・`ISendPackage2` へ移管済み。旧 `server/` 実装と同じフィールド構造／`ObjectMapper` 設定（`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES=false`）を適用しているため、互換検証では `/20/adm/jtouch/sendPackage(2)` と `/20/adm/jtouch/mkdocument(2)` の JSON 差分を `JsonTouchResourceParityTest` で比較し、未知フィールドを含む iOS クライアントからのリクエストでもエラーにならないことを確認する。差異が出た場合はモジュール側の Jackson 設定を Legacy と同一に揃える。


### 4.2 EHTResource シナリオ一覧（2025-11-03 追加）

| ID | 対象カテゴリ | ステータス | 備考 |
| --- | --- | --- | --- |
| EHT-RUN-20251103-ALL | アレルギー CRUD (`/20/adm/eht/allergy*`) | Pending | `curl` シナリオ作成済み。監査イベント `EHT_ALLERGY_*` 発火確認は Maven 導入後に実施。 |
| EHT-RUN-20251103-DG | 病名 CRUD (`/20/adm/eht/diagnosis*`) | Pending | SQL トランザクション確認待ち。監査イベント `EHT_DIAGNOSIS_*`。 |
| EHT-RUN-20251103-MEMO | 患者メモ CRUD (`/20/adm/eht/memo*`) | Pending | Legacy と同一 JSON の往復確認中。`EHT_MEMO_*` 監査ログを比較予定。 |
| EHT-RUN-20251103-DOC | 文書取得／削除 (`/docinfo`, `/document(2)`, `/freedocument`, `/attachment`) | Pending | レスポンス順序・削除連鎖の比較を `psql` + `curl` で実施予定。 |
| EHT-RUN-20251103-MOD | モジュール収集 (`/module/*`, `/order/{param}`, `/interaction`) | Pending | Legacy SQL の `order by` 条件差異なし。外部 ORCA 接続待ち。 |
| EHT-RUN-20251103-LAB | ラボ関連 (`/module/laboTest`, `/item/laboItem`) | Pending | SSMIX2 連携環境が未復旧。レスポンス整形のユニットテスト追加予定。 |
| EHT-RUN-20251103-PT | 患者一覧 (`/patient/firstVisitors`, `/patient/pvt`, `/patient/documents/status`, `/karteNumber`, `/lastDateCount`) | Pending | レポート CSV の件数差異確認を Worker E が担当。 |
| EHT-RUN-20251103-EVT | 来院イベント (`/pvtList`, `/progresscourse`) | Pending | SSE と連動した検証を PVT ワーカーと調整中。 |
| EHT-RUN-20251103-CFG | 設定 (`/claim/conn`, `/serverinfo`) | Pending | 旧サーバー `custom.properties` の値を転送し、レスポンス比較するタスクをインフラへ依頼。 |
| EHT-RUN-20251103-STAMP | スタンプ取得 (`/stamp*`) | Pending | JSON 変換の差分確認を Worker C が担当。 |
| EHT-RUN-20251103-PHY | 身体所見 (`/physical` POST/DELETE/GET) | Pending | `EHTResourceTest.postPhysicalCreatesObservationsAndLogsAudit` 追加済（Maven 未導入のため未実行）。 |
| EHT-RUN-20251103-VITAL | バイタル (`/vital` GET/POST/DELETE) | Pending | `EHTResourceTest.postVitalRecordsAudit` 追加済（Maven 未導入のため未実行）。 |
| EHT-RUN-20251103-CLAIM2 | CLAIM 送信 (`/sendClaim`, `/sendClaim2`) | Pending | `EHTResourceTest.sendClaimWithoutDocumentLogsChartEvent` で監査ログを検証予定。JMS 実送信ログは Staging MQ 復旧後に確認。Compose 並列環境での再現ログとフォールバック分析は `docs/server-modernization/phase2/notes/messaging-parity-check.md`（`ops/tools/jms-probe.sh` 実行例・`artifacts/parity-manual/JMS/20251108T210639Z/`）を参照し、同手順を Gate チェックへ組み込むこと。 |

### 4.3 JavaTime 出力検証（2026-06-18 追加）

> 目的: JavaTimeModule 適用後も監査ログと ORCA/Touch 連携レスポンスが ISO8601 形式（`WRITE_DATES_AS_TIMESTAMPS=false`）を維持しているかを Stage/Prod で継続的に確認する。

1. **準備**  
   - `BASE_URL_LEGACY` / `BASE_URL_MODERN` / `PARITY_HEADER_FILE` を `.env` で指定し、Python スクリプトは使用せず Bash から `ops/tools/send_parallel_request.sh` を呼び出す。  
   - Stage 接続に必要な Bearer は `ops/tests/api-smoke-test/headers/javatime-stage.headers.template` をコピーして `.../javatime-stage.headers` を生成し、ローカル保管（`.gitignore` 済み）。2025-11-07 時点では Stage トークン未共有のため Dry-Run のみ実施 (`tmp/java-time/logs/java-time-sample-20251107-dry-run.log`)。トークン受領後はファイルへ直接貼り付け、リポジトリへはコミットしない。  
   - 監査ログ採取用に `docker compose exec modernized-db psql -U dolphin -d opendolphin` が実行できることを確認。  
   - 取得物の保存先: `artifacts/parity-manual/JAVATIME_*`（HTTP 応答）、`tmp/java-time/audit-$(date +%Y%m%d).sql`（SQL 出力）、`tmp/java-time/logs/`（CLI や Grafana/Loki/Elastic のログ）。Evidence への転記前に 30 日保持ルールを順守する。
2. **監査ログサンプル（d_audit_event）**  
   ```bash
   docker compose exec modernized-db psql -U dolphin -d opendolphin <<'SQL' \
     | tee tmp/java-time/audit-$(date +%Y%m%d).sql
   SELECT id,
          event_time,
          action,
          payload::jsonb ->> 'issuedAt' AS issued_at_iso,
          payload::jsonb #>> '{orcaRequest,requestedAt}' AS orca_requested_at
     FROM d_audit_event
    WHERE action IN ('ORCA_INTERACTION','TOUCH_SENDPACKAGE','TOUCH_SENDPACKAGE2')
    ORDER BY event_time DESC
    LIMIT 20;
   SQL
   ```
   正規表現 `^\d{4}-\d{2}-\d{2}T.*[+-]\d{2}:\d{2}$` に一致しない行は `notes/touch-api-parity.md` §9 と同じフローでエスカレーションする。
3. **ORCA 連携 (`PUT /orca/interaction`)**  
   ```bash
   BASE_URL_MODERN=https://stage.backend/opendolphin/api
   curl -sS -X PUT "$BASE_URL_MODERN/orca/interaction" \
     -H 'Content-Type: application/json' \
     -H 'X-Trace-Id: java-time-orca-'"$(date +%s)" \
     -H 'Authorization: Bearer <token>' \
     -d '{"codes1":["620001601"],"codes2":["610007155"],"issuedAt":"'"$(date --iso-8601=seconds)"'"}' \
     | tee tmp/java-time/orca-response.json
   jq -r '.issuedAt, .result[].timestamp' tmp/java-time/orca-response.json
   ```
   - 取得した `X-Trace-Id` をキーに `d_audit_event` を確認（手順 2 の SQL に `AND request_id='<traceId>'` を追加）。  
   - ORCA DB が未接続の場合は `ops/tests/api-smoke-test/test_config.manual.csv` のスタブケースを使用し、Legacy 側レスポンスとのフィールド比較を行う。
4. **Touch sendPackage (`POST /touch/sendPackage*`)**  
   ```bash
   export BASE_URL_LEGACY=http://legacy.local:8080/opendolphin/api
   export BASE_URL_MODERN=https://stage.backend/opendolphin/api
   export PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/javatime-stage.headers
   export PARITY_BODY_FILE=tmp/sendPackage-probe.json
   cat >"$PARITY_BODY_FILE" <<'JSON'
   {
     "issuedAt": "2026-06-18T09:30:00+09:00",
     "patientId": "000001",
     "department": "01",
     "bundleList": []
   }
   JSON
   ./ops/tools/send_parallel_request.sh POST /touch/sendPackage JAVATIME_TOUCH_001
   ./ops/tools/send_parallel_request.sh POST /touch/sendPackage2 JAVATIME_TOUCH_002
   ```
   - `jq -r '.issuedAt' artifacts/parity-manual/JAVATIME_TOUCH_001/*/response.json` で Legacy/Modern を比較し、差分があればファイルごと `tmp/java-time/diffs/` に保存。  
   - 監査イベント（`action=TOUCH_SENDPACKAGE*`）を `psql` で追跡し、`payload` 内の `bundleList[].startedAt` `completedAt` も ISO8601 であることを確認する。

### 4.4 MML Letter/Labtest パリティ確認（2025-11-16 RUN_ID=20251116T134354Z）

> 目的: `/mml/letter{list,json}` および `/mml/labtest{list,json}` の Legacy/Modernized パリティを証跡化し、EXT-03（紹介状/MML）ギャップをクローズする。

1. **準備**  
   - `server/src/main/java/open/dolphin/rest/MmlResource.java` および `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java` を確認し、対象 4 メソッドが 1:1 で移植されていることを確認。  
   - Legacy レスポンス参照: `tmp/parity-letter/letter_get_legacy.json`（Letter JSON）、`artifacts/parity-manual/lab/20251112TlabReportZ1/lab_module_fetch/{legacy,modern}/response.json`、`ops/tests/fixtures/adm/adm10/labo_item.json`。  
   - 証跡格納先: `artifacts/external-interface/mml/<RUN_ID>/{letter_list,letter_json,labtest_list,labtest_json}/`。RUN_ID=`20251116T134354Z` では README とディレクトリを初期化済み。
   - 認証ヘッダー: `tmp/parity-headers/mml_TEMPLATE.headers`（`password: 632080...` は `doctor2025` の MD5）。RUN_ID ごとに `cp tmp/parity-headers/mml_TEMPLATE.headers tmp/parity-headers/mml_<RUN_ID>.headers` し、`PARITY_HEADER_FILE` へ設定する。`X-Facility-Id` を削除しないこと。
2. **実測取得手順（Docker ブロッカー解除後に実施）**  
   ```bash
   export BASE_URL_LEGACY=http://legacy.local:8080/openDolphin/resources
   export BASE_URL_MODERN=http://modern.local:9080/openDolphin/resources
   export PARITY_HEADER_FILE=tmp/parity-headers/mml_${RUN_ID}.headers
   cp tmp/parity-headers/mml_TEMPLATE.headers "$PARITY_HEADER_FILE"
   ./ops/tools/send_parallel_request.sh GET /mml/letter/list/1.3.6.1.4.1.9414.72.103 MML_LETTER_LIST
   ./ops/tools/send_parallel_request.sh GET /mml/letter/json/8 MML_LETTER_JSON
   ./ops/tools/send_parallel_request.sh GET /mml/labtest/list/1.3.6.1.4.1.9414.72.103 MML_LABTEST_LIST
   ./ops/tools/send_parallel_request.sh GET /mml/labtest/json/90010001 MML_LABTEST_JSON
   ```  
   - 取得ファイルを `artifacts/external-interface/mml/<RUN_ID>/<endpoint>/{legacy,modern}/response.json` として保存。  
   - `diff -u legacy/response.json modern/response.json > .../<endpoint>.diff` を生成し、差分が無いことを証跡化。  
   - CSV (`list`) エンドポイントは `legacy.txt` / `modern.txt` で ID 並びも比較。
3. **完了条件**  
   - 4 エンドポイントすべてで Legacy/Modernized 応答と diff ファイルが `artifacts/external-interface/mml/<RUN_ID>/` に揃っている。  
   - `docs/server-modernization/phase2/operations/logs/<RUN_ID>-mml.md`（例: `20251116T134354Z-mml.md`）に取得手順・結果が追記済み。  
   - `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md` EXT-03 行と `DOC_STATUS` W22 備考が `[証跡取得済]` に更新されている。  
   - 監査 ID（`LETTER_EXPORT_*`, `LABTEST_EXPORT_*`）の実装確認が完了し、AuditTrail で 200 応答が検証されている。
5. **ops/tests/api-smoke-test 連携**  
   - `PARITY_OUTPUT_DIR=artifacts/parity-manual/java-time` として `./ops/tools/send_parallel_request.sh` を再実行し、`README.manual.md` 手順に沿って差分を `diff -u` で取得。  
   - `test_config.manual.csv` へ `JAVATIME_ORCA_001` / `JAVATIME_TOUCH_001` を追記済みの場合は該当 ID を使用し、レポートを `PHASE2_PROGRESS.md` と `notes/worker-directives-20260614.md` へリンクする。`headers/javatime-stage.headers.template` を Stage トークン込みで複製したファイルを `PARITY_HEADER_FILE` に指定する。  
6. **自動採取スクリプト（任意）**  
   - `ops/monitoring/scripts/java-time-sample.sh` を `JAVA_TIME_BASE_URL_MODERN=https://stage.backend/opendolphin/api` など必要な環境変数付きで実行すると、手順 2〜4 を一括自動化できる。`JAVA_TIME_OUTPUT_DIR=tmp/java-time/$(date +%Y%m%d)` を指定すると日付単位で保存可能。`--dry-run` で事前にログを確認し、本実行は Cron（`docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` §1.5）へ登録する。  
   - 出力物（`tmp/java-time/audit-YYYYMMDD.sql`, `tmp/java-time/orca-response-YYYYMMDD.json`, `tmp/java-time/touch-response-YYYYMMDD.json`）を Evidence へ保存し、`PHASE2_PROGRESS.md` の当日欄へ「JavaTime 監視 OK/NG」を記載する。
7. **結果の共有とエスカレーション**  
   - すべての出力が ISO8601 である場合は `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の当日欄へ「JavaTime 監視 OK」と記入し、Grafana/Loki/Elastic のスクリーンショットを Evidence へ添付。  
   - 差分が見つかった場合は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead → Security/Compliance の順で連絡し、詳細は `notes/touch-api-parity.md` §9 の手順に従う。

### 4.5 WebORCA トライアル接続（2025-11-15 更新）

1. **接続先と資格情報**  
   - 検証対象は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に記載された開発用 ORCA サーバー。
   - 認証は HTTP Basic のみ。公式情報は `assets/orca-trialsite/raw/trialsite.md` を参照し、利用不可機能（CLAIM 送信・CSV 生成など）を把握してから作業する。  
   - Evidence へコマンドを記録する際は `--user <MASKED>` などマスク表記を使い、生の資格情報は履歴に残さない。
2. **ヘルスチェック**  
   - `dig <HOST>` と `openssl s_client -connect <HOST>:<PORT> -servername <HOST>` を実行し、結果を `artifacts/orca-connectivity/<RUN_ID>/dns/` と `tls/` に保存する。  
   - `curl -u "user:pass" -H 'Content-Type: application/json; charset=Shift_JIS' -X POST '<URL>/api/api01rv2/system01dailyv2?class=00' --data-binary '@/tmp/system01dailyv2.json'` を実行し、`trial/system01dailyv2.{headers,json}` と `trace/system01dailyv2.trace` を取得する（接続情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 参照）。
3. **モダナイズ版サーバー設定**  
   - `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` の `claim.host`, `claim.send.port`, `claim.scheme`, `claim.conn=server`, `claim.send.encoding=MS932` を確認し、`ServerInfoResource` の結果を `artifacts/.../serverinfo/claim_conn.json` に保存（値は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 参照）。  
   - CRUD を実行する場合は Runbook §4.3 を参照し、`artifacts/orca-connectivity/<RUN_ID>/data-check/` に before/after と操作理由を残す。
4. **Evidence と報告**  
   - `trial/` ディレクトリ構成（例: `trial/appointmodv2/{request,response}.http`、`trace/appointmodv2.trace`、`screenshots/appoint_before.png`）を統一し、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` からリンクする。  
   - `docs/web-client/planning/phase2/DOC_STATUS.md` と `PHASE2_PROGRESS.md` にはトライアル方針・RUN_ID・CRUD 内容を記載し、Blocker は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順に連絡する。

### 4.6 ORCA API 有効化トリアージ（2025-11-13 追加）

| ID | 対象カテゴリ | ステータス | 備考 |
| --- | --- | --- | --- |
| ORCA-API-ENABLE-20251113 | WebORCA `/api21` `/orca31` `/orca06` POST 405 | Open | API 有効化情報：`docs/server-modernization/phase2/notes/orca-api-field-validation.md` §6（システム管理サイトでの API キー／証明書確認、push-exchanger / onshi / CLAIM Receiver `config.yml` の `:api_server`/`:api_path`/`:use_weborca` 再点検、`X-Hybridmode` でのモード判定手順）を参照。405 発生時は (1) API キー・証明書の期限、(2) `config.yml` の `:api_path` が `/api/api21/*` へ向いているか、(3) Hybrid 応急措置モードに落ちていないかを evidence として残す。必要に応じて ORCA 側に `receipt_route` / `API_ENABLE_*` の公開手順問い合わせを Escalate。 |

#### /api/apiXX プレフィックス結果（2025-11-13, RUN_ID=`20251113TorcaApiPrefixW37`）

- 実施目的: `/api21/*` では `405 Method Not Allowed` となる既知事象に対し、`/api/apiXX/*` プレフィックスで別ハンドラが呼ばれるか確認し、Runbook §4.5 の証跡を補強する。
- 証跡: `artifacts/orca-connectivity/20251113T015626Z/api-prefix-test/`（ヘッダー: `_headers.txt`, 本文: `_body.json`）。
- 条件: `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1` を使用。`Content-Type: application/json; charset=Shift_JIS` とし、`tmp/orca-api-payloads/*_payload.json` を `--data-binary` で送信（`assets/..._request.json` をそのまま送ると WebORCA 側で XML 変換処理が panic し応答が落ちるため）。

| エンドポイント | HTTP | Allow | 所見 | Evidence |
| --- | --- | --- | --- | --- |
| `POST /api/api21/medicalmodv2?class=01` | 200 (`Api_Result=10`) | なし | REST ハンドラが応答し `Api_Result_Message="患者番号に該当する患者が存在しません"`。`X-Hybridmode: normal`。患者レコード未投入だが API 自体は動作。 | `.../api21_medicalmodv2_{headers,body}` |
| `POST /api/api11/acceptmodv2?class=01` | 404 | なし | WebORCA が `{"message":"APIが存在しません"}` を返却し、`/api/api11` ルートは未公開。 | `.../api11_acceptmodv2_{headers,body}` |
| `POST /api/api14/appointmodv2?class=01` | 404 | なし | `acceptmodv2` 同様に 404。`Allow` ヘッダーも返らず、メソッド情報は得られず。 | `.../api14_appointmodv2_{headers,body}` |

- 所見: `/api/api21/*` のみ Basic 認証後に REST ハンドラへ到達し 200 応答を取得。`/api/api11` と `/api/api14` は 404 で API 未公開のまま。`Allow` ヘッダーが空であるため、WebORCA 側の公開可否は管理ツール設定の確認が必要。405 ルートの切替検証が完了したため、今後は ORCA API Enable (ID=ORCA-API-ENABLE-20251113) の対処方針に沿ってキーパラメータの棚卸しを継続する。
  - 追加資料: `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md`（firecrawl オフライン仕様）、`manifest.json`（slug マッピング）、`orca-api-matrix.with-spec.csv`（優先度マトリクス連携）。

- **2025-11-13 14:48 JST（RUN_ID=`20251113TorcaApi21LogW55`）**: `export PATIENT_ID_TEST=0000001` を設定したうえで `curl -u <DEV_ORCA_BASIC> -H 'Content-Type: application/xml; charset=UTF-8' --data-binary @tmp/orca-api-payloads/03_medicalmodv2_payload.xml http://localhost:8000/api/api21/medicalmodv2?class=01` を実行。HTTP 200 でも `Api_Result=10` が継続し、`/opt/jma/weborca/log/{http.log,orca_http.log}` の tail（`artifacts/orca-connectivity/20251113T054823Z/api21_logtrace/{http_log_tail.txt,orca_http_log_tail.txt}`）には `API-:orca  ormaster medicalmodv2 ORAPI021S1V2 false` から `DestroyContext` までのイベントのみが出力された。`tbl_ptinf` や患者検索 SQL 行は一切出現せず、WebORCA 側で Patient_ID 参照そのものが行われていないことが再確認できた（接続先・認証詳細は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 参照）。

## 6. 更新フロー

1. 新たな API をモダナイズ版へ追加した場合、開発完了時点で `API_PARITY_MATRIX.md` を更新し、レガシー側に該当 API が存在しない場合は「モダナイズのみ」セクションへ追記する。  
2. 外部システムとの契約やエンドポイントが変更になった場合、本ランブックの該当箇所（設定手順／外部連携テスト）を更新し、`docs/web-client/README.md` からリンクされていることを確認する。  
3. 年次監査やリグレッションテストの結果は `PHASE2_PROGRESS.md` に追記し、次回切替時のチェックリストとして再利用する。

## 7. 参考ドキュメント

- `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`
- `docs/server-modernization/rest-api-modernization.md`
- `docs/server-modernization/api-smoke-test.md`
- `docs/server-modernization/external-integrations/3_6-external-service-modernization.md`
- `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`
- `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md`
- `docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md`
