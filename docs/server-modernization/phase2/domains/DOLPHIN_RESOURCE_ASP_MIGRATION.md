# DolphinResourceASP モダナイズ移行メモ (2025-11-03)

> 更新日: 2025-11-03 / 担当: Worker C（Codex）

## 1. 背景とスコープ
- 対象: 旧サーバー `open.dolphin.touch.DolphinResourceASP` が提供してきた `/touch/*` 系 19 エンドポイント。
- 目的: Touch クライアント（iPad／Windows タブレット）向けカルテ閲覧・スタンプ参照 API をモダナイズ版サーバーへ完全移植し、レスポンス構造・日付フォーマット・監査要件・認可ガードを Legacy と同等に保つ。
- 参照資料: `server-api-inventory.yaml` の `tags: DolphinResourceASP` 群、`MODERNIZED_REST_API_INVENTORY.md`、`phase2/domains/API_PARITY_MATRIX.md`。
- 連携タスク:
  - Worker F：スタンプ取得 API のキャッシュ・ETag 方針定義（`/touch/stamp`, `/touch/stampTree`）。
  - Worker E：Touch UI の例外ハンドリング仕様（`error.*` イベント）の統一、Runbook 更新。

## 2. Legacy 実装サマリ（server/src/main/java/open/dolphin/touch/DolphinResourceASP.java）

| HTTP | パス | パラメータ形式 | 主な戻り値要素 / 備考 |
| --- | --- | --- | --- |
| GET | `/touch/user/{param}` | `userId,facilityId,password` | `<user>` + `<facility>`。S3 URL/キーを含む。認証失敗時は空 `<mmlTouch/>`。 |
| GET | `/touch/patient/firstVisitors/{param}` | `facilityId,first,max` | `<patient>`（`pk`,`patientId`,`name`,`firstVisit`）。 |
| GET | `/touch/patient/visit/{param}` | `facilityId,first,max` | `<patientVisit>`（`pvtDate`,`patient`）。 |
| GET | `/touch/patient/visitRange/{param}` | `facilityId,start,end[,first,max]` | `<patientVisit>` に `pvtStatus` を含む。 |
| GET | `/touch/patient/visitLast/{param}` | `facilityId,start,end` | 結果が空の場合は最大 6 日遡って再検索。 |
| GET | `/touch/patient/{pk}` | `patientPk` | `<patient>`（住所・連絡先含む）。 |
| GET | `/touch/patientPackage/{pk}` | `patientPk` | `<patientPackage>`（患者＋保険＋公費＋アレルギー）。 |
| GET | `/touch/patients/name/{param}` | `facilityId,keyword,first,max` | 先頭がひらがなならカナ検索。`<patient>` リスト。 |
| GET | `/touch/module/{param}` | `kartePk,entity,first,max` | `<module>`（`entity`,`name`,`claimItem`）。RP のみ `numDays` と `administration` を付与。 |
| GET | `/touch/module/rp/{param}` | `kartePk,first,max` | `<bundleMed>` ＋ `<claimItem>`。冒頭に `<pageInfo>`。 |
| GET | `/touch/module/diagnosis/{param}` | `kartePk,first,max` | `<registeredDiagnosis>`（`diagnosis`,`category`,`outcome`,`startDate`,`endDate`）。 |
| GET | `/touch/module/laboTest/{param}` | `facilityId,patientId,first,max` | `<module>` ＋ `<laboItem>` 一覧。 |
| GET | `/touch/item/laboItem/{param}` | `facilityId,patientId,first,max,itemCode` | `<testItem>`（共通情報）＋ `<result>`（サンプル日降順）。 |
| GET | `/touch/module/schema/{param}` | `kartePk,first,max` | `<schema>`（`bucket`,`sop`,`base64`）。 |
| GET | `/touch/document/progressCourse/{param}` | `patientPk,first,max` | `<document>`（SOA/P テキスト変換、オーダ、スキーマ base64）。 |
| GET | `/touch/stampTree/{param}` | `userPk` | JSON（`StampTreeDirector` で XML→JSON 変換）。 |
| GET | `/touch/stamp/{param}` | `stampId` | JSON（`JSONStampBuilder` で StampModel→JSON 変換）。 |
| POST | `/touch/idocument` | 本文: `IDocument` JSON | `karteService.addDocument` 追加後、新規 Document PK を `text/plain` で返却。 |
| POST | `/touch/idocument2` | 本文: `IDocument2` JSON | FreeText 対応版。上記と同じ振る舞い。 |

