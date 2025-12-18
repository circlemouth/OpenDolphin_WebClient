# DOC_STATUS（RUN_ID=`20251214T022944Z`）

- 本更新 RUN_ID=`20251217T233755Z`（Administration 設定配信: `/api/admin/config`/`/api/admin/delivery` フラグ同期）。証跡: `docs/web-client/planning/phase2/logs/20251217T233755Z-admin-config-delivery-flags.md`。備考: Charts の表示/送信/masterSource を配信で切替し、適用（いつ/誰に/runId）を UI と監査ログで追跡。ToneBanner で影響を明示。
- 本更新 RUN_ID=`20251218T022759Z`（config/delivery 不一致検知 `syncMismatch`＋raw監査強化）。証跡: `docs/web-client/planning/phase2/logs/20251218T022759Z-admin-syncMismatch-raw-audit.md`。備考: 不一致キー一覧を UI で表示し、Charts の `admin/delivery.apply` 監査 payload に raw(config/delivery) を分離して格納。
- 本更新 RUN_ID=`20251217T212939Z`（Charts アクセシビリティ自動検査＋手動監査）。証跡: `docs/web-client/planning/phase2/logs/20251217T212939Z-charts-a11y.md`。備考: axe 重大違反ゼロ、ToneBanner/ActionBar のフォーカス順・操作不能理由読み上げをテスト化。
- 本更新 RUN_ID=`20251217T130407Z`（OrcaSummary 請求/予約サマリ商用仕上げ）。証跡: `docs/web-client/planning/phase2/logs/20251217T130407Z-orca-summary.md`。備考: 請求/予約の表示粒度、`dataSourceTransition` 説明、`fallbackUsed=true` 強警告、予約/会計/再取得導線とショートカットを定義。
- 本更新 RUN_ID=`20251217T212600Z`（ドラフト保存と復元 設計追加）。証跡: `docs/web-client/planning/phase2/logs/20251217T212600Z-charts-draft-save.md`。備考: 受付ID/患者ID/診療日/runId/facilityId/userId でドラフト束縛、localStorage+React Query 二重保存、復元ダイアログ、監査 `DRAFT_SAVE/RESTORE/DISCARD` を定義。
- 本更新 RUN_ID=`20251217T150614Z`（DocumentTimeline 商用仕上げ）。証跡: `docs/web-client/planning/phase2/logs/20251217T150614Z-document-timeline.md`。備考: 受付→診療→ORCA 3ステップ可視化、missingMaster 強調、nextAction 表示、仮想化/折りたたみ/表示件数コントロールを追加。
- 本更新 RUN_ID=`20251217T120220Z`（Charts 診療終了ガード・キュー再取得具体化）。証跡: `docs/web-client/planning/phase2/logs/20251217T120220Z-charts-encounter-state-ux.md`。備考: READY_TO_CLOSE を分離し、ORCA送信待ちのバックオフ（5s→15s→45s, max3）と disable 理由固定・info バナー告知を追加。
- 本更新 RUN_ID=`20251217T114331Z`（Charts 診療開始/終了の状態遷移）。証跡: `docs/web-client/planning/phase2/logs/20251217T114331Z-charts-encounter-state.md`。備考: 診療状態を OPEN/ DIRTY / QUEUE_PENDING / CLOSING / CLOSED / ABORTED に整理し、終了ガードと Timeline/Badge/Audit の一貫性を固定。
- 本更新 RUN_ID=`20251217T063116Z`（Charts ToneBanner/状態ピル一貫性）。証跡: `docs/web-client/planning/phase2/logs/20251217T063116Z-charts-tone-banner-pill.md`。備考: Reception と語彙・aria-live を統一し、ピル順序/tooltip/読み上げ抑制を定義。
- 本更新 RUN_ID=`20251217T060504Z`（Charts シェル UI 最終レイアウト確定）。証跡: `docs/web-client/planning/phase2/logs/20251217T060504Z-charts-shell-ui-layout.md`。備考: トップ/アクションバー固定、左30%/右70%基準、画面幅別挙動を定義。
- 本更新 RUN_ID=`20251214T132418Z`（module_json 型情報フォールバック）。証跡: `docs/web-client/planning/phase2/logs/20251214T132418Z-module-json-typeinfo-fallback.md`。  
- 本更新 RUN_ID=`20251214T140106Z`（module_json UI 保存・復元再確認＋負PKクリーニング/ガード方針）。証跡: `docs/web-client/planning/phase2/logs/20251214T140106Z-module-json-ui-save-rerun.md` / `docs/web-client/planning/phase2/logs/20251214T140106Z-module-json-ui-guard.md` / `docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-ui-save-rerun.md` / `docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-cleanup.md`。備考: 負の docPk (-41,-42,-43,-45,-46) を削除済み。  
- 本更新 RUN_ID=`20251214T091846Z`（module_json MSW OFF スモーク追加）。証跡: `docs/web-client/planning/phase2/logs/20251214T091846Z-msw-off-smoke.md`。  
- 本更新 RUN_ID=`20251214T084510Z`（module_json テスト/ビルド検証・smoke 試行）。証跡: `docs/web-client/planning/phase2/logs/20251214T084510Z-module-json-test-build.md` / `docs/server-modernization/phase2/operations/logs/20251214T084510Z-module-json-test-build.md`。
- 本更新 RUN_ID=`20251214T082236Z`（module_json 設計・手順書アップデート）。証跡: `docs/web-client/planning/phase2/logs/20251214T082236Z-module-json-docs.md` / `docs/server-modernization/phase2/operations/logs/20251214T082236Z-module-json-docs.md`。
- 本更新 RUN_ID=`20251214T031644Z`（ModuleJsonConverter 実装・polymorphic typing 設定）。証跡: `docs/web-client/planning/phase2/logs/20251214T031644Z-module-json-converter.md`。
- 過去更新 RUN_ID=`20251214T025057Z`（ModuleModel beanJson 並行保存・decode フォールバック対応）。証跡: `docs/server-modernization/phase2/operations/logs/20251214T025057Z-module-model-json.md`。

