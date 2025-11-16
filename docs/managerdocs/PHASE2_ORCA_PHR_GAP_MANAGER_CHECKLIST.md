# Phase2 ORCA Demo/Dolphin/PHR ギャップ対応マネージャーチェックリスト (2025-11-20)

> **参照開始順**
> 1. `AGENTS.md`
> 2. `docs/web-client/README.md`（Web Client Hub）
> 3. `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`
> 4. `docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md`
>
> **報告テンプレ（RUN_ID / 証跡パス / DOC_STATUS 行）**
> - RUN_ID: `RUN_ID=<ID>`（ドキュメントのみは `RUN_ID=NA`）
> - 証跡パス: `docs/server-modernization/phase2/operations/logs/...`, `artifacts/orca-connectivity/<RUN_ID>/...` 等を列挙
> - DOC_STATUS 行: `docs/web-client/planning/phase2/DOC_STATUS.md`「モダナイズ/外部連携（ORCA PHR ギャップ）」行の更新内容
>
> **Archive 移行チェック（担当: Codex, 期限: 2025-11-29）**
> - [ ] Dormant 判定と根拠記録
> - [ ] `docs/archive/2025Q4/` への移行とスタブ整備
> - [ ] `PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` / `DOC_STATUS.md` 備考をアーカイブ情報で更新
>
> **開発端末手順の現行/Legacy 判定**
> - [ ] `docs/web-client/operations/mac-dev-login.local.md` = 現行手順（Trial CRUD 再検証時に参照）
> - [ ] `docs/web-client/operations/mac-dev-login.local.md` = Legacy / Archive（Archive 化判定時にチェックを付与）


## 1. 背景
- DemoResourceASP / DolphinResourceASP / PHRResource の欠落 API 棚卸し (`MODERNIZED_REST_API_INVENTORY.md:205-224,266-317` と `API_PARITY_MATRIX.md:105-322`) および `DOC_STATUS.md` W22 行を WebORCA トライアルサーバ基準へ更新済。
- ORCA 連携はトライアル環境 (`https://weborca-trial.orca.med.or.jp`, BASIC `trial/weborcatrial`) のみを接続可とし、「新規登録・更新・削除 OK (トライアル環境のみ)」表記と CRUD ログ採取を必須とする。公式サイト・制限事項は `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` を唯一の参照元とし、該当節を引用して Blocker を整理する。
- **Trial サーバ仕様**: firecrawl 取得の API 仕様が trialsite で "利用できない" もしくは "不明" となる場合の代替手段として、トライアルサーバで実際に CRUD を実行し、その挙動を Blocker として記録する。
- すべての書込みは `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` (もしくは最新日付の Trial CRUD ログ) と `artifacts/orca-connectivity/<RUN_ID>/crud/` へ保存し、`DOC_STATUS.md` W22 行および `PHASE2_PROGRESS.md` W22 セクションへ反映する。
- PHR Phase-A〜F の RUN_ID は `20251121TrialPHRSeqZ1` へ統合。旧 PKCS#12 / ORCAcertification 系 Runbook はアーカイブ済とし、参照する場合は「参照アーカイブ（更新不可）」注記を付ける。

> RUN_ID=`20251116T173000Z`: Trial サーバーで POST/PHR API が禁止されている間は Spec-based 実装として扱い、最終段階で ORMaster／本番サーバー接続に切り替えて通信検証を行う。検証完了後に DOC_STATUS／Runbook／API_STATUS を同日更新する。

