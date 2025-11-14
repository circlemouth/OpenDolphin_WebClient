# Phase2 ORCA Demo/Dolphin/PHR ギャップ対応マネージャーチェックリスト（2025-11-20）

## 1. 背景
- DemoResourceASP / DolphinResourceASP / PHRResource の欠落 API 棚卸し（`MODERNIZED_REST_API_INVENTORY.md:205-224,266-317` と `API_PARITY_MATRIX.md:105-322`）および `DOC_STATUS.md` W22 行は WebORCA トライアルサーバー基準へ更新済。
- ORCA 連携はトライアル環境（`https://weborca-trial.orca.med.or.jp`, BASIC `trial/weborcatrial`）のみを接続先とし、「新規登録／更新／削除 OK（トライアル環境でのみ）」表記と CRUD ログ採取を必須とする。公式案内・制限事項は `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` を唯一の参照元とし、該当節を引用して Blocker を整理する。
- すべての書込みは `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`（もしくは最新日付の Trial CRUD ログ）と `artifacts/orca-connectivity/<RUN_ID>/crud/` へ保存し、`DOC_STATUS.md` W22 行および `PHASE2_PROGRESS.md` W22 セクションへ反映する。
- PHR Phase-A〜F の RUN_ID は `20251121TrialPHRSeqZ1` へ統合。旧 PKCS#12 / ORCAcertification 系 Runbook はアーカイブ済とし、参照する場合は「参考アーカイブ（更新不可）」注記を付ける。

## 2. 進行タスク一覧
- [x] **Task-A: ASP リソース再登録 + 認証ヘッダー/Context-Param 設計** — 完了（2025-11-14 / RUN_ID=20251114TaspCtxZ1）。トライアル環境 CRUD 方針をヘッダー要件に追記し、`MODERNIZED_API_DOCUMENTATION_GUIDE.md`・`MODERNIZED_REST_API_INVENTORY.md`・`DOC_STATUS.md` へ反映。
  - [x] `web.xml` へ Demo/Dolphin/PHR サーブレット＋context-param を登録し、`trial/weborcatrial` 想定の BASIC 認証・`X-Facility-Id` 等を明記。
  - [x] `MODERNIZED_API_DOCUMENTATION_GUIDE.md` に Trial CRUD ポリシー（「新規登録／更新／削除 OK（トライアル環境でのみ）」＋ログ採取手順）を追記。
  - [x] `MODERNIZED_REST_API_INVENTORY.md` PHR 欄で `assets/orca-trialsite` 参照箇所を明示。
  - [x] `DOC_STATUS.md` W22 行へ Task-A 完了メモと Trial 切替済を記録。
- [x] **Task-B: PHR-EXPORT-TRACK 基準の PHR 実装順序策定** — 完了（2025-11-14 / RUN_ID=20251114TphrPlanZ1）。Trial CRUD 方針と RUN_ID 命名を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に反映し、Export Track の Blocker をトライアル観点で整理。
  - [x] フェーズ別シーケンス表へ `curl -u trial:weborcatrial` コマンド例とログ採取欄を追加。
  - [x] `API_PARITY_MATRIX.md` PHR 行に Trial 方針／RUN_ID 名を追記。
  - [x] `DOC_STATUS.md` W22 行と `logs/2025-11-14-phr-plan.md` に CRUD ログ要件を記録。
- [x] **Task-C: ORCA 週次向け PHR 証跡テンプレ整備** — 完了（2025-11-14 / RUN_ID=20251114TphrEvidenceZ1）。テンプレ内のコマンド例と証跡格納ルールを Trial 仕様へ改訂。
  - [x] `ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/§4.4 に `curl -u trial:weborcatrial ...` 雛形と CRUD ログ欄を追加。
  - [x] `artifacts/orca-connectivity/template/phr-seq/README.md` を Trial ファイル構成に更新。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md` へ Trial 切替メモを追記。
- [ ] **Task-D: PHR Phase-A/B Trial 実測証跡取得** — 進行率 70%（RUN_ID=20251121TrialPHRSeqZ1-A/B）。テンプレ展開・CRUD ログ保存済。Phase-A/B endpoints の書込み → レスポンス 200/403 を記録し、UI での反映を検証中。
  - [x] RUN_ID 発行と `scripts/orca_prepare_next_run.sh` 実行でテンプレ初期化（`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/README.md`, `crud/PHR_PHASE_AB/`, `logs/curl_summary.log`）。
  - [ ] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phaseA` などを実行し、`Api_Result` と UI スクリーンショットを `crud/phr_phase_ab/` に保存。未提供機能は `trialsite.md#limit` を引用して Blocker 記録。
  - [ ] `DOC_STATUS.md` W22 行と `PHASE2_PROGRESS.md` に Phase-A/B Trial 実測結果を反映。
