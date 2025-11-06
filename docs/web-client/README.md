# Web クライアント開発ドキュメントハブ

Web クライアントに関する設計・要件・運用資料を集約したナビゲーションです。まずは本ファイルから各カテゴリへ移動し、更新時は必ず該当セクションへリンクと概要を追記してください。

## カテゴリ構成

### 1. アーキテクチャ / 要件
- [`architecture/REPOSITORY_OVERVIEW.md`](architecture/REPOSITORY_OVERVIEW.md): リポジトリ構成と各モジュールの役割。
- [`architecture/WEB_CLIENT_REQUIREMENTS.md`](architecture/WEB_CLIENT_REQUIREMENTS.md): 機能・非機能・セキュリティ要件。
- [`architecture/REST_API_INVENTORY.md`](architecture/REST_API_INVENTORY.md): Web クライアントが利用する REST API 一覧と留意点。
- [`../server-modernization/MODERNIZED_REST_API_INVENTORY.md`](../server-modernization/MODERNIZED_REST_API_INVENTORY.md): モダナイズ版 REST API インベントリ（2025-11-04 更新: Touch 患者・スタンプ・ユーザ API の新リソース登録とプライバシー監査要件を追記／2025-11-03 更新: AdmissionResource 2FA、Stamp/Letter 監査ログ対応、`PUT /orca/interaction` のパリティ記述を反映）。
- [`../server/LEGACY_REST_API_INVENTORY.md`](../server/LEGACY_REST_API_INVENTORY.md): 旧サーバーの REST エンドポイントを網羅した参照表。
- [`architecture/SERVER_MODERNIZATION_PLAN.md`](architecture/SERVER_MODERNIZATION_PLAN.md): 既存サーバー刷新・連携の将来計画。
- [`../server-modernization/legacy-server-modernization-checklist.md`](../server-modernization/legacy-server-modernization-checklist.md): 旧サーバー仕様サマリとモダナイズ実装チェックリスト。
- [`../server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`](../server-modernization/persistence-layer/3_4-persistence-layer-modernization.md): 永続化層モダナイズ完了報告と移行手順。
- [`../server-modernization/reporting/3_5-reporting-modernization.md`](../server-modernization/reporting/3_5-reporting-modernization.md): 帳票テンプレート刷新内容と CI 運用ガイド。
- [`../server-modernization/external-integrations/3_6-external-service-modernization.md`](../server-modernization/external-integrations/3_6-external-service-modernization.md): 外部サービス連携（Plivo/ORCA/API ゲートウェイ）のモダナイズ報告と運用指針。

