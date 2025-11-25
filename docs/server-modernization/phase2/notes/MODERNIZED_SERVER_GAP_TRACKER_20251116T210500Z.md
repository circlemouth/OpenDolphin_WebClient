# Modernized Server Gap Tracker（RUN_ID=20251116T210500Z）

## 0. 参照チェーンと証跡
- 本メモは AGENTS → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → 各領域チェックリストを踏まえて作成。
- 根拠ログ / 既存ノート  
  - カルテ機能: `docs/server-modernization/phase2/notes/karte-clinical-review-20251116T152300Z.md`, `docs/server-modernization/phase2/operations/logs/20251116T152300Z-karte-review.md`  
  - ORCA スタンプ/点数: `docs/server-modernization/phase2/operations/logs/20251116T193200Z-orca-stamp-tensu.md`  
  - Messaging/JMS: `docs/server-modernization/phase2/notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md`（同 RUN_ID 更新済）  
  - Trace/Audit: `docs/server-modernization/phase2/operations/logs/20251116T151200Z-trace-audit-review.md`  
  - 外部 API ギャップ: `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md`

## 1. カルテ/添付系ギャップ
| ID | 課題 | 必要対応 | 根拠 |
| --- | --- | --- | --- |
| KRT-01 | 既存カルテ更新 API 不足（PUT `/karte/document`） | `KarteResource`/`KarteServiceBean` に Document 全体更新エンドポイントと差分保存処理を実装。UI (`web-client/src/features/charts/api/document-api.ts`) に合わせる。 | 調査ログ `…152300Z-karte-review.md` |
| KRT-02 | Masuda/SafetySummary API 欠如 (`/karte/routineMed.*`) | Legacy 実装を Jakarta 化し、REST インベントリと Web 要件を満たすエンドポイントを追加。 | 同上 |
| KRT-03 | GET `/karte/image/{id}` の @PathParam 名誤り | `@PathParam("param")` → `@PathParam("id")`。 | 同上 |
| KRT-04 | 添付ストレージ二重アップロード | `AttachmentStorageManager` 呼び出しを 1 回に統合し、例外時ロールバック。 | 同上 |

