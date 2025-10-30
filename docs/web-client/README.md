# Web クライアント開発ドキュメントハブ

Web クライアント構想に必要なドキュメントをカテゴリ別にまとめたナビゲーションです。各フォルダは `docs/web-client/` 配下に整理されています。

## ストラクチャ概要
- `overview/AGENT_OVERVIEW.md` – リポジトリ構成と既存サーバーの要点。
- `requirements/WEB_CLIENT_REQUIREMENTS.md` – 機能・非機能要件。
- `planning/WEB_CLIENT_WORK_PLAN.md` – 実装計画とマイルストーン。
- `planning/phase0/PHASE0_DELIVERABLES.md` – フェーズ0の進捗サマリと意思決定ログ。
- `planning/phase0/API_INVENTORY.md` – REST エンドポイント一覧と利用方針。
- `planning/phase1/PHASE1_FOUNDATION.md` – フェーズ1 技術基盤メモとチェックリスト。
- `planning/phase2/PHASE2_PROGRESS.md` – フェーズ2 コア診療フロー前半の実装メモとリスク/次ステップ整理。
- `planning/UNIMPLEMENTED_API_UI_PLACEMENT.md` – 未整備 API に対応する UI の配置計画とフェーズ別実装方針。
- `planning/WEB_VS_ONPRE_CHECKLIST.md` – Web とオンプレクライアントの機能差分チェックリストとフォローアップタスク。
- `features/PHASE3_STAMP_AND_ORCA.md` – フェーズ3 スタンプ/ORCA 連携仕様と運用メモ。
- `features/PHASE4_SECURITY_AND_QUALITY.md` – フェーズ4 品質・安全性強化タスクの実装概要と運用注意点。
- `features/ORDER_ENTRY_DATA_GUIDE.md` – すべてのオーダカテゴリ（処方・注射・手術・検査など）を登録する際に必須となるサーバー側データ要件まとめ。
- `features/RECEPTION_SCHEDULE_AND_SUMMARY.md` – 受付予約管理と FreeDocument 連携の仕様・運用メモ。
- `features/FACILITY_SCHEDULE_VIEW.md` – 施設全体の予約一覧（PatientSchedule Web 版）の仕様と運用注意点。
- `features/LAB_RESULTS_VIEWER.md` – ラボ検査履歴ビューアの仕様と API 利用方針。
- `features/CARE_MAP_TIMELINE.md` – CareMap カレンダーの仕様とデータ連携。
- `features/MEDICAL_CERTIFICATES_AND_SCHEMA.md` – 診断書エディタとシェーマエディタの仕様・運用メモ。
- `design-system/ALPHA_COMPONENTS.md` – デザインシステム α 版の Storybook 運用とコンポーネント一覧。
- `operations/TEST_SERVER_DEPLOY.md` – テスト環境向けサーバーデプロイとアカウント登録手順。
- `operations/RECEPTION_WEB_CLIENT_MANUAL.md` – 受付担当者向け Web クライアント運用マニュアルと研修計画。
- `operations/LOCAL_BACKEND_DOCKER.md` – Docker Compose を用いた既存サーバーのローカル起動手順。
- `ux/ONE_SCREEN_LAYOUT_GUIDE.md` – 1画面完結レイアウトの設計指針。
- `ux/ONE_SCREEN_LAYOUT_GUIDE.md` Appendix – 既存カルテ画面から抽出した業務要件メモ。
- `ux/KARTE_SCREEN_IMPLEMENTATION.md` – 最新カルテ画面 UI 実装の構造・ショートカット・レスポンシブ整理。
- 参考資料（PDF, 画像等）は `docs/` 配下の各カテゴリに再配置し、本ハブからリンク。

## 開発者の入り口
1. `overview/AGENT_OVERVIEW.md` でシステム全体像と制約を理解する。
2. `requirements/WEB_CLIENT_REQUIREMENTS.md` をレビューしてスコープ・品質要件を把握する。
3. `planning/WEB_CLIENT_WORK_PLAN.md` のフェーズ計画に沿ってタスクを進行する。
4. UI/UX 検討時は `ux/` 内ドキュメント（特に Appendix）と設計検討メモを参照する。

