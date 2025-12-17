# Charts パフォーマンス予算・計測導入ログ（RUN_ID=`20251217T060433Z`）

- タスク: webclient charts production outpatient plan / 14_パフォーマンス予算と計測導入
- 期間: 2025-12-30 09:00 - 2026-01-01 09:00 (JST)
- 対象: Charts の初回オープン / 患者切替 / タイムライン更新の体感性能 KPI 化と計測導入

## 実施内容
1. `src/charts_production_outpatient/foundation/14_パフォーマンス予算と計測導入.md` を新規作成。SLI 定義（初回 2.0s, 切替 1.0s, 再取得 1.2s の P95 目標）と警告/違反ライン、スケルトン統一・段階表示、performance.mark + telemetry/audit 連携の実装指針を整理。
2. 計測キー: runId/traceId/patientIdHash/dataSourceTransition/cacheHit/missingMaster/retryCount を必須化。`fetchWithResolver` meta と UI mark を組み合わせ、`telemetryClient.recordOutpatientFunnel(charts_perf_*)` + `auditEvent.details.performance` に送出する方針を定義。
3. スケルトン/ローディング指針を統一（スピナー禁止、`data-loading-scope`/`data-performance-scope` 付与、段階表示）。ToneBanner と共存させ、遅延警告は info→warning 昇格で再取得導線を自動開く。
4. 実装タスクメモを作成（ChartsPage での mark/measure、usePatientSwitch フック追加、SkeletonPanel/ToneBanner の属性拡張、E2E `tests/e2e/charts-performance.spec.ts` 追加）。
5. 検証フロー（MSW ON→MSW OFF dev proxy→Stage/Preview）とアラート運用（違反連続時に `charts_perf_degraded` を送信）を記載。

## 影響ファイル
- 新規: `src/charts_production_outpatient/foundation/14_パフォーマンス予算と計測導入.md`

## 確認状況・未完
- コード実装・計測は未着手。本 RUN_ID は計画ドキュメントとログ作成のみ。
- telemetry backend 連携スキーマは未決（TRACE_PROPAGATION_CHECK への追記が必要）。
- Stage/Preview での計測取得は権限付与後に同 RUN_ID で実施予定。

## 次アクション
- ChartsPage に performance.mark/measure のフックを実装し、`charts_perf_*` イベントを telemetry/audit へ送る。
- SkeletonPanel/ToneBanner の属性追加と段階表示ロジックを実装し、MSW ON/OFF で E2E 計測を CI に組み込む。
- Stage/Preview で同シナリオを再測し、`docs/server-modernization/phase2/operations/logs/20251217T060433Z-charts-performance.md` へ転記する。
