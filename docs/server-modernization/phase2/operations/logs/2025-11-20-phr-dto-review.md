# RUN_ID=20251120TphrDtoReviewZ1 — PHRContainer DTO & Signed URL フォールバック レビュー

## 1. 実施概要
- 日時: 2025-11-20 10:30-12:10 JST
- 対象: `common/src/main/java/open/dolphin/infomodel/PHRContainer.java`, `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`, `server-modernized/src/main/java/open/dolphin/adm20/support/PhrDataAssembler.java`, `server-modernized/src/test/java/open/dolphin/rest/PHRResourceTest.java`
- 目的: フェーズE/F Blocker となっている DTO Jackson 対応と `PHR_SIGNED_URL_NULL_FALLBACK` テストの実装状況を確認し、必要な修正点とフォローアップを明確化する。
- 参照資料: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md`, `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2、`docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md`

## 2. 調査結果
### 2.1 PHRContainer DTO
1. `PHRContainer` は依然として Jackson アノテーションが一切付与されておらず、`docList`/`labList` はデフォルトで `null` のまま。（`common/src/main/java/open/dolphin/infomodel/PHRContainer.java:9-32`）
   - `PhrDataAssembler#buildContainer` では `new ArrayList<>()` を設定しているが、DTO 自体は `null` 代入を許容しており、呼び出し側が `null` を渡した場合に `getSerializeMapper()`（`AbstractResource`）の `Include.NON_NULL` 設定によりキーが欠落する。
   - `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` フェーズEの「Blocker: DTO Jackson アノテーション未整備」は未解消。少なくとも `@JsonInclude(JsonInclude.Include.NON_EMPTY)` と `@JsonPropertyOrder({"docList","labList"})`（または同等の安定化設定）を DTO 側で付与し、setter で `null` を `Collections.emptyList()` へ強制する必要がある。
2. `PHRContainer` / `PHRCatch` / `PHRLabModule` はリストの defensive copy を行っておらず、`docList`/`labList` が外部からそのままミュータブル参照として露出する。Jackson シリアライズ後に UI ロジックが誤って変更するとレースが発生するため、`List.copyOf` で不変化し `@JsonDeserialize(contentAs = ...)` 等を組み合わせる修正が必要。

### 2.2 署名付き URL フォールバック & テスト
1. `PHRResource#toJobResponse`（`server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java:865-872`）では `signedUrlService.createSignedUrl(...)` 失敗時の例外捕捉や `null` チェックが存在せず、フォールバックで `downloadUrl=null` + `PHR_SIGNED_URL_NULL_FALLBACK` 監査を記録する仕様（フェーズE/F表）が実装されていない。例外が発生した場合はステータス 500 で落ちるため、Blocker 継続。
2. 同メソッド内で `PHR_SIGNED_URL_ISSUED` / `PHR_SIGNED_URL_ISSUE_FAILED` に相当する監査ログ呼び出しがなく、`Unsigned` ルートや `bandwidthProfile` などフェーズE表で必須の詳細を `auditHelper` へ渡していない。
3. `server-modernized/src/test/java/open/dolphin/rest/PHRResourceTest.java` には `PHR_SIGNED_URL_NULL_FALLBACK` を検証するテストが存在せず、`downloadUrl` が `null` になった場合のレスポンス JSON・監査ログ整合（`PHR_RESTEASY_IMPLEMENTATION_PLAN.md` テスト観点）が未担保。
4. `SignedUrlService`（`server-modernized/src/main/java/open/dolphin/adm20/export/HmacSignedUrlService.java`）は `PhrExportConfig` に `PHR_EXPORT_SIGNING_SECRET` が無い場合にランダム秘密鍵を生成する挙動のままであり、Secrets 欠落に気付かずに署名を発行してしまう。`PHR_SIGNED_URL_ISSUE_FAILED` を発火させるには `SignedUrlService` 側でも Secrets チェックと例外化が必要。

