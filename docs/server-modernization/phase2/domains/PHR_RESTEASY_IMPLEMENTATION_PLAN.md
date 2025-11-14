# PHR RESTEasy Implementation Plan

最終更新: 2025-11-14（RUN_ID=20251114TphrPlanZ1）

## 前提・目的
- 対象: PHR-01〜PHR-11（`/20/adm/phr/*`）と連動する export 系 API 群。Legacy 側の `PhrExportJobManager` は `PHR-EXPORT-TRACK` でブロック管理中。
- PHRResource は Task-A で `touch.phr.requiredHeaders=X-Facility-Id,X-Touch-TraceId` を必須化済み。全フェーズで `TouchRequestContextExtractor`/`PhrRequestContextExtractor` による facility / traceId 検証が前提。
- モジュール参照元: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` §4 PHR 表、`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` PHR 行、`docs/server-modernization/phase2/notes/phr-2fa-audit-implementation-prep.md` の監査/2FA・S3 連携メモ。
- ゴール: ORCA 週次レビューで優先度承認できるレベルのシーケンスを提示し、各フェーズの解放条件とテスト観点を明示する。

---

## フェーズA: キー管理（PHR-02 / PHR-03 / PHR-10） {#phase-key-management}
**目的**: PHR 利用鍵（AccessKey）フローを RESTEasy に登録し、施設粒度の鍵管理と監査チェーンを整備する。

| 項目 | 内容 |
| --- | --- |
| 対象ID・順序 | 1) PHR-02 `PUT /accessKey`（鍵 upsert）→ 2) PHR-03 `GET /accessKey/{accessKey}`（suffix 照合）→ 3) PHR-10 `GET /patient/{patientId}`（患者→鍵）。 |
| 依存モジュール / 前提 | `AMD20_PHRServiceBean`, `PhrRequestContextExtractor`, `PhrAuditHelper`, `TouchErrorResponse`。`phr_access_key` Flyway 適用、`touch.phr.requiredHeaders` enforcement、`PHR_ACCESS_KEY` DAO の Jakarta 化（Task-A context-param 連携済）を確認。 |
| 監査 ID / ログ要件 | `PHR_ACCESS_KEY_UPSERT`（新設）、`PHR_ACCESS_KEY_FETCH`, `PHR_ACCESS_KEY_FETCH_BY_PATIENT`。facility mismatch / suffix マスク失敗時は `_FAILED` サフィックスを記録し `X-Touch-TraceId` で相関。 |
| テスト観点 | 401 for missing headers、facility 不一致時 403、アクセスキー末尾4桁検索のマスク、`phr_access_key` Flyway ロールバック検証、`TouchAuditHelper` でのトレース連携。Key rotation happy path + 患者紐付け 404 雛形。 |
| Blocker / 解放条件 | Blocker: Flyway 適用 pending、監査 ID 命名承認（Security）、`phr_access_key` DAO integration テスト不足。解放条件: 上記クリア + RESTEasy リソース登録レビュー + Web.xml context-param diff レビュー完了。 |

---

## フェーズB: 閲覧テキスト API（PHR-01 / PHR-04 / PHR-05 / PHR-08 / PHR-09） {#phase-view-apis}
**目的**: PHR ユースケースで利用者が即表示するテキスト系 API 群を一括で公開し、UTF-8 固定化と異常値抽出ロジックを統一する。

| 項目 | 内容 |
| --- | --- |
| 対象ID・順序 | 1) PHR-01 `GET /abnormal/{patientId}` → 2) PHR-04 `GET /allergy/{patientId}` → 3) PHR-05 `GET /disease/{patientId}` → 4) PHR-08 `GET /labtest/{patientId}` → 5) PHR-09 `GET /medication/{patientId}`。 |
| 依存モジュール / 前提 | `PhrDataAssembler`, `AMD20_PHRServiceBean`, `TouchMedicationFormatter`（PHR-09 前に禁忌語置換を抽出）、`normalizeSampleDate2` の Jakarta 移植（PHR-08）、`docSince/labSince` クエリ定義、Shift_JIS 廃止→UTF-8 固定。 |
| 監査 ID / ログ要件 | `PHR_ABNORMAL_TEXT`, `PHR_ALLERGY_TEXT`, `PHR_DISEASE_TEXT`, `PHR_LABTEST_TEXT`, `PHR_MEDICATION_TEXT`（`PhrAuditHelper` へ追加し、`PHR-EXPORT-TRACK` と同一ネーミングポリシーに合わせる）。 |
| テスト観点 | UTF-8 応答と BOM 無し確認、患者/施設突合、異常値抽出ロジック diff（Legacy vs RESTEasy）、多言語テキスト（kana/kanji）文字化け確認、`docSince/labSince` のクエリバリデーション、`TouchMedicationFormatter` の JSON 依存解消。 |
| Blocker / 解放条件 | Blocker: `TouchMedicationFormatter` リファクタ、`normalizeSampleDate2` 代替完成、監査 ID 定義未済。解放: 各 DTO のユニットテスト + 監査イベント QA 承認 + 週次 ORCA レビューでフェーズB 公開が承認されること。 |

---

## フェーズC: Layer ID / 2FA 連携（PHR-06） {#phase-layer-id}
**目的**: Layer ID 認証トークン発行を RESTEasy へ移行し、2FA/Audit の依存性を固める。

| 項目 | 内容 |
| --- | --- |
| 対象ID・順序 | 単独: PHR-06 `POST /identityToken`。 |
| 依存モジュール / 前提 | `IdentityService`, `PhrRequestContextExtractor`, `PhrAuditHelper`, Vault / Secrets (`SEC-OPS-002` チケット) による Layer ID シークレット注入、Layer ID クライアント証明書保管（`phr-2fa-audit-implementation-prep.md` の Ops 手順）。 |
| 監査 ID / ログ要件 | `PHR_LAYER_ID_TOKEN_ISSUE`（成功/失敗）、`PHR_LAYER_ID_CERT_MISSING`（Ops 監視用）。2FA 監査チェーンと `d_audit_event` ハッシュジョブ（AUDIT-OPS-003）と連動。Secrets 取得結果は `wildfly/identityToken.log` と `ServerInfoResource` を紐付ける。 |
| テスト観点 | 証明書登録状態別の 200/401、Secrets 欠損時の fail-fast、`X-Touch-TraceId` を監査レコードへ継承、Layer ID サンドボックスとの相互接続 curl 手順。Vault から取得した `PHR_LAYER_ID_CLIENT_ID/SECRET` を動的に差し替えた時の Payara ホットリロードを確認する。 |
| Blocker / 解放条件 | Blocker: Secrets チェックジョブ（`ops/check-secrets.sh --profile phr-layer-id`）待ち、IdentityService Payara CDI 化未完、Layer ID ルート証明書更新 Pending。解放: Vault `kv/modernized-server/phr/layer-id` の 3 エントリ（CLIENT_ID/SECRET/CERT_B64）が Ops 署名済、`LAYER_ID_CERT_ALIAS` を web.xml へ反映、`SEC-OPS-002` の CI ジョブが green。 |

- **Secrets/Ops 連携**: Ops（@OpsLead, #ops-secrets）が Vault `kv/modernized-server/phr/layer-id` を管理し、`ops/check-secrets.sh --profile phr-layer-id` で Payara 起動前に `PHR_LAYER_ID_CLIENT_ID`, `PHR_LAYER_ID_CLIENT_SECRET`, `PHR_LAYER_ID_CERT_B64` を検証する。RUN_ID=`20251115TorcaPHRSeqZ1` で Layer ID を実測する場合もこのチェックが必須。
- **署名トークン生成手順**: `IdentityService` は Secrets から取り出したクレデンシャルで JWT を署名し、Layer ID 側へ `/identityToken` をリクエスト。`X-Consent-Token` と `X-Touch-TraceId` を `PhrAuditHelper` に受け渡し、`PHR_LAYER_ID_TOKEN_ISSUE` を `d_audit_event` へ書き込む。Secrets 欠損時は `PHR_LAYER_ID_CERT_MISSING` を記録して 401 を返す。

---

## フェーズD: 画像 / Schema 出力（PHR-07） {#phase-schema}
**目的**: Schema 画像を RESTEasy で安全に配信し、ストレージ/帯域ガバナンスを確立する。

| 項目 | 内容 |
| --- | --- |
| 対象ID・順序 | 単独: PHR-07 `GET /image/{patientId}`。 |
| 依存モジュール / 前提 | `PhrDataAssembler`, `SchemaModel` ストリーマ, `TouchErrorResponse`, `/resources` への MIME 登録, `Cache-Control: no-store` と帯域スロットリング設計。 |
| 監査 ID / ログ要件 | `PHR_SCHEMA_IMAGE_STREAM`, 転送失敗時 `PHR_SCHEMA_IMAGE_STREAM_FAILED`。ダウンロード量を `TouchDownloadMonitor` に転送し、帯域超過時は `PHR_SCHEMA_IMAGE_STREAM_THROTTLED` を記録。 |
| テスト観点 | 大容量画像 (>5MB) 連続アクセス時のサーバー負荷、`Range` ヘッダー無効化、`Content-Type` が `image/jpeg` 固定であること、`X-Facility-Id` 毎のアクセス制限。`ops/shared/docker/bandwidth-policy.properties` で `X-Image-Burst-Limit`/`X-Image-Max-Size` を切り替えた時の挙動も確認。 |
| Blocker / 解放条件 | Blocker: `/resources` Payara 設定の未調整、帯域ガバナンス方針未決定。解放: Ops Storage チームが `TouchDownloadMonitor` へ `Burst=200MB/5min` / `Max=5MB` を投入し、`mime-mapping` に `image/jpeg` を追記、`Cache-Control: no-store, max-age=0` を本 API 固有フィルタで強制する PR が承認済み。 |

- **帯域・キャッシュ方針**: OpsNetwork 管理の `bandwidth-policy.properties` に `X-Image-Burst-Limit=200MB/5min`, `X-Image-Max-Size=5MB` を追加し、Payara 再起動なしで `TouchDownloadMonitor` が読み込めるようホットリロード手順を Runbook へ追記する。Secrets 依存はないが、設定差分は `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` へも記録する。
- **Evidence 取得ルール**: `/image/{patientId}` 実行時は `screenshots/phr-07_image.png` にレンダリング結果を保存、`wildfly/phr_image_download.log` に帯域判定ログを追記し、`PHR_SCHEMA_IMAGE_STREAM_THROTTLED` イベントが出た場合は ORCA 週次で共有する。

---

## フェーズE: PHRContainer（PHR-11） {#phase-container}
**目的**: PHR 本体コンテナ返却を RESTEasy 上で再構成し、署名付き URL と `docSince`/`labSince` フィルタを本番品質で提供する。

| 項目 | 内容 |
| --- | --- |
| 対象ID・順序 | 単独: PHR-11 `GET /{facilityId,patientId,...}`。キー管理・閲覧・Layer ID が完了していることを前提に最終段階で着手。 |
| 依存モジュール / 前提 | `PhrDataAssembler#assemble`, `PHRContainer` DTO の Jackson 化, `SignedUrlService`（1-download, TTL=300s, `allowedSchemes=https` 固定）, `PHR_EXPORT_CONFIG`（`signedUrlIssuer=RESTEASY`, `storageType=S3`, `bandwidthPolicyRef=phr-container`）, `docSince`/`labSince` QueryParam の業務確定。Vault `kv/modernized-server/phr/container` の `PHR_SIGNING_KEY_ID/SECRET`, `PHR_EXPORT_SIGNING_SECRET`, `PHR_EXPORT_STORAGE_TYPE=S3`（`PHR_EXPORT_S3_BUCKET=opd-phr-export-prod` 等）を必須とする。 |
| 監査 ID / ログ要件 | `PHR_CONTAINER_FETCH`, `PHR_SIGNED_URL_ISSUED`, `PHR_SIGNED_URL_ACL_DENY`。監査ログには `docSince/labSince` の実値と結果件数、`signedUrlTtlSeconds`（固定 300）、`signedUrlIssuer`, `storageType`、`bandwidthProfile` を含める。Secrets 不備で署名発行できない場合は `PHR_SIGNED_URL_ISSUE_FAILED` を新設し、`PHR_SIGNED_URL_NULL_FALLBACK` とセットで Pending 理由を Evidence に記録。 |
| テスト観点 | diff ベースの JSON スナップ比較（Legacy vs RESTEasy）、署名付き URL の TTL/署名検証（`aws s3 presign` 互換）、`SignedUrlService` 失敗時のフォールバック（URL 欄 null + 監査 `PHR_SIGNED_URL_NULL_FALLBACK`）、`TouchAuditHelper` 経由で facility/patient 監査整合。`PHR_SIGNING_KEY` ローテーション時に TTL=300s と `signatureScope=facility/patient JOB_ID` が保持されることを確認。 |
| Blocker / 解放条件 | Blocker: `PHRContainer` DTO Jackson アノテーション未整備。Secrets 周り（Vault `kv/modernized-server/phr/container`, `ops/check-secrets.sh --profile phr-export`) と `PHR_EXPORT_CONFIG` 追記は 2025-11-18 Ops/Security 承認済（RUN_ID=`20251118TphrLayerPrepZ1`）。解放: DTO テスト + Signed URL e2e（S3 presign, 1-download enforcement）を完了し、ORCA 週次レビューで evidence（`2025-11-18-phr-layerid-ready.md`）を提示。 |