## 2. ORCA スタンプ／点数マスタ
| ID | 課題 | 必要対応 | 根拠 |
| --- | --- | --- | --- |
| ORCA-01 | `/orca/inputset` の WHERE 句に括弧がなく S% の hospnum フィルタが欠落 | SQL を `(inputcd like 'P%' or inputcd like 'S%')` で括り、両方に `hospnum=?` を適用。 | `…193200Z-orca-stamp-tensu.md` |
| ORCA-02 | `/orca/stamp/{setCd,name}` が診療日指定不可 | パラメータに `date` を追加し、`tbl_inputset` の有効期間チェックを呼び出し元で指定できるようにする。 | 同上 |
| ORCA-03 | `/orca/tensu/shinku` が必要列を返却しない | `TensuMaster` の `taniname`, `ykzkbn`, `yakkakjncd` などをレスポンスに含め、`/tensu/name` との整合を取る。 | 同上 |
| ORCA-05 | 薬剤・特定器材・検査分類マスタ（例: `TBL_GENERIC_CLASS`, `TBL_GENERIC_PRICE`, `TBL_MATERIAL_*`, `TBL_KENSASORT`）を返す REST が不存在 | 薬効/用法/材料/検査分類コードを返却する新規 REST を追加し、DTO/Schema に分類・最低薬価・用法コードを含める。ステータス=Open、オーナー=Worker-B、優先度=P1、ETA=2025-12-06（RUN_ID=`20251124T073245Z` で設計メモ更新）。性能/監査計測ドラフト（RUN_ID=`20251124T111500Z`）の P99・アラート・必須ログ項目を実装時に準拠させる。ベンチテンプレ（k6/autocannon）を `artifacts/api-stability/20251124T111500Z/benchmarks/templates/` に配置済（RUN_ID=`20251124T120000Z`）。 | `docs/server-modernization/phase2/operations/logs/20251123T135709Z-orca-master-gap.md`; `operations/ORCA_CONNECTIVITY_VALIDATION.md` §7 |
| ORCA-06 | 保険者・住所マスタ（`TBL_HKNJAINF`, `TBL_ADRS` 等）を REST で提供していない | 保険者コード・住所コード体系を返却する API を新設し、資格確認/住所補完の UI で利用できるようにする。ステータス=Open、オーナー=Worker-B、優先度=P1、ETA=2025-12-06（RUN_ID=`20251124T073245Z` 設計更新）。性能/監査計測ドラフト（RUN_ID=`20251124T111500Z`）の住所フィルタ負荷・監査ログ必須項目を実装スコープに含める。ベンチテンプレ（k6/autocannon）を `artifacts/api-stability/20251124T111500Z/benchmarks/templates/` に配置済（RUN_ID=`20251124T120000Z`）。 | 同上; `operations/ORCA_CONNECTIVITY_VALIDATION.md` §7 |
| ORCA-07 | ORCA DB 接続が `custom.properties` 直指定で DataSource/Secrets 化されていない | DataSource/Secrets 設計ドラフト（RUN_ID=`20251124T080000Z`, 親=`20251124T000000Z`）: <br>- JNDI=`java:/datasources/OrcaDb`（既存 `ORCADS` 置換互換）、接続文字列/資格情報は Vault or `.env`（例: `ORCA_DB_URL`/`ORCA_DB_USER`/`ORCA_DB_PASSWORD`）で注入し `custom.properties` はフォールバックのみ。<br>- プール推奨: min=2, max=20, idle-timeout=300s, validation=`SELECT 1`、`setReadOnly(true)` を維持。<br>- 資格情報ローテ: Vault バージョンタグ＋secretRef を configmap/env に供給→Datasource reload→旧資格情報 revoke→監査ログへ version/hash を記録。<br>- 監査項目: lookup JNDI 名、secretRef/version、接続成功/失敗（例外種類・DB ホスト非表示）、fallback 発動時の経路。<br>- フェールセーフ: DS lookup 失敗時は read-only DriverManager を最後の手段に限定し、連続失敗閾値で CircuitBreaker→警告レスポンスへ切替。ステータス=Open、オーナー=Worker-B、ETA=2025-12-06 | 証跡: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#run_id-20251124t080000z-orca-07-08-draft` |
| ORCA-08 | 電子点数表（`TBL_ETENSU_1~5`）を返す REST が不存在 | 電子点数表を返す新規 REST を追加し、点数改定・将来日計算に必要な告示日/適用開始日/区分/点数を DTO/Schema に含める。ステータス=Open、オーナー=Worker-B（暫定）、優先度=P1、ETA=2025-12-20（RUN_ID=`20251124T073245Z` で UI/DTO を更新）。性能/監査計測ドラフト（RUN_ID=`20251124T111500Z`）で定義した P99≤1.8s・ペイロード 5MB 上限・アラート閾値を SLA として実装。ベンチテンプレ（k6/autocannon）を `artifacts/api-stability/20251124T111500Z/benchmarks/templates/` に配置済（RUN_ID=`20251124T120000Z`）。 | `docs/server-modernization/phase2/operations/logs/20251123T135709Z-orca-master-gap.md#orca-08-電子点数表-rest-設計たたき台run_id20251123t135709z`; `operations/ORCA_CONNECTIVITY_VALIDATION.md` §7 |

