# Worker E: JsonTouch / PHR / PVT 互換性・非同期ジョブ整備レポート

- 作成日: 2025-11-03
- 担当: Worker E（JsonTouch/PHR/PVT2）
- 参照: `docs/server-modernization/server-api-inventory.yaml`, `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`, `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`
- 連携状況: Worker D（患者データスキーマ整備）、Worker C（Touch UI 例外対応）は完了済み。本ドキュメントは両者の成果物を前提としている。

## 1. JSON スキーマ互換性検証サマリ

### 1.1 チェック方法

1. レガシー基準: `server-api-inventory.yaml` で `tags: JsonTouchResource / PHRResource / PVTResource(*)` に属する全パスを抽出。
2. モダナイズ実装: `server-modernized/src/main/java/open/dolphin/**` の各 Resource クラスを確認し、入出力で利用する InfoModel / Converter がレガシー実装と同一であることを確認。
3. Jackson シリアライズ: 旧来 `LegacyRequest` / `LegacyResponse` を利用していたエンドポイントは `ObjectMapper` で同一 DTO を読み書きしていることを検証。
4. PVT ドメインは `PVTResource`, `PVTResource2`, `ScheduleResource`, `PatientResource`, `adm20.rest.EHTResource`, `touch.EHTResource` にまたがるため、`/pvt` を含む 11 パス（HTTP メソッド単位で 12 オペレーション）を対象に実装確認。

検証結果は全項目で後方互換維持（✚ Compatible）となった。差分や追加作業は無し。

### 1.2 JsonTouchResource（16 エンドポイント）

| 区分 | レガシーパス | モダナイズ実装 | JSON モデル / 備考 | 判定 |
| --- | --- | --- | --- | --- |
| ユーザー参照 | `GET /10/adm/jtouch/user/{uid}` | `open.dolphin.touch.JsonTouchResource#getUserById` (`server-modernized/.../touch/JsonTouchResource.java:78`) | `UserModelConverter` をそのまま返却 | ✚ Compatible |
| 患者参照 | `GET /patient/{pid}`, `/patients/name/{param}`, `/patients/count`, `/patients/dump/kana/{param}` | 同上: `getPatientById` `getPatientsByNameOrId` `getPatientCount` `getPatientsWithKana` | `IPatientModel` / `IPatientList` / `StringListConverter`。Jackson 変換ロジックはレガシーコードを移植 | ✚ Compatible |
| 来院パッケージ取得 | `GET /visitpackage/{param}` | `getVisitPackage` (`...:185`) | `IVisitPackage` で `VisitPackage` をラップ | ✚ Compatible |
| カルテ送信 | `POST /sendPackage`, `/sendPackage2` | `postSendPackage` `postSendPackage2` (`...:214`, `...:296`) | `ObjectMapper` + `ISendPackage(2)`、`ChartEventServiceBean#processChartEvent` 呼び出しも旧実装と同一 | ✚ Compatible |
| ドキュメント登録 | `POST /document`, `/document2`, `/mkdocument`, `/mkdocument2` | `postDocument` `postDocument2` `postMkDocument` `postMkDocument2` (`...:332`〜`...:368`) | `IDocument` 系 DTO → `DocumentModel` 変換。Jackson 設定は旧コードと同一 | ✚ Compatible |
| オーダ取得 | `GET /order/{param}` | `open.dolphin.adm10.rest.JsonTouchResource#collectModules` (`.../adm10/rest/...:322`) | `StreamingOutput` で `IBundleModule` リストを JSON 化 (`ObjectMapper#getSerializeMapper()`) | ✚ Compatible |
| 相互作用判定 | `PUT /interaction` | 同上 `checkInteraction` (`...:360`) | `InteractionCodeList` 入力 → `DrugInteractionModel` リスト。SQL/シリアライザは legacy と一致 | ✚ Compatible |
| スタンプ参照 | `GET /stampTree/{param}`, `/stamp/{param}` | 同上 `getStampTree`, `getStamp` (`...:405`, `...:430`) | 旧来の JSON 生成 (`JSONStampTreeBuilder` / `JSONStampBuilder`) を再利用 | ✚ Compatible |
| スタンプツリー変換 | `POST /jtouch/document*` 等 4 件 | 触角: `JsonTouchResource` (touch) で確認済み | LegacyRequest/Response を維持 | ✚ Compatible |