- [ ] **Task-E: Secrets/Context 検証** — 進行率 50%（RUN_ID=20251121TrialPHRSeqZ1-CTX）。トライアル環境では PKCS#12/MtLS を使用せず BASIC 認証のみであることを確認し、`serverinfo/claim_conn.json` と `wildfly/phr_*.log` へ反映する。
  - [x] Modernized server を `docker-compose.modernized.dev.yml` で起動し、`serverinfo/claim_conn.json` へ Trial 接続設定を保存。
  - [ ] `wildfly/phr_*.log` に BASIC 認証での CRUD 実行ログが出力されること、Secrets 未設定時に fail-fast することを確認。
  - [ ] `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と `logs/2025-11-21-phr-seq-trial.md` へ結果を追記。
- [ ] **Task-F: PHR Phase-C/D/E Trial 実測証跡取得** — 進行率 40%（RUN_ID=20251121TrialPHRSeqZ1-CDE）。Trial エンドポイントで CRUD が許可されていない場合は `trialsite.md` の該当節を引用し Blocker 化する。許可 API はレスポンス 200/403 を `crud/phr_phase_cde/` へ保存。
  - [x] RUN_ID テンプレ展開、`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/{crud/httpdump/trace}` を生成。
  - [ ] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phr06` などを実行し、レスポンスと UI 反映を記録。未サポートの場合は `trialsite.md#limit` 引用＋対応案をログ化。
  - [ ] `PHASE2_PROGRESS.md` / `DOC_STATUS.md` W22 行へ Trial 実測状況と CRUD ログのパスを同期。
- [x] **Task-G: PHRContainer DTO & Fallback テストレビュー** — 完了（RUN_ID=20251121TtaskGImplZ1）。DTO 注釈・フォールバック・監査ログ要件を Trial CRUD 方針に合わせて更新。
  - [x] `common/src/main/java/open/dolphin/infomodel/PHRContainer.java` へ `@JsonInclude` 等を追加し、Trial CRUD との整合を確認。
  - [x] `PHRResource#toJobResponse` / `HmacSignedUrlService` で Trial ベースの Secrets fail-fast + 監査出力を実装。
  - [x] `PHRResourceTest` へ Trial 認証前提のテストケースを追加。

## 3. DOC_STATUS 反映ルール
- タスク完了時は `docs/web-client/planning/phase2/DOC_STATUS.md`「モダナイズ/外部連携（ORCA）」の W22 行に以下を更新する。
  - `主な変更`: 完了タスク名・RUN_ID・更新ファイル・CRUD ログパス（例: `Task-D (RUN_ID=20251121TrialPHRSeqZ1-A/B) crud/phr_phase_ab/ 更新`）。
  - `次回アクション`: 残タスクやレビュー予定（例: `Task-F Trial 403 応答の解釈確認`）。
- 反映後は本チェックリストの該当チェックボックスを更新し、更新日時・担当を記す。

## 4. 進捗報告テンプレート（ワーカー向け）
```
【ワーカー報告】
タスクID: Task-D/E/F/G
完了度: 100% / 進行率% / Blocked
更新ファイル: `path1`, `path2`, ...
RUN_ID / 証跡: RUN_ID=20251121TrialPHRSeqZ1-<phase>, `artifacts/.../crud/...`
CRUDログ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` 等
DOC_STATUS反映: 行・変更内容
残課題/支援依頼: （例: trialsite 限界の引用箇所、代替手段の要否）
```

## 5. 運用メモ
- Trial CRUD 実施時は `trialsite.md` の注意事項（公開データである点、利用不可機能リスト）を引用し、機密データを投入しない。
- `docs/server-modernization/phase2/operations/assets/seeds/*.sql` や ORCAcertification/ 配下は調査用アーカイブとしてのみ参照し、実運用では使用しない旨をログへ残す。
- PHR Export Track を Modernized サーバーへ接続する際は、Trial で得られた CRUD 結果（HTTP 200/403/404）を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に還元し、監査イベント要件と同期する。

## 6. 参照ドキュメントマップ
| 種別 | ドキュメント | 役割 / 更新トリガ |
| --- | --- | --- |
| 設計・棚卸し | `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`<br/>`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` | Sprint2 設計と 1:1 パリティ表。Trial CRUD 方針とリンクを同期。 |
| PHR 実装計画 | `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md` | フェーズ別依存と Trial RUN_ID。タスクD〜F の結果を反映。 |
| Runbook & テンプレ | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/4.4<br/>`artifacts/orca-connectivity/template/phr-seq/README.md` | Trial RUN_ID テンプレ・証跡構造。更新時は CRUD ログ欄を同期。 |
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` | Trial CRUD 実測結果。RUN ごとに新規ログを追加。 |
| トライアル公式案内 | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` | 資格情報・利用不可機能の一次情報。引用時は節名と更新日を記載。 |
| API ドキュメント集約 | `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` | Demo/Dolphin/PHR ASP 設計の一次情報。Trial 切替後もタスク別に整合を確認。 |
| 棚卸し & 割当 | `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行<br/>`docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | ORCA 外部連携行とマネージャー割当一覧。進捗更新時は両方を同期。 |

> 参照マップへリンクを追加・削除した場合は、`PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と本チェックリスト双方を同日に更新する。

> 最終更新: 2025-11-20 / 担当: Codex（Phase2 ORCA 連携マネージャー）
