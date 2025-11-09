# ドキュメント棚卸しステータス（Phase 2）

Web クライアントおよびサーバーモダナイズで参照する資料を「すぐ使うものだけを見える化」するための台帳。月次の Phase2 定例（毎月第1火曜）で更新し、更新後は `docs/web-client/README.md` の該当セクションにリンクを追記する。

## ステータス定義
- **Active**: 直近 30 日以内に更新 or 今後 30 日以内に作業予定がある。リンク切れがないことを確認し、担当者を必ず明記。
- **Dormant**: 31〜180 日間更新がなく、参照頻度が低下。次に参照する可能性があるイベント（例: リリース、検証ウィンドウ）を備考に記載し、担当者レビュー期限を設定。
- **Archive**: 180 日以上更新がなく、現行フローから切り離された資料。`docs/archive/<YYYYQn>/` 配下へ移動し、元ファイルにはスタブを残す。

## 棚卸し手順
1. `git log -1 --format='%cs %h' <path>` で最終更新日とコミットを記録。
2. `rg -n '<file name>' docs -g"*.md"` で参照元件数を確認し、Active 化が必要か判断。
3. ステータス変更時は本ファイルの表と `docs/web-client/README.md` / 関係する README を同時に更新。
4. Archive へ移動する場合は `docs/archive/<YYYYQn>/README.md` に理由と復活条件を追記し、PR 説明欄に「Archive Move」を付記。

