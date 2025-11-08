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
| [`docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md`](../../../server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md) | モダナイズ/DB | Active | 2025-11-08 | 06:24Z 実測・07:43Z 再試行ログに加え、10:14:55Z/10:22:44Z フォローアップで `artifacts/parity-manual/db-restore/20251108T101455Z/`（`README.md`, `investigation.log`, `ops_request.txt`, `blocked_actions.log`）を作成し再依頼・回答待ちを記録。Secrets dump 受領後に成功ケースを追記するタスクが残る。 |
| [`docs/web-client/operations/LEGACY_INTEGRATION_CHECKS.md`](../../operations/LEGACY_INTEGRATION_CHECKS.md) | Web クライアント | Active | 2025-11-07 | 旧/新サーバー切替検証の手順書。実施ログを `operations/logs/` に集約する。
| [`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`](../../../server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md) | モダナイズ/運用 | Done | 2025-11-08 | OBS-ACTUATOR-20251108-02 の成功証跡に `mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests`／`jar tf ... WEB-INF/jboss-deployment-structure.xml` を追記し、2025-11-08T10:32:44+09:00 の Grafana/PagerDuty 本番反映ログ `operations/logs/2025-11-08-pagerduty-observability.txt` と Evidence `artifacts/parity-manual/observability/20251108T074657Z-success/` を紐付け済み。残課題なし。 |
| [`docs/server-modernization/phase2/notes/rest-touch-diff-report.md`](../../../server-modernization/phase2/notes/rest-touch-diff-report.md) | モダナイズ/REST | Active | 2025-11-08 | ADM スナップショットの VisitPackage/Labo/Diagnosis 追加と `jshell` 実行手順を追記。`tmp/legacy-fixtures/adm*/<scenario>.json` の保守ポリシーをリンクし、差分が無い場合でも記録を更新できるようにした。 |

| [`security-elytron-migration.md`](../../../server-modernization/phase2/notes/security-elytron-migration.md) | モダナイズ/セキュリティ | Active | 2026-06-16 | LOGFILTER_HEADER_AUTH_ENABLED トグルと Elytron リリース基準を集約。ops/tools/logfilter_toggle.sh の使用方法・次アクションを記載。 |
| [`FACTOR2_RECOVERY_RUNBOOK.md`](../../../server-modernization/phase2/operations/FACTOR2_RECOVERY_RUNBOOK.md) | モダナイズ/運用 | Active(ドラフト) | 2026-06-16 | FACTOR2_AES_KEY_B64 欠落時の起動失敗→復旧ステップを整理。WildFly 起動ログは artifacts/parity-manual/secrets/ に保存し、Docker 利用環境で追補予定。 |

## 今後のタスク
- [ ] 2025-11-15 までに `DTO diff` を CSV 化し Archive へ移動。
- [x] JMS/予約 Runbook 統合後、`WORKER0_MESSAGING_BACKLOG.md` の stub 化を実施。
- [x] Archive フォルダ構成（`docs/archive/2025Q4/`）を整備し、README テンプレを配布。
