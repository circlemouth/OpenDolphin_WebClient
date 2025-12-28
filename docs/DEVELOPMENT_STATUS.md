# 開発状況（単一参照, 更新日: 2025-12-25）

## 現行ステータス
- Phase2 開発ドキュメントは **Legacy/Archive（参照専用）**。Phase2 を現行フェーズとして扱わない。
- 現行の作業内容はフェーズ名では判断せず、最新のタスク指示/チケット/マネージャー指示に従う。

## 参照の優先順
1. `docs/DEVELOPMENT_STATUS.md`（本ファイル）
2. `AGENTS.md` / `GEMINI.md`（共通ルールと制約）
3. 環境手順: `web-client/README.md` と `setup-modernized-env.sh`
4. Web クライアント設計: `docs/web-client/`（`planning/phase2/` は Legacy）
5. サーバーモダナイズ: `docs/server-modernization/`（`phase2/` は Legacy）

## Legacy 参照（Phase2）
- ロールオフ方針: `docs/server-modernization/phase2/PHASE2_DOCS_ROLLOFF.md`
- Phase2 ドキュメント: `docs/web-client/planning/phase2/`, `docs/server-modernization/phase2/`, `docs/managerdocs/PHASE2_*`

## 補足
- Phase2 の文書は履歴・差分確認のために保持しているが、更新は原則行わない。
- 例外的に Phase2 文書を更新する場合は、事前にマネージャー指示を明記すること。

## 実施記録（最新）
- 2025-12-28: Charts 印刷/エクスポートの確認モーダル/復旧導線/監査ログとガード条件を整備（RUN_ID=20251228T011746Z）。
  - 出力前確認と失敗時の復旧導線を追加し、印刷の approval/do/lock を auditEvent に記録。
  - ChartsActionBar の印刷ガードを送信条件から分離し、missingMaster/fallback/権限のみで制御。
- 2025-12-28: Charts の監査イベント重複防止/lockStatus 整合/URL切替ログ/blocked理由の補強を追加（RUN_ID=20251228T005005Z）。
- 2025-12-28: Charts の重要操作で auditEvent/UI ログの operationPhase(approval/lock/do) を統一（RUN_ID=20251228T001604Z）。
- 2025-12-28: Charts の Appointment 監査ログに screen=charts を反映し、appointment meta の最新選定を安定化（RUN_ID=20251228T000144Z）。
- 2025-12-27: Charts 病名/処方/オーダー編集の readOnly/監査/バリデーション整備（RUN_ID=20251227T213517Z）。
  - 右パネル編集は master未同期/フォールバック/タブロック時に編集ブロックし、理由を明示。
  - 病名/処方/オーダーの監査イベントに更新内容と runId 等の観測メタを統一して記録。
  - ORCA 疾患/オーダー束 API に入力バリデーションを追加し、レスポンス runId を揃えた。
- 2025-12-27: Charts 右固定メニューからの病名/処方/オーダー編集とAPI連携を追加（RUN_ID=20251227T154003Z）。
  - 病名編集パネルで主/疑い/開始/転帰を編集し、/orca/disease へ反映・監査イベント記録を実装。
  - 処方（RP）/オーダー束の編集パネルと /orca/order/bundles API を追加し、作成/更新/削除と監査ログを実装。
- 2025-12-27: SOAP記載ログ/テンプレ挿入/監査イベント/履歴永続化のブラッシュアップを実装（RUN_ID=20251227T144854Z）。
  - SOAP テンプレ挿入の監査イベント追加、保存/更新の監査詳細メタ強化、SOAP履歴の sessionStorage 永続化と容量管理を実装。
  - 患者切替時の未保存ドラフトブロックを強化し、SOAP履歴のタイムライン反映テストを追加。
- 2025-12-25: WebClient 前提 API 実装切替のローカル疎通を再検証（RUN_ID=20251225T105103Z）。
  - 期待条件（HTTP 200 / runId / dataSourceTransition / auditEvent）を満たすのは `dolphindev` の MD5 (`1cc2f4c06fd32d0a6e2fa33f6e1c9164`) を使った場合。
  - 手順のパスワード記載を `src/server_modernized_gap_20251221/06_server_ops_required/WebClient前提API_実装切替.md` へ反映済み。

## 懸念点（要確認）
- テスト未実施: 病名/処方/オーダーの CRUD と監査ログの実運用確認がない。E2E/統合テストの証跡がなく、本番運用レベルの保証に欠ける。
- 実機連携の未確認: ORCA 実環境での動作確認が未実施（認証・データ反映・監査ログ到達の確認が必要）。
- 入力バリデーションの妥当性: server-modernized 側は operation/entity 等のバリデーションを強化したが、病名の必須項目や空文字制御が API 側でどこまで保証されるかは要確認。
- readOnly の伝播確認: UI はブロックするが、sidePanelMeta が常に readOnly/missingMaster/fallback を正しく反映しているか、実運用での状態遷移確認が必要。
