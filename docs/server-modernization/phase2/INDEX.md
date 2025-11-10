# Server Modernization Phase 2 ナビゲーション

Web クライアント開発と並行して進めるモダナイズ作業の資料をフェーズ別に集約。Phase2 以降の情報はここを起点にたどり、更新時は `docs/web-client/planning/phase2/DOC_STATUS.md` にステータスを追記する。

## ブロッカー共有（2026-06-15）
- 現行 WSL2 環境には Docker Desktop が導入されておらず、`scripts/start_legacy_modernized.sh start --build` / `docker compose` が実行できないためフェーズ4（JPQL/TX、予約/紹介状 REST、SessionOperation、adm10/20、HealthInsuranceModel）が一時停止中。詳細は `PHASE2_PROGRESS.md#2026-06-15-追記-フェーズ4-docker-ブロッカー共有担当-codex` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4節を参照。
- 再開条件: Docker Desktop を導入して対象ディストリで WSL Integration を有効化し、`./scripts/start_legacy_modernized.sh down && ./scripts/start_legacy_modernized.sh start --build` が成功、かつ Legacy/Modernized 両 `/actuator/health` が 200 を返すことを証跡化すること。条件達成後にフェーズ4タスクの再開とドキュメント更新を行う。

## 基礎資料（Foundation）
- [`foundation/JAKARTA_EE10_GAP_LIST.md`](foundation/JAKARTA_EE10_GAP_LIST.md): Jakarta EE 10 への移行ギャップ一覧。
- [`foundation/DEPENDENCY_UPDATE_PLAN.md`](foundation/DEPENDENCY_UPDATE_PLAN.md): BOM/依存更新計画。
- [`foundation/IMPACT_MATRIX.md`](foundation/IMPACT_MATRIX.md): 領域別の影響度と担当マッピング。

## ドメイン別メモ（Domains）
- [`domains/AUTH_SECURITY_COMPARISON.md`](domains/AUTH_SECURITY_COMPARISON.md): 認証・MFA 差分と推奨アクション。
- [`domains/RESERVATION_BATCH_MIGRATION_NOTES.md`](domains/RESERVATION_BATCH_MIGRATION_NOTES.md): 予約・通知・バッチ移行メモ（JMS/Executor 設計含む）。
- [`domains/JAKARTA_EE10_CHARTS_VIEW_IMPACT.md`](domains/JAKARTA_EE10_CHARTS_VIEW_IMPACT.md): カルテ画面 Java/Jakarta 依存確認。
- その他のドメイン資料は `domains/` 直下に整列。新規メモを作成する際は本 INDEX にリンクを追加。

## 運用・Ops（Operations）
- [`operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md`](operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md): WildFly 起動阻害要因リスト。
- [`operations/WORKER0_MESSAGING_BACKLOG.md`](operations/WORKER0_MESSAGING_BACKLOG.md): JMS 設定バックログ（セクション6へ統合済み。スタブのみ保持）。
- [`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`](operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md): 外部インタフェース整合性チェック手順。
- [`operations/TRACE_PROPAGATION_CHECK.md`](operations/TRACE_PROPAGATION_CHECK.md): `ops/tools/send_parallel_request.sh --profile <compose|modernized-dev>` による `trace_http_*` / `trace-{schedule,appo}-jpql` 採取ログと RUN_ID 別の環境変数・コマンド。最新 RUN_ID=`20251110T070638Z` の `curl (7)` ブロッカーと `@SessionOperation` 静的解析メモを含む。
- [`operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`](operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md): Micrometer 観点のギャップ整理。

## 調査メモ・ノート（Notes）
- [`notes/common-dto-diff-A-M.md`](notes/common-dto-diff-A-M.md) / [`notes/common-dto-diff-N-Z.md`](notes/common-dto-diff-N-Z.md): DTO 差分一覧（Archive 予定）。
- [`notes/static-analysis-plan.md`](notes/static-analysis-plan.md): 静的解析導入メモ（Ops Runbook へ移管予定）。
- [`notes/static-analysis-findings.md`](notes/static-analysis-findings.md): ワーニング一覧と対応状況。
- [`notes/domain-transaction-parity.md`](notes/domain-transaction-parity.md): フェーズ4-1 `Karte/Patient/Schedule/Appo` の TX 境界・JPQL 差分・RUN_ID=`20251109T201157Z`/`20251110T002451Z` アーカイブおよび `d_audit_event` 採取 TODO を記録。

## 運用ルール
1. サーバー資料を更新したら `docs/web-client/README.md` に概要を追記し、Web クライアント側にも影響があるかを判断する。
2. Active/Dormant/Archive の区分は `DOC_STATUS.md` で管理し、Archive 移行時は `docs/archive/` へ移す。
3. クライアントとサーバーで同一テーマを扱う場合は、担当マネージャーが `【ワーカー指示】` 形式で作業割り振りを記録し、本 INDEX から該当資料へリンクする。
