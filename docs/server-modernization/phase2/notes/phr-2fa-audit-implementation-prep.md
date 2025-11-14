# PHR / 2FA / 監査 実装フェーズ準備メモ（2026-06-07 更新）

## 概要
- 目的: PHR エクスポートの S3 永続化、Secrets 自動検査、監査ハッシュ検証の自動化、第三者提供記録 API の実装着手に向けたチケット草案と作業ブロックを整理する。
- 参照元: `common-dto-diff-N-Z.md` のギャップ整理、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の既存手順。
- 成果物: チケット化にそのまま転用できる要件定義、想定担当/依存関係、受入条件。

## Task-E（2025-11-18）Secrets/Vault 更新状況 — RUN_ID=20251118TphrLayerPrepZ1

| 項目 | Vault / 設定 | 承認ステータス | 備考 |
| --- | --- | --- | --- |
| Layer ID cert / client secrets | `kv/modernized-server/phr/layer-id` に `PHR_LAYER_ID_CLIENT_ID`, `PHR_LAYER_ID_CLIENT_SECRET`, `PHR_LAYER_ID_CERT_P12_B64`, `PHR_LAYER_ID_CERT_ALIAS=phr-layerid-20251118` を格納。`ops/check-secrets.sh --profile phr-layer-id` へ `LAYER_ID_CERT_ALIAS` と `PHR_LAYER_ID_CERT_SHA256` を追加。 | Ops（@OpsLead, 2025-11-18 08:40 JST）と Security がダブルサイン。Payara `domain.xml` へ keystore import→`identityToken` Timer により 200/401 ハンドリングを再確認。 | RUN_ID=`20251118TphrLayerPrepZ1` で `vault kv get .../phr/layer-id` を行い、Base64 長を 6,148 byte（P12 2048bit）に統一。欠損時は `PHR_LAYER_ID_CERT_MISSING` をトリガーするフェールファスト仕様を `IdentityService` 側へ転記済み。 |
| PHR_EXPORT_SIGNING_SECRET / SignedUrlService | `kv/modernized-server/phr/container` に `PHR_SIGNING_KEY_ID=phr-container-20251118`, `PHR_SIGNING_KEY_SECRET`（64 hex, 2026-05-31 ローテーション予定）, `PHR_EXPORT_SIGNING_SECRET` を格納。`SignedUrlService` は `allowedSchemes=https`, `defaultTtlSeconds=300` でロック。 | OpsSec（@OpsSec, 2025-11-18 09:05 JST）承認、Product が TTL 300s/1-download 制限へ合意。`SEC-OPS-002` の `--profile phr-export` がグリーン。 | `PHR_CONTAINER_FETCH` → `PHR_SIGNED_URL_ISSUED` 監査に `signedUrlIssuer=RESTEASY`, `storageType=S3` を出力する追加仕様を Phase-E 表へ転記。NULL 返却基準も `SignedUrlService` README に記載。 |
| PHR_EXPORT_STORAGE_TYPE / S3/IAM | Stage/Prod は `PHR_EXPORT_STORAGE_TYPE=S3` 固定。`PHR_EXPORT_S3_BUCKET=opd-phr-export-prod`, `PHR_EXPORT_S3_REGION=ap-northeast-1`, `PHR_EXPORT_S3_PREFIX=facility/{facilityId}/jobs/`, `PHR_EXPORT_S3_KMS_KEY=alias/opd/phr-export`。IAM ロール `arn:aws:iam::<redacted>:role/phr-export-uploader` へ `s3:GetObject/PutObject/DeleteObject/GetObjectVersion/ListBucket` を許可。 | OpsStorage（@OpsNetwork, 2025-11-18 09:20 JST）と Infrastructure が承認。`PHR_EXPORT_STORAGE_TYPE=FILESYSTEM` は Dev 限定で残すが、CI/Stage/Prod では S3 未設定時に `ops/check-secrets.sh` が失敗するよう更新。 | `S3PhrExportStorage` 実装タスクで必要な `bandwidth-policy.properties` 参照値 (`max-download-burst=50MB/s`, `signed-url-ttl=300`) を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` フェーズE/F へ追加済。CloudTrail/Server-Side Encryption の定期検証（週次）を Ops Runbook へ追記。 |

## チケット草案サマリー

| チケット案 | 優先度 | 作業ブロック（Owner 想定） | 主な受入条件 | 備考 |
| --- | --- | --- | --- | --- |
| PHR-OPS-001: S3PhrExportStorage 実装と運用切替 | 高 | 1) S3/IAM 設計 (Ops)<br>2) ストレージ実装＆テスト (Backend)<br>3) 署名 URL 認証/監査連携 (Security/QA) | `S3PhrExportStorage` の `storeArtifact`/`loadArtifact` が S3 へ PUT/GET する。署名付き URL の TTL・権限が `PhrExportConfig` と一致。モダン/レガシー双方で PHR ダウンロード成功。`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ S3 版手順追記。 | 暫定 FILESYSTEM 継続を判断する場合は代替チケット（容量監視・バックアップ）へ切替。 |
| SEC-OPS-002: `ops/check-secrets.sh` と CI 失敗条件の整備 | 高 | 1) Secrets スキーマ定義 (Security)<br>2) スクリプト実装 (Ops)<br>3) CI 組み込み (DevOps) | `ops/check-secrets.sh` で必須環境変数（2FA/PHR/S3）を検査し、欠損・形式不一致で非ゼロ終了。CI（GitHub Actions/ Jenkins）で `bash ops/check-secrets.sh` を実行し、未設定時に失敗。Runbook に判定基準・保管場所を追記。 | Vault (`kv/modernized-server/*`) のパス命名とローテーション手順を `security/DEPLOYMENT_WORKFLOW.md` と揃える。 |
| AUDIT-OPS-003: 監査ハッシュチェーン自動検証ジョブ | 中 | 1) SQL/検証ロジック設計 (Security)<br>2) バッチ/Quartz 実装 (Backend)<br>3) 監視/通知設定 (Ops) | `d_audit_event` の `event_hash`／`previous_hash` 差異を検出するスケジュールドジョブを Payara Timer または バッチで実装。異常時 PagerDuty/Slack 通知と Runbook エスカレーション手順が整備。CI で DAO レベルのユニットテストが成功。 | ハッシュチェーン検証 SQL は Runbook の手動手順と共通化。ストレージポリシー決定待ちでもジョブ実装は進行可。 |
| PHR-AUD-004: 第三者提供記録 API 設計・実装 | 高 | 1) 業務フロー定義 (Product/Ops)<br>2) API/サービス実装 (Backend)<br>3) UI/監査統合 (Frontend/QA) | REST (`/20/adm/audit/disclosure`) の登録/閲覧/検索 API とサービスレイヤーが実装され、`ThirdPartyDisclosureRecord` 永続化が完了。`AuditTrailService` に `THIRD_PARTY_DISCLOSURE_*` イベントが追加され、Runbook に SQL/CSV 抽出手順が追記。ステージ環境で e2e テスト/監査ログ検証を実施。 | UI 実装は別チケット（Phase3）に分離可。まずは API + 管理ツール連携を優先。 |

