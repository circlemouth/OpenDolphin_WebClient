# 01_監査schema拡張とoutcome正規化

- RUN_ID: 20260125T113024Z
- 作業日: 2026-01-25
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/04_audit_logging/01_監査schema拡張とoutcome正規化.md
- 対象IC: IC-25 / IC-29
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md
  - docs/server-modernization/server-modernized-code-review-20260117.md
  - docs/preprod/implementation-issue-inventory/server-audit-logging.md

## 実施内容
- 監査テーブル `d_audit_event` に `run_id` / `screen` / `ui_action` / `outcome` を追加する Flyway マイグレーションを作成。
- `AuditEventPayload` / `AuditEventEnvelope` / `SessionAuditDispatcher` / `AuditTrailService` を更新し、details から runId/screen/uiAction/outcome を top-level に昇格。
- `details.outcome=MISSING/BLOCKED` の場合でも top-level outcome が SUCCESS にならないよう正規化。
- ORCA 系レスポンスの `auditEvent.outcome` を実際の outcome と一致させた（claim/outpatient, medicalmodv2）。

## 変更ファイル
- common/src/main/java/open/dolphin/audit/AuditEventEnvelope.java
- common/src/main/java/open/dolphin/infomodel/AuditEvent.java
- server-modernized/src/main/java/open/dolphin/security/audit/AuditEventPayload.java
- server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java
- server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java
- server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java
- server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalModV2Resource.java
- server-modernized/src/main/resources/db/migration/V0231__audit_event_schema_extend.sql
- server-modernized/tools/flyway/sql/V0231__audit_event_schema_extend.sql
- server-modernized/src/test/java/open/dolphin/security/audit/SessionAuditDispatcherTest.java

## 検証
- 実行コマンド:
  - mvn -f pom.server-modernized.xml -Dtest=SessionAuditDispatcherTest -Dsurefire.failIfNoSpecifiedTests=false test
- 結果: パス