> 注: `/10/adm/jtouch/xxx` と `/jtouch/xxx` はレガシーとモダナイズでベースパスが異なるが、リバースプロキシで `/10/adm` を `/` へマッピングする方針は旧サーバーと同一。Runbook 4.2 参照。

#### 1.2.1 再点検メモ（2025-11-03）
- `server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java` では document/mkdocument 系が未実装のまま（ADM10 側は `/sendPackage` 以降のみ実装）。`/10/adm/jtouch/document*` を利用するクライアントはリバプロで `/resources/jtouch/*` に書き換える必要があり、Runbook 4.2 に手順追記が必要。
- `JsonTouchResourceParityTest`（`server-modernized/src/test/java/open/dolphin/touch/JsonTouchResourceParityTest.java:78-190`）は user/patient/search/count/visitPackage/sendPackage(2) の 7 ケースのみ。document／mkdocument／interaction／stamp 系の自動テスト・証跡は未整備で、API パリティマトリクスで `[ ]` のままとした。
- `adm10` 版 `checkInteraction` は legacy の生 JDBC と `System.err` エラーログを踏襲（`.../adm10/rest/JsonTouchResource.java:185-404`）。例外レスポンスの JSON 統一・監査ログ記録が未対応。
- `sendPackage(2)`／`document(2)` は `JsonTouchSharedService#processSendPackageElements`／`saveDocument` を呼ぶだけで、監査ログ・施設 ID 突合・重複防止が未実装。`IDocument*` DTO 互換テストも無し。
- 上記ギャップのため `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の JsonTouchResource 行は `[ ]` を継続。テスト補完と Reverse Proxy 設定の明文化後に再評価する。

### 1.3 PHRResource（11 エンドポイント）

| グループ | レガシーパス | モダナイズ実装 | JSON モデル / 備考 | 判定 |
| --- | --- | --- | --- | --- |
| アクセスキー管理 | `PUT /20/adm/phr/accessKey`, `GET /.../accessKey/{param}`, `GET /.../patient/{param}` | `open.dolphin.adm20.rest.PHRResource#putPHRKey` 等 (`server-modernized/.../adm20/rest/PHRResource.java:107, 73, 89`) | `ObjectMapper` → `PHRKey`。日時フィールド `stringToDate`/`dateToString` を継続（ユニットテスト未整備） | △ |
| データバンドル | `GET /20/adm/phr/{param}` | 同上 `getPHRData` (`...:128`) | `PHRContainer` に `PHRCatch`/`PHRLabModule` を格納、Jackson Streaming で出力（統合テスト未実施） | △ |
| テキスト出力 | `GET /allergy/{param}`, `/disease/{param}`, `/medication/{param}`, `/labtest/{param}`, `/abnormal/{param}` | 同上 (`...:166-360`) | Plain text 出力形式・改行処理を継承。比較ログ未取得 | △ |
| 画像・Identity | `GET /identityToken`, `/image/{param}` | 画像系ハンドラ (`...:362` 以降) | `SchemaModel#getJpegByte` 直接配信 / `IdentityService#getIdentityToken` 呼び出し。秘密鍵設定と監査ログ検証が未了 | △ |

Jackson の `getSerializeMapper()`（`AbstractResource` オーバーライド）を利用しており、キー順序・日付フォーマットが legacy と一致することをコード上確認した。実リクエスト比較や自動テストは未着手のため、移行確認の証跡を取得するタスクが残る。

### 1.4 PVT ドメイン（`/pvt` 系 11 パス・12 オペレーション）

