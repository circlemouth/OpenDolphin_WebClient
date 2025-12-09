# Web クライアント ドキュメントハブ（ログイン専用版）
> **Phase2 は Legacy 参照専用／現行スコープはログインのみ**（RUN_ID=`20251203T203000Z`）。ロールオフ手順: `docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md`。証跡ログ: `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md`

## 概要
- 本リポジトリ配下で唯一稼働する Web クライアントはログイン画面のみとなっており、`src/LoginScreen.tsx` で既存 API を直接呼び出す形に再構成されています。
- そのため docs/web-client 以下も最小セットに集約し、不要な機能仕様や UX 施策は削除しました。
- ドキュメント更新時は `AGENTS.md` が示す Phase2 ガバナンス必読チェーン（`AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → マネージャーチェックリスト）を踏襲し、RUN_ID／証跡／DOC_STATUS を同一値で併記してください。
- RUN_ID=`20251206T144901Z` でログイン後に Reception / Charts / Outpatient mock へ遷移できる UI シェル（デモ用ナビゲーション）を追加。API スコープは従来どおりログインのみで、接続シェルが RUN_ID を受け継いで tone/banner を確認できる構成。
- RUN_ID=`20251202T083708Z` で画面別 API マッピングとバージョン整合メモ（`src/webclient_screens_plan/02_画面別 API マッピングとバージョン整合.md`）を更新し、証跡ログ `docs/server-modernization/phase2/operations/logs/20251202T083708Z-api-mapping.md` を連携。orca05 hash/diff 再取得済み（同 RUN_ID）。これらの更新は DOC_STATUS / manager checklist と同期。
- RUN_ID=`20251201T053420Z` で参照チェーン棚卸しを実施済み。証跡: `docs/server-modernization/phase2/operations/logs/20251201T053420Z-run-id-chain.md`（DOC_STATUS/manager checklist と同期）。
- RUN_ID=`20251202T090000Z` で受付/カルテ/管理の screens 棚卸しを開始。証跡: `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`（DOC_STATUS/manager checklist と連動）。
- RUN_ID=`20251202T090000Z` の棚卸し内容を UX 草稿（`docs/web-client/ux/` 配下）へ移植し、Reception/Charts/Patients+Administration のユースケース・API・遷移・認証前提を整理（証跡ログと同 RUN_ID を保持）。
- RUN_ID=`20251202T090000Z` で UX 草稿に検証観点・未決事項メモを追記し、DOC_STATUS と manager checklist・証跡ログの RUN_ID を同期済み。
- RUN_ID=`20251202T090000Z` で UX 草稿に Playwright シナリオ案／配信タイミング検証計画を追記し、DOC_STATUS と manager checklist・証跡ログへ反映済み。
- RUN_ID=`20251202T090000Z` で UX 草稿に Playwright 実装準備メモ／配信観測計画詳細化を追記し、DOC_STATUS・manager checklist・証跡ログと再同期。
- RUN_ID=`20251202T090000Z` で UX 草稿に Playwright ヘルパー試作案／フラグ設計メモを追加し、DOC_STATUS・manager checklist・証跡ログで整合。
- RUN_ID=`20251202T090000Z` で UX 草稿に Playwright ヘルパー実装着手／フィクスチャ計画追記を行い、DOC_STATUS・manager checklist・証跡ログと再同期。
- RUN_ID=`20251202T090000Z` で UX 草稿に Playwright 設定フラグ／未実装ヘルパー実装完了を追記し、DOC_STATUS・manager checklist・証跡ログと再同期。
- RUN_ID=`20251202T090000Z` で UX 草稿にヘッダー切替案・ヘルパー通し検証準備を追記し、DOC_STATUS・manager checklist・証跡ログと再同期。
- RUN_ID=`20251202T090000Z` で A/B: 管理配信検証計画と ORCA キュー/配信フラグ設計（`docs/web-client/ux/admin-delivery-validation.md`, `docs/web-client/ux/config-toggle-design.md`）および Playwright シナリオ叩き台（`docs/web-client/ux/playwright-scenarios.md`）を追加し、DOC_STATUS / manager checklist / 証跡ログと RUN_ID を再同期。
- RUN_ID=`20251202T090000Z` で A/B のヘッダー付与検証・モック ON/OFF チェックリストと Playwright 前提フラグ（`VITE_USE_MOCK_ORCA_QUEUE` / `VITE_VERIFY_ADMIN_DELIVERY`）を明記し、README / DOC_STATUS / manager checklist / 証跡ログで整合を再掲。
- RUN_ID=`20251202T090000Z` の A/B 実行結果（ヘッダー付与レスポンス差分とモック ON/OFF 切替確認）を Playwright シナリオ草稿へ反映し、README / DOC_STATUS / manager checklist / 証跡ログに結果リンクを再掲。
- RUN_ID=`20251202T090000Z` の A/B/C 実行結果として Playwright テスト追加・モック分岐強化・監査ログ正規化を反映し、README / DOC_STATUS / manager checklist / 証跡ログで RUN_ID 整合を再掲。
- RUN_ID=`20251202T090000Z` で Reception/Charts の ORCA エラー・未紐付・送信キュー遅延バナーの tone/`aria-live`/carry over ルールを統一し、自動/手動更新・ステータス遷移・ロール別可否・監査ログの扱いを `docs/web-client/ux/reception-schedule-ui-policy.md` / `docs/web-client/ux/charts-claim-ui-policy.md` に追記。Playwright シナリオへモック ON/OFF（`VITE_USE_MOCK_ORCA_QUEUE`/`VITE_VERIFY_ADMIN_DELIVERY`）でのバナー検証と診療終了解除パスを追加。
- RUN_ID=`20251202T090000Z` で Patients→Reception の戻り導線（フィルタ/保険モード保持・権限ガード）、Administration 配信遅延の警告/リトライ導線、モック ON/OFF のレスポンス差分・監査ログ項目・ヘッダー有無を `docs/web-client/ux/patients-admin-ui-policy.md` / `docs/web-client/ux/admin-delivery-validation.md` / `docs/web-client/ux/config-toggle-design.md` に追記し、証跡ログと同期。
- RUN_ID=`20251203T143858Z` で reception/patients-admin/charts の外来 UX ポリシーを再調査し、tone/レイアウト/ARIA/監査要件を `docs/web-client/ux/ux-documentation-plan.md` に追記。証跡ログ `docs/server-modernization/phase2/operations/logs/20251203T143858Z-outpatient-ux.md` と `artifacts/webclient/ux-notes/20251203T143858Z-ux-review.md` を DOC_STATUS/README に反映。

## 現在のドキュメント一覧（Active）
- `docs/web-client/README.md`（本ファイル）—ログイン画面再構成のハブ。RUN_ID=`20251130T120000Z`。
- `docs/web-client/planning/phase2/DOC_STATUS.md` — doc の棚卸し台帳。RUN_ID=`20251130T120000Z` で更新済。
- `docs/web-client/planning/phase2/LOGIN_REWORK_PLAN.md` — ログイン再構成に伴う実装計画と次アクション。
- `docs/web-client/planning/phase2/LEGACY_ARCHIVE_SUMMARY.md` — ログイン専用化の経緯と legacy 資料のアーカイブ指針。
- `docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md` — 受付状況処理画面の空枠設計ドラフト。
- `docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md` — カルテ記入画面の空枠設計ドラフト。
- `docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md` — カルテ全般管理画面の空枠設計ドラフト。
- `src/webclient_screens_plan/02_画面別 API マッピングとバージョン整合.md` — Reception/Charts/Patients/Administration の API 差分・バージョン整合メモ。RUN_ID=`20251202T083708Z`。証跡: `docs/server-modernization/phase2/operations/logs/20251202T083708Z-api-mapping.md`。
- `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md` — 本対応の証跡ログ。README／DOC_STATUS に書かれた RUN_ID と同一。
- `docs/web-client/ux/ux-documentation-plan.md` — UX ドラフトの進行管理ハブ。RUN_ID=`20251202T090000Z`。
- `docs/web-client/architecture/web-client-api-mapping.md` — API 統合設計の一覧と `resolveMasterSource`/監査 metadata 図。RUN_ID=`20251204T120000Z`。証跡: `docs/server-modernization/phase2/operations/logs/20251204T120000Z-integration-design.md`・`artifacts/webclient/ux-notes/20251204T120000Z-integration-design.md`。
- `docs/web-client/ux/reception-schedule-ui-policy.md` — Reception（受付）UX ポリシー草稿。RUN_ID=`20251202T090000Z`（`docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`）／RUN_ID=`20251204T230000Z`（`docs/server-modernization/phase2/operations/logs/20251204T230000Z-reception-ux.md` + `artifacts/webclient/ux-notes/20251204T230000Z-reception-ux-implementation.md` + スクショ）／RUN_ID=`20251212T090000Z`（`docs/server-modernization/phase2/operations/logs/20251212T090000Z-reception-ux.md` + `artifacts/webclient/ux-notes/20251212T090000Z-reception-ux.md` + スクショ）／RUN_ID=`20251205T062049Z`（`docs/server-modernization/phase2/operations/logs/20251205T062049Z-reception-ux.md` + `artifacts/webclient/ux-notes/20251205T062049Z-reception-ux-implementation.md`/`artifacts/webclient/ux-notes/20251205T062049Z-reception-ux-implementation.png` で Step 1/2 + missingMaster note + status-badge style共有）ので README/DOC_STATUS で RUN_ID を共有。
- `docs/web-client/ux/charts-claim-ui-policy.md` — Chart Entry/Claim UX ポリシー草稿。RUN_ID=`20251202T090000Z`。
- `docs/web-client/ux/patients-admin-ui-policy.md` — Patients 管理＋Administration UX ポリシー草稿。RUN_ID=`20251202T090000Z`。
- `docs/web-client/operations/debugging-outpatient-bugs.md` — 外来 API バグ/差分デバッグ記録と再現手順（RUN_ID=`20251209T094600Z`, parent=`20251209T150000Z`）。証跡: `docs/server-modernization/phase2/operations/logs/20251209T094600Z-debug.md` / `artifacts/webclient/debug/20251209T094600Z-bugs/`（04C5 ローカル 200 / Stage・Preview TCP timeout を継承）。

## 運用方針
1. 本 README 以外の Web クライアント固有ドキュメントを新設する場合、Phase2 DOC_STATUS のコメント欄に RUN_ID・証跡パスを記載し、README にリンクを追加してください。
2. ログイン以外の画面や機能の追加は当面予定にないため、再開時には必ず `planning/phase2/LOGIN_REWORK_PLAN.md` をもとに Scope を再評価してください。
3. 設計証跡や検証ログを残す際は、`docs/web-client/planning/phase2/logs/` 配下に RUN_ID ベースの Markdown を作成し、DOC_STATUS の備考欄にリンクを添えてください。
4. README／DOC_STATUS／新規ドキュメントで RUN_ID を共有していない構成や資料は即時 Archive に移行し、必要なら `docs/archive/<YYYYQn>/` に保存してください。

## ORCA 接続の現行方針
- ORCA 接続は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を唯一の現行ルールとして参照し、mac-dev ログイン手順は既存ログ（例: `docs/server-modernization/phase2/operations/logs/20251203T134014Z-orcacertification-only.md`）を残して Archive 扱いとする。
- `ORCAcertification/` 配下の正式証明書・資格情報を安全に使用し、Web クライアント／Playwright 側の検証では `VITE_DISABLE_MSW` や `VITE_DEV_PROXY_TARGET` の指示に従って ORCAcertification サーバーへ接続する。
- ORCA 連携関連の DOC_STATUS、manager checklist、ORCA_API_STATUS などは本セクションの RUN_ID でリンクを張り、新しい接続方針が常に参照できるようにしてください。

## 参照チェーン
- `AGENTS.md`（最上位ガバナンス）
- `docs/web-client/README.md`（本ファイル）
- `docs/server-modernization/phase2/INDEX.md`（サーバーモダナイズ連携）
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` など各マネージャーチェックリスト

## Legacy 参照
- `docs/archive/2025Q4/web-client/legacy-archive.md` に旧ドキュメント一覧と削除時の背景をまとめています。必要な内容は Git 履歴（`git log -- docs/web-client/...`）から復元し、再利用する場合は README/DOC_STATUS/LOGIN_REWORK_PLAN/LEGACY_ARCHIVE_SUMMARY の順で RUN_ID を共有してください。

本 README を含むすべての更新には RUN_ID を併記してください。ログイン再構成は `RUN_ID=20251130T120000Z`（証跡: `docs/web-client/planning/phase2/logs/20251130T120000Z-login-rework.md`）、UX 草稿更新は `RUN_ID=20251202T090000Z`（証跡: `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md`）を基準とします。
