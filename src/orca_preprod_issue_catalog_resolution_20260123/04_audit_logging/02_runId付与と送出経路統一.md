# 02_runId付与と送出経路統一

- RUN_ID: 20260126T100331Z
- RUN_ID(追加): 20260126T102200Z
- RUN_ID(追加): 20260126T112800Z
- 作業日: 2026-01-26
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/04_audit_logging/02_runId付与と送出経路統一.md
- 対象IC: IC-26 / IC-27 / IC-28
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md
  - docs/server-modernization/server-modernized-code-review-20260117.md
  - docs/preprod/implementation-issue-inventory/server-audit-logging.md

## 実施内容
- ADM/EHT 監査イベントの details に `runId` を付与し、UI の runId と突合可能にした。
- EHT 系の監査送出経路を `SessionAuditDispatcher` 経由に統一し、JMS 送信 + DB 記録を揃えた。
- `/orca12/patientmodv2/outpatient` の監査 action を `ORCA_PATIENT_MUTATION` に統一した。

## 変更ファイル
- server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java
- server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java
- server-modernized/src/main/java/open/dolphin/rest/PatientModV2OutpatientResource.java
- server-modernized/src/test/java/open/dolphin/adm20/rest/EHTResourceTest.java
- server-modernized/src/test/java/open/dolphin/adm20/rest/AdmissionResourceFactor2Test.java

## 検証
- 実行コマンド:
  - mvn -f pom.server-modernized.xml -DskipTests=false test
  - mvn -f pom.server-modernized.xml -Dtest=open.dolphin.adm20.rest.EHTResourceTest -Dsurefire.failIfNoSpecifiedTests=false test
  - mvn -f pom.server-modernized.xml -Dtest=open.dolphin.adm20.rest.AdmissionResourceFactor2Test -Dsurefire.failIfNoSpecifiedTests=false test
- 結果:
  - 20260126T100331Z: Tests run: 274, Failures: 0, Errors: 0, Skipped: 3
  - 20260126T102200Z: Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
  - 20260126T112800Z: Tests run: 13, Failures: 0, Errors: 0, Skipped: 0

## 証跡ログ
- artifacts/test-logs/20260126T102200Z/audit-runid-dispatch.log
- artifacts/test-logs/20260126T112800Z/audit-runid-adm-dispatch.log

## 補足（外部監視の整合）
- 現環境では外部監視（JMS 送出）の実測は未実施だが、監査 payload/details に runId を付与しており、外部監視の一次整合は runId をキーに担保可能。