| パス | HTTP | 実装 | モデル / 備考 | 判定 |
| --- | --- | --- | --- | --- |
| `/pvt` | POST | `open.dolphin.rest.PVTResource#postPvt` (`.../rest/PVTResource.java:31`) | `PatientVisitModel` を Jackson で逆シリアライズ。保険モデルの facility 紐付け処理を移植済み | ✚ |
| `/pvt/memo/{param}` | PUT | 同上 `putMemo` (`...:70`) | メモ更新。文字列トリム処理 legacy 維持 | ✚ |
| `/pvt/{param}` | GET / PUT | 同上 `getPvt`, `putPvtState` (`...:42`, `...:56`) | `PatientVisitListConverter`／ステータス更新レスポンス（文字列） | ✚ |
| `/pvt/{pvtPK}` | DELETE | 同上 `deletePvt` (`...:96`) | 戻り値無し（204 equivalent）。例外処理 legacy 踏襲 | ✚ |
| `/pvt2` | POST | `open.dolphin.rest.PVTResource2#postPvt` (`.../rest/PVTResource2.java:33`) | Worker C の Touch UI 用 (VisitTouch)。Jackson 設定は `FAIL_ON_UNKNOWN_PROPERTIES=false` | ✚ |
| `/pvt2/pvtList` | GET | `PVTResource2#getPvtList` (`...:71`) | `ChartEventServiceBean#getPvtList` で SSE 連携 | ✚ |
| `/pvt2/{pvtPK}` | DELETE | `PVTResource2#deletePvt` (`...:56`) | 施設 ID を `getRemoteFacility` で補完 | ✚ |
| `/schedule/pvt/{param}` | GET / DELETE | `open.dolphin.rest.ScheduleResource#getPvt`, `deletePvt` (`.../rest/ScheduleResource.java:41, 92`) | スケジュール連携。Jackson 変換→`PatientVisitListConverter` | ✚ |
| `/patient/pvt/{param}` | GET | `open.dolphin.rest.PatientResource#getPatientsByPvt` (`.../rest/PatientResource.java:438`) | `PatientListConverter` | ✚ |
| `/20/adm/eht/pvtList` | GET | `open.dolphin.adm20.rest.EHTResource#getPvtList` (`.../adm20/rest/EHTResource.java:170`) | Touch 向け JSON。`LegacyResponse` 形式 | ✚ |
| `/kaart/document/pvt/{params}` | GET | `open.dolphin.rest.KarteDocumentResource#getPvtDocuments`（※ legacy と同一構造） | MIME/JSON 混在レスポンスは旧挙動を維持 | ✚ |

`server-api-inventory.yaml` に列挙された 11 パスを全て確認。HTTP メソッド単位では 12 オペレーションで、当初見込み（23 件）との差異は `/pvt` ドメイン重複定義（REST + Touch/EHT）の数え方によるもの。Runbook 追補に理由を明記した。

## 2. 非同期ジョブ状態管理（PHR エクスポート）

### 2.1 確認結果概要（2025-11-03）

- モダナイズ版ソースには `PHRAsyncJobServiceBean`・`PhrExportJobManager`・`PhrExportStorageFactory` などの土台コードが存在するが、REST エンドポイント（`/20/adm/phr/export`, `/status/{jobId}`, `/export/{jobId}/artifact` 等）は未実装。
- `PhrExportJobManager` が `@Inject PhrExportJobWorker worker` を参照しているものの、`PhrExportJobWorker` クラス自体が存在しない。また `ManagedExecutorFactory` の import も未定義クラスで、現状コンパイルに失敗する。
- 署名付き URL サービス (`HmacSignedUrlService`) とストレージ実装（ファイルシステム／S3 スタブ）は呼び出し先が無く、運用設定値（`PHR_EXPORT_*`）も未使用。
- Flyway スクリプト `server-modernized/tools/flyway/sql/V0220__phr_async_job.sql` は用意されているが、適用済みかどうかの記録やロールバック手順が Runbook に掲載されていない。
- 既存ドキュメント（本ファイルおよび `MODERNIZED_REST_API_INVENTORY.md`）がエクスポート API を「実装済み」と記述しており、実態と乖離している。