## サーバー連携とセキュリティの要点
- WildFly 上の既存 WAR を改変せず、REST API (`/patient`, `/karte`, `/orca` 等) を活用する。
- 認証ヘッダ: `userName`, `password(MD5)`, `clientUUID` をすべてのリクエストに付与する。
- `/chartEvent/subscribe` を用いた長輪講で排他制御とリアルタイム更新を実現する。
- 自費カルテは `DocInfoModel.healthInsurance` と `DocInfoModel.isSendClaim` を適切に設定し、CLAIM 送信を制御する。

## 運用ガイドライン
- ドキュメント更新時は内容と日付を記録し、本ハブの該当セクションへリンクを追加する。
- 新規資料を追加した場合は `README.md`（本ファイル）にカテゴリと保存場所を明記する。
- セキュリティ関連の変更は必ずレビューを経て、関連ドキュメントへ反映する。

## 今後の拡張候補
- 認証トークン方式や SSE/WebSocket 化の検討結果は `planning/` 直下の補遺として追加予定。
- PDF/帳票のブラウザネイティブ化検討、法令変更キャッチアップ資料を新規カテゴリとして拡張する。

## 直近更新
- 2026-05-24: 未整備 API 対応 UI の配置計画を `planning/UNIMPLEMENTED_API_UI_PLACEMENT.md` として追加し、フェーズ5 以降の実装方針を整理。
- 2026-05-23: `planning/WEB_VS_ONPRE_CHECKLIST.md` に REST API 実装比較セクションを追記し、オンプレ版との API 差分を一覧化。
- 2026-05-22: CareMap に添付ファイル統合とプレビュー機能を追加。`features/CARE_MAP_TIMELINE.md`、`planning/WEB_VS_ONPRE_CHECKLIST.md` を更新し、
  `operations/CAREMAP_ATTACHMENT_MIGRATION.md` を新設して image-browser 設定の移行手順と Web 版での確認ポイントを整理。
- 2026-05-13: CareMap（治療履歴カレンダー）を追加。`features/CARE_MAP_TIMELINE.md` を新設し、`features/charts/components/CareMapPanel.tsx`、
  `planning/WEB_VS_ONPRE_CHECKLIST.md`、`ux/KARTE_SCREEN_IMPLEMENTATION.md` に仕様を反映。
