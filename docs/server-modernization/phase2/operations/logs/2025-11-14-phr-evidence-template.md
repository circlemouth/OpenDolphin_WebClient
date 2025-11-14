# RUN_ID=20251114TphrEvidenceZ1 — PHR 証跡テンプレ整備ログ

## 1. 目的
- Task-C（PHR 週次向け証跡テンプレ & 監査チェックリスト）を実装し、PHR-01〜11 のシーケンスを ORCA 週次レビューへ提示できる状態にする。
- `ORCA_CONNECTIVITY_VALIDATION.md` §4.3.1、`artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md`、`MODERNIZED_API_DOCUMENTATION_GUIDE.md` §6.4、`DOC_STATUS.md` W22 行を同期し、RUN_ID ベースで成果を追跡する。

## 2. 更新内容
| 項目 | 内容 |
| --- | --- |
| Runbook | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` に `#### 4.3.1 PHR シーケンス証跡テンプレ` を追加し、PHR-01〜11 のフェーズ表、`curl --cert-type P12` 雛形、`PHR_*` 監査チェックリスト、`RUN_ID=20251115TorcaPHRSeqZ1` 命名ルールを記載。 |
| ログ | `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#6` にテンプレリンク・測定スケジュール（2025-11-15 Phase-A/B、2025-11-16 Layer ID）・次回レビュー（2025-11-18 09:30 JST）を追記。 |
| テンプレ | `artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md` を新設し、`phr-seq/` フォルダ構造、必須 CLI／スクリーンショット、`audit/phr_audit_extract.sql` の雛形を定義。 |
| API ドキュメント | `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` §6.4 を新設し、Task-A context-param → Task-C 証跡テンプレの参照チェーンとヘッダー／監査手順を整理。 |
| DOC_STATUS | `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行「次回アクション」を「PHR 証跡テンプレ準備済 / 2025-11-18 ORCA 週次で承認待ち / RUN_ID=20251115TorcaPHRSeqZ1 で Phase-A/B 実測予定」に更新。 |

## 3. チェックリスト
- [x] `artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md` 作成
- [x] Runbook (§4.3.1) へ PHR シーケンス観点を追加
- [x] `2025-11-13-orca-connectivity.md` 末尾にテンプレ案と測定計画を記載
- [x] `MODERNIZED_API_DOCUMENTATION_GUIDE.md` §6.4 でヘッダー/Audit 要件を周知
- [x] `DOC_STATUS.md` W22 行（次回アクション）を Task-C 状態へ更新
- [ ] RUN_ID=`20251115TorcaPHRSeqZ1` で Phase-A/B curl 証跡を採取（締切 2025-11-15 10:00 JST）
- [ ] Layer ID (PHR-06) Secrets チェック後に実測（締切 2025-11-16 18:00 JST）

## 4. レビュー依頼
- 対象: ORCA 週次レビュー（W22、2025-11-18 火 09:30 JST）。
- 添付: `phr-seq/` テンプレ README、`ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2、`MODERNIZED_API_DOCUMENTATION_GUIDE.md` §6.4 抜粋。
- レビュー観点: (1) RUN_ID 命名と証跡フォルダ構造の妥当性、(2) `PHR_*` 監査チェックリストの網羅性、(3) Layer ID / 画像 / Container の Pending 承認可否。
- レビュアー: ORCA 週次オーナー（@Hayato）、PHR 実装担当（@Codex）、運用代表（@OpsLead）。

## 5. Pending リスク
| リスク | 状態 / 対応 |
| --- | --- |
| Layer ID Secrets (PHR-06) 未確認 | Ops（窓口: @OpsLead, #ops-secrets）と合意済み事項: Vault パスを `kv/modernized-server/phr/layer-id` に統一し、`PHR_LAYER_ID_CLIENT_ID`, `PHR_LAYER_ID_CLIENT_SECRET`, `PHR_LAYER_ID_CERT_B64` を `ops/check-secrets.sh --profile phr-layer-id` で検証する。未決事項: `SEC-OPS-002` 実装完了と Payara への `LAYER_ID_CERT_ALIAS` 反映が 2025-11-17 18:00 JST までに整わない場合は RUN_ID=`20251115TorcaPHRSeqZ1` では 401 証跡のみ提出。承認待ち。 |
| PHR-07 画像帯域ポリシー | Ops Storage チーム（@OpsNetwork）から `TouchDownloadMonitor` に `X-Image-Burst-Limit=200MB/5min`, `X-Image-Max-Size=5MB` を投入する案で一致。Secrets 不要、ただし `/resources/phr-schema-image` へ `Cache-Control: no-store, max-age=0` を固定し、`ops/shared/docker/bandwidth-policy.properties` にも同値を記載する。未決: Payara 側 `mime-mapping` 追加と帯域設定の PR を 2025-11-17 15:00 JST までに Ops がレビューすること。テンプレ README の TODO へ反映済。 |
| PHR-11 Signed URL | Ops Secrets 管理担当（@OpsSec）と `SignedUrlService` 用共有鍵 `PHR_SIGNING_KEY_ID`, `PHR_SIGNING_KEY_SECRET`, `PHR_SIGNING_KEY_TTL=300s` を `kv/modernized-server/phr/container` に格納する方針で合意。`PHR_EXPORT_CONFIG` へ `signedUrlIssuer=RESTEASY`, `allowedSchemes=https` を追加し、`ops/check-secrets.sh --profile phr-export` で `PHR_EXPORT_CONFIG`/Secrets を同時検証する。未決: Vault エントリのローテーション手順と監査証跡が 2025-11-18 ORCA 週次までに承認されない場合は Phase-E 実測を W23 へスライド。 |

## 6. 次アクション
1. 2025-11-15 10:00 JST までに RUN_ID=`20251115TorcaPHRSeqZ1` を作成し、Phase-A/B の curl／audit／スクリーンショットをテンプレに沿って保存。
2. Layer ID Secrets（SEC-OPS-002 プロファイル）、画像帯域（`bandwidth-policy.properties`）、Signed URL（`kv/modernized-server/phr/container`）のレビュー結果を Ops から 2025-11-17 までに取得し、Pending リスクを 2025-11-18 ORCA 週次で共有。
3. 実測完了後は `docs/web-client/planning/phase2/DOC_STATUS.md`・`PHASE2_PROGRESS.md` の ORCA 節を更新し、RUN_ID／Evidence パス／承認結果を共有する。