- **Signed URL 生成手順**: `SignedUrlService` は Secrets から `PHR_SIGNING_KEY_ID`, `PHR_SIGNING_KEY_SECRET` を取得し、`PHRContainer` バイト列のハッシュ＋TTL=300s で署名 URL を作成する。`allowedSchemes=https` を強制し、ACL で facility/patient を埋め込む。生成結果は `logs/phr_container_summary.md` に保存。
- **Ops 連携**: OpsSec が Vault `kv/modernized-server/phr/container` をメンテし、ローテーション時は `RUN_ID=2025xxxxTorcaPHRSeqZ#` の Evidence へ証跡を残す。Secrets の存在確認と `PHR_EXPORT_CONFIG` の差分は ORCA 週次（2025-11-18）までに承認フローを完了させる。

---

## フェーズF: Export Track（PHR-EXPORT-TRACK） {#phase-export-track}
**目的**: `PhrExportJobManager` 系（`/20/adm/phr/export*`）の再公開を別フェーズで管理し、S3 / 監査タスクと同期する。

| 項目 | 内容 |
| --- | --- |
| 対象タスク | `PHRExportResource`（ジョブ登録/進捗/ダウンロード）、`S3PhrExportStorage` 実装、`PHRAsyncJobServiceBean`。 |
| 依存モジュール / 前提 | `phr-2fa-audit-implementation-prep.md` 記載の PHR-OPS-001（S3), SEC-OPS-002（Secrets チェック), AUDIT-OPS-003（監査ハッシュ）チケットに加え、Vault `kv/modernized-server/phr/container` / `kv/modernized-server/phr/export` へ `PHR_EXPORT_STORAGE_TYPE=S3`, `PHR_EXPORT_S3_BUCKET=opd-phr-export-prod`, `PHR_EXPORT_S3_REGION=ap-northeast-1`, `PHR_EXPORT_S3_PREFIX=facility/{facilityId}/jobs/`, `PHR_EXPORT_S3_KMS_KEY=alias/opd/phr-export`, `IAM_ROLE=arn:aws:iam::<redacted>:role/phr-export-uploader` を格納。Ops が `bandwidth-policy.properties` に `max-export-download-burst=50MB/s` を投入済。 |
| 監査 ID / ログ要件 | `PHR_EXPORT_SUBMIT`, `PHR_EXPORT_UPLOAD`, `PHR_EXPORT_DOWNLOAD`, `PHR_EXPORT_JOB_FAILED`, `PHR_SIGNED_URL_ISSUED`, `PHR_SIGNED_URL_ACL_DENY`。S3 署名 URL ログと `d_audit_event` ハッシュ検証を Runbook §6 と同期し、`SignedUrlService` 発行値（TTL, issuer, storageType, kmsKeyAlias）を Evidence へ残す。 |
| テスト観点 | S3 署名 URL TTL/ACL（TTL=300s, `x-amz-server-side-encryption=aws:kms` 必須）、並列 export のジョブ分離、Vault シークレット欠損時の fail-fast、`PHR_EXPORT_CONFIG` の環境差し替え検証、`TouchDownloadMonitor` ログで帯域制御が効いているかを確認。 |
| Blocker / 解放条件 | Blocker: `S3PhrExportStorage` 実装 PR と `PHRExportJobManager` → `SignedUrlService` 連携の単体テスト。Secrets/DTO/フォールバック整備は RUN_ID=`20251121TtaskGImplZ1` で解消済み（Task-G 完了）。残課題は S3 e2e ＋監査チェーン job。解放: 実装 + 署名 URL e2e + 監査チェーン job を完了し、ORCA 週次でフェーズF着手許可を取得。 |

