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
- `features/PHASE3_STAMP_AND_ORCA.md` – フェーズ3 スタンプ/ORCA 連携仕様と運用メモ。
- `features/PHASE4_SECURITY_AND_QUALITY.md` – フェーズ4 品質・安全性強化タスクの実装概要と運用注意点。
- `design-system/ALPHA_COMPONENTS.md` – デザインシステム α 版の Storybook 運用とコンポーネント一覧。
- `ux/ONE_SCREEN_LAYOUT_GUIDE.md` – 1画面完結レイアウトの設計指針。
- `ux/ONE_SCREEN_LAYOUT_GUIDE.md` Appendix – 既存カルテ画面から抽出した業務要件メモ。
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
- 2026-03-30: フェーズ4 セキュリティ/性能/負荷対策を実装。`features/PHASE4_SECURITY_AND_QUALITY.md` を新設し、`planning/WEB_CLIENT_WORK_PLAN.md` のフェーズ4タスクを完了として更新。
- 2026-02-20: フェーズ3 前半のスタンプライブラリ・ORCA 連携 UI を実装。`features/PHASE3_STAMP_AND_ORCA.md` を新設し、`planning/WEB_CLIENT_WORK_PLAN.md` のタスクステータスを更新。
- 2026-02-14: フェーズ2 カルテ編集機能を実装。`features/charts` に診察開始/終了、SOAP 保存、長輪講同期を追加し、`planning/phase2/PHASE2_PROGRESS.md` を更新。
- 2026-01-15: フェーズ2 前半の進捗を `planning/phase2/PHASE2_PROGRESS.md` に整理。患者検索 UI / カルテ履歴 β 実装と既存ユーザー影響メモを追加。
- 2025-11-05: 認証ラッパーのセキュリティレビュー完了を追記し、`planning/phase1/PHASE1_SECURITY_REVIEW.md` を新設。フェーズ1完了条件を更新。
- 2025-11-04: フェーズ1成果物として認証 SDK/HTTP クライアント/Storybook を整備し、`design-system/ALPHA_COMPONENTS.md` を新設。`planning/phase1/PHASE1_FOUNDATION.md` と `planning/WEB_CLIENT_WORK_PLAN.md` のステータスを更新。
- 2025-10-29: `planning/phase0/PHASE0_DELIVERABLES.md`, `planning/phase0/API_INVENTORY.md` を追加し、フェーズ0タスクの進捗と REST API 利用方針を整理。
- 2025-10-29: `planning/phase1/PHASE1_FOUNDATION.md` を追加し、web-client プロジェクト初期セットアップと採用スタックを記録。
