# RUN_ID=20251118TphrLayerPrepZ1 — Layer ID / 画像 / Container 依存解消ログ

## 1. 目的
- Task-E: PHR-06/07/11 を Pending から Ready へ進めるため、Layer ID cert import、画像帯域ポリシー、Signed URL/S3 Secrets を Ops と合意し、関連ドキュメント（`phr-2fa-audit-implementation-prep.md`, `PHR_RESTEASY_IMPLEMENTATION_PLAN.md`, `ORCA_CONNECTIVITY_VALIDATION.md`, `DOC_STATUS.md`）へ反映する。
- ORCA 週次（2025-11-18 09:30 JST）で証跡を提示し、RUN_ID ベースで Secrets/Vault チェックの完了を示す。

## 2. 更新内容
| 更新対象 | 反映内容 | RUN_ID / 備考 |
| --- | --- | --- |
| `docs/server-modernization/phase2/notes/phr-2fa-audit-implementation-prep.md` | `Task-E（2025-11-18）Secrets/Vault 更新状況` を追加し、Layer ID cert、PHR_EXPORT_SIGNING_SECRET、PHR_EXPORT_STORAGE_TYPE/S3/IAM の Vault パス・承認時間・Ops担当を記録。 | RUN_ID=`20251118TphrLayerPrepZ1` |
| `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md` | フェーズE/F 表へ Signed URL TTL=300s、`storageType=S3`, `bandwidthPolicyRef=phr-container`, `kmsKey=alias/opd/phr-export` 等の要件と Blocker 状態を追記。 | 同上 |
| `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` | §4.3.2 テンプレ の Phase-D/E 行と備考を更新。画像帯域 (`X-Image-Burst-Limit=200MB/5min`)・Signed URL の Ready 条件、`2025-11-18-phr-layerid-ready.md` へのリンク、次回 RUN_ID の再設定を明記。 | 同上 |
| `docs/web-client/planning/phase2/DOC_STATUS.md` | W22 行「次回アクション」を Task-E 状態へ更新（Secrets Ready、RUN_ID 記録、Phase-C/D/E 実測の再スケジュール）。 | 同上 |

## 3. Secrets / Vault 証跡
| 項目 | Vault パス / コマンド | ステータス | 備考 |
| --- | --- | --- | --- |
| Layer ID cert import | `vault kv get kv/modernized-server/phr/layer-id` → `PHR_LAYER_ID_CLIENT_ID/SECRET`, `PHR_LAYER_ID_CERT_P12_B64`, `PHR_LAYER_ID_CERT_ALIAS=phr-layerid-20251118`, `PHR_LAYER_ID_CERT_SHA256=<redacted>` | Ops (@OpsLead) + Security ダブルサイン済。`ops/check-secrets.sh --profile phr-layer-id` が 0 終了を確認（2025-11-18 08:40 JST）。 | 401 テスト時は `PHR_LAYER_ID_CERT_MISSING` 監査で即失敗するフェールファスト仕様を `IdentityService` へ転記済。 |
| PHR_EXPORT_SIGNING_SECRET / SignedUrlService | `vault kv get kv/modernized-server/phr/container`。`PHR_SIGNING_KEY_ID=phr-container-20251118`, `PHR_SIGNING_KEY_SECRET`（64 hex, rotate due 2026-05-31）, `PHR_EXPORT_SIGNING_SECRET`, `PHR_EXPORT_STORAGE_TYPE=S3`。`ops/check-secrets.sh --profile phr-export` = 0。 | OpsSec (@OpsSec, 09:05 JST) + Product 承認。`SignedUrlService` で TTL=300s, 1-download, HTTPS-only を enforce。 | 監査 `PHR_SIGNED_URL_ISSUED` へ `signedUrlIssuer=RESTEASY`, `storageType=S3`, `kmsKey=alias/opd/phr-export` を追記済。 |
| PHR_EXPORT_S3 / IAM | `vault kv get kv/modernized-server/phr/export`。`PHR_EXPORT_S3_BUCKET=opd-phr-export-prod`, `PHR_EXPORT_S3_REGION=ap-northeast-1`, `PHR_EXPORT_S3_PREFIX=facility/{facilityId}/jobs/`, `PHR_EXPORT_S3_KMS_KEY=alias/opd/phr-export`, `IAM_ROLE=arn:aws:iam::<redacted>:role/phr-export-uploader`。 | OpsNetwork (@OpsNetwork, 09:20 JST) 承認。`bandwidth-policy.properties` に `max-export-download-burst=50MB/s`, `signed-url-ttl=300` を登録。 | Dev 環境のみ `PHR_EXPORT_STORAGE_TYPE=FILESYSTEM` を許可。CI/Stage/Prod は S3 未設定時に `ops/check-secrets.sh` が失敗するよう更新。 |