## 2. 進行タスク一覧
- [x] **Task-A: ASP リソース再登録 + 認証ヘッダー/Context-Param 設定)** 完了 (2025-11-14 / RUN_ID=20251114TaspCtxZ1)。トライアル環境 CRUD 方針をヘッダー要件に追記し、`MODERNIZED_API_DOCUMENTATION_GUIDE.md`・`MODERNIZED_REST_API_INVENTORY.md`・`DOC_STATUS.md` へ反映。
  - [x] `web.xml` へ Demo/Dolphin/PHR サーブレットの context-param を登録し、`trial/weborcatrial` 想定の BASIC 認証・`X-Facility-Id` 等を明記。
  - [x] `MODERNIZED_API_DOCUMENTATION_GUIDE.md` に Trial CRUD ポリシー (「新規登録・更新・削除 OK (トライアル環境のみ)」＋ログ採取手順) を追記。
  - [x] `MODERNIZED_REST_API_INVENTORY.md` PHR 欄に `assets/orca-trialsite` 参照箇所を明示。
  - [x] `DOC_STATUS.md` W22 行へ Task-A 完了メモと Trial 対応済を記録。
- [x] **Task-B: PHR-EXPORT-TRACK 基準の PHR 実装の計画)** 完了 (2025-11-14 / RUN_ID=20251114TphrPlanZ1)。Trial CRUD 方針と RUN_ID 命名を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に反映し、Export Track の Blocker をトライアル観点で整理。
  - [x] フェーズ別シーケンス表へ `curl -u trial:weborcatrial` コマンド例とログ採取欄を追加。
  - [x] `API_PARITY_MATRIX.md` PHR 行に Trial 方針／RUN_ID 名を追記。
  - [x] `DOC_STATUS.md` W22 行と `logs/2025-11-14-phr-plan.md` に CRUD ログ要件を記録。
- [x] **Task-C: ORCA 週次向け PHR 証跡テンプレート整備)** 完了 (2025-11-14 / RUN_ID=20251114TphrEvidenceZ1)。テンプレート内のコマンド例と証跡格納ルールを Trial 仕様へ改訂。
  - [x] `ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/§4.4 に `curl -u trial:weborcatrial ...` 雛形と CRUD ログ欄を追加。
  - [x] `artifacts/orca-connectivity/template/phr-seq/README.md` を Trial ファイル構成に更新。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md` へ Trial 対応メモを追記。
- [ ] **Task-D: PHR Phase-A/B Trial 実測証跡取得)** 進行率 90% / Blocked (RUN_ID=20251121TrialPHRSeqZ1-A/B)。テンプレ展開・CRUD ログ保存済。Trial 環境の `/20/adm/phr/*` が未開放のためすべて HTTP404/405 (`trialsite.md` Snapshot 行2-7) となり、UI 反映は Modernized REST 経路での e2e 待ち。
  - [x] RUN_ID 発行と `scripts/orca_prepare_next_run.sh` 実行でテンプレート初期化 (`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/README.md`, `crud/PHR_PHASE_AB/`, `logs/curl_summary.log`)。
  - [x] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phaseA` などを実行し、HTTP404/405 (`{"Code":404/405,...}`) と placeholder スクリーンショットを `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/crud/PHR_PHASE_AB/` へ保存。未提供機能は `trialsite.md` Snapshot 行2-7 を引用し Blocker=`TrialEndpointMissing` としてログ化。
  - [x] `DOC_STATUS.md` W22 行と `PHASE2_PROGRESS.md` に Phase-A/B Trial 実測結果と Blocker を反映。
  - [ ] Final validation (Production/ORMaster): RUN_ID=`20251116T173000Z` で `/20/adm/phr/phase{A,B}` を `curl -vv -u ormaster:ormaster --data-binary @payloads/phr_phase_ab_prod.xml https://ormaster.orca.med.or.jp/20/adm/phr/phaseA` へ切替え、`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md#phr-phase-ab` に DNS/TLS/CRUD ログを集約。完了後に Task-D チェックボックスと DOC_STATUS（W22）を同日更新。
