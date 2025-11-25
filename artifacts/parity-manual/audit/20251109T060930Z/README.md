# 2025-11-09 監査ログ採取（2FA API）

## 状況
- 目的: `/20/adm/factor2/totp/registration` 実行時の `d_audit_event` 追記と Trace ID/JMS 連携を確認する。
- 現状: Compose が別ワーカーにより停止→再起動され、`opendolphin-server` / `opendolphin-server-modernized-dev` へ接続できないタイミングでコマンドを再実行したため、`curl` が `connection refused`（exit code 7）で失敗。`totp_registration_admin/{legacy,modern}` には接続失敗のメタのみが残っている。

## 実施ログ（停止前）
- 連続実行中に Modernized 側で `d_audit_event_seq` が欠落し、`AuditTrailService.record` で `relation "d_audit_event_seq" does not exist` が発生するところまで確認。  
- その後 `CREATE SEQUENCE d_audit_event_seq` を手動追加し `setval` 済みだが、Compose 再起動で状態が巻き戻った可能性がある。
- これらのログは `artifacts/parity-manual/audit/d_audit_event_missing.log`（既存ファイル）に追記予定。再現後に `totp_registration_admin/modern_server.log` へ WildFly ログを保存する。

## マネージャー確認依頼
1. Docker 停止を解除し、`./scripts/start_legacy_modernized.sh start` を実行後、HTTP 8080/9080 が疎通する状態を維持してほしい。
2. `opendolphin-postgres(-modernized)` に `d_audit_event_seq` が存在するか確認し、欠落していれば `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` 追記の SQL を適用。
3. 上記が完了次第、以下の手順で 2FA API を再実行（`ops/tests/security/factor2` テンプレ参照）し、レスポンスと `d_audit_event` の INSERT 結果をこのディレクトリへ保存する。  
   ```bash
   PARITY_HEADER_FILE=tmp/trace-headers/adm20-admin-json.headers \
   PARITY_BODY_FILE=tmp/payloads/totp_registration_admin.json \
   PARITY_OUTPUT_DIR=artifacts/parity-manual/audit/20251109T060930Z \
   ops/tools/send_parallel_request.sh --profile compose \
     POST /20/adm/factor2/totp/registration totp_registration_admin
   ```
4. 成功した場合は `ops/tests/security/factor2/totp-verification.http` まで進め、`d_audit_event` の `TOTP_*` エントリを `psql` でダンプして `README.md` へ記載してほしい。

## 既存ファイル
- `totp_registration_admin/<legacy|modern>/meta.json` … 最終実行時の接続失敗記録（exit=7）。
- `d_audit_event_missing.log`（親ディレクトリ） … 11/09 作業中に確認した `d_audit_event_seq` 欠落ログ。
