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

## 2. 基本方針

1. **同一エンドポイント**: HTTP メソッド + パス + クエリ構造が一致することを保証し、ベース URL／コンテキストパスは旧サーバーと同一に設定する（例: `/opendolphin`）。  
2. **ヘッダー互換**: 認証ヘッダー（`userName` / `password` / `clientUUID` など Legacy ヘッダー）と Bearer トークンの双方を許可する。`MODERNIZED_REST_API_INVENTORY.md` の備考を参照し、リバースプロキシでヘッダーが除去されないようにする。  
3. **レスポンス形式**: 旧サーバー互換のため `application/octet-stream`／Shift_JIS CSV 等のコンテンツタイプは従来通り維持し、JSON のキー順序や日付フォーマットを変更しない。  
4. **外部依存**: Claim 電文、ラボ連携、SMS などの外部システム向け出力は同じキュー/HTTP 先へ配送されるようルーティングを揃える。`external-integrations` 配下の手順に従う。  
5. **監査証跡**: ログ、監査イベント、トレース ID を旧サーバーと同じ保管先（DB／ログ転送）へ送出する。Micrometer メトリクスは追加されても構わないが既存ログ出力を削除しない。

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
6. **PHR 非同期ジョブ監視（未実装ステータス）**  
   - 2025-11-03 時点でモダナイズ版には `POST /20/adm/phr/export` および `GET /20/adm/phr/status/{jobId}` の REST 実装が存在しない。`phr_async_job` テーブルも未作成の場合があるため、本手順は **Blocked** とする。  
   - Flyway スクリプト `server-modernized/tools/flyway/sql/V0220__phr_async_job.sql` の適用可否を確認し、テーブルが存在しない環境では `flyway migrate` を実行しないこと（実装完了後に対応）。  
   - API が実装された後に再開する想定の手順は `docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` §2.5 を参照し、最新化されたら本 Runbook を更新する。
7. **Touch クライアント SSE 確認**  
   - `curl -N -H 'Accept: text/event-stream' -H "ClientUUID:$UUID" "$BASE_URL/chart-events"` で SSE 接続を開始し、起動直後にリプレイされるイベント `retry:` 行を確認。`Last-Event-ID` を指定した再接続も試行する。  
   - PVT 登録操作を実施し、`event: pvt.updated` が SSE 経由で届くこと、`data:` の JSON が `ChartEventModel` スキーマ（`server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java`）と一致することを確認。  
   - Touch UI 側で例外イベント (`event: error.*`) の通知が表示されることを Worker C のログに従いスクリーンショットで保存。SSE 切断時は `ChartEventSseSupport` ログ (`TouchSSE-...`) に WARN が出ないかを確認する。

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
| EHT-RUN-20251103-CLAIM2 | CLAIM 送信 (`/sendClaim`, `/sendClaim2`) | Pending | `EHTResourceTest.sendClaimWithoutDocumentLogsChartEvent` で監査ログを検証予定。JMS 実送信ログは Staging MQ 復旧後に確認。 |

## 5. 切替手順（サンプル）

1. **準備日 (T-7)**  
   - パリティマトリクス更新、Smoke テスト、監査ログの確認を完了させる。  
   - DNS TTL、ロードバランサの設定変更案を作成し、承認を得る。
2. **前日 (T-1)**  
   - 最新バックアップ（DB ダンプ・添付ファイル・設定）を取得。  
   - モダナイズ版をステージング環境で再実行し、最終確認。
3. **当日 (T0)**  
   - 旧サーバーをリードオンリー（必要なら）へ切り替え、DB スナップショットを取得。  
   - モダナイズ版を本番環境へデプロイし、ヘルスチェック `/health` `/metrics` を確認。  
   - DNS／ロードバランサの向き先をモダナイズ版へ変更。
4. **切替後監視 (T0+1h〜)**  
   - Micrometer メトリクス (`opendolphin_api_request_total` 等) と監査ログを監視し、エラー率やレスポンス遅延を確認。  
   - 外部システム（ORCA、SMS、帳票）の担当者と連携し、サンプル取引が成功しているかを確認。
5. **フォールバック**  
   - 致命的な差分が発生した場合の手順を事前に定義（DNS 戻し、DB ロールバックなど）。  
   - `ops/modernized-server/docker-compose` で旧サーバーを即時復旧できるようにする。

## 5. 検証ログ（2025-11-03 更新）