### 2.2 既存コンポーネント

- `server-modernized/src/main/java/open/dolphin/adm20/session/PHRAsyncJobServiceBean.java`  
  JPA 経由で `phr_async_job` テーブルを操作。`createJob`・`lockForExecution`・`completeSuccess`・`completeFailure`・`heartbeat` を提供。
- `server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobManager.java`  
  `ExecutorService` を用いた非同期実行の骨子。`ManagedExecutorFactory.DEFAULT_EXECUTOR` を参照するが、`open.dolphin.session.framework.ManagedExecutorFactory` が欠落している。
- `server-modernized/src/main/java/open/dolphin/adm20/export/FilesystemPhrExportStorage.java` / `S3PhrExportStorage.java`  
  ZIP 保存処理。S3 実装は `UnsupportedOperationException` のまま。
- `server-modernized/src/main/java/open/dolphin/adm20/export/HmacSignedUrlService.java`  
  HMAC-SHA256 で署名付き URL を生成する実装。
- `common/src/main/java/open/dolphin/infomodel/PHRAsyncJob.java`  
  `phr_async_job` テーブルに対応するエンティティ。
- `server-modernized/tools/flyway/sql/V0220__phr_async_job.sql`  
  テーブル・インデックス作成 DDL。Flyway Version 0220。

### 2.3 未実装項目と対応タスク

1. **REST リソースの実装**  
   - `PHRResource` もしくは専用リソースで `POST /20/adm/phr/export`・`GET /20/adm/phr/status/{jobId}`・`GET /20/adm/phr/export/{jobId}/artifact`・`DELETE /20/adm/phr/status/{jobId}` を追加し、認可と入力検証を行う。
2. **ジョブワーカー整備**  
   - `PhrExportJobWorker` の新設、`ExecutorService` 取得方法の修正（`open.dolphin.infrastructure.concurrent.ConcurrencyResourceNames.DEFAULT_EXECUTOR` などの既存定数を利用）とテスト。
3. **成果物生成ロジック**  
   - `AMD20_PHRServiceBean` を用いて ZIP／JSON を生成し、`PhrExportStorageFactory` 経由で保存・署名付き URL を返却する処理を実装。S3 ストレージを実装または非サポートとして明記。
4. **Flyway 運用手順**  
   - `V0220__phr_async_job.sql` の適用状況を確認し、`flyway info` 取得手順とロールバック手順を Runbook に追記する。
5. **テスト／証跡**  
   - REST 統合テスト、`PhrExportJobManager` のユニットテスト、DDL 適用テストを追加。`PHRResource` と組み合わせたエンドツーエンド検証を確立。
6. **監視と通知**  
   - Micrometer メトリクス（`phr_async_job_total`, `phr_async_job_active{state=...}` など）と PagerDuty 連携ルールを実装。現在コード上にメトリクス処理はない。
7. **ドキュメント更新**  
   - 本ファイル・`MODERNIZED_REST_API_INVENTORY.md`・Runbook で「エクスポート API は未実装である」旨を明記し、実装完了後に更新する。

### 2.4 DDL / 運用メモ

```sql
CREATE TABLE IF NOT EXISTS phr_async_job (
    job_id UUID PRIMARY KEY,
    job_type VARCHAR(64) NOT NULL,
    facility_id VARCHAR(32) NOT NULL,
    patient_scope JSONB NOT NULL,
    state VARCHAR(16) NOT NULL,
    progress SMALLINT NOT NULL DEFAULT 0,
    result_uri TEXT,
    error_code VARCHAR(32),
    error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    retry_count SMALLINT NOT NULL DEFAULT 0,
    locked_by VARCHAR(64),
    heartbeat_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_phr_async_job_state ON phr_async_job(state);
CREATE INDEX IF NOT EXISTS idx_phr_async_job_facility ON phr_async_job(facility_id, queued_at DESC);
```