## 詳細メモ

### PHR-OPS-001: S3 ストレージ実装
- **現状**: `S3PhrExportStorage#storeArtifact` / `loadArtifact` は `UnsupportedOperationException`。Factory で S3 を選択すると警告を出すのみ。
- **要件整理**:
  - S3 バケット命名、リージョン、暗号化方式（SSE-S3 or KMS）を Ops と決定。
  - IAM ポリシー: `PutObject`, `GetObject`, `DeleteObject`, `GetObjectVersion`, `HeadObject` を許可。プリフィクスは `phr-exports/{facilityNumber}/{jobId}` を想定。
  - 署名付き URL は `PhrExportConfig#getTokenTtlSeconds` と同値の有効期限。HTTP メソッドは `GET` のみ許可。Content-Type は `application/zip` 固定。
  - `PhrExportConfig` に S3 用設定 (`PHR_EXPORT_S3_BUCKET`, `PHR_EXPORT_S3_REGION`, `PHR_EXPORT_S3_PREFIX`, `PHR_EXPORT_S3_ENDPOINT`) を追加し、Secrets Manager から認証情報（アクセスキー ID / シークレットキー or IAM ロール）を取得。
  - 監査ログ: `storeArtifact` / `loadArtifact` 成功時に `PHR_EXPORT_UPLOAD` / `PHR_EXPORT_DOWNLOAD` 監査イベントを拡張。失敗時は `action=_FAILED` を記録。