### ORCA-05/06/08 大規模マスタ キャッシュ/索引ポリシー案（RUN_ID=`20251124T090600Z`, 親=`20251124T000000Z`）
- **ETag/If-None-Match**: ORCA 側レスポンスに `ETag` を付与（`<masterType>-<asOf>-<version>-<rangeHash>` で強い検証子化）。Web クライアントは `If-None-Match` を必須送信し、304 時はキャッシュを継続利用。`Cache-Control: public, max-age=<TTL>, stale-while-revalidate=86400` を返し、段階的にミスヒットを低減。
- **TTL (推奨)**
  - 住所 (`TBL_ADRS`): 月次郵便データ更新を想定し `max-age=2592000`（30 日）。Zip 部分更新を行う場合は `asOf`／`prefCode` でチャンク化し、ETag を分割。
  - 保険者 (`TBL_HKNJAINF`): 法令改定・組合統廃合頻度から `max-age=1209600`（14 日）。失効日が過ぎたキャッシュは必ず再取得。
  - 用法/薬効/特定器材（`TBL_GENERIC_*`, `TBL_MATERIAL_*`, `TBL_KENSASORT`）: 点数告示と一体で改定されるため `max-age=1209600`（14 日）。`version` フィールドが変わったらクライアントは強制再フェッチ。
  - 電子点数表 (`TBL_ETENSU_1~5`): 改定期の揺れを避けるため `max-age=604800`（7 日）。`asOf` パラメータと組み合わせ、将来日計算は 304 を許容しつつ `asOf` をキーにキャッシュを分離。
- **バリアントキー**: `Vary: X-ORCA-Facility, X-ORCA-Version, Accept-Encoding` を追加し、施設別のバリアントを分離。施設間でのキャッシュ汚染を防ぐ。
- **圧縮/転送最適化**: マスタは gzip/deflate を許容。住所・点数表のような大型レスポンスはページング（例: `offset/limit` または `zipPrefix`/`srycdRange`）を前提にし、ETag をチャンク単位で発行して帯域を削減。
- **DB インデックス案（PostgreSQL 想定）**
  - 住所: `btree (zip)` で一意、`btree (pref_code, city_code, town_code)` を検索キーに追加。郵便番号前方一致検索が多い場合は `gin (zip gin_trgm_ops)` を併用。
  - 保険者: `btree (hknjcd)` 主キー、`btree (valid_from, valid_to)` で期間フィルタを高速化。名称検索が必要なら `gin (hknjname gin_trgm_ops)`。
  - 用法/薬効: `btree (yhkbn, yjcode)`（薬効コード＋用法区分）、`btree (valid_from, valid_to)` を組み合わせ、薬価/用法の期間検索を最適化。
  - 特材: `btree (srycd)` 主キー、`btree (kubun, valid_from)` で区分＋期間フィルタを高速化。材料名全文検索は `gin (name_kana gin_trgm_ops)` を追加。
  - 電子点数表: `btree (srycd, kbn, ymd_start DESC)` で最新点数を即時取得。将来日計算用に `btree (ymd_start, ymd_end, srycd)` を補助。
- **整合チェック**: API 側で `CacheHit/CacheAge/Version` をレスポンスメタに返し、Web クライアントは監査ログへ `runId/version/cacheHit/etag` を記録。304 時も `CacheHit=true` を明示して監査一貫性を確保。

### ORCA-05/06/08 実装タスクチェックリスト（RUN_ID=`20251124T110000Z`, 親=`20251124T000000Z`、優先度=P1）
- 根拠: 正式版 OpenAPI `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`。サーバー実装オーナー=Worker-B。進行順: ORCA-05 → ORCA-06 → ORCA-08。

**ORCA-05 薬剤分類/最低薬価/用法/特定器材/検査分類（ETA=2025-12-06）**
- `/orca/master/generic-class`（薬剤分類ツリー）
  - [ ] DTO: `DrugMasterEntry` の `code/name/category/unit/minPrice/youhouCode/materialCategory/kensaSort/validFrom/validTo/meta{version,runId,snapshotVersion,dataSource,cacheHit,missingMaster,fallbackUsed,fetchedAt}` を OpenAPI と同名・同型で実装。
  - [ ] DB クエリ: `TBL_GENERIC_CLASS` 階層を `parent_class`（又は親コード）で再帰/自己結合し、`valid_from/valid_to` 期間内・`keyword` 部分一致を SELECT。ページング必須。
  - [ ] 変換: 取得行を階層順に並べ替え、空の子を `isLeaf=true` で返却。`category=generic` 固定。
  - [ ] 監査: クエリ発行時の `version`（告示日）と `snapshotVersion`、`cacheHit`/`missingMaster`/`fallbackUsed` をレスポンス・監査ログ両方へ記録。
  - [ ] テスト: OpenAPI 例レス準拠の契約テスト（200/503）＋ keyword 無指定全件と 0 件ケースを追加。