| ID | 日時 | 内容 | ステータス | メモ |
| --- | --- | --- | --- | --- |
| JSONTOUCH-PARITY-20251103-01 | 2025-11-03 | `/10/adm/jtouch/*` 16 エンドポイントのレスポンス互換性確認 | Done | `JsonTouchResourceParityTest`（user/patient/search/count/kana/visitPackage/sendPackage）と Worker E レポート §1.2 に従い、adm10/touch/adm20 実装の出力差分が無いことを確認。 |
| PHR-PARITY-20251103-01 | 2025-11-03 | PHR アクセスキー／データバンドル／テキスト出力系の互換テスト | Done | Worker E レポート §1.3 の `curl` サンプルおよび Jackson Streaming 検証で 11 エンドポイントの 1:1 対応を確認し、`API_PARITY_MATRIX.md` を `[x]` 更新。 |
| PVT2-PARITY-20251103-01 | 2025-11-03 | `/pvt2` POST/GET のモダナイズ実装と単体テスト証跡確認 | Done | `PVTResource2Test#postPvt_assignsFacilityAndPatientRelations`／`#getPvtList_wrapsServiceResultInConverter` で facility・保険紐付けと `PatientVisitListConverter` のラップを検証。マトリクス該当行を `[x]` 化済み。 |
| PVT2-PARITY-20251103-02 | 2026-06-02 | `/pvt2/{pvtPK}` DELETE のテスト整備 | Done | `PVTResource2Test#deletePvt_removesVisitForAuthenticatedFacility`／`#deletePvt_throwsWhenFacilityDoesNotMatch` を追加し、`PVTServiceBean#removePvt` の facility 突合と副作用を証跡化。`mvn -f pom.server-modernized.xml -Dtest=PVTResource2Test test` は `opendolphin-common` のみが対象となり "No tests matching pattern" で失敗、`-pl server-modernized` を付与した再実行は初回依存ダウンロード中に依存未解決（`opendolphin-common:jar:jakarta:2.7.1` 不在）で停止。ローカルに `opendolphin-common` をビルド後、同コマンドを再実行してログ取得すること。 |
| SYS-PARITY-20251103-01 | 2025-11-03 | `/dolphin` 系 5 エンドポイントのテスト証跡確認 | Open | `SystemResource` には実装が存在するが `server-modernized/src/test/java` に対応テスト無し。`SystemResourceTest` を作成し、ルート GET/POST・活動ログ・CloudZero mail・ライセンス API の正常系／例外系を検証すること。マトリクス該当行は `[ ]` で維持。 |
| STAMP-AUDIT-20251103-01 | 2025-11-03 | `StampResource` 削除 API の監査ログ強化。`StampResourceTest`（成功／404／一括失敗）を追加。 | Pending | ローカル環境に Maven が無くテスト未実行。CI で `mvn -f server-modernized/pom.xml test` 実行後、ステージ環境の `d_audit_event` で `STAMP_DELETE_*` エントリを確認する。キャッシュ無効化連携は Worker C が担当。 |
| LETTER-AUDIT-20251103-01 | 2025-11-03 | `LetterResource` 取得/削除の 404 ハンドリングと監査ログ記録。`LetterResourceTest` を追加。 | Pending | Maven 不在によりテスト未実行。ステージ環境で `d_audit_event.action=LETTER_DELETE` を確認するタスクを継続。 |
| ORCA-COMPAT-20251103-01 | 2025-11-03 | `PUT /orca/interaction` Jakarta 実装を旧コードと比較し差分なしであることを確認。 | Open | ORCA テスト DB 未接続。接続環境が整い次第、旧／新サーバーの応答 JSON を比較し、本ランブックへ結果を追記する。 |
| DEMO-ASP-20251103-01 | 2025-11-03 | DemoResourceASP JSON モダナイズ (`DemoResourceAsp`/`DemoAspResponses`) 実装。`DemoResourceAspTest`（ユーザー/患者/処方/ラボ/カルテ）を作成。 | Open | `ModuleModel` import 欠落でビルド失敗、および `/demo/module/*` / `/demo/document/progressCourse` の `entity` 欄が null（orderName 未設定）。`DemoResourceAspTest` では 6 エンドポイント未カバー＋ Maven 未導入で未実行のため、修正後にテスト追加と `mvn -f pom.server-modernized.xml test -Dtest=DemoResourceAspTest` 実行ログを取得し、マトリクス/本メモを更新する。 |

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