- **作業ブロック**:
  1. Ops: バケット設計＆Terraform/IaC 草案。S3 側のバージョニングと暗号化設定、CloudTrail 連携を Runbook に反映。
  2. Backend: `S3PhrExportStorage` 実装（AWS SDK v2/v3 or S3 REST クライアント）。単体テストで `S3Client` をモックし署名 URL 生成を検証。`PhrExportStorageFactory` の警告削除。
  3. QA/Security: Stage 環境で実データの PUT/GET/DELETE ドライラン。`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に S3 手順を追加し、既存 FILESYSTEM 手順を残したまま切替条件を定義。
- **成果物**: 実装 PR、Terraform 差分、Runbook 更新、CI での `PhrExportStorageTest`。

### SEC-OPS-002: Secrets 自動検査と CI 連携
- **現状**: Secrets チェックは Runbook で手動。CI 未整備。
- **対象変数**:
  - `FACTOR2_AES_KEY_B64`: 32 byte Base64（長さ 44）。空/NUL 文字禁止。
  - `FIDO2_RP_ID`: ドメイン形式。`FIDO2_ALLOWED_ORIGINS`: カンマ区切り URL。双方とも本番/ステージで個別値。
  - `PHR_EXPORT_SIGNING_SECRET`: 32+ 文字。英数字のみ推奨。
  - `PHR_EXPORT_STORAGE_TYPE`: `FILESYSTEM` or `S3`。S3 選択時は以下追加チェック。  
    - `PHR_EXPORT_S3_BUCKET`（DNS 準拠）、`PHR_EXPORT_S3_REGION`、`PHR_EXPORT_S3_PREFIX`、`AWS_REGION`。  
  - `VAULT_ADDR` / `VAULT_TOKEN`（CI で Vault 参照する場合）。
- **スクリプト仕様（案）**:
  - `bash` + `set -euo pipefail`。`REQUIRED_SECRETS=(...)` と `OPTIONAL_SECRETS=(...)` を配列定義。
  - 形式検証には `grep -E` や `python` 禁止のため `bash`/`perl`/`awk` のみ。Base64 長さは `wc -c`、ドメイン検証は `grep -Eq '^[a-z0-9.-]+$'`、URL は `grep -Eq '^https://'` 程度の静的チェック。
  - 欠損または形式不一致で `EXIT_CODE=1` に設定し終了。チェック結果は一覧表示。
- **CI 設定案**:
  - Jenkins: `pipeline` ステージに `sh 'bash ops/check-secrets.sh'` を追加。Vault から読み込む場合は `withCredentials` で注入。
  - GitHub Actions: `jobs.prepare` で `environment: staging` の Protected Secret を利用。`run: bash ops/check-secrets.sh`.
  - Nightly: ステージング向けジョブを実行し、Vault のキー欠損を早期検知。失敗時は Security/Ops に Slack 通知。
- **Runbook 追記項目**: 失敗条件（欠損/形式不一致/Vault 到達不可）、Secrets 保管場所（Vault パス）、復旧手順（Vault へ再登録→ジョブ再実行）。

### AUDIT-OPS-003: 監査ハッシュ検証自動化
- **現状**: Runbook に手動 SQL (`SELECT event_time,event_hash,previous_hash ...`) のみ。ジョブ無し。
- **要件**:
  - Payara Timer Service で 5 分間隔に `AuditTrailService.verifyChain()` を実行、差異が出た場合に `SecurityIncidentNotifier` を介して PagerDuty/Slack Webhook へ通知。
  - 差分検出時は `d_audit_event` の該当レコードを CSV にエクスポートして S3/WORM に保管。
  - ヘルスエンドポイント `/health/audit-chain` を MicroProfile Health で公開し、CI で `curl` チェック。
  - CI で `AuditTrailServiceTest#detectsChainBreak` を追加。`@QuarkusTest` ではなく Payara Embedded の単体テスト方針を決定。
