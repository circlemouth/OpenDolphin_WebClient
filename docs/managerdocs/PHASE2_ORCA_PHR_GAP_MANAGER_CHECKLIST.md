# Phase2 ORCA Demo/Dolphin/PHR ギャチE�E対応�Eネ�EジャーチェチE��リスト！E025-11-20�E�E

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
- DemoResourceASP / DolphinResourceASP / PHRResource の欠落 API 棚卸し！EMODERNIZED_REST_API_INVENTORY.md:205-224,266-317` と `API_PARITY_MATRIX.md:105-322`�E�およ�E `DOC_STATUS.md` W22 行�E WebORCA トライアルサーバ�E基準へ更新済、E
- ORCA 連携はトライアル環墁E��Ehttps://weborca-trial.orca.med.or.jp`, BASIC `trial/weborcatrial`�E��Eみを接続�Eとし、「新規登録�E�更新�E�削除 OK�E�トライアル環墁E��のみ�E�」表記と CRUD ログ採取を忁E��とする。�E式案�E・制限事頁E�E `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` を唯一の参�E允E��し、該当節を引用して Blocker を整琁E��る、E
- **Trial �T�[�o�[�ڕW���L**: firecrawl �擾�ς� API �d�l�� trialsite �Łu���g��E??�������Ȃ�E???E�v�����ɂȂ�@�\�������A�g���C�A���T�[�o�[��ŕK�����s�ECRUD �𐬌������A�ؐՂ��c���B���񋟋@�\�̂� Blocker �Ƃ��ċL�^����AE
- すべての書込みは `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`�E�もしくは最新日付�E Trial CRUD ログ�E�と `artifacts/orca-connectivity/<RUN_ID>/crud/` へ保存し、`DOC_STATUS.md` W22 行およ�E `PHASE2_PROGRESS.md` W22 セクションへ反映する、E
- PHR Phase-A〜F の RUN_ID は `20251121TrialPHRSeqZ1` へ統合。旧 PKCS#12 / ORCAcertification 系 Runbook はアーカイブ済とし、参照する場合�E「参老E��ーカイブ（更新不可�E�」注記を付ける、E

## 2. 進行タスク一覧
- [x] **Task-A: ASP リソース再登録 + 認証ヘッダー/Context-Param 設訁E*  E完亁E��E025-11-14 / RUN_ID=20251114TaspCtxZ1�E�。トライアル環墁ECRUD 方針をヘッダー要件に追記し、`MODERNIZED_API_DOCUMENTATION_GUIDE.md`・`MODERNIZED_REST_API_INVENTORY.md`・`DOC_STATUS.md` へ反映、E
  - [x] `web.xml` へ Demo/Dolphin/PHR サーブレチE���E�context-param を登録し、`trial/weborcatrial` 想定�E BASIC 認証・`X-Facility-Id` 等を明記、E
  - [x] `MODERNIZED_API_DOCUMENTATION_GUIDE.md` に Trial CRUD ポリシー�E�「新規登録�E�更新�E�削除 OK�E�トライアル環墁E��のみ�E�」＋ログ採取手頁E��を追記、E
  - [x] `MODERNIZED_REST_API_INVENTORY.md` PHR 欁E�� `assets/orca-trialsite` 参�E箁E��を�E示、E
  - [x] `DOC_STATUS.md` W22 行へ Task-A 完亁E��モと Trial 刁E��済を記録、E
- [x] **Task-B: PHR-EXPORT-TRACK 基準�E PHR 実裁E��E��策宁E*  E完亁E��E025-11-14 / RUN_ID=20251114TphrPlanZ1�E�。Trial CRUD 方針と RUN_ID 命名を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に反映し、Export Track の Blocker をトライアル観点で整琁E��E
  - [x] フェーズ別シーケンス表へ `curl -u trial:weborcatrial` コマンド例とログ採取欁E��追加、E
  - [x] `API_PARITY_MATRIX.md` PHR 行に Trial 方針／RUN_ID 名を追記、E
  - [x] `DOC_STATUS.md` W22 行と `logs/2025-11-14-phr-plan.md` に CRUD ログ要件を記録、E
- [x] **Task-C: ORCA 週次向け PHR 証跡チE��プレ整傁E*  E完亁E��E025-11-14 / RUN_ID=20251114TphrEvidenceZ1�E�。テンプレ冁E�Eコマンド例と証跡格納ルールめETrial 仕様へ改訂、E
  - [x] `ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/§4.4 に `curl -u trial:weborcatrial ...` 雛形と CRUD ログ欁E��追加、E
  - [x] `artifacts/orca-connectivity/template/phr-seq/README.md` めETrial ファイル構�Eに更新、E
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md` へ Trial 刁E��メモを追記、E
- [ ] **Task-D: PHR Phase-A/B Trial 実測証跡取征E*  E進行率 70%�E�EUN_ID=20251121TrialPHRSeqZ1-A/B�E�。テンプレ展開・CRUD ログ保存済。Phase-A/B endpoints の書込み ↁEレスポンス 200/403 を記録し、UI での反映を検証中、E
  - [x] RUN_ID 発行と `scripts/orca_prepare_next_run.sh` 実行でチE��プレ初期化！Eartifacts/orca-connectivity/20251121TrialPHRSeqZ1/README.md`, `crud/PHR_PHASE_AB/`, `logs/curl_summary.log`�E�、E
  - [ ] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phaseA` などを実行し、`Api_Result` と UI スクリーンショチE��めE`crud/phr_phase_ab/` に保存。未提供機�Eは `trialsite.md#limit` を引用して Blocker 記録、E
  - [ ] `DOC_STATUS.md` W22 行と `PHASE2_PROGRESS.md` に Phase-A/B Trial 実測結果を反映、E
- [ ] **Task-E: Secrets/Context 検証**  E進行率 50%�E�EUN_ID=20251121TrialPHRSeqZ1-CTX�E�。トライアル環墁E��は PKCS#12/MtLS を使用せず BASIC 認証のみであることを確認し、`serverinfo/claim_conn.json` と `wildfly/phr_*.log` へ反映する、E
  - [x] Modernized server めE`docker-compose.modernized.dev.yml` で起動し、`serverinfo/claim_conn.json` へ Trial 接続設定を保存、E
  - [ ] `wildfly/phr_*.log` に BASIC 認証での CRUD 実行ログが�E力されること、Secrets 未設定時に fail-fast することを確認、E
  - [ ] `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と `logs/2025-11-21-phr-seq-trial.md` へ結果を追記、E
- [ ] **Task-F: PHR Phase-C/D/E Trial 実測証跡取征E*  E進行率 40%�E�EUN_ID=20251121TrialPHRSeqZ1-CDE�E�。Trial エンド�Eイントで CRUD が許可されてぁE��ぁE��合�E `trialsite.md` の該当節を引用ぁEBlocker 化する。許可 API はレスポンス 200/403 めE`crud/phr_phase_cde/` へ保存、E
  - [x] RUN_ID チE��プレ展開、`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/{crud/httpdump/trace}` を生成、E
  - [ ] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phr06` などを実行し、レスポンスと UI 反映を記録。未サポ�Eト�E場合�E `trialsite.md#limit` 引用�E�対応案をログ化、E
  - [ ] `PHASE2_PROGRESS.md` / `DOC_STATUS.md` W22 行へ Trial 実測状況と CRUD ログのパスを同期、E
- [x] **Task-G: PHRContainer DTO & Fallback チE��トレビュー**  E完亁E��EUN_ID=20251121TtaskGImplZ1�E�、ETO 注釈�Eフォールバック・監査ログ要件めETrial CRUD 方針に合わせて更新、E
  - [x] `common/src/main/java/open/dolphin/infomodel/PHRContainer.java` へ `@JsonInclude` 等を追加し、Trial CRUD との整合を確認、E
  - [x] `PHRResource#toJobResponse` / `HmacSignedUrlService` で Trial ベ�Eスの Secrets fail-fast + 監査出力を実裁E��E
  - [x] `PHRResourceTest` へ Trial 認証前提のチE��トケースを追加、E

## 3. DOC_STATUS 反映ルール
- タスク完亁E��は `docs/web-client/planning/phase2/DOC_STATUS.md`「モダナイズ/外部連携�E�ERCA�E�」�E W22 行に以下を更新する、E
  - `主な変更`: 完亁E��スク名�ERUN_ID・更新ファイル・CRUD ログパス�E�侁E `Task-D (RUN_ID=20251121TrialPHRSeqZ1-A/B) crud/phr_phase_ab/ 更新`�E�、E
  - `次回アクション`: 残タスクめE��ビュー予定（侁E `Task-F Trial 403 応答�E解釈確認`�E�、E
- 反映後�E本チェチE��リスト�E該当チェチE��ボックスを更新し、更新日時�E拁E��を記す、E

## 4. 進捗報告テンプレート（ワーカー向け�E�E
```
【ワーカー報告、E
タスクID: Task-D/E/F/G
完亁E��: 100% / 進行率% / Blocked
更新ファイル: `path1`, `path2`, ...
RUN_ID / 証跡: RUN_ID=20251121TrialPHRSeqZ1-<phase>, `artifacts/.../crud/...`
CRUDログ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` 筁E
DOC_STATUS反映: 行�E変更冁E��
残課顁E支援依頼: �E�侁E trialsite 限界の引用箁E��、代替手段の要否�E�E
```

## 5. 運用メモ
- Trial CRUD 実施時�E `trialsite.md` の注意事頁E���E開データである点、利用不可機�Eリスト）を引用し、機寁E��ータを投入しなぁE��E
- `docs/server-modernization/phase2/operations/assets/seeds/*.sql` めEORCAcertification/ 配下�E調査用アーカイブとしてのみ参�Eし、実運用では使用しなぁE��をログへ残す、E
- PHR Export Track めEModernized サーバ�Eへ接続する際は、Trial で得られた CRUD 結果�E�ETTP 200/403/404�E�を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` に邁E�Eし、監査イベント要件と同期する、E

## 6. 参�Eドキュメント�EチE�E
| 種別 | ドキュメンチE| 役割 / 更新トリガ |
| --- | --- | --- |
| 設計�E棚卸ぁE| `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`<br/>`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` | Sprint2 設計と 1:1 パリチE��表。Trial CRUD 方針とリンクを同期、E|
| PHR 実裁E��画 | `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md` | フェーズ別依存と Trial RUN_ID。タスクD〜F の結果を反映、E|
| Runbook & チE��プレ | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/4.4<br/>`artifacts/orca-connectivity/template/phr-seq/README.md` | Trial RUN_ID チE��プレ・証跡構造。更新時�E CRUD ログ欁E��同期、E|
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` | Trial CRUD 実測結果。RUN ごとに新規ログを追加、E|
| トライアル公式案�E | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` | 賁E��惁E��・利用不可機�Eの一次惁E��。引用時�E節名と更新日を記載、E|
| API ドキュメント集紁E| `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` | Demo/Dolphin/PHR ASP 設計�E一次惁E��。Trial 刁E��後もタスク別に整合を確認、E|
| 棚卸ぁE& 割彁E| `docs/web-client/planning/phase2/DOC_STATUS.md` W22 衁Ebr/>`docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | ORCA 外部連携行とマネージャー割当一覧。進捗更新時�E両方を同期、E|

> 参�Eマップへリンクを追加・削除した場合�E、`PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と本チェチE��リスト双方を同日に更新する、E

> 最終更新: 2025-11-20 / 拁E��E Codex�E�Ehase2 ORCA 連携マネージャー�E�E

