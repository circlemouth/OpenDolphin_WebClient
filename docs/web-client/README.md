# Web クライアント開発ドキュメントハブ

Web クライアントに関する設計・要件・運用資料を集約したナビゲーションです。まずは本ファイルから各カテゴリへ移動し、更新時は必ず該当セクションへリンクと概要を追記してください。

## カテゴリ構成

### 1. アーキテクチャ / 要件
- [`architecture/REPOSITORY_OVERVIEW.md`](architecture/REPOSITORY_OVERVIEW.md): リポジトリ構成と各モジュールの役割。
- [`architecture/WEB_CLIENT_REQUIREMENTS.md`](architecture/WEB_CLIENT_REQUIREMENTS.md): 機能・非機能・セキュリティ要件。
- [`architecture/REST_API_INVENTORY.md`](architecture/REST_API_INVENTORY.md): Web クライアントが利用する REST API 一覧と留意点。
- [`architecture/SERVER_MODERNIZATION_PLAN.md`](architecture/SERVER_MODERNIZATION_PLAN.md): 既存サーバー刷新・連携の将来計画。

### 2. プロセス / 計画
- [`process/ROADMAP.md`](process/ROADMAP.md): フェーズ 0〜2 の成果と次アクションを統合したロードマップ。
- [`process/SWING_PARITY_CHECKLIST.md`](process/SWING_PARITY_CHECKLIST.md): Web とオンプレ（Swing）機能差分の確認チェックリスト。
- [`process/API_UI_GAP_ANALYSIS.md`](process/API_UI_GAP_ANALYSIS.md): 未整備 API と UI の対応状況・実装優先度。
- [`process/SECURITY_AND_QUALITY_IMPROVEMENTS.md`](process/SECURITY_AND_QUALITY_IMPROVEMENTS.md): セキュリティ/品質改善タスクのサマリと監査ポリシー。

### 3. 臨床・機能ガイド
- [`guides/CLINICAL_MODULES.md`](guides/CLINICAL_MODULES.md): 患者管理、受付・予約、カルテ補助、ORCA 連携、帳票/シェーマ機能の統合ガイド。
- `features/` 配下: CareMap、受付予約、スタンプライブラリ、ラボ結果、ORCA 連携など機能別仕様書。
- `process/`・`architecture/` 補遺: API・データ要件、モダナイゼーション計画の補足資料。

### 4. UX / デザインシステム
- [`design-system/ALPHA_COMPONENTS.md`](design-system/ALPHA_COMPONENTS.md): デザインシステム α 版と Storybook 運用指針。
- [`ux/ONE_SCREEN_LAYOUT_GUIDE.md`](ux/ONE_SCREEN_LAYOUT_GUIDE.md): 1 画面完結のレイアウト指針と業務要件メモ。
- [`ux/CHART_UI_GUIDE_INDEX.md`](ux/CHART_UI_GUIDE_INDEX.md): カルテ UI 関連資料の集約。改修前に必ず参照すること。
- [`ux/KARTE_SCREEN_IMPLEMENTATION.md`](ux/KARTE_SCREEN_IMPLEMENTATION.md): 最新カルテ画面の構造・ショートカット・レスポンシブ仕様。

### 5. 運用・オペレーション
- [`operations/RECEPTION_WEB_CLIENT_MANUAL.md`](operations/RECEPTION_WEB_CLIENT_MANUAL.md): 受付担当者向け研修計画と運用手順。
- [`operations/LOCAL_BACKEND_DOCKER.md`](operations/LOCAL_BACKEND_DOCKER.md): 既存サーバーを Docker Compose で起動する手順。
- [`operations/CAREMAP_ATTACHMENT_MIGRATION.md`](operations/CAREMAP_ATTACHMENT_MIGRATION.md): CareMap 添付移行と image-browser 設定のガイド。
- [`operations/TEST_SERVER_DEPLOY.md`](operations/TEST_SERVER_DEPLOY.md): テスト環境へのデプロイとアカウント発行手順。

## 開発者の入り口
1. `architecture/REPOSITORY_OVERVIEW.md` でシステム全体像と制約を把握する。
2. `architecture/WEB_CLIENT_REQUIREMENTS.md` と `process/ROADMAP.md` を読み、対象スコープと品質要件を確認する。
3. 実装タスクは `process/` 配下の計画ドキュメント（フェーズ別ロードマップ/差分チェックリスト/API ギャップ分析）に従って進める。
4. UI/UX 検討時は `ux/` ディレクトリ、機能仕様は `features/`・`guides/` を参照し、更新時は本 README にも反映する。

## ドキュメント更新ルール
- ドキュメントを追加・改訂した際は変更内容と日付を該当ファイルに記載し、本ハブへリンクを追記する。
- セキュリティや監査に影響する変更は必ず `process/SECURITY_AND_QUALITY_IMPROVEMENTS.md` へ反映し、レビューを経てから適用する。
- 参考資料（PDF / 画像など）は `docs/` 配下の適切なカテゴリに格納し、必ず本ファイルから辿れるようにする。

## 直近更新履歴
- 2025-11-01: 左レールに ProblemListCard / SafetySummaryCard を追加し、診断リストと安全サマリ（アレルギー/既往/内服）のガイドを `ux/ONE_SCREEN_LAYOUT_GUIDE.md` / `ux/KARTE_SCREEN_IMPLEMENTATION.md` / `ux/CHART_UI_GUIDE_INDEX.md` に反映。
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