- `/orca/master/generic-price`（薬価・最低薬価）
  - [ ] DTO: `DrugMasterEntry` を単品返却し、`minPrice` null 許容・`category=generic-price` を固定。
  - [ ] DB クエリ: `TBL_GENERIC_PRICE`（または薬価ビュー）を `srycd` 完全一致で取得し、`effectiveDate` による期間フィルタを適用。
  - [ ] 変換: ヒットなしは `200` + `price=null` で返却（404 は使用しない）。
  - [ ] 監査: `dataSource`（DB/キャッシュ）、`cacheHit`、`missingMaster`（未収載判定）、`fetchedAt` を必須化。
  - [ ] テスト: 価格あり/なし/キャッシュヒット/未収載の 4 パターンを MSW→REST で相互確認。
- `/orca/master/youhou`（用法）
  - [ ] DTO: `DrugMasterEntry` に `youhouCode` を保持、`minPrice`/`materialCategory`/`kensaSort` は null 許容。
  - [ ] DB クエリ: `TBL_GENERIC_YH`（用法マスタ）を `keyword` LIKE と `effectiveDate` 範囲で検索。
  - [ ] 変換: 並び順はコード昇順、カナ/名称の大文字小文字・全半角揺れを normalize しない（DB そのまま）。
  - [ ] 監査: `cacheHit` true/false 両方の監査行を d_audit_event に残す（空配列の場合も記録）。
  - [ ] テスト: keyword あり/なし、`effectiveDate` 過去日/将来日、0 件の 3 パターン。
- `/orca/master/material`（特定器材）
  - [ ] DTO: `materialCategory`/`unit`/`minPrice` 必須、`category=material` 固定。
  - [ ] DB クエリ: `TBL_MATERIAL_*` 系から価格・区分を join（kubun + srycd + hospnum をキー）。`effectiveDate` と `keyword` を併用。
  - [ ] 変換: 数値カラムは JSON number で返却（0 許容）。`note` 空は省略。
  - [ ] 監査: `fallbackUsed` が true の場合は ORCA DB の不足テーブル名を `missingTables` としてメタに残す。
  - [ ] テスト: 200 正常（ページング含む）、cache miss→fallback、503（DB 不整合）の 3 ケース。
- `/orca/master/kensa-sort`（検査分類）
  - [ ] DTO: `kensaSort` を必須（OpenAPI `kensaSort`）、`unit` null 許容。
  - [ ] DB クエリ: `TBL_KENSASORT` を `keyword` 部分一致＋有効期間フィルタで取得。
  - [ ] 変換: コード/名称の前方一致検索をサポートし、結果順はコード昇順。
  - [ ] 監査: `snapshotVersion` と `version` をレスポンスメタに保持し、監査ログでは `cacheHit` と `missingMaster` を必須。
  - [ ] テスト: keyword=空/部分一致/該当なし、ページング境界の検査。

**ORCA-06 保険者・住所（ETA=2025-12-06）**
- `/orca/master/hokenja`
  - [ ] DTO: `InsurerEntry`（`payerCode/payerName/payerType/payerRatio/prefCode/cityCode/zip/addressLine/phone/meta`）。`payerRatio` は numeric（0–1）として返却。
  - [ ] DB クエリ: `TBL_HKNJAINF` を `pref`（JIS 都道府県コード）＋ `keyword`（名称/カナ）で LIKE、期間フィルタ有り。ページング必須。
  - [ ] 変換: `payerType` を ORCA コード→ enum 変換（national_health/employer/association など）。`totalCount` を別クエリまたは window で算出。
  - [ ] 監査: `runId/snapshotVersion/version/cacheHit/missingMaster/fallbackUsed/fetchedAt` をレスポンスメタに必須化。監査ログへ facility ID とクエリ条件を併記。
  - [ ] テスト: 200（複数件）/0件/503、pref フィルタ有無、ページング境界の 4 パターン。
