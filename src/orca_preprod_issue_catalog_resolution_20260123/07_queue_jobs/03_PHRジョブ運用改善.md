# 03_PHRジョブ運用改善

- RUN_ID: 20260124T055257Z
- 作業日: 2026-01-24
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/07_queue_jobs/03_PHRジョブ運用改善.md
- 対象IC: IC-33 / IC-34 / IC-35
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/touch_adm_phr/06_Touch_ADM_PHR_API整備.md
  - docs/server-modernization/server-modernized-code-review-20260117.md

## 実施内容
- PHR エクスポートジョブの監視・復旧を担う Supervisor を追加し、再起動後に PENDING/スタック RUNNING を再実行可能にした。
- retry/backoff をジョブ管理に実装し、失敗理由に応じて再試行可否・次回実行タイミングを制御した。
- ジョブ監視メトリクス（heartbeat/lockedBy/retryCount/nextRetryAt）をステータスレスポンスに追加した。

## 再実行ポリシー
- retry 対象: `STORAGE_ERROR` / `UNEXPECTED_ERROR` / `HEARTBEAT_TIMEOUT` / `RUNTIME_TIMEOUT`。
- retry 上限: `phr-export.job.max-retries`（既定 3）。
- backoff: `phr-export.job.retry.backoff-seconds` を基準に指数バックオフ（上限 `phr-export.job.retry.backoff-max-seconds`）。
- 再起動復旧:
  - `PENDING` は即時再実行。
  - `RUNNING` で heartbeat が欠落/タイムアウトしたジョブは失敗扱い → 再実行可否を判定。
  - `RUNNING` が最大実行時間を超えた場合は `RUNTIME_TIMEOUT` で失敗扱い → 再実行可否を判定。
  - retry 上限超過は `EXPIRED` で終了。

## 監視/タイムアウト
- 監視対象:
  - `heartbeatAt`（進捗/ハートビート更新）
  - `lockedBy`（実行中ワーカー）
  - `retryCount` / `nextRetryAt`
- タイムアウト設定:
  - heartbeat timeout: `phr-export.job.heartbeat-timeout.seconds`（既定 300 秒）
  - max runtime: `phr-export.job.max-runtime.seconds`（既定 1800 秒）
- Supervisor が `phr-export.job.recovery-interval.seconds` 間隔でジョブ状態を巡回し、復旧/再実行を実施。

## 設定項目
- `PHR_EXPORT_JOB_MAX_RETRIES` / `phr-export.job.max-retries`
- `PHR_EXPORT_JOB_RETRY_BACKOFF_SECONDS` / `phr-export.job.retry.backoff-seconds`
- `PHR_EXPORT_JOB_RETRY_BACKOFF_MAX_SECONDS` / `phr-export.job.retry.backoff-max-seconds`
- `PHR_EXPORT_JOB_HEARTBEAT_TIMEOUT_SECONDS` / `phr-export.job.heartbeat-timeout.seconds`
- `PHR_EXPORT_JOB_MAX_RUNTIME_SECONDS` / `phr-export.job.max-runtime.seconds`
- `PHR_EXPORT_JOB_RECOVERY_INTERVAL_SECONDS` / `phr-export.job.recovery-interval.seconds`
- `PHR_EXPORT_JOB_RECOVERY_ENABLED` / `phr-export.job.recovery.enabled`

## 変更ファイル
- server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportConfig.java
- server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobManager.java
- server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobSupervisor.java
- server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobWorker.java
- server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java
- server-modernized/src/main/java/open/dolphin/adm20/session/PHRAsyncJobServiceBean.java
- server-modernized/src/main/java/open/dolphin/adm20/dto/PhrExportJobResponse.java
- server-modernized/src/test/java/open/dolphin/adm20/export/PhrExportJobManagerTest.java

## 検証
- 実行コマンド:
  `mvn -f pom.server-modernized.xml -Dtest=PHRResourceTest,PhrExportJobManagerTest test`
- 結果: PHRResource/ジョブ管理テストが成功。