### Legacy 共通仕様
- レスポンス: 17 件が `application/xml`（カスタム `<mmlTouch>` フォーマット）、2 件が JSON。HTTP ステータスは正常時 200、結果なしでも 200（空 XML）／一部 `null` 返却により 204。
- 認証／認可: リクエストヘッダ `userName/password/clientUUID` を想定。パラメータの `facilityId` とヘッダの整合チェックは未実装。Role ベース制約なし。
- キャッシュ: 実装なし。都度 JPA クエリを実行（`IPhoneServiceBean`）。
- 監査ログ: 直接の記録はなし（セッション層の `@SessionOperation` に依存）。

## 3. 現状ギャップと課題
1. **性能要件／キャッシュ**  
   - `getProgressCource`, `getModule*`, `getLabo*`, `getStamp*` などが大量データを返却。モバイル回線での利用を考慮すると 1 リクエストあたり 256KB 超の XML が頻発。  
   - 旧サーバーは Tomcat 側で短期キャッシュしていた（ロードバランサ設定）。モダナイズ版ではキャッシュレイヤー不在。
2. **認可の明文化不足**  
   - facilityId をパスで受け取りつつ、`HttpServletRequest#getRemoteUser()` との突合を行っていない。ロール／施設不一致の拒否が必要。
3. **例外ハンドリングの不統一**  
   - Null 戻り・`System.err` 出力のみで UI 例外イベント (`error.touch.*`) へ伝搬していない。Worker E の Runbook に沿った JSON エラー構造を返す必要あり。
4. **レスポンス生成の保守性**  
   - 手書きの `StringBuilder` による XML 生成が 1,200 行以上。構造が複雑で変更リスクが高い。Streaming 出力とテンプレート化が望ましい。

## 4. モダナイズ方針（案）
1. **レスポンスビルダーの共通化**  
   - `TouchXmlWriter`（仮）を新設し、既存の XML 組立処理をセクション単位に集約。`StreamingOutput` で直接書き出してヒープ消費を抑制。
   - JSON 変換部（スタンプ系）は `JSONStamp*Builder` をラップし、例外時に `TouchErrorResponse` を返す。
2. **キャッシュレイヤー導入**  
   - `TouchResponseCache`（`@ApplicationScoped`）で `ConcurrentHashMap` + `Duration ttl`（初期 10 秒）による軽量キャッシュを用意。  
   - キャッシュキーは `method:paramHash`。`postDocument(2)` 実行時に患者／カルテ単位で無効化。
   - スタンプ関連は Worker F が整理中の `StampCacheInvalidation` ポリシーと整合させ、ETag 対応も視野に入れる。
3. **認可・監査強化**  
   - `remoteUser` から施設 ID を取得し、パス `facilityId` と不一致の場合は 403 を返却。  
   - 重要操作（文書登録／スタンプ取得）は `AuditTrailService` へ `action=TOUCH_DOCUMENT_CREATE` 等を記録。
4. **例外統一**  
   - Worker E が定義した Touch UI 例外スキーマ（`type`, `message`, `traceId`）で `Response.status(xxx).entity(TouchErrorResponse)` を返却。  
   - サービス層例外（`SessionServiceException` 等）はハンドラで補足し、UI 例外イベントへも SSE 通知。
5. **テスト・性能測定**  
   - Mockito ベースの単体テストで XML/JSON 出力とキャッシュ挙動を検証。  
   - `scripts/load-test.ts` を流用し `/touch/document/progressCourse` などを対象に 100 リクエスト負荷テストを実施。結果は Runbook へ添付。

