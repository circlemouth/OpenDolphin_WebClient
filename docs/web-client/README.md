# Web クライアント開発ドキュメントハブ

Web クライアントに関する設計・要件・運用資料を集約したナビゲーションです。まずは本ファイルから各カテゴリへ移動し、更新時は必ず該当セクションへリンクと概要を追記してください。Phase2 以降は棚卸し台帳[`planning/phase2/DOC_STATUS.md`](planning/phase2/DOC_STATUS.md)で Active/Dormant/Archive を更新し、本ハブと内容を同期させます。

## Phase2 ガバナンス必読チェーン

> **Phase2 ガバナンス必読チェーン / 接続・RUN 運用共通ルール**  
> 1. `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各領域チェックリストの順で参照・更新し、同一 RUN_ID を連携する。  
> 2. WebORCA 接続先・認証情報は非公開とし、開発で使用する値は `docs/web-client/operations/mac-dev-login.local.md` を参照する。WebORCA トライアルや `curl --cert-type P12` を使った本番アクセスは禁止。  
> 3. RUN_ID は `YYYYMMDDThhmmssZ` 形式を採用し、指示・README・DOC_STATUS・ログ・証跡ディレクトリのすべてで同一値を共有する。観点ごとに派生 RUN_ID を使う場合は親 RUN_ID を明示し、ログ先頭と備考欄へ併記する。  
> 4. DOC_STATUS 更新は (a) 最終コミット確認 → (b) Active/Dormant/Archive 判定 → (c) 備考に RUN_ID / 証跡パスを追記 → (d) ハブドキュメントへ同日付反映、の順で行い、完了報告前にチェック。  
> 5. Legacy サーバー/クライアントは参照専用アーカイブであり、差分検証のためにのみ起動可（保守・稼働維持作業は禁止）。

最終棚卸し更新: 2025-11-23（RUN_ID=`20251123T213145Z`）。参照チェーン確認ログを `docs/server-modernization/phase2/operations/logs/20251123T213145Z-run-id-chain.md` に配置し、`planning/phase2/DOC_STATUS.md` と Phase2 INDEX（サーバーモダナイズ）へ同日付で同期済み。

## カテゴリ構成

### 1. アーキテクチャ / 要件
- [`architecture/REPOSITORY_OVERVIEW.md`](architecture/REPOSITORY_OVERVIEW.md): リポジトリ構成と各モジュールの役割。（2025-11-12 更新: Modules 節に共通モジュール共有方針と `-jakarta` 併産手順を追記）
- [`architecture/WEB_CLIENT_REQUIREMENTS.md`](architecture/WEB_CLIENT_REQUIREMENTS.md): 機能・非機能・セキュリティ要件。
- [`architecture/PHASE2_SYSTEMS_ALIGNMENT.md`](architecture/PHASE2_SYSTEMS_ALIGNMENT.md): Phase2 の三者接続図/API 契約/Runbook 連携/証跡保存先を RUN_ID=`20251115T143200Z` でまとめたドラフト。UX マネージャー主導で更新し、DOC_STATUS Active 行と同期。
- [`architecture/REST_API_INVENTORY.md`](architecture/REST_API_INVENTORY.md): Web クライアントが利用する REST API 一覧と留意点。
- [`architecture/ui-api-mapping.md`](architecture/ui-api-mapping.md): ルーティング/画面/コンポーネントごとに REST・ORCA 接続と優先度/監査ルールを RUN_ID=`20251127T120000Z` で整理。
- [`../server/LEGACY_REST_API_INVENTORY.md`](../server/LEGACY_REST_API_INVENTORY.md): 旧サーバーの REST エンドポイント参照表（クライアント互換確認用）。
- サーバー API のモダナイズ資料（`MODERNIZED_REST_API_INVENTORY.md` や Persistence/Reporting など）は [Server Modernization Phase2 Index](../server-modernization/phase2/INDEX.md) から辿る。

### 2. プロセス / 計画
- [`process/ROADMAP.md`](process/ROADMAP.md): フェーズ 0〜2 の成果と次アクションを統合したロードマップ。
- [`process/SWING_PARITY_CHECKLIST.md`](process/SWING_PARITY_CHECKLIST.md): Web とオンプレ（Swing）機能差分の確認チェックリスト。
- [`process/API_UI_GAP_ANALYSIS.md`](process/API_UI_GAP_ANALYSIS.md): 未整備 API と UI の対応状況・実装優先度。
- [`process/SECURITY_AND_QUALITY_IMPROVEMENTS.md`](process/SECURITY_AND_QUALITY_IMPROVEMENTS.md): セキュリティ/品質改善タスクのサマリと監査ポリシー。
- [`planning/phase2/DOC_STATUS.md`](planning/phase2/DOC_STATUS.md): ドキュメント棚卸しとステータス管理。追加資料を作る際はまずここで区分を決める。

### 3. サーバーモダナイズ連携
- [`../server-modernization/phase2/INDEX.md`](../server-modernization/phase2/INDEX.md): Phase2 ドキュメントのナビゲーション（foundation/domains/operations/notes を集約）。
- `docs/server-modernization/security/3_7-security-compliance.md`: Phase 3.7 セキュリティ・コンプライアンス実装まとめ（2FA 監査ログ `status` フラグと AES キー要件見直し）。
- `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`: デバッグ観点のチェックリスト。ブロッカー調査時は `SERVER_MODERNIZED_STARTUP_BLOCKERS.md` を合わせて参照。
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`: 2025-11-12 追加。WebORCA サブモジュールとモダナイズ版サーバー間の疎通チェック、`claim.host` 設定、53 API の検証マトリクス、Evidence 保存ルールを集約。接続先の具体値は機微情報として `docs/web-client/operations/mac-dev-login.local.md` を参照する運用に変更。CRUD ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-orca-dev-crud.md` と `artifacts/orca-connectivity/<RUN_ID>/` に保存。棚卸し状況は `planning/phase2/DOC_STATUS.md` 内「モダナイズ/外部連携（ORCA）」セクションを参照し、週次テーブルで W21 以降の進捗を記録する。週次欄更新時は `npm run orca-weekly` の出力（`tmp/orca-weekly-summary.{json,md}`）を貼り付け、RUN_ID/日付を README・PHASE2_PROGRESS・DOC_STATUS へ同時反映すること。
- 2025-11-16 (Worker-D): RUN_ID=`20251116T210500Z-E1` で EXT-01 PHR REST の Evidence を作成。Trial=`20251121TrialPHRSeqZ1-A/B`（404/405）、Modernized=`20251121TrialPHRSeqZ1-CTX`（200/監査）を `artifacts/orca-connectivity/20251116T210500Z-E1/` に集約し、Flyway V0228 (`d_phr_key` / `phr_async_job`) と `ops/check-secrets.sh` ログを `checks/` に保存。詳細は `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E1-phr.md` と `notes/external-api-gap-20251116T111329Z.md` §2.1 を参照。Trial POST が開放され次第、本 RUN の証跡を実測で差し替える。 
- `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`: 2025-11-14 作成。モダナイズ版サーバー/ORCA 連携 API のドキュメント配置・進捗・RUN_ID ハイライトを 1 か所に集約し、`MODERNIZED_REST_API_INVENTORY.md` や `API_PARITY_MATRIX.md`、各種 ORCA Runbook への入口として利用する（ORCA 連携の位置付けは §3.2 を参照）。
- `docs/server-modernization/phase2/operations/assets/orca-trialsite/README.md`: 2025-11-14 追加。**現在は開発用固定サーバー移行により参考アーカイブ扱い（WebORCA トライアルの接続情報・制限を保管）。** Evidence は `artifacts/orca-connectivity/TRIAL_SWITCH/` に残るが、新規検証では利用しない。
- 旧サーバーとモダナイズ版の REST API インベントリはそれぞれ [`../server/LEGACY_REST_API_INVENTORY.md`](../server/LEGACY_REST_API_INVENTORY.md) と [`../server-modernization/MODERNIZED_REST_API_INVENTORY.md`](../server-modernization/MODERNIZED_REST_API_INVENTORY.md) を使用。

### 4. 臨床・機能ガイド
- [`guides/CLINICAL_MODULES.md`](guides/CLINICAL_MODULES.md): 患者管理、受付・予約、カルテ補助、ORCA 連携、帳票/シェーマ機能の統合ガイド。（2025-11-06 更新: DocInfoSummary 必須フィールドの非 null 化と CLAIM/ラボ連携時の保険バリデーション方針を追記）
- `features/` 配下: CareMap、受付予約、スタンプライブラリ、ラボ結果、ORCA 連携など機能別仕様書。
- `process/`・`architecture/` 補遺: API・データ要件、モダナイゼーション計画の補足資料。

-### 5. UX / デザインシステム
- [`design-system/ALPHA_COMPONENTS.md`](design-system/ALPHA_COMPONENTS.md): デザインシステム α 版と Storybook 運用指針。（2025-11-06 更新: SurfaceCard の warning/danger トーン追加と forwardRef 対応、SelectField/TextArea の必須 props 整理を追記）
- [`ux/ux-documentation-plan.md`](ux/ux-documentation-plan.md): Web クライアント UX ドキュメントの再編計画。現在の設計・監査・RUN_ID ルールはこの文書から 3 つのポリシードキュメント（`reception-schedule-ui-policy.md`, `patients-admin-ui-policy.md`, `charts-claim-ui-policy.md`）を参照する構成で整理されています。legacy な背景資料は `ux/legacy/` に移動済みです。
- [`ux/reception-schedule-ui-policy.md`](ux/reception-schedule-ui-policy.md): 受付・施設スケジュール画面のコンポーネント→API/マスターの依存図と TooltipFields で統一する `progress`/`status` 更新、管理 UX 責務分離、並列チェックリスト（RUN_ID=20251127T051615Z）。
- [`ux/patients-admin-ui-policy.md`](ux/patients-admin-ui-policy.md): Patients 系と Administration 系の UI/ORCA 連携・トーン管理・監査を整理し、PHR/ORCA master bridge のブロックチェックと `missingMaster`/`fallbackUsed` による警告パターンを記述。
- [`ux/charts-claim-ui-policy.md`](ux/charts-claim-ui-policy.md): カルテタイムライン、ORCA master、Claim/Letter の依存・トーン・React Query ポリシーを集約し、`dataSourceTransition`/`cacheHit` の可視化と API 証跡の並列表を提示。
- Legacy 背景資料 (`ux/legacy/`): `CHART_UI_GUIDE_INDEX.md`、`API_SURFACE_AND_AUDIT_GUIDE.md`、`KARTE_SCREEN_IMPLEMENTATION.md`、`ONE_SCREEN_LAYOUT_GUIDE.md` を移して履歴/寸法/監査要件の資料として保持しています。新規実装は再編計画と上記 3 つのポリシーを優先してください。

- [`operations/RECEPTION_WEB_CLIENT_MANUAL.md`](operations/RECEPTION_WEB_CLIENT_MANUAL.md): 受付担当者向け研修計画と運用手順。2026-06-14 (Worker O) `chart-events.replay-gap` 通知 UI のワイヤーフレーム、状態遷移図、Web/Touch 擬似コード、監査・再取得フローを追記。2026-06-14 (Worker T) Touch 向け `ReplayGapState` 詳細・ローカル通知・監査ペイロード・UI モックを追加し、iOS/Android 擬似コードを更新。
- [`operations/RELEASE_NOTES_DRAFT.md`](operations/RELEASE_NOTES_DRAFT.md): リリース判定用の文書系差分・検証結果の草案（2025-11-03 新設: Worker F）。
- [`operations/LOCAL_BACKEND_DOCKER.md`](operations/LOCAL_BACKEND_DOCKER.md): 既存サーバーを Docker Compose で起動する手順。2025-11-02 (Codex) 初期施設 ID・管理者/医師アカウントとテスト患者 `WEB1001`〜`WEB1010` の投入手順を整理。2025-11-03 (Codex) Worker0/1 修正後の Maven/Docker ビルド検証ログと再現手順を追加。2025-11-04 (Worker B) Touch 個人情報 API における `X-Access-Reason`／`X-Consent-Token` ヘッダー運用と PIA 監査ログ確認フローを Runbook へ追記。2025-11-05 (Codex) `scripts/start_legacy_modernized.sh` による旧/新サーバー同時起動手順を追加。
- [`operations/mac-dev-login.local.md`](operations/mac-dev-login.local.md): 2025-11-06（MacBook-Air M2, gcloud 470.0.0 記録付き）に Trial CRUD 検証へ必要なローカル WildFly ログイン／pf 例外／gcloud Secrets／GCS 受け渡しセットアップを再確認した Mac 手順。Trial CRUD を GUI 端末なしで再実施する際に唯一、施設 ID `1.3.6.1.4.1.9414.72.101` / `admin` アカウント発行・MD5 パスワード管理・Docker port-forward 復旧 (lo0 pf ルール) をまとめて参照できるため現行維持とする。Legacy 化条件: (1) WildFly 33 モダナイズ版の WAR 起動が安定し `LOCAL_BACKEND_DOCKER.md` へ Mac 専用手順を吸収できた時点、かつ (2) Secrets/GCS 受け渡し Runbook が Ops と共有済で Trial CRUD の CLI が OS 非依存になった時点で Dormant/Archive へ移行する。
- [`operations/CAREMAP_ATTACHMENT_MIGRATION.md`](operations/CAREMAP_ATTACHMENT_MIGRATION.md): CareMap 添付移行と image-browser 設定のガイド。
- [`operations/TEST_SERVER_DEPLOY.md`](operations/TEST_SERVER_DEPLOY.md): テスト環境へのデプロイとアカウント発行手順。2025-11-02 (Codex) Docker Compose 由来の初期アカウント情報を冒頭に整理。
- [`operations/CHARTS_LEFT_RAIL_TIMELINE_FIX.md`](operations/CHARTS_LEFT_RAIL_TIMELINE_FIX.md): Charts 左カラムと固定フッター干渉の解消内容と検証ログ（2025-11-03 追加: Codex）。
- [`operations/CHARTS_PATIENT_HEADER_BUTTON_FIX.md`](operations/CHARTS_PATIENT_HEADER_BUTTON_FIX.md): 患者ヘッダー「診察開始/終了」ボタンの disabled 表示を単色化し、`aria-pressed`/`aria-busy` を追加した検証ノート（2025-11-03 追加: Codex）。
- [`../server-modernization/operations/OBSERVABILITY_AND_METRICS.md`](../server-modernization/operations/OBSERVABILITY_AND_METRICS.md): モダナイズ版サーバーのメトリクス公開と Prometheus/Grafana 連携ガイド（2025-11-07: Stage Dry-Run 証跡、logrotate / Evidence ルール、GitHub Actions 週次 Dry-Run を更新）。

## 開発者の入り口
1. `architecture/REPOSITORY_OVERVIEW.md` でシステム全体像と制約を把握する。
2. `architecture/WEB_CLIENT_REQUIREMENTS.md` と `process/ROADMAP.md` を読み、対象スコープと品質要件を確認する。
3. 実装タスクは `process/` 配下の計画ドキュメント（フェーズ別ロードマップ/差分チェックリスト/API ギャップ分析）に従って進める。
4. UI/UX 検討時は `ux/` ディレクトリ、機能仕様は `features/`・`guides/` を参照し、更新時は本 README にも反映する。

## Vite Stage 起動（Vite 6.4 以降）
- Vite 6.4 以降は `npm run dev:stage --https` が非対応。Stage 向け開発サーバーは `VITE_API_BASE_URL= VITE_DISABLE_MSW=1 npx vite --host --mode stage --port 4173 --clearScreen false` を使用し、MSW/Service Worker を無効化して実サーバー接続する。

-## DocumentTimeline 安定化と開発モック手順（2025-11-01 追記、担当: Codex）
- `ux/ux-documentation-plan.md`（再編計画）および `ux/charts-claim-ui-policy.md` に、カテゴリ切替時のイベント再選択・詳細パネルの同期・エラートーン（情報/警告/危険/中立）を明文化。カルテ左レールの DocumentTimeline 改修時はこれらの要件に従い、legacy な `ux/legacy/CHART_UI_GUIDE_INDEX.md` で過去の記録を補完してください。
- Web クライアント開発では、Vite 開発サーバー起動時に MSW が自動登録され、Charts Page 用の `/api/karte/docinfo/*` `/api/pvt2/pvtList` `/api/chartEvent/*` をモックする。詳細手順は `web-client/README.md#開発モックmswとバックエンド切替` を参照。
- 実サーバー検証に切り替える際は `npm run build && npm run preview -- --host` を利用し、必要に応じてブラウザの Service Worker 管理画面で `mockServiceWorker` を解除する。スイッチ後は `VITE_DEV_PROXY_TARGET` で向き先を設定する。

## ドキュメント更新ルール
- ドキュメントを追加・改訂した際は変更内容と日付を該当ファイルに記載し、本ハブへリンクを追記する。
- セキュリティや監査に影響する変更は必ず `process/SECURITY_AND_QUALITY_IMPROVEMENTS.md` へ反映し、レビューを経てから適用する。
- 参考資料（PDF / 画像など）は `docs/` 配下の適切なカテゴリに格納し、必ず本ファイルから辿れるようにする。

## 直近更新履歴
- 2026-06-14 (Worker O): `operations/RECEPTION_WEB_CLIENT_MANUAL.md` へ `chart-events.replay-gap` 再取得 UX のワイヤーフレーム/状態遷移/擬似コードを追加し、`ux/legacy/CHART_UI_GUIDE_INDEX.md` からの誘導リンクと Touch SSE クライアント改修メモを整備。
- 2026-06-14 (Worker T): Touch 向け `ReplayGapState` の状態遷移表・iOS/Android 擬似コード・監査ペイロード例・ローカル通知/アクセシビリティ要件・UI モック（`docs/server-modernization/phase2/notes/assets/touch-replay-gap-banner.svg`）を `operations/RECEPTION_WEB_CLIENT_MANUAL.md#68-touch-replaygapstate-実装詳細2026-06-14-追記-worker-t` に追加し、`ux/legacy/CHART_UI_GUIDE_INDEX.md` へも追記。
- 2026-06-08 (担当: Codex): シェーマ保存ペイロード `src/features/charts/utils/schema-payload.ts` の DocInfoSummary `recordedAt/createdAt/updatedAt` を REST タイムスタンプで必須化し、CareMap・Timeline ユーティリティの共通フィクスチャ `src/features/charts/utils/__tests__/doc-info-summary.fixture.ts` を追加してテストモックの型整合性を確保。
- 2026-06-07 (担当: Codex): Touch 初診 `docType` 棚卸し進捗と API 検証手順を `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-A-M.md`・`docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md` に追記し、クライアント仕様書 `guides/CLINICAL_MODULES.md` へ docType 一覧と利用例を追加。
- 2026-06-06 (担当: Codex): Touch 向け FirstEncounterModel 統合対応を `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-A-M.md`・`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に反映し、`d_first_encounter` の docType 運用と互換性確認手順を共有。
- 2026-06-04 (担当: Codex): `docs/archive/2025Q4/server-modernization/phase2/notes/common-dto-diff-N-Z.md` を追加し、Legacy 版と Jakarta 移行後の Common DTO（N〜Z）差分・PHR 拡張・新規 Async ジョブ／第三者提供記録エンティティの影響を整理。`docs/server-modernization/phase2/PHASE2_PROGRESS.md` にもフォローアップタスクを追記。
- 2026-05-27 (owner: Codex): Added scripts/api_parity_eval.py and scripts/api_parity_response_check.py plus documentation (docs/server-modernization/phase2/PHASE2_PROGRESS.md, docs/server-modernization/operations/API_PARITY_RESPONSE_CHECK.md). Use python scripts/api_parity_eval.py for documentation parity and python scripts/api_parity_response_check.py --config <file> for live comparisons.
- 2026-05-27 (担当: Codex): `PVTResource2Test` に DELETE 正常／施設不一致ケースを追加し、`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` を更新。`/pvt2/{pvtPK}` DELETE が `[x]` 判定となったことを記録。
- 2026-05-27 (担当: Codex): JsonTouch `/10/adm/jtouch/document*` 実装と Parity テスト拡張の結果を `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に反映。`JsonTouchResourceParityTest` を 17 ケースに増強し、Maven `-pl server-modernized test` が DuplicateProjectException で失敗する旨を Runbook に記録。
- 2025-11-19 (担当: Codex): WebORCA トライアルへ一時統一した履歴。**2025-11-21 以降は接続情報を非公開化し、開発用は `mac-dev-login.local.md` 参照に一本化**。関連ログは履歴として参照可だが新規検証は mac-dev-login.local.md 記載先で行う。
- 2025-11-20 (担当: cursor cli): `src/modernized_server/07_APIとORCAの結合テスト完了.md` を追加し、RUN_ID=`20251120T131731Z` で WebORCA trial 向け API×ORCA 結合テスト自動化の計画とログ雛形（`docs/server-modernization/phase2/operations/logs/20251120T131731Z-orca-tests.md`）を準備。成功/失敗パターンと Blocker を `ORCA_API_STATUS.md` と連携して報告できる状態を整備。
 - 2025-11-25 (担当: Codex): Stage/Preview Vite stage server を `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources` + `VITE_API_BASE_URL=http://100.102.17.40:8000/openDolphin/resources` + `VITE_DISABLE_MSW=1` で起動し、`RUN_ID=20251124T073245Z VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources VITE_API_BASE_URL=http://100.102.17.40:8000/openDolphin/resources VITE_DISABLE_MSW=1 PLAYWRIGHT_BASE_URL=http://localhost:4173 WEB_ORCA_MASTER_SOURCE=server npm run e2e:orca-master` を 2025-11-25T19:23:30+0900 に再実行。`playwright.config.ts` に `/charts/72001` の baseURL を渡した結果、Live プロファイルの Charts master bridge が完走（405ms, 1 pass）し、`recordPerfLog`／警告バナー／監査メタ（`dataSource=server`/`cacheHit=false`/`missingMaster=false`/`fallbackUsed=false`）を出力、`artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` にステータスを上書きしました。Reception/Claim は `profile==='msw'`/`test.skip`/`test.fixme` により MSW-only snapshot 経路（`missingMaster=true`・`fallbackUsed=true`）を継続し caution-tone warning banner を出すため、Reception/Claim 用 Live baseURL と UI セレクタが整った段階で同コマンドを再実行し、warning tone や監査メタの変化を `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md#SP4` / DOC_STATUS / manager checklist / `docs/server-modernization/phase2/notes/worker-report-master-bridge-20251124T073245Z.md` に追記してください。`artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` を証跡としつつ、Live baseURL coverage・Reception/Claim MSW-only coverage・warning banner tone の解消タスクを次の再検証でクリアします。
同日 2025-11-25T19:00:20+0900 に raw B が再再更新されたため同コマンドを再度実行し、`schema missing: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/orca-master-generic-class.json` を再確認したうえで `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05,orca06,orca08}.hash` と `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca*.json` に同じハッシュ（ORCA-05 server=`f739d4c33db1a6dd632cee5f350750e04b49c304e8371ae1c011453ee45d5646`・msw=`6d61e0ab37cfcd94065899e44e3ef6bc3f42fb3414a26ccaec8bd8da3a7b9385`; ORCA-06/08 msw=`2a80924ccae73e708f32acd3fec350f4b3c329747679f04afb59aa5cdf6e65f5`/`849e849d1e83d6181229ccfed716521fa6f83b0ce1cac2e696b8656e666d8c10`) を再記録しました。
- 2025-11-26T04:54:43+0900 (担当: Codex): raw B 差分の監査タイミング（全クライアント切断中の接続再開前）を兼ねて上記コマンドを再実行し、`artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05,orca06,orca08}.hash` と `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca*.json` を再上書き。`schema missing: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/orca-master-generic-class.json` を再確認したうえで ORCA-05 counts=MSW 5 / server 4（totals=970/970）・`missingMaster=false`/`fallbackUsed=false`/`cacheHit=false`/`dataSource=snapshot`、ORCA-06/08 counts=2/2・5/5・`hashMatchComputed=true` を確認し、`hashes`/`diffs`/`schema missing` を DOC_STATUS/manager checklist/worker report に同期しました。`raw B→bridge-sync→hashes/diffs→DOC_STATUS/manager checklist/worker report` の接続再開前ループを維持し、接続再開後の Stage/Live E2E では warning banner tone と `dataSourceTransition` の変化を必ず観測してください。
- 2025-11-26T05:04:44+0900 (担当: Codex): 02:00〜05:04 JST の接続再開直前サイクルに合わせ `node scripts/bridge-sync.mjs --run-id 20251124T073245Z --date 20251124 --source server` を再実行して `artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/server/{orca05,orca06,orca08}.hash` と `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca*.json` を上書きし、`schema missing: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/orca-master-generic-class.json` を再確認。ORCA-05 は counts=MSW 5 / server 4（totals=970/970）・`missingMaster=false`/`fallbackUsed=false`/`cacheHit=false`/`dataSource=snapshot`、ORCA-06/08 は counts=2/2・5/5・`hashMatchComputed=true` を維持し、該当 `hashes`/`diffs`/`schema missing` を `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md#SP3`・`artifacts/api-stability/20251124T000000Z/master-sync/20251124/`・`docs/server-modernization/phase2/notes/worker-report-master-bridge-20251124T073245Z.md` に引き続き記録し、接続再開後の Stage/Live E2E 担当へ warning banner tone と `dataSourceTransition` 変化・Reception/Claim MSW-only coverage を引き継いでください。未完タスク: Reception/Claim coverage・warning tone・Stage/Live E2E 再実行（dataSourceTransition の確認を含む）。
- 2025-11-26T05:20:35+0900 (担当: Codex): 同じ Stage/Preview 環境で `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources VITE_API_BASE_URL=http://100.102.17.40:8000/openDolphin/resources VITE_DISABLE_MSW=1 PLAYWRIGHT_BASE_URL=http://localhost:4173 WEB_ORCA_MASTER_SOURCE=server npm run e2e:orca-master` を再実行した結果、`artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` が `status: partial`（Charts pass / Reception skip / Claim pending）となり、Live シナリオは `browserType.launch` 時に `FATAL: base/apple/mach_port_rendezvous_mac.cc:156 bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.50292: Permission denied (1100)` を受けてブラウザが終了したため完走できませんでした。Reception/Claim は依然 MSW only（`missingMaster=true`/`fallbackUsed=true`）で caution-tone warning banner を継続中です。Playwright の Mach port アクセス権が確保され、Reception/Claim Live baseURL/`test.skip`・`test.fixme` 解消後に再実行して `warning banner tone`・`dataSourceTransition` の変化を `artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` および Stage log に記録してください。
- 2025-11-26T05:47:12+0900 (担当: Codex): Stage/Preview Vite stage server を `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources` / `VITE_API_BASE_URL=http://100.102.17.40:8000/openDolphin/resources` / `VITE_DISABLE_MSW=1` + `PLAYWRIGHT_BASE_URL=https://localhost:4173` で再起動し `WEB_ORCA_MASTER_SOURCE=server npm run e2e:orca-master` を実行。Chart master bridge が `dataSourceTransition=snapshot→server`・`dataSource=server`・`cacheHit=false`・`missingMaster=false`・`fallbackUsed=false` を返し warning badge tone も server ルートになったことを `recordPerfLog` で確認して `artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` を上書きし、Stage log を DOC_STATUS/manager checklist/worker report に同期しました。Reception/Claim は `profile==='msw'` + `test.skip`/`test.fixme` で MSW snapshot/fallback を維持して caution-tone warning banner（`missingMaster=true`/`fallbackUsed=true`）を出し続けているため、Live baseURL（例 `/reception/insurance`・`/claim/tensu`）と selectors が揃った段階で同コマンドを再実行して `warning banner tone`・`dataSourceTransition` が server ルートへ移行することを Stage log/`docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md#SP4` に追記し、次回報告では Stage log と `artifacts/api-stability/20251124T000000Z/master-sync/20251124/` diff 再取得予定を明示してください。
- 2025-11-26T05:20:35+0900 (担当: Codex): Stage/Preview Vite stage server（同上の `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources`/`VITE_API_BASE_URL`/`VITE_DISABLE_MSW=1` 設定）で `npm run e2e:orca-master` を再実行した結果、`artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` に `status: partial`（Charts pass / Reception skip / Claim pending）が記録され、Live-specific Claim の `browserType.launch` が `FATAL: base/apple/mach_port_rendezvous_mac.cc:156 bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.50292: Permission denied (1100)` を返して abort したため Live `warning banner tone`・`dataSourceTransition`・Live baseURL coverage を再取得できませんでした。Reception/Claim は依然 `profile==='msw'`/`test.skip`/`test.fixme` の snapshot/fallback 経路のまま caution-tone warning banner を表示しているため、`bootstrap_check_in` 権限が付与された Stage/Live agent 環境および Reception/Claim Live baseURL＋`test.skip`/`test.fixme` 解除のタイミングで同コマンドを再実行し、`artifacts/e2e/20251124T073245Z/sp4-main-scenarios.log` を上書きして warning badge・監査メタ・`dataSourceTransition` の変化・Live baseURL coverage を再確認してください。再取得結果は `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md#SP4`・DOC_STATUS（Web クライアント/連携行）・`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` RUN_ID セクション・`docs/server-modernization/phase2/notes/worker-report-master-bridge-20251124T073245Z.md` と同期し、未完タスク（Live baseURL coverage、Reception/Claim MSW-only coverage、warning banner tone、dataSourceTransition 再確認）を明記してください。
- 2025-11-07 (担当: Codex): ChartsPage の保存/ロック/ORCA 生成ハンドラと ObservationPanel の Hook 依存を整理し、`react-hooks/exhaustive-deps` 警告を解消。`resolveProgressContext` 依存へ集約した保存系の副作用と、観察データの `useMemo` 固定化で再描画を安定化。
- 2025-11-06 (担当: Codex): `ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` を更新し、左レール VisitChecklist 廃止と ProblemListCard 先頭化・StatusBar からの未完タスク表示撤去を記録。
- 2025-11-03 (担当: Codex): API パリティ再集計で JsonTouch 16 件・PHR 11 件・`/pvt2/{pvtPK}` DELETE を `[ ] / △ 要証跡` に差し戻し、`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md` を更新。未解決タスクと Runbook 参照先を整理。
- 2025-11-04 (担当: Worker E): SystemResource `/dolphin` 系 5 エンドポイントを `[x]` 判定へ更新し、`SystemResourceTest` 追加・監査ログ分岐・ライセンス I/O 例外の証跡を `API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に反映。
- 2025-11-04 (担当: Worker F): PHRResource 11 件と `/20/adm/phr/export` 系 REST を実装し、監査ログ・TouchErrorResponse・署名付き URL 手順を `API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に反映。`PHRResourceTest` を追加（Maven 未導入のため CI 実行が必要）。
- 2025-11-03 (担当: Codex): 受付患者検索カードを4入力欄によるAND検索に刷新し、条件クリアボタンと独立した新規患者登録ボタンを追加。仕様概要を `ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` に追記。
- 2025-11-03 (担当: Codex): Web クライアントの初期表示を「受付一覧」へ切り替え、サイドバーで患者情報を保存した直後に患者 ID 検索が自動反映されるよう受付画面を更新。詳細は `ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` と `features/RECEPTION_SCHEDULE_AND_SUMMARY.md` を参照。
- 2025-11-03 (担当: Codex): Worker0/1 修正後の Maven / Docker ビルド検証結果を `docs/server-modernization/phase2/PHASE2_PROGRESS.md` と `operations/LOCAL_BACKEND_DOCKER.md` に追記し、未解決のコンパイルエラーと再現手順を整理。
- 2025-11-03 (担当: Codex): WildFly プロファイルを `standalone-full.xml` 運用へ切り替え、ActiveMQ/JMS 認証確認手順を追加。詳細は `operations/TEST_SERVER_DEPLOY.md` と `operations/LOCAL_BACKEND_DOCKER.md#activemqjms-確認手順2025-11-03-更新` を参照。
- 2025-11-01 (担当: Codex): OrderConsole アイコンバー再構成とモーダル挙動の進捗を `docs/server-modernization/phase2/PHASE2_PROGRESS.md#2025-11-01-進捗-t3-orderconsole-アイコンバー実装担当-codex` に記録。MSW スクリーンショットは既存ビルドエラー解消後に `docs/server-modernization/phase2/assets/order-console-1366.png` へ追加予定。
- 2025-11-01 (担当: Codex): 左レール VisitChecklist / ProblemListCard / SafetySummaryCard の縮小対応を実施し、`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に T2 の確認メモを追記（2025-11-06 時点で VisitChecklist は廃止済み）。
- 2025-11-01 (担当: Codex): `docker-compose.yml` の WildFly ヘルスチェックを OpenDolphin API に切り替え、SYSAD 認証ヘッダーを追加。手順を `operations/LOCAL_BACKEND_DOCKER.md` に追記。
- 2025-11-01 (担当: Worker E): ChartsPage のレイアウト最終調整を反映。`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` に 3 解像度の実測寸法とギャップ調整を追記し、`docs/server-modernization/phase2/PHASE2_PROGRESS.md` / 本 README に検証結果（lint 既存エラー・vitest 既存失敗）と残タスクを記録。
- 2025-11-01 (担当: Codex): 患者検索/受付用ダミーデータを MSW に追加し、`web-client/README.md`・`operations/DEV_MSW_MOCKS.md` にメンテナンス手順を追記。
- 2025-11-01 (担当: Codex): DocumentTimelinePanel の安定化方針とエラーメッセージ改善を `ux/legacy/CHART_UI_GUIDE_INDEX.md` / `ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` に追記し、MSW モック切替手順を `web-client/README.md` に整理。計画ドキュメント `phase1/PHASE1_FOUNDATION.md`・`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に進捗メモを追加。
- 2025-11-01 (担当: Codex): 旧 Swing クライアントの列幅を基準にカルテ画面の再配置計画を策定。`ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/legacy/CHART_UI_GUIDE_INDEX.md`・`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md`・`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に寸法とタスク分解を追記。
- 2025-11-01: 左レールに ProblemListCard / SafetySummaryCard を追加し、診断リストと安全サマリ（アレルギー/既往/内服）のガイドを `ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` / `ux/legacy/CHART_UI_GUIDE_INDEX.md` に反映。23インチ(1920px)の列比率と右レール折りたたみ条件を `docs/server-modernization/phase2/PHASE2_PROGRESS.md`・`ux/legacy/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/legacy/CHART_UI_GUIDE_INDEX.md` に追記。
- 2025-11-02 (担当: Codex): 従来サーバーにテスト患者 `WEB1001`〜`WEB1010` を投入し、`operations/LOCAL_BACKEND_DOCKER.md` / `operations/TEST_SERVER_DEPLOY.md` に再投入手順と一覧を追加。
- 2025-11-02 (担当: Codex): `ReceptionSidebarContent` を新設し、受付サイドバーのタブ構成と患者エディタ統合を完了。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` と `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に仕様・進捗を追記。
- 2026-06-01: PHR 管理タブと患者データ出力ページを整理。`process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-31: 管理画面の未実装項目調査を反映し、`process/SWING_PARITY_CHECKLIST.md` を再構成。
- 2026-05-27: 受付詳細モーダルの旧 API 対応タブを実装。`process/API_UI_GAP_ANALYSIS.md` と `process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-25: 施設予約一覧の改修内容を `guides/CLINICAL_MODULES.md` に統合。
- 2026-05-24: 未整備 API の UI 対応計画を更新。`process/API_UI_GAP_ANALYSIS.md` を参照。
- 2026-05-20: 診断書エディタとシェーマエディタを Supplement パネルへ追加。`features/MEDICAL_CERTIFICATES_AND_SCHEMA.md` と `process/SWING_PARITY_CHECKLIST.md`、`operations/RECEPTION_WEB_CLIENT_MANUAL.md` を更新。
- 2026-05-13: CareMap（治療履歴カレンダー）を追加。`features/CARE_MAP_TIMELINE.md` を新設し、`process/SWING_PARITY_CHECKLIST.md` と `ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` を更新。
- 2026-05-05: 患者メモ履歴ダイアログを追加。`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md`、`features/PATIENT_MANAGEMENT_GUIDE.md`、`process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-02: 受付予約管理の保存ガードを実装。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` に運用上の注意を追記。
- 2026-05-01: 受付予約管理 (AppointmentManager) と FreeDocument 編集 UI を拡充。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` と `process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-04-25: カルテ右ペインに問診メモ／患者メモ編集カードを追加。`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` と `process/SWING_PARITY_CHECKLIST.md` に反映。
- 2026-04-23: 受付患者一覧に呼出トグルとインラインメモ編集を実装。`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` を更新。
- 2026-04-21: Swing 版との差分チェックリストを整備。`process/SWING_PARITY_CHECKLIST.md` を新設。
- 2026-04-20: `/charts/:visitId` と `/reception` を分離し、遷移導線と空状態ガイドを更新。`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` を改訂。
- 2026-04-17: カルテ画面 UI をフルレイアウト化。`ux/legacy/KARTE_SCREEN_IMPLEMENTATION.md` と関連コンポーネントの仕様を整理。
- 2026-03-30: フェーズ4 セキュリティ/性能対策を完了。`features/PHASE4_SECURITY_AND_QUALITY.md` を新設し、関連タスクをクローズ。

> 過去の履歴は各ドキュメント内の更新履歴または `process/ROADMAP.md` を参照してください。