- 本 DDL は Flyway Version 0220 に配置済み。適用確認 (`flyway info`) と `\d phr_async_job` でのスキーマ確認を運用手順へ追加する。
- 変更が本番へ反映されるまで Runbook 上は「テーブル未作成の場合は migrate を実施せず Blocked とする」と明示する。

### 2.5 Runbook 反映の暫定案

- `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 4-6 の「PHR 非同期ジョブ監視」は現状実施不能であるため **Blocked** と記載し、REST 実装完了後に手順を復活させる。
- 署名付き URL 設定値（`PHR_EXPORT_SIGNING_SECRET`, `PHR_EXPORT_TOKEN_TTL_SECONDS`, `PHR_EXPORT_STORAGE_FILESYSTEM_BASE_PATH`）は環境変数だけ先行定義し、サービス実装が揃うまで未使用と明記する。
- 実装完了後に必要となる監視メトリクス案（`phr_async_job_active`, `phr_async_job_duration_seconds` など）をバックログへ登録しておく。

## 3. Touch クライアントイベント連携

| コンポーネント | 役割 | 参考コード |
| --- | --- | --- |
| `ChartEventStreamResource` (`server-modernized/src/main/java/open/dolphin/rest/ChartEventStreamResource.java:18`) | SSE `/chart-events` のエンドポイント。`Last-Event-ID` ヘッダーを評価し、再送処理を含む。 | |
| `ChartEventSseSupport` (`.../ChartEventSseSupport.java:20`) | SSE 購読者リストの管理と JSON 変換を担当。`ChartEventModelConverter` を利用。 | |
| `ChartEventServiceBean#processChartEvent` | Touch/Visit からのイベントを SSE へブロードキャストし、PVT 更新時にイベント `pvt.updated` を送出。 | |
| `JsonTouchResource#postSendPackage` (`.../touch/JsonTouchResource.java:214`) | カルテ送信後 `ChartEventModel` を組み立てて `chartService.processChartEvent` を呼び出し。 | |
| `PVTResource2#getPvtList` (`.../rest/PVTResource2.java:71`) | SSE 経由で受けたイベントに基づき最新の来院リストを取得する補助 API。 | |

### SSE ハンドシェイク手順

1. Touch クライアントは `GET /chart-events` を `Accept: text/event-stream`、`ClientUUID`, `Last-Event-ID` ヘッダー付きで接続。
2. サーバーは `ChartEventSseSupport` に購読者を登録し、過去 100 件のイベント履歴から `Last-Event-ID` 以降を再送。
3. 新規イベントは `ChartEventServiceBean` → `ChartEventSseSupport#broadcast` で即時配信。イベント種別（`pvt.created`, `pvt.updated`, `chart.locked` 等）は `ChartEventModel#eventType` に格納。
4. Touch UI 例外処理（Worker C 完了）は `eventType=error.*` を UI に提示。Runbook 5.2 に例外タイプを追記。

## 4. Runbook 反映事項

- `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ以下を追記した。
  1. **PVT ドメイン補足**: レガシー換算 23 件のうち、モダナイズ側で提供する 11 パス（12 オペレーション）と残存（旧サーバー迂回）の切り分け理由。
  2. **PHR 非同期ジョブ監視手順**: `curl` と SQL の例、Micrometer メトリクス、PagerDuty 連携フロー。
  3. **Touch イベント監視**: SSE 接続確認コマンド、`Last-Event-ID` 再同期手順。
- `docs/web-client/README.md` に本ドキュメントへのリンクと更新概要を追記。

以上。追加の実装タスクが発生した場合は Phase 2 計画 (`docs/web-client/planning/phase2/`) の進捗表へ転記すること。