- [ ] **Task-E: Secrets/Context 検証** 進行率 70% (RUN_ID=20251121TrialPHRSeqZ1-CTX)。トライアル環境では PKCS#12/MtLS を使用せず BASIC 認証のみであることを確認し、`serverinfo/claim_conn.json` と `wildfly/phr_*.log` へ反映する。
  - [x] Modernized server を `docker-compose.modernized.dev.yml` で起動し、`serverinfo/claim_conn.json` へ Trial 接続設定を保存。
  - [x] `wildfly/phr_20251121TrialPHRSeqZ1-CTX.log` に BASIC 認証での CRUD 実行ログ (`PHR_ALLERGY_TEXT`, `PHR_LABTEST_TEXT` など) が出力されることを確認し、HTTP200/500 応答とともに `artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CTX/{crud,wildfly}` へ保存。
  - [ ] Secrets 未設定時の fail-fast (`PHR_EXPORT_SIGNING_SECRET` 欠落による `PHR_SIGNED_URL_ISSUE_FAILED`) は `PHRKey` / `PHRAsyncJob` が PersistenceUnit 未登録のため `UnknownEntityException` で阻害されている。`server-modernized/persistence.xml` を修正してから再測。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と `2025-11-21-phr-seq-trial.md#4-task-e-secretscontext-再検証-run_id20251121trialphrseqz1-ctx` へ結果と Blocker を追記。
- [ ] **Task-F: PHR Phase-C/D/E Trial 実測証跡取得)** 進行率 40% (RUN_ID=20251121TrialPHRSeqZ1-CDE)。Trial エンドポイントで CRUD が許可されていなかった場合、 `trialsite.md` の該当節を引用し Blocker 化する。許可 API はレスポンス 200/403 を `crud/phr_phase_cde/` へ保存。
  - [x] RUN_ID テンプレート展開、`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/{crud/httpdump/trace}` を生成。
  - [ ] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phr06` などを実行し、レスポンスと UI 反映を記録。未サポートの場合は `trialsite.md#limit` 引用の対応案をログ化。
  - [ ] `PHASE2_PROGRESS.md` / `DOC_STATUS.md` W22 行へ Trial 実測状況と CRUD ログのパスを同期。
  - [ ] Final validation (Production/ORMaster): `/20/adm/phr/phase{C,D,E}` を RUN_ID=`20251116T173000Z` 配下で本番接続し、`docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md#phr-phase-cde` に `curl -vv -u ormaster:ormaster ...` 証跡（DNS/TLS/HTTPdump）を追加。完了日に Task-F と DOC_STATUS を同期。
- [x] **Task-G: PHRContainer DTO & Fallback テストレビュー** 完了 (RUN_ID=20251121TtaskGImplZ1)。DTO 注釈のフォールバック・監査ログ要件を Trial CRUD 方針に合わせて更新。
  - [x] `common/src/main/java/open/dolphin/infomodel/PHRContainer.java` へ `@JsonInclude` 等を追加し、Trial CRUD との整合を確認。
  - [x] `PHRResource#toJobResponse` / `HmacSignedUrlService` で Trial ベースの Secrets fail-fast + 監査出力を実装。
  - [x] `PHRResourceTest` へ Trial 認証前提のテストケースを追加。