## 4. Signed URL / 画像ストリーミング要件
- 署名付き URL: TTL=300s、1-download、`allowedSchemes=https` 固定、監査には `signedUrlIssuer`, `storageType`, `kmsKeyAlias`, `bandwidthProfile` を必須で残す。NULL フォールバック時は `PHR_SIGNED_URL_NULL_FALLBACK` と Pending 理由を `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md` へ追記する。
- 画像ストリーミング: `bandwidth-policy.properties` に `X-Image-Burst-Limit=200MB/5min` / `X-Image-Max-Size=5MB` を設定し、Payara `mime-mapping` PR (#ops-network-20251118) を取り込む。`wildfly/phr_image_download.log` で throttle 成否をログ化。
- Layer ID: keystore import 後の `PHR_LAYER_ID_CERT_SHA256` を Evidence に保存し、`IdentityService` で欠損時に fail-fast (`PHR_LAYER_ID_CERT_MISSING`) する実装を確認。

## 5. Pending / 解除条件
| 項目 | 状態 | 解除条件 / 期限 |
| --- | --- | --- |
| PHR-06/07/11 ORCA 実測 | In Progress（2025-11-15 再実施で PKCS#12 エラーは解消し HTTP 405/404 まで取得。ORCA 側に `/20/adm/phr/*` が存在しないため 200/403 までは到達せず） | Modernized REST 経路で同 API を実装し、Phase-C/D/E の 200/403 + `d_audit_event`（`PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_IMAGE_STREAM`, `PHR_CONTAINER_FETCH`）を採取する。Evidence: `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/`, `logs/phr_container_summary.md`。 |
| `PHRContainer` DTO Jackson 注釈 | Pending（開発タスク） | `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` フェーズE Blocker にある DTO 整備を 2025-11-20 Code Review で fix。 |
| `S3PhrExportStorage` 実装 | Pending（Phase-F ブロッカー） | PHR-OPS-001 を W22 Sprint で着手し、`SignedUrlService` との e2e を 2025-11-22 までに通す。 |

## 6. 次アクション
1. `RUN_ID=20251119TorcaPHRSeqZ1` をテンプレから生成し、Phase-C/D/E の curl・監査抽出・スクリーンショットを採取する（Owner: Codex, Deadline: 2025-11-19 10:00 JST）。
2. `PHRContainer` DTO アノテーション PR (#phr-container-serialization) を 2025-11-20 までにレビュー完了し、`PHR_SIGNED_URL_NULL_FALLBACK` の単体テストを追加。
3. W22 ORCA 週次（2025-11-18）で本ログを共有し、Ops による Secrets/S3 承認済みステータスを議事録へ貼り付け。完了後は `docs/web-client/planning/phase2/DOC_STATUS.md` の次回アクション欄を本ログに合わせて更新済みであることを報告する。

## 8. RUN_ID=`20251119TorcaPHRSeqZ1` 実測メモ（2025-11-15 再実施）
- 実施内容: Phase-C（PHR-06 Layer ID）, Phase-D（PHR-07 画像）, Phase-E（PHR-11 Container）を `curl --cert-type P12 --cert ORCAcertification/103867__JP_u00001294_client3948.p12:FJjmq/d7EP` で再測し、`artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/` 配下に `httpdump/trace/serverinfo/screenshots/audit/logs` を保存。
- 結果: TLS 相互認証と Basic 認証は成功し、PHR-06=HTTP 405、PHR-07=HTTP 404、PHR-11=HTTP 404 まで前進。ORCA 本番に `/20/adm/phr/*` が未開放のため 200/403 までは到達せず。ServerInfoResource は Modernized Compose から HTTP 200 (`body=server`) を取得。
- 影響: PKCS#12 pass 前提はクリア。今後は Modernized REST 実装（WildFly 経由）で同 API を提供し、`d_audit_event` に `PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_IMAGE_STREAM`, `PHR_CONTAINER_FETCH` を残せるようにする必要がある。現状 `audit/sql/PHR_*.sql` の結果は 0 rows。
- TODO 更新: （1）`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#73` に HTTP 405/404 証跡と再実測完了を追記。（2）`DOC_STATUS.md` / `PHASE2_PROGRESS.md` W22 行へ「PKCS#12 OK / HTTP 405/404 まで取得済」旨と Evidence パスを反映。（3）Modernized 実装タスクへ `PHR_CONTAINER`/`PHR_IMAGE`/`LayerID` の優先度を引き継ぐ。

## 7. 連絡先
- Layer ID / Secrets: @OpsLead (#ops-secrets)
- 画像帯域 / Payara 設定: @OpsNetwork (#ops-infra)
- Signed URL / S3 / IAM: @OpsSec (#ops-secrets)
- PHR 実装: @Codex (#server-modernized)