### 2. プロセス / 計画
- [`process/ROADMAP.md`](process/ROADMAP.md): フェーズ 0〜2 の成果と次アクションを統合したロードマップ。
- [`process/SWING_PARITY_CHECKLIST.md`](process/SWING_PARITY_CHECKLIST.md): Web とオンプレ（Swing）機能差分の確認チェックリスト。
- [`process/API_UI_GAP_ANALYSIS.md`](process/API_UI_GAP_ANALYSIS.md): 未整備 API と UI の対応状況・実装優先度。
- [`process/SECURITY_AND_QUALITY_IMPROVEMENTS.md`](process/SECURITY_AND_QUALITY_IMPROVEMENTS.md): セキュリティ/品質改善タスクのサマリと監査ポリシー。
- `docs/server-modernization/security/3_7-security-compliance.md`: Phase 3.7 セキュリティ・コンプライアンス実装まとめ（2025-11-03 更新: 2FA 監査ログ `status` フラグと AES キー要件見直し）。
- `docs/server-modernization/phase2/README.md`: サーバーモダナイズ Phase 2 のハンドブック。ディレクトリ構成と着手手順を確認すること。
- `docs/server-modernization/phase2/foundation/JAKARTA_EE10_GAP_LIST.md`: Jakarta EE 10 への移行ギャップと優先課題の一覧。サーバーモダナイズ作業前に必読。
- `docs/server-modernization/phase2/foundation/DEPENDENCY_UPDATE_PLAN.md`: 依存ライブラリ更新計画とライセンス確認メモ。BOM 更新時はこの資料に準拠すること。
- `docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md`: Jakarta 移行で影響を受ける領域と担当者メモ。週次レビューで進捗を同期。
- `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md`: 旧サーバーとモダナイズ版の認証／MFA／監査実装比較と Jakarta EE 10 影響・推奨アクション（2025-11-02 追記）。
- `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md`: 予約・通知・バッチ機能の Jakarta EE 10 化影響と依存ギャップ整理（2025-11-02 更新）。
- `docs/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md`: JMS 設定ギャップと Worker 0 向けアクションメモ。
- `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md`: WildFly 起動を阻害する未実装リソース（2FA 秘密鍵 / JDBC データソース / JMS / Jakarta Concurrency）の調査結果と対応手順（2026-06-02 追加）。
- `docs/server-modernization/phase2/operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md`: JsonTouch/PHR/PVT 互換性確認と PHR 非同期ジョブ状態管理・Touch SSE 運用手順（2025-11-04 更新: PHR export API 実装・ジョブ監視手順を反映。2025-11-03 追加）。
- `docs/server-modernization/phase2/domains/EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`: 外部連携（ORCA/HL7/Plivo/WebAuthn 等）の旧 API・依存差分とライセンス対応を整理したギャップリスト。
- `docs/server-modernization/phase2/domains/JAKARTA_EE10_CHARTS_VIEW_IMPACT.md`: 患者基本情報・カルテ閲覧系の `javax.*` 残存状況、レスポンスモデル比較、Micrometer 置換など Jakarta EE 10 移行時の影響整理。閲覧 API 改修時は合わせて参照。
- `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`: 旧サーバーとモダナイズ版の全 REST API を 1:1 で比較したパリティマトリクス（2026-05-27 更新: `DELETE /pvt2/{pvtPK}` の単体テスト証跡を追加し、1:1 対応 202 件／未整備 54 件へ再集計。2025-11-04 (Worker A) `/touch/document/progressCourse`・`/touch/idocument(2)` 行を JSON モダナイズ＋監査ログ整備済みとして更新。2025-11-04 (Worker B) `/touch/patient/*` `/touch/stamp*` `/touch/user/{param}` 行を TouchPatient/Stamp/UserResource へ移管し、監査ログ＋単体テスト証跡を反映）。
- `docs/server-modernization/phase2/domains/STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md`: Stamp/Letter/MML/ORCA の移行計画、監査強化方針、整合テスト計画（2025-11-03 更新: Stamp/Letter 監査ログ実装・ORCA 相互作用検証タスクを追記）。
- `docs/server-modernization/phase2/domains/DEMO_RESOURCE_ASP_MIGRATION.md`: DemoResourceASP 15 エンドポイントのデモデータ移行仕様・マッピング・QA テストケース整理（2025-11-03 再点検: コンパイルエラー/レスポンス差分/テスト未実行の課題を追記）。
- `docs/server-modernization/phase2/domains/EHT_SECURITY_AUDIT_CHECKLIST.md`: EHTResource のセキュリティ／監査要件整理、トランザクション境界方針、外部連携テスト観点（2025-11-03 追加）。
- `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`: WildFly 33 / Micrometer 移行に伴うログ・監査・ジョブ管理比較と運用リスク整理（2025-11-02 更新）。
- `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`: 外部システムから見た旧新サーバー互換を確保する切替/検証ランブック（2025-11-06 更新: Touch 監査ログの actorRole 連携確認と `/touch/patient/{pk}` XML 分離の検証 TODO を追記、あわせて PHR ラボモジュール変換と TouchModuleService RP 復元の互換確認手順を補足。2025-11-04 更新: SystemResource 監査整備・PHR export 手順・Touch 来院履歴 API の QueryParam 仕様を追記。2025-11-03 更新: JsonTouch/PHR/PVT2 パリティ検証ログを追加し、`/dolphin` 系 5 件のテスト未整備課題を整理）。
- `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`: Micrometer サブシステム設定・Prometheus/Grafana 整備・監査突合手順（2025-11-02 更新）。
- `docs/server-modernization/phase2/domains/KARTE_ORDER_JAKARTA_STATUS.md`: カルテ記載・スタンプ/オーダ系 CRUD の Jakarta EE 10 移行状況と未移植課題。CLAIM 送信やドラフト保存を触る際は必読。
- `docs/server-modernization/phase2/domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md`: DolphinResourceASP モダナイズ計画メモ（2025-11-04 更新: TouchModuleService / TouchModuleResourceTest の導入とキャッシュキー `method:paramHash` 方針を追記）。
- `docs/server-modernization/security/ELYTRON_INTEGRATION_PLAN.md`: WildFly Elytron / Jakarta Security 連携方針と Trace ID 運用（2025-11-02 新設）。