- 目的: docs/web-client 配下のアクティブ資料を棚卸しし、RUN_ID/証跡/責務を同期させる。参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル。
- 今回の整理でフル電子カルテ版の実装計画を再定義し、Legacy ログイン専用期の資料は Archive として分離した。
- Legacy (`client/`, `common/`, `ext_lib/`) は参照専用。接続検証や設定変更の対象は `server-modernized/` のみ。
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251214T022944Z-module-json-kickoff.md`（module_json ガント開始）、`docs/web-client/planning/phase2/logs/20251213T133932Z-charts-fetch-with-resolver.md`（fetch レイヤ統一）、`docs/web-client/planning/phase2/logs/20251213T000432Z-charts-session-permission-guard.md`（セッション/権限ガード整理）、`docs/web-client/planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md`（外来 API 契約）、`docs/web-client/planning/phase2/logs/20251212T140014Z-charts-page-gap.md`（ChartsPage 棚卸し）、`docs/web-client/planning/phase2/logs/20251212T131901Z-charts-outpatient-coverage.md`（カバレッジ定義）、`docs/web-client/planning/phase2/logs/20251212T130647Z-charts-production-outpatient-governance.md`（ガント起点）。

## Active ドキュメント（2025-12-14 現在）
| ドキュメント | スコープ | ステータス | 最終レビュー | 備考 / RUN_ID |
| --- | --- | --- | --- | --- |
| `docs/web-client/README.md` | Web クライアントハブ | Active | 2025-12-14 | RUN_ID=`20251214T082236Z`。module_json JSON 化手順への導線を追加し、参照チェーンを更新。 |
| `src/docs/modernization/設計と手順書アップデート.md` | module_json 設計/手順書更新タスク | Active | 2025-12-14 | RUN_ID=`20251214T082236Z`。server-modernized README/operations への JSON 化手順反映と証跡整理。証跡 `planning/phase2/logs/20251214T082236Z-module-json-docs.md`。 |
| `src/modernization/module_json/キックオフ_RUN_ID採番.md` | module_json ガント起点 | Active | 2025-12-14 | RUN_ID=`20251214T022944Z`。証跡 `docs/web-client/planning/phase2/logs/20251214T022944Z-module-json-kickoff.md`。 |
| `src/modernization/module_json/ModuleJsonConverter型情報フォールバック.md` | module_json: 型情報フォールバック | Active | 2025-12-14 | RUN_ID=`20251214T132418Z`。`@class` 無し beanJson を WARN なしで decode するフォールバック方針。証跡 `planning/phase2/logs/20251214T132418Z-module-json-typeinfo-fallback.md`。 |
| `src/modernization/module_json/UI保存復元確認.md` | module_json: UI 保存・復元 | Active | 2025-12-14 | RUN_ID=`20251214T140106Z`。add→update→GET を UI 経路で再実施し、docPk 正数化と beanJson 保存・復元（WARN 無）を確認。証跡 `planning/phase2/logs/20251214T140106Z-module-json-ui-save-rerun.md`。 |
| `src/modernization/module_json/テストとビルド検証.md` | module_json: テスト/ビルド/Smoke | Active | 2025-12-14 | RUN_ID=`20251214T084510Z`。単体テスト追加・Maven ビルド成功、DevTools hook 無効化を修正し smoke(msw ON) 1/1 pass。証跡 `docs/web-client/planning/phase2/logs/20251214T084510Z-module-json-test-build.md`。 |
| `src/modernization/module_json/MSW_OFF_smoke追加.md` | module_json: MSW OFF スモーク | Active | 2025-12-14 | RUN_ID=`20251214T091846Z`。MSW OFF で orca-master-bridge smoke 1/1 pass。証跡 `docs/web-client/planning/phase2/logs/20251214T091846Z-msw-off-smoke.md`。 |
| `src/modernization/module_json/ModuleJsonConverter実装.md` | module_json: Converter 実装 | Active | 2025-12-14 | RUN_ID=`20251214T031644Z`。beanJson 優先/beanBytes フォールバック方針と PTValidator 設定を明文化。証跡 `docs/web-client/planning/phase2/logs/20251214T031644Z-module-json-converter.md`。 |
| `src/modernization/module_json/Flywayスクリプト追加.md` | module_json Flyway 追加 | Active | 2025-12-14 | RUN_ID=`20251214T031229Z`（親 `20251214T022944Z`）。証跡 `docs/web-client/planning/phase2/logs/20251214T031229Z-module-json-flyway.md`。 |
| `src/modernization/module_json/KarteServiceBean組み込み.md` | module_json: KarteServiceBean 直列化/復元 | Active | 2025-12-14 | RUN_ID=`20251214T041935Z`（親 `20251214T022944Z`）。add/updateDocument 直列化・読込系復元を実装。証跡 `docs/web-client/planning/phase2/logs/20251214T041935Z-module-json-karte-service-bean.md`。 |
| `docs/web-client/planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` | 画面別実装計画 | Active | 2025-12-11 | 新設。画面/機能/ARIA/監査/テレメトリ/ロードマップを統合。 |
| `docs/web-client/planning/phase2/DOC_STATUS.md` | 棚卸し台帳 | Active | 2025-12-14 | 本ファイル。RUN_ID=`20251214T022944Z`。module_json ガント行を追加。 |
| `docs/web-client/architecture/future-web-client-design.md` | 画面配置・機能サマリ | Active | 2025-12-10 | RUN_ID=`20251210T141208Z`。計画書と整合。 |
| `docs/web-client/architecture/web-client-api-mapping.md` | 外来 API マッピング | Active | 2025-12-08 | RUN_ID=`20251208T124645Z`。OUTPATIENT_API_ENDPOINTS と同期。 |
| `docs/web-client/ux/reception-schedule-ui-policy.md` | Reception UX ポリシー | Active | 2025-12-12 | RUN_ID=`20251212T090000Z`（他の RUN_ID は本文記載）。 |
| `docs/web-client/ux/charts-claim-ui-policy.md` | Charts/Claim UX ポリシー | Active | 2025-12-02 | RUN_ID=`20251202T090000Z`。 |
| `docs/web-client/ux/patients-admin-ui-policy.md` | Patients+Administration UX | Active | 2025-12-02 | RUN_ID=`20251202T090000Z`。 |
| `docs/web-client/ux/config-toggle-design.md` / `ux/admin-delivery-validation.md` | 配信トグル/管理配信検証 | Active | 2025-12-02 | RUN_ID=`20251202T090000Z`。 |
| `docs/web-client/ux/playwright-scenarios.md` | E2E シナリオ草稿 | Active | 2025-12-02 | RUN_ID=`20251202T090000Z`。計画書のテスト章と連携。 |
| `docs/web-client/ux/ux-documentation-plan.md` | UX 文書進行ハブ | Active | 2025-12-02 | RUN_ID=`20251202T090000Z`。 |
| `docs/web-client/operations/debugging-outpatient-bugs.md` | 外来 API デバッグ記録 | Active | 2025-12-10 | RUN_ID=`20251210T054022Z`。Stage/Preview 再検証 pending。 |
| `docs/web-client/planning/phase2/logs/20251217T130407Z-orca-summary.md` | OrcaSummary 請求/予約 UX ログ | Active | 2025-12-17 | RUN_ID=`20251217T130407Z`。請求/予約サマリ粒度、`dataSourceTransition` 説明、`fallbackUsed` 強警告、予約/会計/再取得導線を整理。成果物 `src/charts_production_outpatient/ux/24_OrcaSummary_請求予約_商用レベル仕上げ.md`。 |
| `docs/web-client/planning/phase2/logs/20251217T120220Z-charts-encounter-state-ux.md` | Charts 診療終了ガード UX 具体化ログ | Active | 2025-12-17 | RUN_ID=`20251217T120220Z`。READY_TO_CLOSE 分離、ORCAキュー再取得バックオフ、終了 disable 理由固定を追加。成果物 `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md`。 |
| `docs/web-client/planning/phase2/logs/20251217T114331Z-charts-encounter-state.md` | Charts 診療開始/終了 状態遷移ログ | Active | 2025-12-17 | RUN_ID=`20251217T114331Z`。診療状態モデル（OPEN/ DIRTY / QUEUE_PENDING / CLOSING / CLOSED / ABORTED）と終了ガード・復元方針を整理。成果物 `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md`。 |
| `docs/web-client/planning/phase2/logs/20251217T060504Z-charts-shell-ui-layout.md` | Charts シェル UI 最終レイアウトログ | Active | 2025-12-17 | RUN_ID=`20251217T060504Z`。ヘッダー/アクションバー/左右ペインのレイアウト確定と幅別挙動を定義。 |
| `docs/web-client/planning/phase2/logs/20251214T140106Z-module-json-ui-save-rerun.md` | module_json UI 保存・復元ログ | Active | 2025-12-14 | RUN_ID=`20251214T140106Z`。UI 経路の add→update→GET で docPk=9024（正数）となり、beanJson 保存/復元に WARN 無し。サーバー側証跡 `docs/server-modernization/phase2/operations/logs/20251214T140106Z-module-json-ui-save-rerun.md`。 |
| `docs/web-client/planning/phase2/logs/20251214T084510Z-module-json-test-build.md` | module_json テスト/ビルド検証ログ | Active | 2025-12-14 | RUN_ID=`20251214T084510Z`。単体テスト追加・Maven コンパイル成功、perf-env-boot.js 修正後に msw smoke 1/1 pass。 |
| `docs/web-client/planning/phase2/logs/20251214T091846Z-msw-off-smoke.md` | module_json MSW OFF スモークログ | Active | 2025-12-14 | RUN_ID=`20251214T091846Z`。MSW OFF smoke 1/1 pass。beanJson は WAR 再ビルド＋opendolphin スキーマ整合後に `/karte/document` POST→GET→DB まで自動保存を確認（docPk=-45, bean_json NOT NULL）。HAR/trace/screenshot を同 RUN_ID で取得済み。 |
| `docs/web-client/planning/phase2/logs/20251214T132418Z-module-json-typeinfo-fallback.md` | module_json 型情報フォールバックログ | Active | 2025-12-14 | RUN_ID=`20251214T132418Z`。`@class` 無し beanJson を non-typed fallback で decode し WARN を抑止。回帰テストを追加し `mvn -pl common test` 成功。 |
| `docs/web-client/planning/phase2/logs/20251214T022944Z-module-json-kickoff.md` | module_json ガントキックオフ証跡 | Active | 2025-12-14 | RUN_ID=`20251214T022944Z`。参照チェーン再確認・Legacy 非改変の明文化。成果物 `src/modernization/module_json/キックオフ_RUN_ID採番.md`。 |
| `docs/web-client/planning/phase2/logs/20251211T172459Z-runid-governance.md` | RUN_ID 整備・参照チェーン確認ログ | Active | 2025-12-11 | RUN_ID=`20251211T172459Z`。本ガントの事前登録。 |
| `docs/web-client/planning/phase2/logs/20251211T120619Z-charts-timeline.md` | Charts データバインド実装ログ | Active | 2025-12-11 | RUN_ID=`20251211T120619Z`。DocumentTimeline/PatientsTab/OrcaSummary のデータバインドと tone 連動メモ。 |
| `docs/web-client/planning/phase2/logs/20251211T193942Z-administration-delivery.md` | Administration 配信/キュー実装ログ | Active | 2025-12-11 | RUN_ID=`20251211T193942Z`。設定配信フォーム・キュー再送/破棄・Reception/Charts 通知。 |
| `docs/web-client/planning/phase2/logs/20251211T193257Z-charts-action-bar.md` | Charts アクションバー警告・ロック実装ログ | Active | 2025-12-11 | RUN_ID=`20251211T193257Z`。missingMaster/fallbackUsed ガードと `charts_action` テレメトリ追記。 |
| `docs/web-client/planning/phase2/logs/20251212T054836Z-playwright-a11y.md` | Playwright E2E + A11y | Active | 2025-12-12 | RUN_ID=`20251212T054836Z`。Reception→Charts→Patients→Administration トーン/aria-live/telemetry 通し検証（MSW ON/OFF、HAR/trace/screenshot 取得）。 |
| `docs/web-client/planning/phase2/logs/20251212T060744Z-gantt-update.md` | ガント更新（Playwright/A11y残タスク整理） | Active | 2025-12-12 | RUN_ID=`20251212T060744Z`。webclient modernized gantt を最新進捗に反映し、残タスクを列挙。 |
| `docs/web-client/planning/phase2/logs/20251212T061538Z-gantt-update.md` | ガント更新（Patients/MSW 進捗反映） | Active | 2025-12-12 | RUN_ID=`20251212T061538Z`。Patients 編集タスクを in_progress(40%)、MSW シナリオを completed に更新。 |
| `docs/web-client/planning/phase2/logs/20251212T131901Z-charts-outpatient-coverage.md` | Charts 本番外来カバレッジ定義ログ | Active | 2025-12-12 | RUN_ID=`20251212T131901Z`。成果物 `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md` を作成。 |
| `docs/web-client/planning/phase2/logs/20251212T140014Z-charts-page-gap.md` | ChartsPage 要件突き合わせログ | Active | 2025-12-12 | RUN_ID=`20251212T140014Z`。計画書 2.4 と `features/charts/*` の差分を棚卸し。 |
| `docs/web-client/planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md` | Charts 外来 API 契約テーブル確定ログ | Active | 2025-12-12 | RUN_ID=`20251212T143720Z`。成果物 `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md` を作成。Patients/Charts からの `/api01rv2/patient/outpatient` 接続実装と MSW/Playwright 4 パターン追記。 |
| `docs/web-client/planning/phase2/logs/20251213T125127Z-charts-audit-event.md` | Charts 監査ログ統一ログ | Active | 2025-12-13 | RUN_ID=`20251213T125127Z`。auditEvent details 統一、主要操作の記録保証。成果物 `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`。 |
| `docs/web-client/planning/phase2/logs/20251213T000432Z-charts-session-permission-guard.md` | Charts セッション/権限ガード整理ログ | Active | 2025-12-13 | RUN_ID=`20251213T000432Z`。セッション切れ/施設不一致時の破棄・ログアウト誘導、権限別ガードと Topbar 表示要件を確定。成果物 `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`。 |
| `docs/web-client/planning/phase2/logs/20251217T125828Z-charts-error-handling.md` | Charts エラー/リトライ規約ログ | Active | 2025-12-17 | RUN_ID=`20251217T125828Z`。API 失敗時の tone/banner/再取得導線と missingMaster/fallback ブロック方針をアップデート。成果物 `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`。 |
| `docs/web-client/planning/phase2/logs/20251213T133932Z-charts-fetch-with-resolver.md` | Charts fetch レイヤ統一ログ | Active | 2025-12-13 | RUN_ID=`20251213T133932Z`。fetchWithResolver で外来 API メタを統一し、React Query cacheHit/refetch を UI・audit・telemetry と同期。成果物 `src/charts_production_outpatient/foundation/13_データ取得レイヤの統一_fetchWithResolver.md`。 |
| `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md` | Charts 本番外来カバレッジ定義 | Active | 2025-12-12 | RUN_ID=`20251212T131901Z`。DoD（監査/ARIA/運用）込みで外来 UI カバレッジを一覧化。 |
| `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md` | ChartsPage 棚卸し（計画→実装の差分） | Active | 2025-12-12 | RUN_ID=`20251212T140014Z`。P0/P1/P2 と入口/出口（Reception/Patients/Administration）責務分離案を確定。証跡: `docs/web-client/planning/phase2/logs/20251212T140014Z-charts-page-gap.md`。 |
| `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md` | Charts 外来 API 契約（監査/透過/再試行ルール） | Active | 2025-12-12 | RUN_ID=`20251212T143720Z`。Playwright/fixture の単一ソースとして API 契約を固定。証跡: `docs/web-client/planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md`。 |
| `src/charts_production_outpatient/integration/44_admin_config_deliveryフラグ同期.md` | Administration 配信フラグ同期 | Active | 2025-12-17 | RUN_ID=`20251217T233755Z`。Charts の表示/送信/masterSource を配信で切替し、適用（いつ/誰に/runId）を UI と監査ログで追跡。証跡: `docs/web-client/planning/phase2/logs/20251217T233755Z-admin-config-delivery-flags.md`。 |
| `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md` | Charts 診療開始/終了 状態モデル | Active | 2025-12-17 | RUN_ID=`20251217T120220Z`（親 `20251217T114331Z`）。READY_TO_CLOSE 追加、送信待ちバックオフと終了ガード理由固定、復元戦略を定義。 |
| `src/charts_production_outpatient/workflow/32_ドラフト保存と復元.md` | Charts ドラフト保存/復元 | Active | 2025-12-17 | RUN_ID=`20251217T212600Z`。受付ID/患者ID/診療日/runId/facilityId/userId でドラフト束縛、localStorage+React Query 二重保存、復元ダイアログと監査 `DRAFT_SAVE/RESTORE/DISCARD` を定義。証跡: `docs/web-client/planning/phase2/logs/20251217T212600Z-charts-draft-save.md`。 |
| `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md` | Charts シェル UI レイアウト確定 | Active | 2025-12-17 | RUN_ID=`20251217T060504Z`。ヘッダー/アクションバー/左右ペイン比率と画面幅別挙動、重要情報の常時視認配置を確定。 |
| `src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md` | Charts ToneBanner/状態ピル一貫性 | Active | 2025-12-17 | RUN_ID=`20251217T063116Z`。Reception と語彙/aria-live/ピル順序を統一し、読み上げ抑制と tooltip 方針を定義。証跡: `docs/web-client/planning/phase2/logs/20251217T063116Z-charts-tone-banner-pill.md`。 |
| `src/charts_production_outpatient/ux/24_OrcaSummary_請求予約_商用レベル仕上げ.md` | OrcaSummary 請求/予約サマリ商用仕上げ | Active | 2025-12-17 | RUN_ID=`20251217T130407Z`。請求/予約の表示粒度、`dataSourceTransition` 説明、`fallbackUsed=true` 強警告、予約/会計/再取得導線を定義。証跡: `docs/web-client/planning/phase2/logs/20251217T130407Z-orca-summary.md`。 |
| `src/charts_production_outpatient/quality/51_アクセシビリティ自動検査と手動監査.md` | Charts アクセシビリティ監査 | Active | 2025-12-17 | RUN_ID=`20251217T212939Z`。axe 重大違反 0、ActionBar フォーカス順と操作不能理由読み上げをテスト化。Playwright `/charts` ページ a11y スキャン追加（color-contrast/aria-allowed-role/aria-required-children/label 除外）。証跡: `docs/web-client/planning/phase2/logs/20251217T212939Z-charts-a11y.md`。 |
| `src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md` | Charts 監査ログ統一方針 | Active | 2025-12-13 | RUN_ID=`20251213T125127Z`。重要操作の監査記録保証と details 透過ルールを整理。証跡: `docs/web-client/planning/phase2/logs/20251213T125127Z-charts-audit-event.md`。 |
| `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md` | Charts セッション/権限ガード方針 | Active | 2025-12-13 | RUN_ID=`20251213T000432Z`。主要アクションの権限ガード、セッション無効時の破棄/誘導、Topbar/ヘッダーの監査表示を固定。証跡: `docs/web-client/planning/phase2/logs/20251213T000432Z-charts-session-permission-guard.md`。 |
| `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md` | Charts エラー/リトライ規約 | Active | 2025-12-17 | RUN_ID=`20251217T125828Z`。API 失敗の tone/aria-live/再取得導線と missingMaster/fallback ブロック運用を更新。証跡: `docs/web-client/planning/phase2/logs/20251217T125828Z-charts-error-handling.md`。 |
| `src/charts_production_outpatient/foundation/13_データ取得レイヤの統一_fetchWithResolver.md` | Charts fetch レイヤ統一 | Active | 2025-12-13 | RUN_ID=`20251213T133932Z`。fetchWithResolver で外来 API 呼び出しと meta 透過を統一し、React Query cacheHit/refetch を UI/audit/telemetry と同期。証跡: `docs/web-client/planning/phase2/logs/20251213T133932Z-charts-fetch-with-resolver.md`。 |
| `src/charts_production_outpatient/foundation/14_パフォーマンス予算と計測導入.md` | Charts パフォーマンス予算・計測導入 | Active | 2025-12-17 | RUN_ID=`20251217T060433Z`。初回/患者切替/再取得の P95 予算、警告/違反ライン、スケルトン統一、telemetry/audit 連携を定義。証跡: `docs/web-client/planning/phase2/logs/20251217T060433Z-charts-performance-budget.md`。 |
| `docs/web-client/planning/phase2/logs/20251212T130647Z-charts-production-outpatient-governance.md` | Charts Production（外来）ガント開始ログ | Active | 2025-12-12 | RUN_ID=`20251212T130647Z`。ガント起点 `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` を作成し、参照チェーン/DOC_STATUS/README を同期。 |
| `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md` | Charts Production（外来）ガント起点 | Active | 2025-12-12 | RUN_ID=`20251212T130647Z`。参照チェーンと起動前提（`WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`）を明記。 |

## Legacy / Archive
- ログイン専用期（RUN_ID=`20251130T120000Z` 〜 `20251203T203000Z`）の資料は Archive。代表例:
  - `planning/phase2/LOGIN_REWORK_PLAN.md`
  - `planning/phase2/LEGACY_ARCHIVE_SUMMARY.md`
  - `planning/phase2/logs/20251130T120000Z-login-rework.md`
  - `planning/phase2/screens/*` および `src/webclient_screens_plan/*`
- 詳細な旧ステータス表は Git 履歴と `docs/archive/2025Q4/web-client/legacy-archive.md` を参照。
- ロールオフ手順と証跡: `docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md` / `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md`。

## 運用ルール
1. 新規資料は RUN_ID を必ず付与し、備考に証跡ログパスを記載して README の Active リストへリンクする。
2. Stage/Preview での実 API 検証は `planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md` に従い、`docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に接続ログを保存する。
3. Archive へ移す際は `docs/archive/<YYYYQn>/` に格納し、本文に移動理由と RUN_ID を明記する。
