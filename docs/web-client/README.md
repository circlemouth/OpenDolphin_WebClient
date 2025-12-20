# Web クライアント ドキュメントハブ（Phase2 Legacy, RUN_ID=`20251219T144408Z`）
> ⚠️ **Legacy/Archive**: Phase2 ドキュメントは参照専用。現行の開発状況は `docs/DEVELOPMENT_STATUS.md` を参照すること。
> 2025-12-19 時点の Phase2 記録。デバッグ用 Web クライアント（ログイン＋Reception/Charts/Outpatient Mock シェル）を起点に、フル電子カルテ版の実装計画を整理した。

## 概要
- 現行実装はログイン＋デモシェルのみが実 API 接続（ログイン API）。Reception/Charts/Outpatient Mock では RUN_ID を発行し tone/banner carry-over を確認できる。
- Phase2 期の計画は `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` に集約している（参照専用）。
- Phase2 文書の更新が必要な場合は、`docs/DEVELOPMENT_STATUS.md` の例外手順に従うこと。

### 最新更新サマリ（2025-12-19 / RUN_ID=`20251219T144408Z`）
- ORCA-06 `/orca/master/hokenja` `/orca/master/address` を実装（RUN_ID=`20251219T144408Z`）。保険者/住所の DTO を追加し、404/503/空レス差分を監査ログに反映。証跡: `docs/server-modernization/phase2/operations/logs/20251219T144408Z-orca-06-hokenja-address.md`。成果物: `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_06_hokenja_address実装.md`。
- ORCA-05 `/orca/master/generic-class|generic-price|youhou|material|kensa-sort` を OpenAPI 準拠で実装（RUN_ID=`20251219T140028Z`）。DTO/監査メタ/ページング/契約テストを整備。証跡: `docs/server-modernization/phase2/operations/logs/20251219T140028Z-orca-05-master-generic.md`。成果物: `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_05_master_generic系列実装.md`。
- ORCA-03 `/orca/tensu/shinku` レスポンス拡充（RUN_ID=`20251219T133053Z`）。`taniname` / `ykzkbn` / `yakkakjncd` を含む列構成で `/orca/tensu/name` と整合。証跡: `docs/server-modernization/phase2/operations/logs/20251219T133053Z-orca-03-tensu-shinku.md`。成果物: `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_03_tensu_shinkuレスポンス拡充.md`。
- ORCA-02 `/orca/stamp/{setCd,name}` date パラメータの追補ドキュメント反映（RUN_ID=`20251219T223000Z`）。`server-api-inventory.md`/`api_inventory.yaml` を更新し、証跡ログに「テスト未実施」を明記。証跡: `docs/server-modernization/phase2/operations/logs/20251219T223000Z-orca-02-stamp-date-followup.md`。
- ORCA-02 `/orca/stamp/{setCd,name}` date パラメータ追加（RUN_ID=`20251219T131008Z`）。`date` クエリで有効期間判定を指定可能にし、既存の第3要素指定は後方互換で維持。証跡: `docs/server-modernization/phase2/operations/logs/20251219T131008Z-orca-02-stamp-date.md`。成果物: `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_02_stamp_dateパラメータ追加.md`。
- DDL 変換警告と Agroal クラスロード警告の解消（RUN_ID=`20251219T125123Z`）。`schema-generation.database.action=none` へ変更し、`io.agroal.api` module dependency を追加して `WELD-000119` を解消。証跡: `docs/server-modernization/phase2/operations/logs/20251219T125123Z-ddl-agroal-warn-fix.md`。成果物: `src/server_modernized_full_completion_phase2/02_jakarta_foundation/ddl変換警告とAgroalクラスロード解消.md`。
- ORCA-01 `/orca/inputset` SQL 修正（RUN_ID=`20251219T113948Z`）。`inputcd` の WHERE 句を括弧で明示し、SQL 文字列ユニットテストを追加。証跡: `docs/server-modernization/phase2/operations/logs/20251219T113948Z-orca-01-inputset-sql.md`。成果物: `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_01_inputset_sql修正.md`。
- server-modernized 実装優先度と実装順を確定（RUN_ID=`20251219T065150Z`）。ORCA Master → 監査・JMS → 外部 API → Jakarta 設定の順序と依存関係/テスト順序を明文化し、Phase2 ガント（`.kamui/apps/server-modernized-implementation-20251219.yaml`）へ反映。現在は Legacy 参照専用のため、現行ガントは `.kamui/apps/server-modernized-current-plan-20251220.yaml` を参照。成果物: `src/server_modernized_full_completion_phase2/01_gap_inventory/優先度と実装順確定.md`。
- 実装状況ドキュメント棚卸し（RUN_ID=`20251219T063753Z`）。`JAKARTA_EE10_GAP_LIST.md` / `MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` / `ORCA_API_STATUS.md` を突合し、未実装・部分実装・証跡未取得の一覧をタスク化。成果物: `src/server_modernized_full_completion_phase2/01_gap_inventory/実装状況ドキュメント棚卸し.md`。
- DOC_STATUS 棚卸しとハブ同期（RUN_ID=`20251219T063136Z`）。DOC_STATUS の備考欄へ RUN_ID/証跡パスを追記し、README/Phase2 INDEX/manager overview/checklist を同日付で同期。証跡: `docs/web-client/planning/phase2/logs/20251219T063136Z-doc-status-hub-sync.md`。成果物: `src/server_modernized_full_completion_phase2/00_governance/DOC_STATUS棚卸しとハブ同期.md`。
- RUN_ID 整備と参照チェーン再確認（RUN_ID=`20251219T062549Z`）。参照チェーン（AGENTS → README → Phase2 INDEX → manager overview → checklist）を再確認し、RUN_ID を統一。Legacy 資産は参照専用、`server-modernized/` のみ対象範囲であることを再合意。証跡: `docs/web-client/planning/phase2/logs/20251219T062549Z-runid-governance.md`。成果物: `src/server_modernized_full_completion_phase2/00_governance/RUN_ID整備と参照チェーン再確認.md`。
- 54 リリース前チェックリストと DOC_STATUS 更新（RUN_ID=`20251218T213011Z`）。DoD 達成サマリと未完了項目（Stage/Preview 実 API 再検証、性能実測、予約変更は Reception 委譲、APM 未接続）を整理し、DOC_STATUS に RUN_ID を追記。成果物: `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`。
- 52 監査ログ/テレメトリ証跡化（RUN_ID=`20251218T183545Z`）。telemetry (`recordOutpatientFunnel`) と auditEvent が同一 `runId/traceId` で追跡できることを vitest で確認。証跡: `docs/server-modernization/phase2/operations/logs/20251218T183545Z-charts-audit-telemetry.md` / 計画: `docs/web-client/planning/phase2/logs/20251218T183545Z-charts-audit-telemetry.md` / 成果物: `src/charts_production_outpatient/quality/52_監査ログ_テレメトリ_証跡化.md` / テスト: `web-client/src/features/charts/__tests__/auditTelemetryRunId.test.ts`。
- 53 障害注入（タイムアウト/500/スキーマ不一致/キュー滞留）（RUN_ID=`20251218T171651Z`）。MSW の `x-msw-fault`/`x-msw-delay-ms` で Charts の外来 API に故障を注入し、解除後に再取得で復帰できることを確認可能化。証跡: `docs/web-client/planning/phase2/logs/20251218T171651Z-charts-fault-injection.md` / 成果物: `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md` / 実装: `web-client/src/mocks/handlers/outpatient.ts`, `web-client/src/mocks/handlers/orcaQueue.ts`, `web-client/src/libs/http/header-flags.ts`, `web-client/src/features/outpatient/OutpatientMockPage.tsx` / E2E: `tests/e2e/charts-fault-injection.msw.spec.ts`。
- 43 `/orca12/patientmodv2/outpatient` 編集導線（患者更新）（RUN_ID=`20251218T115400Z`）。Charts 患者サイドペインから「基本/保険」を安全に更新（権限/監査/差分確認/巻き戻し/再試行）。`operation=create/update/delete` と `changedKeys` を監査ログへ残し、入力検証（形式/必須/マスタ依存）と `role=alert` エラー表示を統一。証跡: `src/charts_production_outpatient/integration/logs/20251218T115400Z-patientmodv2-outpatient-edit.md` / 成果物: `src/charts_production_outpatient/integration/43_patientmodv2_outpatient編集導線.md` / 実装: `web-client/src/features/charts/PatientsTab.tsx`, `web-client/src/features/charts/PatientInfoEditDialog.tsx`, `web-client/src/features/patients/api.ts`。
- 45 `/api/orca/queue` と送信ステータス表示（RUN_ID=`20251218T114241Z`）。ORCA キューを Charts に統合し、送信状態（待ち/処理中/成功/失敗）を DocumentTimeline の患者行と “ORCA キュー連携” に表示。滞留検知（時間閾値）と `runId/traceId` の証跡（UI state / 監査）を同期。証跡: `src/charts_production_outpatient/integration/logs/20251218T114241Z-orca-queue-send-status.md` / 成果物: `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md` / 実装: `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/charts/DocumentTimeline.tsx`, `web-client/src/features/charts/ChartsActionBar.tsx`, `web-client/src/features/outpatient/orcaQueueApi.ts`, `web-client/src/features/outpatient/orcaQueueStatus.ts`。
- 42 `/orca21/medicalmodv2/outpatient` 表示セクション分割（医療記録）（RUN_ID=`20251218T105723Z`）。診断/処方/検査/処置/メモの 5 セクションで表示し、セクション単位の未取得/欠落/エラーを部分表示（全体停止回避）。`recordsReturned/outcome` を UI と監査ログへ反映。証跡: `src/charts_production_outpatient/integration/logs/20251218T105723Z-medicalmodv2-outpatient-sections.md` / 成果物: `src/charts_production_outpatient/integration/42_medicalmodv2_outpatient表示セクション分割.md` / 実装: `web-client/src/features/charts/MedicalOutpatientRecordPanel.tsx`, `web-client/src/features/charts/medicalOutpatient.ts`, `web-client/src/features/charts/api.ts`。
- Charts 患者サイドペイン（基本/保険/履歴）仕上げ（閲覧中心 + role/missingMaster/fallback/dataSourceTransition + 受付ステータスで編集ガード、差分表示と保存履歴モーダル、履歴タブ整理、Patients への deep link/復帰導線を追加）。証跡: `docs/web-client/planning/phase2/logs/20251218T092541Z-charts-patient-sidepane.md` / 成果物: `src/charts_production_outpatient/ux/25_患者サイドペイン_基本保険履歴_仕上げ.md` / 実装: `web-client/src/features/charts/PatientsTab.tsx`。
- Charts 並行編集（同一端末の複数タブ）検知を実装（閲覧専用化＋warning 統一＋最終更新ピル＋監査イベント `CHARTS_EDIT_LOCK/CHARTS_CONFLICT`）。証跡: `docs/web-client/planning/phase2/logs/20251218T092228Z-charts-concurrent-edit-lock.md` / 成果物: `src/charts_production_outpatient/workflow/34_並行編集とロック表示.md` / 実装: `web-client/src/features/charts/editLock.ts`。
- Charts 外来受診コンテキスト確立（Reception→Charts で `receptionId/visitDate/patientId` を URL へ格納し、リロード/複数タブ/戻る操作でも別患者混入を防ぐガードを追加）。証跡: `docs/web-client/planning/phase2/logs/20251218T082404Z-charts-encounter-context.md` / 成果物: `src/charts_production_outpatient/workflow/30_外来受診コンテキスト確立.md`。
- config/delivery 不一致検知（`syncMismatch`）と raw 監査強化（RUN_ID=`20251218T022759Z`）。Administration/Charts の UI に mismatch を可視化し、Charts の `admin/delivery.apply` 監査 payload に raw(config/delivery) を分離して格納。証跡: `docs/web-client/planning/phase2/logs/20251218T022759Z-admin-syncMismatch-raw-audit.md`。
- 41 `/api01rv2/appointment/outpatient/*` 統合（RUN_ID=`20251217T234312Z`）。予約一覧/患者別予約/来院中リストを Charts 向けに正規化し、`受付ID(receptionId)` 表示と Charts→Reception の導線（予約変更/キャンセル）を追加。予約データの未取得/不整合は `tone=info/warning` で統一。証跡: `src/charts_production_outpatient/integration/logs/20251217T234312Z-appointment-outpatient-integration.md` / 成果物: `src/charts_production_outpatient/integration/41_appointment_outpatient統合.md`。
- Administration 設定配信（`/api/admin/config` / `/api/admin/delivery`）のフラグ同期を実装（RUN_ID=`20251217T233755Z`）。Charts の表示/送信/masterSource を配信で切替でき、Charts 側で「いつ・誰に・どの runId で」適用されたかを UI と監査ログに残す。masterSource 変更（例: `server→fallback`）は ToneBanner で明示。証跡: `docs/web-client/planning/phase2/logs/20251217T233755Z-admin-config-delivery-flags.md` / 成果物: `src/charts_production_outpatient/integration/44_admin_config_deliveryフラグ同期.md`。
- Charts ORCA送信フロー（送信前チェック）を実装（RUN_ID=`20251217T233430Z`）。missingMaster/権限不足/未保存ドラフト/通信不安定を列挙して UI で明確にブロックし、送信開始→進行中→成功/失敗・再試行/中断・証跡（runId/traceId/requestId）表示を一貫化。証跡: `docs/web-client/planning/phase2/logs/20251217T233430Z-charts-orca-send-precheck.md` / 成果物: `src/charts_production_outpatient/workflow/33_ORCA送信フロー_送信前チェック.md` / 実装: `web-client/src/features/charts/ChartsActionBar.tsx`。
- Charts 印刷/エクスポート（診療文書）を最低限実装（RUN_ID=`20251217T233649Z`）。`/charts/print/outpatient` の A4 プレビュー、`window.print()` による PDF 保存導線、`PRINT_OUTPATIENT` 監査（actor/runId/patientId）と `ToneBanner warning` の注意喚起を追加。証跡: `docs/web-client/planning/phase2/logs/20251217T233649Z-charts-print-export.md` / 成果物: `src/charts_production_outpatient/ux/26_印刷_エクスポート_診療文書.md`。
- Charts アクセシビリティ自動検査（RUN_ID=`20251217T212939Z`）。ActionBar/ToneBanner の axe 単体テスト＋Playwright `/charts` ページスコープ a11y スキャンを追加し、重大違反フィルター後 0 件。フォーカス順と操作不能理由の読み上げを確認。証跡: `docs/web-client/planning/phase2/logs/20251217T212939Z-charts-a11y.md` / 成果物: `src/charts_production_outpatient/quality/51_アクセシビリティ自動検査と手動監査.md` / テスト: `web-client/src/features/charts/__tests__/chartsAccessibility.test.tsx`, `tests/e2e/charts-a11y-page.spec.ts`。
- DocumentTimeline 商用仕上げ（RUN_ID=`20251217T150614Z`）。受付→診療→ORCA キューを 3 ステップ可視化し、missingMaster/失敗/再取得の nextAction を明示。32件ウィンドウ仮想化＋折りたたみ＋表示件数を追加。証跡: `docs/web-client/planning/phase2/logs/20251217T150614Z-document-timeline.md` / 成果物: `src/charts_production_outpatient/ux/23_DocumentTimeline商用レベル仕上げ.md`。
- OrcaSummary（請求/予約）商用レベル仕上げ指針を追加（RUN_ID=`20251217T130407Z`）。請求/予約サマリの表示粒度、`dataSourceTransition` の説明、`fallbackUsed=true` 強警告、予約/会計/再取得導線とショートカットを定義。証跡: `docs/web-client/planning/phase2/logs/20251217T130407Z-orca-summary.md` / 成果物: `src/charts_production_outpatient/ux/24_OrcaSummary_請求予約_商用レベル仕上げ.md`。
- 診療開始/終了の状態遷移を再定義し、READY_TO_CLOSE を分離。ORCA送信待ちのバックオフ（5s→15s→45s, 最大3回）と終了ガードの disable 理由を固定（RUN_ID=`20251217T120220Z`）。証跡: `docs/web-client/planning/phase2/logs/20251217T120220Z-charts-encounter-state-ux.md` / 成果物: `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md`。
- Charts シェル UI 最終レイアウトを確定（RUN_ID=`20251217T060504Z`）。トップ/アクションバー固定、左30%/右70%基準、重要情報の二重配置、画面幅別挙動（wide/default/medium/narrow）を定義。証跡: `docs/web-client/planning/phase2/logs/20251217T060504Z-charts-shell-ui-layout.md` / 成果物: `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`。
- module_json docPk ガード & 負 PK クリーニング（RUN_ID=`20251214T140106Z`）。`d_document/d_module` の負 id を削除し、addDocument 応答 docPk を必ず再利用する UI/テスト方針をログ化。証跡: `docs/web-client/planning/phase2/logs/20251214T140106Z-module-json-ui-guard.md` / `docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-cleanup.md`。
- module_json UI 保存・復元再確認（RUN_ID=`20251214T140106Z`）。最新 WAR ビルドで add→update→GET が docPk=9024（正数）となり、beanJson 保存/復元とも WARN 無し。証跡: `docs/web-client/planning/phase2/logs/20251214T140106Z-module-json-ui-save-rerun.md` / `docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-ui-save-rerun.md`。
- module_json 型情報フォールバック（RUN_ID=`20251214T132418Z`）。ModuleJsonConverter に non-typed フォールバック mapper を追加し、`@class` 無し beanJson でも WARN 無しで decode できる回帰テストを追加（証跡: `docs/web-client/planning/phase2/logs/20251214T132418Z-module-json-typeinfo-fallback.md`）。
- module_json docPk 正数化（RUN_ID=`20251214T132016Z`）。JPA の PK 採番を `opendolphin.hibernate_sequence` へ固定し、addDocument で負の id を強制的に正のシーケンス採番へ上書き・DocInfo 同期。UI からの負数 docPk で updateDocument が 500 になる事象を防止。証跡: `docs/web-client/planning/phase2/logs/20251214T132016Z-docpk-positive.md`。
- module_json JSON 化手順を README / server-modernized Operations に反映し、RUN_ID=`20251214T082236Z` で証跡を整理。新規 Runbook `docs/server-modernization/phase2/operations/MODULE_JSON_DEVELOPMENT.md` を追加し、beanJson 優先・beanBytes フォールバック、polymorphic typing、Flyway `V0225` 前提と検証手順を明文化（証跡: `docs/web-client/planning/phase2/logs/20251214T082236Z-module-json-docs.md`）。
- module_json ガントの親 RUN=`20251214T022944Z` を維持しつつ、キックオフ・Flyway・Converter・KarteServiceBean 組み込みの各ドキュメント/ログを参照チェーンで統一。
- module_json テスト/ビルド検証（RUN_ID=`20251214T084510Z`）を実施。ModuleJsonConverter 正常系の単体テストを追加し Maven ビルド成功。perf-env-boot.js 修正後に msw smoke 1/1 pass（証跡: `docs/web-client/planning/phase2/logs/20251214T084510Z-module-json-test-build.md`）。
- module_json MSW OFF スモークを追加（RUN_ID=`20251214T091846Z`）。`VITE_DISABLE_MSW=1` で dev 起動し、orca-master-bridge smoke 1/1 pass。副作用なし（証跡: `docs/web-client/planning/phase2/logs/20251214T091846Z-msw-off-smoke.md`）。beanJson UI までの巡回は今後の軽量ケースで補完予定。
- Charts 外来の fetch レイヤー統一、エラー/リトライ規約、セッション/権限ガード、API 契約テーブルなど 2025-12-13 までの更新内容は据え置き（次の UI 実装タスク開始待ち）。

