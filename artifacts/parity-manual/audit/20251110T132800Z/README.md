# RUN_ID=20251110T132800Z Audit Evidence

- 取得日時: 2025-11-10T22:28:00+09:00（UTC 13:28:00）
- 実行者: Codex
- コマンド:
  - `docker exec -i opendolphin-postgres psql -U opendolphin -d opendolphin -c "SELECT event_time, action, resource, request_id, patient_id FROM d_audit_event ORDER BY event_time DESC LIMIT 20;"`
  - `docker exec -i opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "SELECT event_time, action, resource, request_id, patient_id FROM d_audit_event ORDER BY event_time DESC LIMIT 20;"`
- 結果サマリ:
  - Legacy 側は `d_audit_event` に 0 行（空テーブル）。今回の /dolphin, /serverinfo/jamri, /mml/patient/list リクエストは AuditTrail には記録されず、baseline seed が Event を持たない状態であることを確認。
  - Modernized 側は過去の `SYSTEM_ACTIVITY_SUMMARY` / `EHT_CLAIM_SEND` が 2025-11-10 21:32 JST まで残っているが、今回のベースケース ID (`base_readonly_*`) に対応するリクエスト ID は記録されていない。WildFly が 404 を返している間は AuditTrail にも到達していないことが確定。
- 添付ファイル:
  - `legacy_d_audit_event.log`
  - `modern_d_audit_event.log`

> 監査ログが欠落しているため、`docs/server-modernization/phase2/notes/test-data-inventory.md` §3 へ「RUN_ID=20251110T132800Z は AuditTrace 追加なし」を追記。次回は Modernized WildFly の `/openDolphin/resources/*` デプロイ正常化後に同シナリオを再取得する。