- **依存関係**: Secrets チェック（`PHR_EXPORT_SIGNING_SECRET`）と独立。S3 実装と疎結合。
- **作業ブロック**:
  1. Security: 監査証跡の保管期間・WORM/S3 Glacier 判定を決定。Runbook/コンプライアンス文書へ反映。
  2. Backend: 検証ユーティリティ（`AuditHashVerifier`）実装、Timer Bean、ヘルスチェック追加。
  3. Ops: アラート連携（PagerDuty サービス/Slack channel）設定。通知テンプレートに対応手順を含める。
- **受入条件**: Stage 環境で意図的に `previous_hash` を改変し、ジョブが 5 分以内に検知するデモを記録。Runbook に異常時フロー追記。

### PHR-AUD-004: 第三者提供記録 API
- **現状**: DTO/テーブルのみ。API/UI 未実装。
- **要件**:
  - REST Resource（仮: `AuditDisclosureResource`）: `POST /20/adm/audit/disclosure`（作成）、`GET /20/adm/audit/disclosure/{id}`、`GET /20/adm/audit/disclosure?patientId=&from=&to=&recipient=`、`PATCH /20/adm/audit/disclosure/{id}`（備考修正）、`DELETE`（論理削除 or 訂正フラグ）。
  - 役割ベースアクセス制御: `SecurityContext` と `FacilityRole` を利用し、医事課/セキュリティ管理者のみ許可。
  - 監査ログ: `THIRD_PARTY_DISCLOSURE_CREATE/UPDATE/DELETE/VIEW` を `AuditTrailService` へ追加。
  - バリデーション: `patientId` 必須、`recipient`/`purpose` 文字数制限、`disclosedAt` は過去/現在のみ許可。JAX-RS バリデーションと Bean Validation を併用。
  - レポート: CSV エクスポート（`text/csv`）と PDF/Excel 検討。初期スコープは CSV。
  - UI: Phase3 で別チケットだが、API 応答を念頭に UI 仕様を先行定義。利用ワークフロー図（ヒアリング結果）を `docs/server-modernization/phase2/operations/` に追加。
- **作業ブロック**:
  1. Product/Ops: ヒアリング（医事課／法務）。提供トリガー・承認プロセス・証憑添付要件を決定。成果: ワークフロー図・監査要件の明文化。
  2. Backend: DTO -> Resource -> Service 実装。`ThirdPartyDisclosureService` を追加し、`d_third_party_disclosure` CRUD + 検索を実装。単体テスト（`ThirdPartyDisclosureResourceTest`）と統合テストを作成。
  3. QA/Security: Stage で e2e テスト。監査ログと API レスポンスを比較し、Runbook に抽出 SQL/CSV 手順を追加。
- **マイルストーン**: Phase2 で API 実装・Runbook 更新。Phase3 で UI 開発とユーザー教育資料作成。コンプライアンス審査を Phase2 完了判定条件に含める。

## 次アクション
1. 本メモを `PHASE2_PROGRESS.md` にリンクし、Ops 定例で優先度確定。
2. Secrets チェック対象の環境変数を `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` と `security/DEPLOYMENT_WORKFLOW.md` に同期。
3. Ops/Security と連携して S3 / 監査自動化の PoC スケジュールを策定し、Phase2 Sprint Backlog に投入する。