## 3. 追加アクション（Blocker 継続）
| No. | 対応内容 | Owner | Due |
| --- | --- | --- | --- |
| G-1 | **完了 (RUN_ID=`20251121TtaskGImplZ1`)** `PHRContainer` DTO へ `@JsonInclude(Include.NON_EMPTY)`＋`List.copyOf` setter を実装し、`docList`/`labList` の null/可変参照を排除。 | サーバー実装 | 2025-11-21 18:00 JST ✅ |
| G-2 | **完了 (RUN_ID=`20251121TtaskGImplZ1`)** `PHRResource#toJobResponse` に署名付き URL 成功/失敗/NULL 監査（`PHR_SIGNED_URL_{ISSUED,ISSUE_FAILED,NULL_FALLBACK}`）とフォールバックを実装、Secrets 欠損時も 500 を返さず署名なし URL へ切替。 | サーバー実装 | 2025-11-21 18:00 JST ✅ |
| G-3 | **完了 (RUN_ID=`20251121TtaskGImplZ1`)** `PHRResourceTest` へ SignedUrl `null`/例外ケースを追加し、`downloadUrl` が署名なし URL にフォールバックすることと監査イベント内容をアサート。 | サーバー実装 | 2025-11-21 18:00 JST ✅ |
| G-4 | **完了 (RUN_ID=`20251121TtaskGImplZ1`)** `HmacSignedUrlService` で Secrets/TTL 欠損時に即 `IllegalStateException` を投げさせ、`PHRResource` 側で `PHR_SIGNED_URL_ISSUE_FAILED` + フォールバック監査をログ化。 | サーバー実装 × OpsSec | 2025-11-22 12:00 JST ✅ |

## 4. ドキュメント反映
- フェーズ計画: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-export-track` に本レビュー結果を追記し、フェーズE/F Blocker 状態を「DTO 注釈と null フォールバック実装待ち」として明記。
- 進捗台帳: `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行と `docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md` Task-G を RUN_ID とともに更新。

## 5. 備考
- 本レビューはコード差分無し（参照のみ）。テスト実行なし。
- Secrets/監査要件は `RUN_ID=20251118TphrLayerPrepZ1` の合意内容を転記済みであり、本ログは Blocker の残項目のみを示す。

## 6. 実装結果 (2025-11-21 / RUN_ID=20251121TtaskGImplZ1)
- `common/src/main/java/open/dolphin/infomodel/PHRContainer.java` へ `@JsonInclude(Include.NON_EMPTY)` と `List.copyOf` ベースの setter を導入し、`docList`/`labList` を常に空リストまたは不変リストで返すよう更新（null 禁止）。
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java` で `PHR_SIGNED_URL_{ISSUED,ISSUE_FAILED,NULL_FALLBACK}` を発行する分岐を実装。`signedUrlIssuer=RESTEASY`、`storageType`（Config 連動）、`kmsKeyAlias=alias/opd/phr-export`、`bandwidthProfile=phr-container`、`signedUrlTtlSeconds=300` を監査詳細へ含め、例外/Secrets 欠落時は `downloadUrl` を署名なし URL へフェールオーバー。
- `server-modernized/src/main/java/open/dolphin/adm20/export/HmacSignedUrlService.java` を Vault Secrets 依存に固定し、`PHR_EXPORT_SIGNING_SECRET` または TTL 未設定時に `IllegalStateException` を送出するフェールファストへ切替。`PhrExportConfig` からのランダム鍵生成コードを削除済み。
- `server-modernized/src/test/java/open/dolphin/rest/PHRResourceTest.java` に SignedUrl `null`/例外シナリオを追加し、`mvn -pl server-modernized -Dtest=PHRResourceTest test`（ByteBuddy experimental フラグ付き）で `PHR_SIGNED_URL_NULL_FALLBACK`／`PHR_SIGNED_URL_ISSUE_FAILED` の監査内容と `downloadUrl=/resources/20/adm/phr/export/{jobId}/artifact` へのフォールバックを確認。 