- [ ] **Task-I: Trial Blocker 週次エスカレーションパック** (RUN_ID=NA)。Trialsite 行117-142と Task-D/F 実測ログを束ね、週次レビュー向け資料と Blocker 緩和方針 (Modernized Task-H) を整理する。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-21-phr-escalation.md` を作成し、(1) `/20/adm/phr/*` Trial 遮断一覧、(2) ORCA 開放設定、(3) Modernized 暫定対応 (Task-H)、(4) エスカレーション論点を記載。
  - [x] `docs/server-modernization/phase2/operations/logs/20251116T164400Z-status-sync.md`（本指示 RUN_ID）へ Worker-A/B 成果（RUN_ID=`20251121TrialPHRSeqZ1-{A/B,CDE}`、Blocker=`TrialEndpointMissing`/`TrialLocalOnly`、ステータス「Trial再実測完了」/「Trial通信不可だが実装済」）と DOC_STATUS / Checklist 更新行を集約。
  - [x] `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行へ Task-I の参照リンク・RUN_ID=NA を追記し、ORCA 週次資料へ転送。
  - [ ] 週次レビュー後に ORCA 側の回答（開放可否/スケジュール）と Modernized Task-H 承認状況を追記し、チェックボックスを更新。
  - [ ] Final validation hand-off: RUN_ID=`20251116T173000Z` の `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md#manager-ops` へ ORMaster 切替条件（資格情報、DNS/TLS 証跡、`curl -vv -u ormaster:ormaster ...` コマンド、責任者）を追記し、週次資料と連携する。
  - [x] DOC_STATUS 連携済 (W22 TaskI 行に RUN_ID=NA / `2025-11-21-phr-escalation.md` リンクを追記, 2025-11-21)。
  - [ ] 週次レビュー反映待ち (2025-11-22 ORCA 週次で回答を取得後に更新)。

## 3. DOC_STATUS 反映ルール
- タスク完了時は `docs/web-client/planning/phase2/DOC_STATUS.md`「モダナイズ/外部連携 (ORCA)」の W22 行に以下を更新する。
  - `主な変更`: 完了タスク名 (RUN_ID・更新ファイル・CRUD ログパス) (例: `Task-D (RUN_ID=20251121TrialPHRSeqZ1-A/B) crud/phr_phase_ab/ 更新`)。
  - `次回アクション`: 残タスクのレビュー予定（例: `Task-F Trial 403 応答の解釈確認`）。
- 反映後、本チェックリストの該当チェックボックスを更新し、更新日時と担当を記す。

## 4. 進捗報告テンプレート（ワーカー向け)
```
【ワーカー報告】
タスクID: Task-D/E/F/G
完了: 100% / 進行率% / Blocked
更新ファイル: `path1`, `path2`, ...
RUN_ID / 証跡: RUN_ID=20251121TrialPHRSeqZ1-<phase>, `artifacts/.../crud/...`
CRUDログ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` 等
DOC_STATUS反映: 行の変更内容
残課題・支援依頼: (例: trialsite 限界の引用箇所、代替手段の要否)
```

## 5. 運用メモ
- Trial CRUD 実施時、 `trialsite.md` の注意事項 (公開データである点、利用不可機能リスト）を引用し、機密データを投入しないこと。
- `docs/server-modernization/phase2/operations/assets/seeds/*.sql` を ORCAcertification/ 配下の調査用アーカイブとしてのみ参照し、実運用では使用しないことをログへ残す。
- PHR Export Track を Modernized サーバへ接続する際は、Trial で得られた CRUD 結果 (HTTP 200/403/404) を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に追記し、監査イベント要件と同期する。

## 6. 参照ドキュメント一覧
| 種別 | ドキュメント| 役割 / 更新トリガ |
| --- | --- | --- |
| 設計・棚卸し| `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`<br/>`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` | Sprint2 設計と 1:1 パリティ表。Trial CRUD 方針とリンクを同期。|
| PHR 実装計画 | `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md` | フェーズ別依存と Trial RUN_ID。タスクD〜F の結果を反映。|
| Runbook & テンプレート | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/4.4<br/>`artifacts/orca-connectivity/template/phr-seq/README.md` | Trial RUN_ID テンプレート・証跡構造。更新時に CRUD ログ欄と同期。|
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` | Trial CRUD 実測結果。RUN ごとに新規ログを追加。|
| トライアル公式サイト | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` | 基本情報・利用不可機能の一次情報。引用時に節名と更新日を記載。|
| API ドキュメント集約| `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` | Demo/Dolphin/PHR ASP 設計の一次情報。Trial 対応後もタスク別に整合を確認。|
| 棚卸し & 割り当て| `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行<br/>`docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | ORCA 外部連携行とマネージャー割当一覧。進捗更新時に両方を同期。|

> 参照マップへリンクを追加・削除した場合、`PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と本チェックリスト双方を同日に更新する。

> 最終更新: 2025-11-20 / 担当: Codex (Phase2 ORCA 連携マネージャー)