### 3. 臨床・機能ガイド
- [`guides/CLINICAL_MODULES.md`](guides/CLINICAL_MODULES.md): 患者管理、受付・予約、カルテ補助、ORCA 連携、帳票/シェーマ機能の統合ガイド。
- `features/` 配下: CareMap、受付予約、スタンプライブラリ、ラボ結果、ORCA 連携など機能別仕様書。
- `process/`・`architecture/` 補遺: API・データ要件、モダナイゼーション計画の補足資料。

### 4. UX / デザインシステム
- [`design-system/ALPHA_COMPONENTS.md`](design-system/ALPHA_COMPONENTS.md): デザインシステム α 版と Storybook 運用指針。
- [`ux/ONE_SCREEN_LAYOUT_GUIDE.md`](ux/ONE_SCREEN_LAYOUT_GUIDE.md): 1 画面完結のレイアウト指針と業務要件メモ。
- [`ux/CHART_UI_GUIDE_INDEX.md`](ux/CHART_UI_GUIDE_INDEX.md): カルテ UI 関連資料の集約。改修前に必ず参照すること。
  - 2025-11-01 (担当: Codex): DocumentTimelinePanel 安定化とエラーメッセージ整備の観点を追記し、タイムラインの状態遷移とフィードバック設計を整理。
  - 2025-11-01 (追記): AppShell コンテンツ領域の `contentMaxWidth` 制限撤廃と、患者一覧/受付一覧/ChartsPage がウィンドウ幅へ追従するレイアウト更新を反映。
- [`ux/KARTE_SCREEN_IMPLEMENTATION.md`](ux/KARTE_SCREEN_IMPLEMENTATION.md): 最新カルテ画面の構造・ショートカット・レスポンシブ仕様。

- [`operations/RECEPTION_WEB_CLIENT_MANUAL.md`](operations/RECEPTION_WEB_CLIENT_MANUAL.md): 受付担当者向け研修計画と運用手順。
- [`operations/RELEASE_NOTES_DRAFT.md`](operations/RELEASE_NOTES_DRAFT.md): リリース判定用の文書系差分・検証結果の草案（2025-11-03 新設: Worker F）。
- [`operations/LOCAL_BACKEND_DOCKER.md`](operations/LOCAL_BACKEND_DOCKER.md): 既存サーバーを Docker Compose で起動する手順。2025-11-02 (Codex) 初期施設 ID・管理者/医師アカウントとテスト患者 `WEB1001`〜`WEB1010` の投入手順を整理。2025-11-03 (Codex) Worker0/1 修正後の Maven/Docker ビルド検証ログと再現手順を追加。2025-11-04 (Worker B) Touch 個人情報 API における `X-Access-Reason`／`X-Consent-Token` ヘッダー運用と PIA 監査ログ確認フローを Runbook へ追記。2025-11-05 (Codex) `scripts/start_legacy_modernized.sh` による旧/新サーバー同時起動手順を追加。
- [`operations/CAREMAP_ATTACHMENT_MIGRATION.md`](operations/CAREMAP_ATTACHMENT_MIGRATION.md): CareMap 添付移行と image-browser 設定のガイド。
- [`operations/TEST_SERVER_DEPLOY.md`](operations/TEST_SERVER_DEPLOY.md): テスト環境へのデプロイとアカウント発行手順。2025-11-02 (Codex) Docker Compose 由来の初期アカウント情報を冒頭に整理。
- [`operations/CHARTS_LEFT_RAIL_TIMELINE_FIX.md`](operations/CHARTS_LEFT_RAIL_TIMELINE_FIX.md): Charts 左カラムと固定フッター干渉の解消内容と検証ログ（2025-11-03 追加: Codex）。
- [`operations/CHARTS_PATIENT_HEADER_BUTTON_FIX.md`](operations/CHARTS_PATIENT_HEADER_BUTTON_FIX.md): 患者ヘッダー「診察開始/終了」ボタンの disabled 表示を単色化し、`aria-pressed`/`aria-busy` を追加した検証ノート（2025-11-03 追加: Codex）。
- [`../server-modernization/operations/OBSERVABILITY_AND_METRICS.md`](../server-modernization/operations/OBSERVABILITY_AND_METRICS.md): モダナイズ版サーバーのメトリクス公開と Prometheus/Grafana 連携ガイド。