- 2026-05-20: 診断書エディタとシェーマエディタを Supplement パネルへ追加。`features/MEDICAL_CERTIFICATES_AND_SCHEMA.md` を新設し、`planning/WEB_VS_ONPRE_CHECKLIST.md`、`operations/RECEPTION_WEB_CLIENT_MANUAL.md` を更新して研修フローと移行注意点を反映。
- 2026-05-12: 施設予約一覧ページとラボ検査履歴ビューアを追加。`features/FACILITY_SCHEDULE_VIEW.md`、`features/LAB_RESULTS_VIEWER.md`、`operations/RECEPTION_WEB_CLIENT_MANUAL.md`、`planning/WEB_VS_ONPRE_CHECKLIST.md` を更新し、オンプレとの機能差分を解消。
- 2026-05-08: オーダセット共有/インポート機能と予約リマインダー送信フローを追加。`features/PHASE3_STAMP_AND_ORCA.md`、`features/RECEPTION_SCHEDULE_AND_SUMMARY.md`、`operations/RECEPTION_WEB_CLIENT_MANUAL.md`、`planning/WEB_VS_ONPRE_CHECKLIST.md` を更新し、共有手順・リマインダー運用・研修計画を反映。
- 2026-05-05: 患者メモ履歴ダイアログを追加し、右ペインから保存済みメモのプレビューと復元が可能に。`ux/KARTE_SCREEN_IMPLEMENTATION.md`、`features/PATIENT_MANAGEMENT_GUIDE.md`、`planning/WEB_VS_ONPRE_CHECKLIST.md` を更新して監査ログや運用手順を反映。
- 2026-05-03: `PatientsPage` に患者情報編集フォームを追加し、`/patient` POST/PUT と健康保険管理の Web 実装を完了。`features/PATIENT_MANAGEMENT_GUIDE.md` を新設し、`planning/WEB_VS_ONPRE_CHECKLIST.md` と `planning/phase0/API_INVENTORY.md` を更新。
- 2026-05-02: 受付予約管理で保存中の操作ガードを追加。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` に予約保存中のボタン無効化仕様を追記し、二重操作防止策と運用上の注意を明文化。
- 2026-05-01: 受付予約管理（`AppointmentManager`）と FreeDocument 編集 UI を追加。`features/RECEPTION_SCHEDULE_AND_SUMMARY.md` と `planning/WEB_VS_ONPRE_CHECKLIST.md` を更新し、Swing 版とのデータ整合と運用手順を整理。
- 2026-04-25: カルテ右ペインに問診メモ／患者メモ編集カードと `/karte/memo` 連携を追加。`ux/KARTE_SCREEN_IMPLEMENTATION.md` と `planning/WEB_VS_ONPRE_CHECKLIST.md` を更新し、オンプレ MemoInspector 相当の編集フローを Web に反映。
- 2026-04-23: 受付患者一覧に呼出トグルとインラインメモ編集を追加。`ux/KARTE_SCREEN_IMPLEMENTATION.md` と `planning/WEB_VS_ONPRE_CHECKLIST.md` を更新し、オンプレ版と同等の受付操作を Web でも提供。
- 2026-04-21: Web／オンプレ機能差分チェックリストを追加。`planning/WEB_VS_ONPRE_CHECKLIST.md` を新設し、今後の追従タスクを整理。
- 2026-04-20: カルテ入力 (`/charts/:visitId`) と受付一覧 (`/reception`) を分離し、受付→カルテ遷移導線と空状態ガイダンスを整理。`ux/KARTE_SCREEN_IMPLEMENTATION.md` を更新。
- 2026-04-17: カルテ画面 UI をフルレイアウト化。`ux/KARTE_SCREEN_IMPLEMENTATION.md` を新設し、`features/charts/pages/ChartsPage.tsx` の刷新内容とショートカット/レスポンシブ仕様を整理。
- 2026-03-30: フェーズ4 セキュリティ/性能/負荷対策を実装。`features/PHASE4_SECURITY_AND_QUALITY.md` を新設し、`planning/WEB_CLIENT_WORK_PLAN.md` のフェーズ4タスクを完了として更新。
- 2026-02-20: フェーズ3 前半のスタンプライブラリ・ORCA 連携 UI を実装。`features/PHASE3_STAMP_AND_ORCA.md` を新設し、`planning/WEB_CLIENT_WORK_PLAN.md` のタスクステータスを更新。
- 2026-02-14: フェーズ2 カルテ編集機能を実装。`features/charts` に診察開始/終了、SOAP 保存、長輪講同期を追加し、`planning/phase2/PHASE2_PROGRESS.md` を更新。
- 2026-01-15: フェーズ2 前半の進捗を `planning/phase2/PHASE2_PROGRESS.md` に整理。患者検索 UI / カルテ履歴 β 実装と既存ユーザー影響メモを追加。
- 2025-11-05: 認証ラッパーのセキュリティレビュー完了を追記し、`planning/phase1/PHASE1_SECURITY_REVIEW.md` を新設。フェーズ1完了条件を更新。
- 2025-11-04: フェーズ1成果物として認証 SDK/HTTP クライアント/Storybook を整備し、`design-system/ALPHA_COMPONENTS.md` を新設。`planning/phase1/PHASE1_FOUNDATION.md` と `planning/WEB_CLIENT_WORK_PLAN.md` のステータスを更新。
- 2025-10-30: Docker Compose による既存サーバー起動手順を整備し、Web クライアントは Vite プロキシと `.env.local` を追加してローカル検証を簡素化。
- 2025-10-29: `planning/phase0/PHASE0_DELIVERABLES.md`, `planning/phase0/API_INVENTORY.md` を追加し、フェーズ0タスクの進捗と REST API 利用方針を整理。
- 2025-10-29: `planning/phase1/PHASE1_FOUNDATION.md` を追加し、web-client プロジェクト初期セットアップと採用スタックを記録。
