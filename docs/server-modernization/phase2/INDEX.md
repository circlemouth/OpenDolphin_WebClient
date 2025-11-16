# Server Modernization Phase 2 ナビゲーション

Web クライアント開発と並行して進めるモダナイズ作業の資料をフェーズ別に集約。Phase2 以降の情報はここを起点にたどり、更新時は `docs/web-client/planning/phase2/DOC_STATUS.md` にステータスを追記する。

## Phase2 ガバナンス必読チェーン

> **Phase2 ガバナンス必読チェーン / 接続・RUN 運用共通ルール**  
> 1. `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各領域チェックリストの順で参照・更新し、同一 RUN_ID を連携する。  
> 2. WebORCA 接続先は `https://weborca-trial.orca.med.or.jp/`（BASIC 認証 `trial` / `weborcatrial`）のみとし、他環境や `curl --cert-type P12` を使った本番アクセスは禁止。  
> 3. RUN_ID は `YYYYMMDDThhmmssZ` 形式を採用し、指示・README・DOC_STATUS・ログ・証跡ディレクトリのすべてで同一値を共有する。観点ごとに派生 RUN_ID を使う場合は親 RUN_ID を明示し、ログ先頭と備考欄へ併記する。  
> 4. DOC_STATUS 更新は (a) 最終コミット確認 → (b) Active/Dormant/Archive 判定 → (c) 備考に RUN_ID / 証跡パスを追記 → (d) ハブドキュメントへ同日付反映、の順で行い、完了報告前にチェック。  
> 5. Legacy サーバー/クライアントは参照専用アーカイブであり、差分検証のためにのみ起動可（保守・稼働維持作業は禁止）。

## ブロッカー共有（2026-06-15）
- WSL2 環境には Docker Desktop が導入されておらず、`scripts/start_legacy_modernized.sh start --build` / `docker compose` が実行できないためフェーズ4（JPQL/TX、予約/紹介状 REST、SessionOperation、adm10/20、HealthInsuranceModel）が一時停止中。詳細は `PHASE2_PROGRESS.md#2026-06-15-追記-フェーズ4-docker-ブロッカー共有担当-codex` と `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ4節を参照。
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
- [`operations/WORKER0_MESSAGING_BACKLOG.md`](operations/WORKER0_MESSAGING_BACKLOG.md): JMS 設定バックログ（2025Q4 Archive: `../archive/2025Q4/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md`。セクション6へ統合済み）。
- [`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`](operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md): 外部インタフェース整合性チェック手順。
- [`operations/ORCA_CONNECTIVITY_VALIDATION.md`](operations/ORCA_CONNECTIVITY_VALIDATION.md): WebORCA トライアルサーバー（`https://weborca-trial.orca.med.or.jp`, BASIC `trial/weborcatrial`）向けの CRUD 手順と証跡取得チェックリスト。「新規登録／更新／削除 OK（トライアル環境でのみ）」表記、`curl -u trial:weborcatrial ...` コマンド、`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` 参照ルール、`logs/*-orca-trial-crud.md` への書込みログを標準化している。
- [`operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`](operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md): モダナイズ版サーバーおよび ORCA 連携 API の資料配置と現状をまとめたナビゲーションガイド（2025-11-14 作成）。
- [`operations/assets/orca-api-spec/README.md`](operations/assets/orca-api-spec/README.md): firecrawl で取得した ORCA API 公式仕様のオフラインコピーとメタデータ、`orca-api-matrix` との突合表。
- [`operations/assets/orca-tec-index/README.md`](operations/assets/orca-tec-index/README.md): 技術情報ハブ（帳票・CLAIM・MONTSUQI・カスタマイズ留意事項など）を firecrawl で Markdown 化したオフラインコピー。
- [`operations/assets/orca-use-guides/README.md`](operations/assets/orca-use-guides/README.md): `/receipt/use/` 配下の運用ガイド（例: glserver SSL クライアント認証設定）を firecrawl で保全したアーカイブ。
- [`operations/TRACE_PROPAGATION_CHECK.md`](operations/TRACE_PROPAGATION_CHECK.md): `ops/tools/send_parallel_request.sh --profile <compose|modernized-dev>` による `trace_http_*` / `trace-{schedule,appo}-jpql` 採取ログと RUN_ID 別の環境変数・コマンド。最新 RUN_ID=`20251116T210500Z-C` で JMS probe／LogFilter 改修後の Trace 伝播状況と 4xx/5xx 監査ブロッカーを更新。
- [`operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`](operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md): Micrometer 観点のギャップ整理。