## 開発者の入り口
1. `architecture/REPOSITORY_OVERVIEW.md` でシステム全体像と制約を把握する。
2. `architecture/WEB_CLIENT_REQUIREMENTS.md` と `process/ROADMAP.md` を読み、対象スコープと品質要件を確認する。
3. 実装タスクは `process/` 配下の計画ドキュメント（フェーズ別ロードマップ/差分チェックリスト/API ギャップ分析）に従って進める。
4. UI/UX 検討時は `ux/` ディレクトリ、機能仕様は `features/`・`guides/` を参照し、更新時は本 README にも反映する。

## DocumentTimeline 安定化と開発モック手順（2025-11-01 追記、担当: Codex）
- `ux/CHART_UI_GUIDE_INDEX.md` / `ux/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/KARTE_SCREEN_IMPLEMENTATION.md` に、カテゴリ切替時のイベント再選択・詳細パネルの同期・エラートーン（情報/警告/危険/中立）を明文化。カルテ左レールの DocumentTimeline 改修時はこれらの要件に従う。
- Web クライアント開発では、Vite 開発サーバー起動時に MSW が自動登録され、Charts Page 用の `/api/karte/docinfo/*` `/api/pvt2/pvtList` `/api/chartEvent/*` をモックする。詳細手順は `web-client/README.md#開発モックmswとバックエンド切替` を参照。
- 実サーバー検証に切り替える際は `npm run build && npm run preview -- --host` を利用し、必要に応じてブラウザの Service Worker 管理画面で `mockServiceWorker` を解除する。スイッチ後は `VITE_DEV_PROXY_TARGET` で向き先を設定する。

## ドキュメント更新ルール
- ドキュメントを追加・改訂した際は変更内容と日付を該当ファイルに記載し、本ハブへリンクを追記する。
- セキュリティや監査に影響する変更は必ず `process/SECURITY_AND_QUALITY_IMPROVEMENTS.md` へ反映し、レビューを経てから適用する。
- 参考資料（PDF / 画像など）は `docs/` 配下の適切なカテゴリに格納し、必ず本ファイルから辿れるようにする。