## Legacy 記録（参照専用）
- Phase2 の記録一覧。現行の作業判断は `docs/DEVELOPMENT_STATUS.md` を単一参照とする。
- `src/server_modernized_full_completion_phase2/01_gap_inventory/優先度と実装順確定.md` — server-modernized 実装優先度と順序確定（RUN_ID=`20251219T065150Z`）。
- `src/server_modernized_full_completion_phase2/01_gap_inventory/実装状況ドキュメント棚卸し.md` — server-modernized 実装状況棚卸し（RUN_ID=`20251219T063753Z`）。
- `src/server_modernized_full_completion_phase2/02_jakarta_foundation/ddl変換警告とAgroalクラスロード解消.md` — DDL 変換警告と Agroal クラスロード解消（RUN_ID=`20251219T125123Z`）。
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_06_hokenja_address実装.md` — ORCA-06 `/orca/master/hokenja` `/orca/master/address` 実装（RUN_ID=`20251219T144408Z`）。
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_05_master_generic系列実装.md` — ORCA-05 `/orca/master/generic-class|generic-price|youhou|material|kensa-sort` 実装（RUN_ID=`20251219T140028Z`）。
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_03_tensu_shinkuレスポンス拡充.md` — ORCA-03 `/orca/tensu/shinku` レスポンス拡充（RUN_ID=`20251219T133053Z`）。
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_02_stamp_dateパラメータ追加.md` — ORCA-02 `/orca/stamp/{setCd,name}` date パラメータ追加（RUN_ID=`20251219T131008Z`）。
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_01_inputset_sql修正.md` — ORCA-01 `/orca/inputset` SQL 修正（RUN_ID=`20251219T113948Z`）。
- `src/modernization/module_json/キックオフ_RUN_ID採番.md` — module_json モダナイズ計画ガント起点（RUN_ID=`20251214T022944Z`）。
- `src/modernization/module_json/ModuleJsonConverter型情報フォールバック.md` — module_json: 型情報フォールバック（RUN_ID=`20251214T132418Z`）。
- `src/modernization/module_json/UI保存復元確認.md` — module_json: UI 経路の addDocument 保存/復元（RUN_ID=`20251214T123042Z`）。
- `src/modernization/module_json/docPk正数化調査.md` — module_json: docPk 正数化・updateDocument 整合（RUN_ID=`20251214T132016Z`）。
- `src/modernization/module_json/テストとビルド検証.md` — module_json テスト/ビルド/Smoke（RUN_ID=`20251214T084510Z`）。
- `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` — 画面別実装計画（本更新の中心）。
- `planning/phase2/DOC_STATUS.md` — 棚卸し台帳（RUN_ID 同期済み）。
- `src/server_modernized_full_completion_phase2/00_governance/RUN_ID整備と参照チェーン再確認.md` — RUN_ID 整備と参照チェーン再確認（RUN_ID=`20251219T062549Z`）。
- `src/server_modernized_full_completion_phase2/00_governance/DOC_STATUS棚卸しとハブ同期.md` — DOC_STATUS 棚卸しとハブ同期（RUN_ID=`20251219T063136Z`）。
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` — Charts Production（外来・本番品質）ガント起点（RUN_ID=`20251212T130647Z`）。
- `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md` — Charts 本番外来（受付→診療→会計）カバレッジ定義（RUN_ID=`20251212T131901Z`）。
- `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md` — ChartsPage の現状棚卸しとギャップ（RUN_ID=`20251212T140014Z`）。
- `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md` — Charts 外来 API 契約（監査・UI 透過・再試行/ガードの単一ソース、RUN_ID=`20251212T143720Z`）。
- `src/charts_production_outpatient/integration/41_appointment_outpatient統合.md` — `/api01rv2/appointment/outpatient/*` 統合（予約/来院 正規化＋受付ID＋導線、RUN_ID=`20251217T234312Z`）。
- `src/charts_production_outpatient/integration/43_patientmodv2_outpatient編集導線.md` — `/orca12/patientmodv2/outpatient` 編集導線（Charts から患者更新を安全化、RUN_ID=`20251218T115400Z`）。
- `src/charts_production_outpatient/integration/42_medicalmodv2_outpatient表示セクション分割.md` — `/orca21/medicalmodv2/outpatient` 表示セクション分割（診断/処方/検査/処置/メモ、RUN_ID=`20251218T105723Z`）。
- `src/charts_production_outpatient/integration/44_admin_config_deliveryフラグ同期.md` — Administration 設定配信（`/api/admin/config`/`/api/admin/delivery`）フラグ同期（RUN_ID=`20251217T233755Z`）。
- `src/charts_production_outpatient/integration/45_orca_queueと送信ステータス表示.md` — Charts: ORCA キュー/送信ステータス表示（待ち/処理中/成功/失敗、滞留検知、RUN_ID=`20251218T114241Z`）。
- `src/charts_production_outpatient/workflow/30_外来受診コンテキスト確立.md` — 受付ID/診療日/患者の来院コンテキストを URL/タブ/復元で破綻させないガード（RUN_ID=`20251218T082404Z`）。
- `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md` — 診療開始/終了の状態モデルと終了ガード（RUN_ID=`20251217T120220Z`）。
- `src/charts_production_outpatient/workflow/33_ORCA送信フロー_送信前チェック.md` — ORCA送信の送信前チェック（送信不可条件の列挙・状態表示・再試行/中断・証跡表示、RUN_ID=`20251217T233430Z`）。
- `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md` — Charts シェル UI 最終レイアウト（RUN_ID=`20251217T060504Z`）。
- `src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md` — Charts ToneBanner/状態ピル一貫性（RUN_ID=`20251217T063116Z`）。
- `src/charts_production_outpatient/ux/24_OrcaSummary_請求予約_商用レベル仕上げ.md` — OrcaSummary 請求/予約サマリ商用仕上げ（RUN_ID=`20251217T130407Z`）。
- `src/charts_production_outpatient/ux/26_印刷_エクスポート_診療文書.md` — Charts 印刷/エクスポート（診療文書）（RUN_ID=`20251217T233649Z`）。
- `src/charts_production_outpatient/quality/52_監査ログ_テレメトリ_証跡化.md` — Charts 監査ログ/telemetry runId 突合（RUN_ID=`20251218T183545Z`）。
- `src/charts_production_outpatient/quality/51_アクセシビリティ自動検査と手動監査.md` — Charts アクセシビリティ自動/手動監査（RUN_ID=`20251217T212939Z`）。
- `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md` — Charts 障害注入（timeout/500/schema mismatch/queue stall）（RUN_ID=`20251218T171651Z`）。
- `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md` — Charts セッション/権限ガード方針（RUN_ID=`20251213T000432Z`）。
- `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md` — Charts エラー/リトライ規約（RUN_ID=`20251217T125828Z`）。
- `src/charts_production_outpatient/foundation/13_データ取得レイヤの統一_fetchWithResolver.md` — Charts 外来 fetch レイヤー統一（RUN_ID=`20251213T133932Z`）。
- `src/charts_production_outpatient/foundation/14_パフォーマンス予算と計測導入.md` — Charts 初回/患者切替/タイムライン更新の P95 予算と計測導入（RUN_ID=`20251217T060433Z`）。
- `architecture/future-web-client-design.md` — 次期画面配置と機能サマリ（RUN_ID=`20251210T141208Z`）。
- `architecture/web-client-api-mapping.md` — 外来 API マッピングと監査メタ（RUN_ID=`20251208T124645Z`）。
- UX ポリシー: `ux/reception-schedule-ui-policy.md`, `ux/charts-claim-ui-policy.md`, `ux/patients-admin-ui-policy.md`, `ux/config-toggle-design.md`, `ux/admin-delivery-validation.md`, `ux/playwright-scenarios.md`, `ux/ux-documentation-plan.md`。
- Ops/Debug: `operations/debugging-outpatient-bugs.md`（外来 API 差分ログ）。
- 証跡ログ: `planning/phase2/logs/20251219T063136Z-doc-status-hub-sync.md`（DOC_STATUS 棚卸しとハブ同期）。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251219T125123Z-ddl-agroal-warn-fix.md`（DDL 変換警告と Agroal クラスロード解消、RUN_ID=`20251219T125123Z`）。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251219T140028Z-orca-05-master-generic.md`（ORCA-05 マスタ実装、RUN_ID=`20251219T140028Z`）。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251219T144408Z-orca-06-hokenja-address.md`（ORCA-06 保険者・住所マスタ実装、RUN_ID=`20251219T144408Z`）。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251219T133053Z-orca-03-tensu-shinku.md`（ORCA-03 `/orca/tensu/shinku` レスポンス拡充、RUN_ID=`20251219T133053Z`）。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251219T131008Z-orca-02-stamp-date.md`（ORCA-02 `/orca/stamp` date パラメータ追加、RUN_ID=`20251219T131008Z`）。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251219T223000Z-orca-02-stamp-date-followup.md`（ORCA-02 `/orca/stamp` date 追補回収、RUN_ID=`20251219T223000Z`）。
- 証跡ログ: `planning/phase2/logs/20251218T183545Z-charts-audit-telemetry.md`（auditEvent と telemetry runId/traceId 突合、RUN_ID=`20251218T183545Z`）。
- 証跡ログ: `planning/phase2/logs/20251219T062549Z-runid-governance.md`（RUN_ID 整備と参照チェーン再確認）。
- 証跡ログ: `planning/phase2/logs/20251217T233430Z-charts-orca-send-precheck.md`、`planning/phase2/logs/20251214T082236Z-module-json-docs.md`、`planning/phase2/logs/20251214T022944Z-module-json-kickoff.md`、`planning/phase2/logs/20251213T133932Z-charts-fetch-with-resolver.md`、`planning/phase2/logs/20251213T000432Z-charts-session-permission-guard.md`、`planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md`、`planning/phase2/logs/20251212T140014Z-charts-page-gap.md`、`planning/phase2/logs/20251212T130647Z-charts-production-outpatient-governance.md`、`planning/phase2/logs/20251212T131901Z-charts-outpatient-coverage.md`、`planning/phase2/logs/20251211T172459Z-runid-governance.md`、`planning/phase2/logs/20251211T172459Z-web-client-plan.md`、`planning/phase2/logs/20251211T193942Z-administration-delivery.md`。過去 RUN_ID は DOC_STATUS を参照。
- 証跡ログ: `planning/phase2/logs/20251218T082404Z-charts-encounter-context.md`（外来受診コンテキスト確立）を追加。
- 証跡ログ: `planning/phase2/logs/20251214T123042Z-module-json-ui-save.md` を追加。
- Charts 実装ログ: `planning/phase2/logs/20251211T120619Z-charts-timeline.md`（DocumentTimeline/OrcaSummary/PatientsTab のデータバインド、RUN_ID=`20251211T120619Z`）。

