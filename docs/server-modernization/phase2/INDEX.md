# Server Modernization Phase 2 ナビゲーション

> **Legacy/Archive（参照のみ・新規追加禁止, RUN_ID=20251203T203000Z）** Phase2 資料はロールオフ済み。`docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md` を起点に参照し、現行作業は Web クライアント側の README/DOC_STATUS へ誘導する。証跡ログ: `operations/logs/20251203T203000Z-phase2-legacy-mark.md`

Web クライアント開発と並行して進めるモダナイズ作業の資料をフェーズ別に集約。Phase2 以降の情報はここを起点にたどり、更新時は `docs/web-client/planning/phase2/DOC_STATUS.md` にステータスを追記する。

## Phase2 ガバナンス必読チェーン

> **Phase2 ガバナンス必読チェーン / 接続・RUN 運用共通ルール**  
> 1. `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各領域チェックリストの順で参照・更新し、同一 RUN_ID を連携する。  
> 2. WebORCA 接続先は機微情報として `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照し、mac-dev を使った接続手順はアーカイブ扱いとする。WebORCA トライアルや `curl --cert-type P12` を使った本番アクセスは禁止で、証跡は `docs/server-modernization/phase2/operations/logs/20251203T134014Z-orcacertification-only.md` に保存する。  
> 3. RUN_ID は `YYYYMMDDThhmmssZ` 形式を採用し、指示・README・DOC_STATUS・ログ・証跡ディレクトリのすべてで同一値を共有する。観点ごとに派生 RUN_ID を使う場合は親 RUN_ID を明示し、ログ先頭と備考欄へ併記する。  
> 4. DOC_STATUS 更新は (a) 最終コミット確認 → (b) Active/Dormant/Archive 判定 → (c) 備考に RUN_ID / 証跡パスを追記 → (d) ハブドキュメントへ同日付反映、の順で行い、完了報告前にチェック。  
> 5. Legacy サーバー/クライアントは参照専用アーカイブであり、差分検証のためにのみ起動可（保守・稼働維持作業は禁止）。

最終棚卸し更新: 2025-11-21（RUN_ID=`20251120T191203Z`）。`docs/web-client/planning/phase2/DOC_STATUS.md` と本 INDEX・Web クライアント Hub を同日付で同期済み。
RUN_ID=`20251201T053420Z` で参照チェーン棚卸しを再確認済み。証跡: `operations/logs/20251201T053420Z-run-id-chain.md`（DOC_STATUS/README/manager checklist と同期）。 
RUN_ID=`20251219T062549Z` で参照チェーンを再確認し、RUN_ID をハブ文書で統一。証跡: `docs/web-client/planning/phase2/logs/20251219T062549Z-runid-governance.md`。
RUN_ID=`20251219T063136Z` で DOC_STATUS 棚卸しとハブ同期を実施。証跡: `docs/web-client/planning/phase2/logs/20251219T063136Z-doc-status-hub-sync.md`。
RUN_ID=`20251219T113948Z` で ORCA-01 `/orca/inputset` SQL 修正とテスト追加を実施。証跡: `docs/server-modernization/phase2/operations/logs/20251219T113948Z-orca-01-inputset-sql.md`。
RUN_ID=`20251219T125123Z` で DDL 変換警告（`d_factor2_*`/`d_stamp_tree`）と Agroal クラスロード警告（`DatasourceMetricsRegistrar`）を解消。証跡: `docs/server-modernization/phase2/operations/logs/20251219T125123Z-ddl-agroal-warn-fix.md`。
RUN_ID=`20251219T131008Z` で ORCA-02 `/orca/stamp/{setCd,name}` date パラメータ追加を実施。証跡: `docs/server-modernization/phase2/operations/logs/20251219T131008Z-orca-02-stamp-date.md`。

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
- [`operations/ORCA_CONNECTIVITY_VALIDATION.md`](operations/ORCA_CONNECTIVITY_VALIDATION.md): ORCA 本番環境接続手順と証跡取得チェックリスト。⚠️ **接続先は `ORCA_CERTIFICATION_ONLY.md` 記載の本番サーバー (`https://weborca.cloud.orcamo.jp:443`) のみ。トライアルサーバーへの接続は禁止**。PKCS#12 証明書 + Basic 認証を使用し、`logs/` 配下に RUN_ID 付きのログを保存する。
- [`operations/logs/20240215T093000Z-error-audit.md`](operations/logs/20240215T093000Z-error-audit.md): RUN_ID=`20240215T093000Z`（親=`20251120T193040Z`）。ORCA Trial 障害時の trace_http_401/500・metrics・httpdump 採取チェックと Blocker 記入欄を整備。証跡: `artifacts/error-audit/20240215T093000Z/`。
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
- [`notes/karte-update-verification-20251119T133000Z.md`](notes/karte-update-verification-20251119T133000Z.md): Karte Update API (KRT-01) 検証ノート（RUN_ID=`20251119T133000Z`）。`PUT /document` の実装確認、Legacy 比較、Web クライアント適合性を記録。
- [`notes/karte-clinical-review-20251119T133348Z.md`](notes/karte-clinical-review-20251119T133348Z.md): 拡張機能 API KRT-02 (SafetySummary) 実装ノート（RUN_ID=`20251119T133348Z`）。`SafetySummary` エンドポイントの欠如確認と実装、`SafetySummaryResponse` DTO の作成を記録。
- [`notes/ORCA_WEB_CLIENT_API_RELATIONSHIP.md`](notes/ORCA_WEB_CLIENT_API_RELATIONSHIP.md): Legacy サーバー視点の Web クライアント ↔ ORCA 連携整理（RUN_ID=`20251116T101200Z`）。病名送信/取り込み・マスタ参照のデータフローと `custom.properties` 依存を明文化。
- [`notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md`](notes/ORCA_WEB_CLIENT_API_RELATIONSHIP_MODERNIZED.md): モダナイズ版サーバー視点の ORCA 連携（RUN_ID=`20251116T105500Z`）。`MessagingGateway`/JMS/MDB の挙動、Trace-ID 監査連携、最新ギャップ修正を集約。
- [`notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`](notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md): RUN_ID=`20251116T210500Z`。カルテ/API ギャップ、ORCA マスタ修正、Messaging/Audit、PHR/予約/紹介状など外部 API の残課題と担当ワーカー指示を一覧化。
- [`notes/external-api-gap-20251116T111329Z.md`](notes/external-api-gap-20251116T111329Z.md): ORCA PHR/予約/紹介状ラッパーの Spec-based 状況と Trial/ORMaster 証跡、RUN_ID=`20251116T111329Z` および派生 RUN（E1/E2/E3）の進捗を記録。

## 運用ルール
1. サーバー資料を更新したら `docs/web-client/README.md` に概要を追記し、Web クライアント側にも影響があるかを判断する。
2. Active/Dormant/Archive の区分は `DOC_STATUS.md` で管理し、Archive 移行時は `docs/archive/` へ移す。
3. クライアントとサーバーで同一テーマを扱う場合は、担当マネージャーが `【ワーカー指示】` 形式で作業割り振りを記録し、本 INDEX から該当資料へリンクする。
4. 三者接続の整合性は `docs/web-client/architecture/PHASE2_SYSTEMS_ALIGNMENT.md`（RUN_ID=`20251115T143200Z`）を参照し、更新後は本 INDEX / DOC_STATUS へ同日付で反映する。