## 4. 2025-11-04 実装サマリ（Worker B）
- `TouchModuleService`（`server-modernized/src/main/java/open/dolphin/touch/module/TouchModuleService.java`）を新設し、`CacheUtil`（共通モジュール）ベースの TTL 10 秒キャッシュを導入。キャッシュキーは `method:paramHash` 形式（例: `modules:-123456789`）。
- 認可は `TouchAuthHandler` で `X-Facility-Id` と `remoteUser` を突合、レスポンスには `Cache-Control: no-store, no-cache, must-revalidate` を付与。
- 監査ログは `TouchModuleAuditLogger`（logger 名: `open.dolphin.audit.TouchModule`）で開始／成功／失敗を記録。
- JSON DTO 群は `TouchModuleDtos` に集約し、`/touch/module*` / `/touch/item/laboItem` の legacy XML 要素を網羅的にマッピング。
- テスト: `TouchModuleResourceTest`（modules/rp/diagnosis/labo/schema/caching/施設ガード）を追加。`mvn -pl server-modernized -Dtest=TouchModuleResourceTest test` はローカルに Maven が無いため失敗（`bash: mvn: command not found`）。

## 5. 今後の作業項目
1. **コード実装**
   - `DolphinResourceASP` を共通ヘルパーとキャッシュ利用構造へリファクタリング。
   - `TouchResponseCache`, `TouchErrorResponse`, `TouchXmlWriter`（名称調整可）の新規クラス追加。
   - `postDocument(2)` でキャッシュ無効化＋監査記録を実装。
2. **ドキュメント更新**
   - `API_PARITY_MATRIX.md` の DolphinResourceASP 行を `[x] ◎` に更新し、メモ欄に検証内容を記載。
   - `MODERNIZED_REST_API_INVENTORY.md` に `/touch/*` セクションを追加。
   - `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に JSON diff・性能検証ログの保存先を追記。
3. **共同検討**
   - Worker F: スタンプキャッシュ失効タイミングを定義し、本ドキュメントへリンク。
   - Worker E: 例外フォーマット合意を取得し `TouchErrorResponse` へ反映。`PHASE2_PROGRESS.md` に決定事項を記録。

## 6. 未決事項・質問
1. `Cache-Control` ヘッダーをクライアントへ送る際、医療情報のブラウザキャッシュ禁止 (`no-store`) 方針と両立させる運用案（サーバー内キャッシュのみ？）。
2. `/touch/user/{param}` が Basic 認証代替として利用されているが、JWT ベース Auth との整合方針。モダナイズ後も同一レスポンスで良いか確認が必要。
3. Touch UI で SSE イベントにより例外を通知するトリガー定義（Worker E Runbook 追記待ち）。

## 7. 再点検結果（2025-11-03）
- `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java:26-1488` と `DolphinResourceASP.java:25-1446` は legacy コードをそのまま複製しており、XML 文字列生成・`System.err` ログ・`IPhoneServiceBean` 直呼び出しが残存。設計で掲げた `TouchXmlWriter`／`TouchResponseCache`／`TouchErrorResponse` は未着手。
- RESTEasy 登録は `server-modernized/src/main/webapp/WEB-INF/web.xml:20-46` で `open.dolphin.touch.DolphinResource` のみ指定され、`DolphinResourceASP` は未登録。ASP 用エンドポイントは現行のままでは公開されず、API Parity マトリクスで `[ ]` のままとした。
- 認可・監査の追加は進捗なし。`/touch/user/{param}`・`/touch/patient/*` 系はいずれも facility/user ヘッダー突合や `AuditTrailService` 呼び出しが未実装。
- テストは未整備。`server-modernized/src/test/java` に DolphinResourceASP 向けのパリティ/回帰テストは存在せず、`mvn` も環境未導入のため自動検証不可。
- 次ステップでは RESTEasy 登録・例外レスポンス統一・キャッシュ/認可/監査の実装と併せて、`API_PARITY_MATRIX.md` の `[ ]` 解消条件（実装 + テスト証跡）を満たす必要がある。

---
*本メモは DolphinResourceASP モダナイズ作業の設計ベースラインとして利用し、実装完了後に検証結果・制約事項を追記する。*
