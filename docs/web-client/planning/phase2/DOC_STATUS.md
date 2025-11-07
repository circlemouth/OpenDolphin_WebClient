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
| [`docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md`](../../../server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md) | モダナイズ/連携 | Active | 2025-11-07 | セクション 6/7 で JMS・クライアント検証手順を統合。次は実機ログをリンクする。
| [`docs/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md`](../../../server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md) | モダナイズ運用 | Archive予定 | 2025-11-07 | 内容は RESERVATION メモへ統合済み。スタブのみ残っているため 2025Q4 Archive へ移動。
| [`docs/server-modernization/phase2/notes/static-analysis-plan.md`](../../../server-modernization/phase2/notes/static-analysis-plan.md) | 共通（Ops） | Dormant | 2025-11-07 | Ops Runbook へ必要箇所を移したら Archive。Slack/PagerDuty 設定は Runbook 側で保守。
| [`docs/server-modernization/phase2/notes/common-dto-diff-A-M.md`](../../../server-modernization/phase2/notes/common-dto-diff-A-M.md) / [`N-Z`](../../../server-modernization/phase2/notes/common-dto-diff-N-Z.md) | 共通 DTO | Archive予定 | 2025-11-07 | DTO 差分は CSV へ抜粋し `docs/archive/2025Q4/dto-diff/` へ移動予定。Legacy 互換確認時のみ参照。
| [`docs/server-modernization/phase2/SERVER_MODERNIZED_STARTUP_BLOCKERS.md`](../../../server-modernization/phase2/SERVER_MODERNIZED_STARTUP_BLOCKERS.md) | モダナイズ運用 | Active | 2025-11-07 | デバッグ作業中のため常に最新版を参照。Blocking Issue 解消後に Dormant 評価。
| [`docs/web-client/operations/LEGACY_INTEGRATION_CHECKS.md`](../../operations/LEGACY_INTEGRATION_CHECKS.md) | Web クライアント | Active | 2025-11-07 | 旧/新サーバー切替検証の手順書。実施ログを `operations/logs/` に集約する。

## 今後のタスク
- [ ] 2025-11-15 までに `DTO diff` を CSV 化し Archive へ移動。
- [x] JMS/予約 Runbook 統合後、`WORKER0_MESSAGING_BACKLOG.md` の stub 化を実施。
- [x] Archive フォルダ構成（`docs/archive/2025Q4/`）を整備し、README テンプレを配布。