- `/orca/master/address`
  - [ ] DTO: `AddressEntry` or 空オブジェクト（200/該当なし）を返却。`zip` パターン `^\\d{7}$` を遵守。
  - [ ] DB クエリ: `TBL_ADRS` を zip 完全一致で検索し、有効期間チェックを適用。
  - [ ] 変換: 該当なしは `{}`（200）、未登録 zip は `404 MASTER_ADDRESS_NOT_FOUND` を返却。
  - [ ] 監査: `missingMaster` を該当なし時 false、404 時は true で記録。`fetchedAt` を必須。
  - [ ] テスト: 200（ヒット）/200（空）/404/503 の 4 ケース。zip フォーマット不正は 400 を確認。

**ORCA-08 電子点数表（ETA=2025-12-20）**
- `/orca/tensu/etensu`
  - [ ] DTO: `TensuEntry`（`tensuCode/name/kubun/tanka/unit/category/startDate/endDate/tensuVersion/meta`）。`totalCount` + `items[]` をページング返却。
  - [ ] DB クエリ: `TBL_ETENSU_1~5` を `asOf`（YYYYMMDD）と `tensuVersion` で絞り込み、`keyword`/`category` を前方一致。`PAGE`/`pageSize` で OFFSET/LIMIT。
  - [ ] 変換: `tanka` 数値、`category` を ORCA 区分コード→説明にマップ（OpenAPI 例のまま）。ヒット 0 件は 404 `TENSU_NOT_FOUND`。
  - [ ] 監査: 200/404 いずれも `meta` に `runId/snapshotVersion/cacheHit/missingMaster/fallbackUsed/fetchedAt` を必須。欠落テーブルがある場合は `ServiceUnavailable`（503）で返却。
  - [ ] テスト: 200（複数件）/404/503、`asOf` 過去日/未来日、`tensuVersion` 指定有無の組み合わせで契約テスト。