## 参考（Archive / Legacy）
- ログイン専用化までの計画・ログ (`planning/phase2/LOGIN_REWORK_PLAN.md`, `planning/phase2/logs/20251130T120000Z-login-rework.md` など) は Archive として保持。詳細は `docs/archive/2025Q4/web-client/legacy-archive.md` と DOC_STATUS の Legacy セクションを参照。
- 旧 RUN_ID（`20251203T203000Z` 等）のロールオフ手順: `docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md`。証跡: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md`。

## 運用方針（Phase2 Legacy）
1. Phase2 文書は参照専用。原則として新規ドキュメントの追加や RUN_ID 更新を行わない。
2. 例外的に Phase2 文書を更新する場合は、`docs/DEVELOPMENT_STATUS.md` の例外手順に従う。
3. 既存の Phase2 資料は `docs/archive/<YYYYQn>/` へ順次移行し、履歴管理のみ継続する。

## ORCA 接続の現行方針
- 接続先・証明書は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を唯一のルールとして参照。違反となる WebORCA トライアル接続や `curl --cert-type P12` の乱用は禁止。
- `VITE_DISABLE_MSW` / `VITE_DEV_PROXY_TARGET` を用いた実 API 検証は証跡ログに RUN_ID 付きで保存する（例: `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md`）。

## 参照チェーン（Phase2 Legacy）
- `AGENTS.md`
- `docs/web-client/README.md`（本ファイル）
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`

## Legacy 参照
- `docs/archive/2025Q4/web-client/legacy-archive.md` に旧ドキュメント一覧と削除時の背景を保持。必要に応じて Git 履歴から復元し、RUN_ID を共有する。