> **2025-11-20 Task-G レビュー (RUN_ID=20251120TphrDtoReviewZ1)**
> - `PHRContainer` 系 DTO（`common/src/main/java/open/dolphin/infomodel/PHRContainer.java` ほか）には依然として Jackson アノテーションや `null` ガードが無く、`docList`/`labList` が `null` のままシリアライズされるとキー欠落 → Web クライアント側で `undefined` 判定になる。`@JsonInclude(Include.NON_EMPTY)` と setter での `List.copyOf(...)` 固定化を追加し、Blocker を解除する。
> - `PHRResource#toJobResponse`（`server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java:865-872`）では `SignedUrlService` の失敗時フォールバックや `PHR_SIGNED_URL_{ISSUED,NULL_FALLBACK,ISSUE_FAILED}` 監査出力が未実装。Secrets 欠損時の例外化と、成功/失敗それぞれで `signedUrlIssuer/storageType/ttlSeconds/bandwidthProfile` を監査へ渡す処理を追加する必要がある。
> - `server-modernized/src/test/java/open/dolphin/rest/PHRResourceTest.java` には `SignedUrlService` を `null` 戻り/例外でスタブ化するテストがなく、`PHR_SIGNED_URL_NULL_FALLBACK` を証跡化できない。フェーズF着手前にユニットテストを追加し、`docs/server-modernization/phase2/operations/logs/2025-11-20-phr-dto-review.md` に記載した TODO を消化する。