## 3. Messaging / 監査 / RUN ガバナンス
| ID | 課題 | 対応方針 | 根拠 |
| --- | --- | --- | --- |
| MSG-01 | JMS 実測証跡不足 | **実装完了（2025-11-19）**: `MessageSender.java`（MDB）、`MessagingGateway.java`（送信ゲートウェイ）、`MessagingConfig.java`（設定管理）、`DiagnosisSender.java`（Socket送信）を Jakarta Messaging 3.0 準拠へ復旧。`diagnosis.claim.send` フラグによる傷病名送信制御を実装し、JMS キュー `java:/queue/dolphin` および接続ファクトリ `java:/JmsXA` への JNDI 参照を明示。証跡: `operations/logs/20251119T140358Z-jms-implementation.md`。次ステップ: WildFly 33 環境で実際の ORCA 送信および ACK 受信を検証し、`ops/tools/jms-probe.sh` 証跡を追加（2025-11-25 まで）。 | Messaging レビュー報告、`docs/server-modernization/phase2/operations/logs/20251116T210500Z-C-jms-probe.md` |
| AUD-01 | `TRACE_PROPAGATION_CHECK.md` の §7 が未更新 | **完了（2025-11-16）**: RUN_ID=`20251116T210500Z-C`（§7.1）を記載し、JMS `messages-added`=6→9 / `d_audit_event` 0 件 / ブロッカー3件を整理。次 RUN で証跡を更新。 | Trace/Audit レビュー、`operations/logs/20251116T151200Z-trace-audit-review.md`, `operations/logs/20251116T210500Z-C-jms-probe.md` |
| AUD-02 | 4xx/5xx で AuditTrail まで Trace-ID が届かない | `LogFilter` が 4xx/5xx 応答を検知して `SessionAuditDispatcher` へ `REST_ERROR_RESPONSE` を送るよう改修（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`）。次 RUN で `TRACE_PROPAGATION_CHECK.md` の 401/500 行に監査行を追加し、JMS/Audit 両ルートを確認。 | Trace/Audit レビュー、`operations/logs/20251116T210500Z-C-trace-logfilter.md` |
| OPS-01 | `mac-dev-login.local.md` の資格情報ローテ | **完了（2025-11-16）**: `admin2025!C` / `doctor2025!C` へ更新し、`artifacts/mac-dev-login/20251116T210500Z-C/rotation.md` と ops ログへリンク。次回ローテは 2025-12-15 目安。 | `docs/web-client/operations/mac-dev-login.local.md`, `operations/logs/20251116T210500Z-C-trace-logfilter.md` |

## 4. 外部 API（PHR/予約/紹介状）
| ID | 課題 | 必要対応 | 根拠 |
| --- | --- | --- | --- |
| EXT-01 | PHR REST リソースが Spec-based で止まっている | `phr_access_key` Flyway 適用、Layer ID secrets、監査 ID を整備し Trial/ORMaster 両方で CRUD 証跡を取得。RUN_ID=`20251116T210500Z-E1` で Flyway/Secrets 監査と 404/405 証跡を集約済（証跡: `operations/logs/20251116T210500Z-E1-phr.md`, `artifacts/orca-connectivity/20251116T210500Z-E1/`）。ORMaster seed/DNS 復旧後に 200 応答を採取し Spec-based を解除する。 | `external-api-gap-20251116T111329Z.md` §2.1, `DOC_STATUS.md` W22 |
| EXT-02 | 予約／受付ラッパーの Trial 実測不足 | モダナイズ REST（appointments/visits mutation）を実装済（RUN_ID=`20251116T134343Z`）。Trial で curl 実測し (`operations/logs/20251116T210500Z-E2-appointmod.md` 等、`artifacts/orca-connectivity/20251116T210500Z-E2/`)、HTTP405 / ORMaster DNS NXDOMAIN を記録。Ops による DNS/FW 開放後に 200 応答を取得し、`ORCA_API_STATUS.md` / `RESERVATION_BATCH_MIGRATION_NOTES.md` の before/after を更新する。 | `external-api-gap-20251116T111329Z.md` §2.2, `DOC_STATUS.md` W22 |
| EXT-03 | 紹介状／MML API 証跡欠落 | Jakarta Persistence (`persistence.xml`), parity headers (`tmp/parity-headers/mml_TEMPLATE.headers`), Runbook Sec.4.4 を RUN_ID=`20251116T134354Z` で更新し、`artifacts/external-interface/mml/20251116T134354Z/` に証跡構造を定義。Docker/ORMaster 解放後に `send_parallel_request.sh` で Legacy/Modernized の `/mml/letter{list,json}`, `/mml/labtest{list,json}` を取得し diff を保存、LabSeedMissing Blocker を解消して [証跡取得済] へ更新する。 | `external-api-gap-20251116T111329Z.md` §2.3, `operations/logs/20251116T134354Z-mml.md`, `DOC_STATUS.md` W22 |

## 5. 次アクション（ワーカー指示案）
1. **Worker-A（カルテ担当）**: KRT-01〜04 を実装。`docs/server-modernization/phase2/notes/karte-clinical-review-20251116T152300Z.md` を進捗ログとして更新。  
2. **Worker-B（ORCAスタンプ/点数）**: ORCA-01〜03 を `/orca` リソースで対応し、同 RUN_ID の ops/logs に SQL 修正とテスト結果を記載。  
3. **Worker-C（Messaging/Audit/Ops）**: MSG-01, AUD-01/02, OPS-01 を担当し、Trace/Audit Runbook と mac-dev-login ドキュメントを更新。  
4. **Worker-D（外部 API）**: EXT-01〜03 の実装/証跡取得を継続。E1/E2/E3 RUN（`20251116T210500Z-{E1,E2,E3}`）の成果を `external-api-gap-20251116T111329Z.md` と DOC_STATUS に反映しつつ、ORMaster 環境復旧後に CRUD 実測・diff 取得を完了させる。