## 調査メモ・ノート（Notes）
- [`notes/common-dto-diff-A-M.md`](notes/common-dto-diff-A-M.md) / [`notes/common-dto-diff-N-Z.md`](notes/common-dto-diff-N-Z.md): DTO 差分一覧（Archive 済み: `../archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-A-M.md` / `.../common-dto-diff-N-Z.md`）。
- [`notes/static-analysis-plan.md`](notes/static-analysis-plan.md): 静的解析導入メモ（Ops Runbook へ移管予定）。
- [`notes/static-analysis-findings.md`](notes/static-analysis-findings.md): ワーニング一覧と対応状況。
- [`notes/domain-transaction-parity.md`](notes/domain-transaction-parity.md): フェーズ4-1 `Karte/Patient/Schedule/Appo` の TX 境界・JPQL 差分・RUN_ID=`20251109T201157Z`/`20251110T002451Z` アーカイブおよび `d_audit_event` 採取 TODO を記録。
- [`notes/karte-clinical-review-20251116T152300Z.md`](notes/karte-clinical-review-20251116T152300Z.md): カルテ保存・SafetySummary 関連の未実装 API/バグ調査（RUN_ID=`20251116T152300Z`）。`PUT /karte/document` 不在、Masuda 系 API 欠如、画像 API の `@PathParam` 不整合、添付外部ストレージ二重アップロードを整理。
- [`notes/ORCA_WEB_CLIENT_API_RELATIONSHIP.md`](notes/ORCA_WEB_CLIENT_API_RELATIONSHIP.md): Legacy サーバー視点の Web クライアント ↔ ORCA 連携整理（RUN_ID=`20251116T101200Z`）。病名送信/取り込み・マスタ参照のデータフローと `custom.properties` 依存を明文化。
- [`notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md`](notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md): モダナイズ版サーバー視点の ORCA 連携（RUN_ID=`20251116T105500Z`）。`MessagingGateway`/JMS/MDB の挙動、Trace-ID 監査連携、最新ギャップ修正を集約。
- [`notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`](notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md): RUN_ID=`20251116T210500Z`。カルテ/API ギャップ、ORCA マスタ修正、Messaging/Audit、PHR/予約/紹介状など外部 API の残課題と担当ワーカー指示を一覧化。
- [`notes/external-api-gap-20251116T111329Z.md`](notes/external-api-gap-20251116T111329Z.md): ORCA PHR/予約/紹介状ラッパーの Spec-based 状況と Trial/ORMaster 証跡、RUN_ID=`20251116T111329Z` および派生 RUN（E1/E2/E3）の進捗を記録。

## 運用ルール
1. サーバー資料を更新したら `docs/web-client/README.md` に概要を追記し、Web クライアント側にも影響があるかを判断する。
2. Active/Dormant/Archive の区分は `DOC_STATUS.md` で管理し、Archive 移行時は `docs/archive/` へ移す。
3. クライアントとサーバーで同一テーマを扱う場合は、担当マネージャーが `【ワーカー指示】` 形式で作業割り振りを記録し、本 INDEX から該当資料へリンクする。
4. 三者接続の整合性は `docs/web-client/architecture/PHASE2_SYSTEMS_ALIGNMENT.md`（RUN_ID=`20251115T143200Z`）を参照し、更新後は本 INDEX / DOC_STATUS へ同日付で反映する。