> **2025-11-21 Task-G 実装 (RUN_ID=20251121TtaskGImplZ1)**
> - `PHRContainer` DTO へ `@JsonInclude(Include.NON_EMPTY)` と defensive setter を適用し、docList/labList の null 返却を排除。
> - `PHRResource#toJobResponse` に署名付き URL 成功/失敗/NULL フォールバックの監査 (`PHR_SIGNED_URL_{ISSUED,ISSUE_FAILED,NULL_FALLBACK}`) を追加し、Secrets/TTL 欠落時は fail-fast → 署名なし URL 返却 + 監査記録とした。
> - `HmacSignedUrlService` を Vault Secrets 依存に固定し、`PHRResourceTest` に null/例外ケースのユニットテストを追加して RUN_ID の証跡を `docs/server-modernization/phase2/operations/logs/2025-11-20-phr-dto-review.md` へ追記。

> #RUN RUN_ID=20251114TphrPlanZ1 — export フェーズは `PHR-EXPORT-TRACK` のログにて同 RUN_ID を継承し、IaaS 設計レビューが完了したタイミングで更新すること。

---

## ORCA 週次レビュー利用手順
1. 週次アジェンダにフェーズ順の進捗枠を固定し、Blocker をこのドキュメントの該当フェーズ表から引用する。
2. フェーズ移行時は `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の PHR 行メモ欄に本ドキュメント該当アンカーを記載して優先度シグナルを共有する。
3. Export Track の判断はフェーズEが完了し、RUN_ID ログが `Ready for QA` になったタイミングで ORCA サイドへ提示する。