## トラッキング対象（2025-11-07 更新）
| ドキュメント | スコープ | ステータス | 最終レビュー | 備考 / 次アクション |
| --- | --- | --- | --- | --- |
| [`docs/web-client/README.md`](../../README.md) | Web クライアント | Active | 2025-11-07 | 再構成済み。週次でリンク検査を実施し、Phase2 INDEX と同期する。
| [`docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md`](../../../server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md) | モダナイズ/連携 | Active | 2025-11-09 | §8 に Legacy WildFly10 復旧ログ／`ServerInfoResource` 証跡を追記し、CLAIM/DIAGNOSIS 検証ログから新規 artifacts へリンク済み。次回は ClaimSender/DiagnosisSender の修正結果と突合する。 |
| [`docs/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md`](../../../server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md) | モダナイズ運用 | Archive予定 | 2025-11-07 | 内容は RESERVATION メモへ統合済み。スタブのみ残っているため 2025Q4 Archive へ移動。
| [`docs/server-modernization/phase2/notes/static-analysis-plan.md`](../../../server-modernization/phase2/notes/static-analysis-plan.md) | 共通（Ops） | Dormant | 2025-11-07 | Ops Runbook へ必要箇所を移したら Archive。Slack/PagerDuty 設定は Runbook 側で保守。
| [`docs/server-modernization/phase2/notes/common-dto-diff-A-M.md`](../../../server-modernization/phase2/notes/common-dto-diff-A-M.md) / [`N-Z`](../../../server-modernization/phase2/notes/common-dto-diff-N-Z.md) | 共通 DTO | Archive予定 | 2025-11-07 | DTO 差分は CSV へ抜粋し `docs/archive/2025Q4/dto-diff/` へ移動予定。Legacy 互換確認時のみ参照。
| [`docs/server-modernization/phase2/SERVER_MODERNIZED_STARTUP_BLOCKERS.md`](../../../server-modernization/phase2/SERVER_MODERNIZED_STARTUP_BLOCKERS.md) | モダナイズ運用 | Active | 2025-11-09 | Legacy WildFly10 の `DB_HOST` 衝突（ORCA ネットワークの `db` alias）を Appendix として追加し、Compose/CLI 差分と `jboss-cli` 証跡へのリンクを整理。Blocking Issue 解消後に Dormant 評価。 |
| [`docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md`](../../../server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md) | モダナイズ/DB | Active | 2025-11-09 | 節3/4/6 を改訂し、`psql -h localhost` 前提のシード投入、`flyway/flyway:10.17` コンテナでの baseline→migrate→info、失敗パターン表、Gate 定義を追加。証跡は `artifacts/parity-manual/db-restore/20251109T200035Z/` に集約。 |
| [`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`](../../../server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md) | モダナイズ/運用 | Active | 2025-11-09 | フェーズ2の DB Gate を完了扱いにし、`JPQL` 調査結果と `Claim/Diagnosis/MML` の再検証（ヘルパーコンテナ経由）を備考へ追記。`artifacts/parity-manual/{db-restore,JPQL,CLAIM_DIAGNOSIS_FIX}/20251109T20xxxxZ/` を参照できるよう更新。 |
| [`docs/server-modernization/phase2/PHASE2_PROGRESS.md`](../../../server-modernization/phase2/PHASE2_PROGRESS.md) | モダナイズ/運用 | Active | 2025-11-09 | 「DB ベースライン復旧Gate」「CLAIM_DIAGNOSIS_FIX 再検証」節を新設し、`psql`/`flyway` 証跡、`claimHelper/diseaseHelper` 課題、ヘルパーコンテナ経由の CLI 手順を記録。 |
| [`docs/web-client/operations/LEGACY_INTEGRATION_CHECKS.md`](../../operations/LEGACY_INTEGRATION_CHECKS.md) | Web クライアント | Active | 2025-11-07 | 旧/新サーバー切替検証の手順書。実施ログを `operations/logs/` に集約する。
| [`docs/server-modernization/phase2/notes/touch-api-parity.md`](../../../server-modernization/phase2/notes/touch-api-parity.md) | モダナイズ/REST | Active | 2025-11-09 | §10 を追加し、`artifacts/parity-manual/{db-restore,smoke,rest-errors,TRACEID_JMS,audit}/20251109T060930Z/` の証跡と Trace/REST/TOTP のブロッカー、マネージャー向け依頼事項を整理。 |
| [`docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md`](../../../server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md) | モダナイズ/運用 | Active | 2025-11-09 | §5 に 2025-11-09 実行結果 (trace_http_200/400/401/500) を追記し、`UnknownEntityException: AuditEvent` 等の失敗ログと再実行 TODO を列挙。 |
| [`docs/server-modernization/operations/API_PARITY_RESPONSE_CHECK.md`](../../../server-modernization/operations/API_PARITY_RESPONSE_CHECK.md) | モダナイズ/REST | Active | 2025-11-09 | 手動比較向けに `compare: "text"` を利用する config（tmp/parity-touch/20251109T060930Z）と実行例を追記。 |
| [`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`](../../../server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md) | モダナイズ/運用 | Active | 2025-11-09 | Gate #44（MmlSenderBeanSmokeTest）を追加し、`tmp/mml-tests/` フィクスチャ確認→`mvn -Dtest=...` 実行→`tmp/mvn-mml.log` 証跡→`artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/<UTC>/` への保存手順を明文化。 |
| [`docs/server-modernization/phase2/notes/messaging-parity-check.md`](../../../server-modernization/phase2/notes/messaging-parity-check.md) | モダナイズ/連携 | Active | 2025-11-09 | §8 を追加し、Claim/Diagnosis/MML の HTTP/JMS/DB サマリ、`claimHelper.vm` 配置方針、`MessagingHeaders` 図解、DLQ・ポートフォワード課題、証跡 (`artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T201846Z/`) を整理。 |
| [`docs/server-modernization/phase2/notes/domain-transaction-parity.md`](../../../server-modernization/phase2/notes/domain-transaction-parity.md) | モダナイズ/ドメイン | Active | 2025-11-09 | §3 に Karte/Patient/Appo/Schedule の JPQL 比較表と Trace ID、未登録エンティティ (`PatientVisitModel`,`AppointmentModel`)／データ欠落 (`WEB1001`) を明記し、`ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` 追加ケースと `appo_cancel_sample.json` にリンク。 |
| [`docs/server-modernization/phase2/notes/storage-mode-checklist.md`](../../../server-modernization/phase2/notes/storage-mode-checklist.md) | モダナイズ/運用 | Active | 2025-11-09 | MinIO 付き compose / `.env` / `ops/tests/storage/attachment-mode/run.sh` 手順を追記。docker 実行はマネージャーが調整し、DB/S3 証跡を `artifacts/parity-manual/attachments/<UTC>/` に保存する。 |
| [`docs/server-modernization/phase2/notes/rest-touch-diff-report.md`](../../../server-modernization/phase2/notes/rest-touch-diff-report.md) | モダナイズ/REST | Active | 2025-11-08 | ADM スナップショットの VisitPackage/Labo/Diagnosis 追加と `jshell` 実行手順を追記。`tmp/legacy-fixtures/adm*/<scenario>.json` の保守ポリシーをリンクし、差分が無い場合でも記録を更新できるようにした。 |

| [`security-elytron-migration.md`](../../../server-modernization/phase2/notes/security-elytron-migration.md) | モダナイズ/セキュリティ | Active | 2026-06-16 | LOGFILTER_HEADER_AUTH_ENABLED トグルと Elytron リリース基準を集約。ops/tools/logfilter_toggle.sh の使用方法・次アクションを記載。 |
| [`FACTOR2_RECOVERY_RUNBOOK.md`](../../../server-modernization/phase2/operations/FACTOR2_RECOVERY_RUNBOOK.md) | モダナイズ/運用 | Active(ドラフト) | 2026-06-16 | FACTOR2_AES_KEY_B64 欠落時の起動失敗→復旧ステップを整理。WildFly 起動ログは artifacts/parity-manual/secrets/ に保存し、Docker 利用環境で追補予定。 |

## 今後のタスク
- [ ] 2025-11-15 までに `DTO diff` を CSV 化し Archive へ移動。
- [x] JMS/予約 Runbook 統合後、`WORKER0_MESSAGING_BACKLOG.md` の stub 化を実施。
- [x] Archive フォルダ構成（`docs/archive/2025Q4/`）を整備し、README テンプレを配布。