## 直近更新履歴
- 2026-05-27 (owner: Codex): Added scripts/api_parity_eval.py and scripts/api_parity_response_check.py plus documentation (docs/server-modernization/phase2/PHASE2_PROGRESS.md, docs/server-modernization/operations/API_PARITY_RESPONSE_CHECK.md). Use python scripts/api_parity_eval.py for documentation parity and python scripts/api_parity_response_check.py --config <file> for live comparisons.
- 2026-05-27 (担当: Codex): `PVTResource2Test` に DELETE 正常／施設不一致ケースを追加し、`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` を更新。`/pvt2/{pvtPK}` DELETE が `[x]` 判定となったことを記録。
- 2026-05-27 (担当: Codex): JsonTouch `/10/adm/jtouch/document*` 実装と Parity テスト拡張の結果を `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に反映。`JsonTouchResourceParityTest` を 17 ケースに増強し、Maven `-pl server-modernized test` が DuplicateProjectException で失敗する旨を Runbook に記録。
- 2025-11-03 (担当: Codex): API パリティ再集計で JsonTouch 16 件・PHR 11 件・`/pvt2/{pvtPK}` DELETE を `[ ] / △ 要証跡` に差し戻し、`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md` を更新。未解決タスクと Runbook 参照先を整理。
- 2025-11-04 (担当: Worker E): SystemResource `/dolphin` 系 5 エンドポイントを `[x]` 判定へ更新し、`SystemResourceTest` 追加・監査ログ分岐・ライセンス I/O 例外の証跡を `API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に反映。
- 2025-11-04 (担当: Worker F): PHRResource 11 件と `/20/adm/phr/export` 系 REST を実装し、監査ログ・TouchErrorResponse・署名付き URL 手順を `API_PARITY_MATRIX.md`・`PHASE2_PROGRESS.md`・`operations/WORKER_E_JSONTOUCH_PHR_PVT_COMPATIBILITY.md`・`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に反映。`PHRResourceTest` を追加（Maven 未導入のため CI 実行が必要）。
- 2025-11-03 (担当: Codex): 受付患者検索カードを4入力欄によるAND検索に刷新し、条件クリアボタンと独立した新規患者登録ボタンを追加。仕様概要を `ux/KARTE_SCREEN_IMPLEMENTATION.md` に追記。
- 2025-11-03 (担当: Codex): Web クライアントの初期表示を「受付一覧」へ切り替え、サイドバーで患者情報を保存した直後に患者 ID 検索が自動反映されるよう受付画面を更新。詳細は `ux/KARTE_SCREEN_IMPLEMENTATION.md` と `features/RECEPTION_SCHEDULE_AND_SUMMARY.md` を参照。
- 2025-11-03 (担当: Codex): Worker0/1 修正後の Maven / Docker ビルド検証結果を `docs/server-modernization/phase2/PHASE2_PROGRESS.md` と `operations/LOCAL_BACKEND_DOCKER.md` に追記し、未解決のコンパイルエラーと再現手順を整理。
- 2025-11-03 (担当: Codex): WildFly プロファイルを `standalone-full.xml` 運用へ切り替え、ActiveMQ/JMS 認証確認手順を追加。詳細は `operations/TEST_SERVER_DEPLOY.md` と `operations/LOCAL_BACKEND_DOCKER.md#activemqjms-確認手順2025-11-03-更新` を参照。
- 2025-11-01 (担当: Codex): OrderConsole アイコンバー再構成とモーダル挙動の進捗を `docs/server-modernization/phase2/PHASE2_PROGRESS.md#2025-11-01-進捗-t3-orderconsole-アイコンバー実装担当-codex` に記録。MSW スクリーンショットは既存ビルドエラー解消後に `docs/server-modernization/phase2/assets/order-console-1366.png` へ追加予定。
- 2025-11-01 (担当: Codex): 左レール VisitChecklist / ProblemListCard / SafetySummaryCard の縮小対応を実施し、`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に T2 の確認メモを追記。
- 2025-11-01 (担当: Codex): `docker-compose.yml` の WildFly ヘルスチェックを OpenDolphin API に切り替え、SYSAD 認証ヘッダーを追加。手順を `operations/LOCAL_BACKEND_DOCKER.md` に追記。
- 2025-11-01 (担当: Worker E): ChartsPage のレイアウト最終調整を反映。`ux/KARTE_SCREEN_IMPLEMENTATION.md` に 3 解像度の実測寸法とギャップ調整を追記し、`docs/server-modernization/phase2/PHASE2_PROGRESS.md` / 本 README に検証結果（lint 既存エラー・vitest 既存失敗）と残タスクを記録。
- 2025-11-01 (担当: Codex): 患者検索/受付用ダミーデータを MSW に追加し、`web-client/README.md`・`operations/DEV_MSW_MOCKS.md` にメンテナンス手順を追記。
- 2025-11-01 (担当: Codex): DocumentTimelinePanel の安定化方針とエラーメッセージ改善を `ux/CHART_UI_GUIDE_INDEX.md` / `ux/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/KARTE_SCREEN_IMPLEMENTATION.md` に追記し、MSW モック切替手順を `web-client/README.md` に整理。計画ドキュメント `phase1/PHASE1_FOUNDATION.md`・`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に進捗メモを追加。
- 2025-11-01 (担当: Codex): 旧 Swing クライアントの列幅を基準にカルテ画面の再配置計画を策定。`ux/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/CHART_UI_GUIDE_INDEX.md`・`ux/KARTE_SCREEN_IMPLEMENTATION.md`・`docs/server-modernization/phase2/PHASE2_PROGRESS.md` に寸法とタスク分解を追記。
- 2025-11-01: 左レールに ProblemListCard / SafetySummaryCard を追加し、診断リストと安全サマリ（アレルギー/既往/内服）のガイドを `ux/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/KARTE_SCREEN_IMPLEMENTATION.md` / `ux/CHART_UI_GUIDE_INDEX.md` に反映。23インチ(1920px)の列比率と右レール折りたたみ条件を `docs/server-modernization/phase2/PHASE2_PROGRESS.md`・`ux/ONE_SCREEN_LAYOUT_GUIDE.md`・`ux/CHART_UI_GUIDE_INDEX.md` に追記。
- 2025-11-02 (担当: Codex): 従来サーバーにテスト患者 `WEB1001`〜`WEB1010` を投入し、`operations/LOCAL_BACKEND_DOCKER.md` / `operations/TEST_SERVER_DEPLOY.md` に再投入手順と一覧を追加。
- 2025-11-02 (担当: Codex): `ReceptionSidebarContent` を新設し、受付サイドバーのタブ構成と患者エディタ統合を完了。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` と `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に仕様・進捗を追記。
- 2026-06-01: PHR 管理タブと患者データ出力ページを整理。`process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-31: 管理画面の未実装項目調査を反映し、`process/SWING_PARITY_CHECKLIST.md` を再構成。
- 2026-05-27: 受付詳細モーダルの旧 API 対応タブを実装。`process/API_UI_GAP_ANALYSIS.md` と `process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-25: 施設予約一覧の改修内容を `guides/CLINICAL_MODULES.md` に統合。
- 2026-05-24: 未整備 API の UI 対応計画を更新。`process/API_UI_GAP_ANALYSIS.md` を参照。
- 2026-05-20: 診断書エディタとシェーマエディタを Supplement パネルへ追加。`features/MEDICAL_CERTIFICATES_AND_SCHEMA.md` と `process/SWING_PARITY_CHECKLIST.md`、`operations/RECEPTION_WEB_CLIENT_MANUAL.md` を更新。
- 2026-05-13: CareMap（治療履歴カレンダー）を追加。`features/CARE_MAP_TIMELINE.md` を新設し、`process/SWING_PARITY_CHECKLIST.md` と `ux/KARTE_SCREEN_IMPLEMENTATION.md` を更新。
- 2026-05-05: 患者メモ履歴ダイアログを追加。`ux/KARTE_SCREEN_IMPLEMENTATION.md`、`features/PATIENT_MANAGEMENT_GUIDE.md`、`process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-05-02: 受付予約管理の保存ガードを実装。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` に運用上の注意を追記。
- 2026-05-01: 受付予約管理 (AppointmentManager) と FreeDocument 編集 UI を拡充。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` と `process/SWING_PARITY_CHECKLIST.md` を更新。
- 2026-04-25: カルテ右ペインに問診メモ／患者メモ編集カードを追加。`ux/KARTE_SCREEN_IMPLEMENTATION.md` と `process/SWING_PARITY_CHECKLIST.md` に反映。
- 2026-04-23: 受付患者一覧に呼出トグルとインラインメモ編集を実装。`ux/KARTE_SCREEN_IMPLEMENTATION.md` を更新。
- 2026-04-21: Swing 版との差分チェックリストを整備。`process/SWING_PARITY_CHECKLIST.md` を新設。
- 2026-04-20: `/charts/:visitId` と `/reception` を分離し、遷移導線と空状態ガイドを更新。`ux/KARTE_SCREEN_IMPLEMENTATION.md` を改訂。
- 2026-04-17: カルテ画面 UI をフルレイアウト化。`ux/KARTE_SCREEN_IMPLEMENTATION.md` と関連コンポーネントの仕様を整理。
- 2026-03-30: フェーズ4 セキュリティ/性能対策を完了。`features/PHASE4_SECURITY_AND_QUALITY.md` を新設し、関連タスクをクローズ。

> 過去の履歴は各ドキュメント内の更新履歴または `process/ROADMAP.md` を参照してください。
