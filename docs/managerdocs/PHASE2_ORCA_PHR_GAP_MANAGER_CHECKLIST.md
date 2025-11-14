# Phase2 ORCA Demo/Dolphin/PHR ギャップ対応マネージャーチェックリスト（2025-11-19）

## 1. 背景
- DemoResourceASP / DolphinResourceASP / PHRResource の欠落 API 棚卸し（`MODERNIZED_REST_API_INVENTORY.md:205-224,266-317` と `API_PARITY_MATRIX.md:105-322`）および `DOC_STATUS.md` W22 行更新済み。
- 現在のマネージャー指示（2025-11-19）は、PKCS#12 パスフレーズの再共有と PHRA/B/C/D/E 各 RUN_ID の再実測を最優先とし、ORCA 週次レビューまでに証跡と Blocker の整理を完了させること。
- すべての進捗は `docs/web-client/planning/phase2/DOC_STATUS.md`「モダナイズ/外部連携（ORCA）」行へ反映し、RUN_ID と証跡パスをログ (`docs/server-modernization/phase2/operations/logs/`) に残す。
- PHR Phase-C/D/E RUN_ID=`20251119TorcaPHRSeqZ1` は PKCS#12 パスを更新済みで mTLS/Basic までは成功。ORCA 本番に `/20/adm/phr/*` が存在しないため HTTP 405/404 が上限であり、Modernized REST 実装で 200/403＋監査取得へ切り替える必要がある。証跡は `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/`、ログは `docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md` に集約済。`serverinfo/claim_conn.json` と `wildfly/phr_20251119TorcaPHRSeqZ1.log` を採取済。

## 2. 進行タスク一覧
- [x] **Task-A: ASP リソース再登録 + 認証ヘッダー/Context-Param 設計** — 完了（2025-11-14 / RUN_ID=20251114TaspCtxZ1）。`web.xml` へ Demo/Dolphin/PHR ASP を再登録し、context-param とヘッダー制約を明示。`MODERNIZED_API_DOCUMENTATION_GUIDE.md`・`MODERNIZED_REST_API_INVENTORY.md`・`DOC_STATUS.md`・ログを更新済。
  - [x] web.xml へ Demo/Dolphin/PHR サーブレット＋マッピング＋context-param 反映（`X-Facility-Id`, `X-Touch-TraceId` 等）。
  - [x] `MODERNIZED_API_DOCUMENTATION_GUIDE.md` に新節「Demo/Dolphin/PHR ASP 再登録方針」を追加（ヘッダー一覧・context-param キー）。
  - [x] `MODERNIZED_REST_API_INVENTORY.md` PHR 欠落表・Demo/Dolphin 欄へ context-param/認証メモ追記。
  - [x] WildFly 再読込検証とログ保存 `docs/server-modernization/phase2/operations/logs/2025-11-14-asp-rest-config.md`。
  - [x] `DOC_STATUS.md` W22 行へ Task-A 完了メモ（RUN_ID 含む）を追記。
- [x] **Task-B: PHR-EXPORT-TRACK 基準の PHR 実装順序策定** — 完了（2025-11-14 / RUN_ID=20251114TphrPlanZ1）。`PHR_RESTEASY_IMPLEMENTATION_PLAN.md` を新規作成し、フェーズA〜Fの依存/監査/テスト/Blocker と #RUN hook を整備。`API_PARITY_MATRIX.md` メモ、`DOC_STATUS.md` W22 行、`logs/2025-11-14-phr-plan.md` を更新済。
  - [x] 新規ドキュメントでフェーズ別（キー管理→閲覧→Layer ID→Schema→PHRContainer→Export）シーケンスを表形式化。
  - [x] export Track の Blocker / RUN hook を併記し、ORCA 週次承認向けアジェンダを明文化。
  - [x] `API_PARITY_MATRIX.md` PHR 行に上記 doc へのアンカーを追加し、メモ欄へ順序注記。
  - [x] `DOC_STATUS.md` W22 行「主な変更」へ Task-B 反映内容を追記。
  - [x] ログ `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-plan.md` に決定事項と証跡を記録。
- [x] **Task-C: ORCA 週次向け PHR 証跡テンプレ整備** — 完了（2025-11-14 / RUN_ID=20251114TphrEvidenceZ1）。`ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/§4.4、`logs/2025-11-13-orca-connectivity.md#task-c-phr-template`、`artifacts/orca-connectivity/template/phr-seq/README.md`、`logs/2025-11-14-phr-evidence-template.md`、`DOC_STATUS.md`、本チェックリストを同期。
  - [x] `ORCA_CONNECTIVITY_VALIDATION.md` に PHR-01〜11 テスト観点・ヘッダー要件・ServerInfo チェック表・RUN_ID テンプレを追加。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` へ RUN_ID=`20251114TphrEvidenceZ1` のテンプレ節を追加し、TODO と週次レビュー日程を列挙。
  - [x] `artifacts/orca-connectivity/template/phr-seq/README.md`（新規）で証跡構造/命名規則/スクリーンショット要件を定義。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md` を作成し、Task-C 成果と Pending リスクを記録。
  - [x] `DOC_STATUS.md` W22 行「主な変更/次回アクション」に Task-C 内容と RUN_ID を追記し、マネージャーテンプレこのファイルへ反映。

- [ ] **Task-D: PHR Phase-A/B 実測証跡取得** — 進行率 60%（RUN_ID=20251115TorcaPHRSeqZ1 / WebORCA 経路は 404 で終了、Modernized 実測待ち）。テンプレ展開・Evidence 保存・週次台帳反映済。PKCS#12 パスフレーズ再共有後に Modernized REST 証跡を再取得する必要あり。
  - [x] RUN_ID 発行と `scripts/orca_prepare_next_run.sh` 実行でテンプレ初期化（`artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/README.md`, `logs/curl_summary.log`, `todo/PHR_OPEN_ITEMS.md`）。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-15-phr-seq-phaseAB.md` と `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` §7 を作成し、Phase-A/B の結果・Blocker・再実行手順を記録。`PHASE2_PROGRESS.md` / `DOC_STATUS.md` W22 行へ RUN_ID + Evidence パスを反映。
  - [x] Ops から PKCS#12 パスフレーズ（FJjmq/d7EP）を受領し、`curl --cert-type P12` で Phase-A/B を再実行。結果は全件 HTTP 404（WebORCA には `/20/adm/phr/*` が存在せず）であるため、`httpdump/` に JSON/HTML 応答と `trace/` ログを保存。
  - Blocker実績: 2025-11-19 時点で Modernized 側は未起動のまま（`serverinfo/claim_conn.error` が `Could not resolve host: server-modernized-dev` を記録）。同理由により `wildfly/phr_*.log` は placeholder のまま。
  - [ ] docker-compose.modernized.dev.yml で modernized server を起動して `serverinfo/claim_conn.json` と `wildfly/phr_*.log` を再取得。
  - [ ] Modernized REST 経路で Phase-A/B の 200/403 証跡・監査ログを取得し、`screenshots/phr-0X_response.png` と `logs/phr_labtest_summary.md` を更新、RUN_ID 完了後に週次ドキュメントを再同期。
  - [x] Ops (#ops-secrets) から新しい PKCS#12 passphrase を受領し、RUN_ID=`20251115TorcaPHRSeqZ1` を再実施済（HTTP 404 まで取得 / Modernized REST 実装待ち）。

- [x] **Task-E: Layer ID / 画像 / Container 依存解消** — 完了（2025-11-18 / RUN_ID=20251118TphrLayerPrepZ1）。Secrets/Vault テーブル、PHR フェーズE/F表、ORCA Runbook、ログ、DOC_STATUS を更新し、PHR-06/07/11 の前提要件・Signed URL 条件・S3/IAM/帯域ポリシーを合意済み。
  - [x] Ops チームと Secrets 取り扱い・署名 URL 要件を確定し、`PHR_RESTEASY_IMPLEMENTATION_PLAN.md` フェーズE/Fへ反映。
  - [x] `ORCA_CONNECTIVITY_VALIDATION.md` Phase-D/E 表と備考、`logs/2025-11-14-phr-evidence-template.md` Pending 項目、`DOC_STATUS.md` W22 行「次回アクション」を Secrets 承認済み状態へ更新。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md` を作成し、Vault/署名URL/画像スロットル要件と次回 RUN_ID 計画を記録。

- [ ] **Task-F: PHR Phase-C/D/E 実測証跡取得** — 進行率 70%（RUN_ID=20251119TorcaPHRSeqZ1 / PKCS#12 pass 更新済, HTTP 405/404 まで取得）。テンプレ展開・証跡格納・`serverinfo/claim_conn.json`・`wildfly/phr_20251119TorcaPHRSeqZ1.log`・`screenshots/phr-0X_*_response.png` を更新済。残タスクは Modernized REST（WildFly）経路で 200/403＋`d_audit_event` を取得すること。
  - [x] RUN_ID 発行＋テンプレ展開、`artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/README.md` / `httpdump` / `trace` / `serverinfo` / `wildfly` / `screenshots` を作成。
  - [x] `docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md`（新規）と `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` §7.3、`docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md` Pending 表を更新。`PHASE2_PROGRESS.md` / `DOC_STATUS.md` W22 行に RUN_ID と HTTP 405/404 状態を反映。
  - Blocker: ORCA 本番 `/20/adm/phr/*` が未開放のため HTTP 405/404 が上限。Phase-A/B/C/D/E の PKCS 再測および `serverinfo/claim_conn.json` / `wildfly/phr_20251119TorcaPHRSeqZ1.log` / `screenshots/phr-0{6,7,11}_response.png` までは完了済で、残タスクは Modernized REST 実装＋`d_audit_event` 取得。
  - [x] Ops (#ops-secrets) から正しい PKCS#12 passphrase を受領し、Phase-A/B/C/D/E を 2025-11-15〜11-19 に再実施（遅延時は ORCA 週次で共有済）。
  - [x] `docker-compose.modernized.dev.yml` で modernized server を起動し、`serverinfo/claim_conn.json` と `wildfly/phr_*.log` を取得（`claim_conn.error` の `Could not resolve host` は解消）。
  - [x] 再実測後に `httpdump/`, `trace/`, `screenshots/`, `logs/phr_container_summary.md`, `audit/sql/PHR_*.sql` を実応答へ差し替え、Runbook §4.3.2 / 週次ドキュメントを再同期。

- [x] **Task-G: PHRContainer DTO & Fallback テストレビュー** — 完了（RUN_ID=20251121TtaskGImplZ1）。DTO 注釈・署名付き URL フォールバック・`PHRResourceTest` 追加を実装し、Blocker を解消。
  - [x] `common/src/main/java/open/dolphin/infomodel/PHRContainer.java` を確認し、Jackson 注釈と `List.copyOf` ベース null ガードの欠落を `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` フェーズFと `logs/2025-11-20-phr-dto-review.md` に記録。
  - [x] `PHRResource#toJobResponse` / `HmacSignedUrlService` の SignedUrl フォールバック未実装・Secrets fail-fast 不足・監査イベント (`PHR_SIGNED_URL_{ISSUED,NULL_FALLBACK,ISSUE_FAILED}`) 欠如をレビューしてログ化。
  - [x] `PHRResourceTest` に SignedUrl null/例外ケースが無いことを報告し、監査アサーション要件を定義。
  - [x] フォロー①: PHRContainer DTO に `@JsonInclude(Include.NON_EMPTY)` 付与と defensive setter (`List.copyOf`) 実装済み。
  - [x] フォロー②: `PHRResource#toJobResponse` に SignedUrlService 失敗時フォールバック＋監査イベント出力を追加済み（`PHR_SIGNED_URL_{ISSUED,ISSUE_FAILED,NULL_FALLBACK}`）。
  - [x] フォロー③: `HmacSignedUrlService` 等で Secrets 未設定なら即例外＋ `PHR_SIGNED_URL_ISSUE_FAILED` 監査記録（OpsSec 連携）を実装。
  - [x] フォロー④: `PHRResourceTest` へ SignedUrl null/例外ケース＋監査アサーションを追加し、`PHR_SIGNED_URL_NULL_FALLBACK` をカバー。

## 3. DOC_STATUS 反映ルール
- タスク完了時は `docs/web-client/planning/phase2/DOC_STATUS.md`「モダナイズ/外部連携（ORCA）」の W22 行に以下を更新する。
  - `主な変更`: 完了タスク名・RUN_ID・更新ファイルパス（例: `Task-A (RUN_ID=20251114TaspCtxZ1) web.xml/context-param 反映`）。
  - `次回アクション`: 残タスクやレビュー予定（例: `Task-B 優先度レビュー待ち`）。
- 反映後は本チェックリストで該当チェックボックスを更新し、更新日時と担当を記す。

## 4. 進捗報告テンプレート（ワーカー向け）
```
【ワーカー報告】
タスクID: Task-A/B/C
完了度: 100% / 進行率% / Blocked
更新ファイル: `path1`, `path2`, ...
RUN_ID / 証跡: RUN_ID=..., `docs/.../logs/...`
DOC_STATUS反映: 行・変更内容
残課題/支援依頼: （あれば箇条書き）
```

## 5. 運用メモ
- マネージャーは週次棚卸しや ORCA レビュー前に本ファイルを参照し、チェック項目の進捗と依存関係を確認する。
- 新規指示や Blocker が生じた場合、該当タスク配下にサブタスクを追加し、RUN_ID とログパスを即時記録する。
- Task-A/B/C 完遂後は次フェーズ（PHR Export, Demo/Dolphin API 実装）に備え、同形式でタスクを追加する。

## 6. 参照ドキュメントマップ
| 種別 | ドキュメント | 役割 / 更新トリガ |
| --- | --- | --- |
| 設計・棚卸し | `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`<br/>`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` | Sprint2 設計と 1:1 パリティ表。タスクA/B/C 更新時に該当セクションを必ず修正。 |
| PHR 実装計画 | `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md` | フェーズA〜F の依存と Blocker。Task-B/C 完了後も RUN_ID を追記。 |
| Runbook & テンプレ | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2/4.4<br/>`artifacts/orca-connectivity/template/phr-seq/README.md` | PHR RUN_ID テンプレ・証跡構造。新テンプレ追加時に更新。 |
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-15-phr-seq-phaseAB.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md` ほか | RUN_ID ごとの結果。再実測後は新規ログファイルを作成しリンクする。 |
| API ドキュメント集約 | `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` | Demo/Dolphin/PHR ASP 設計の一次情報。タスクAの更新内容を同期。 |
| 公式仕様 | `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md` | ORCA 仕様アーカイブ。API 差分調査時に参照。 |
| 棚卸し & 割当 | `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行<br/>`docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | ORCA 外部連携行の更新／マネージャー割当一覧。進捗更新時は両方を同期。 |

> 参照マップに記載した資料へリンクを追加・削除した場合は、同日に `PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と本チェックリスト双方を更新する。

> 最終更新: 2025-11-19 / 担当: Codex（Phase2 ORCA 連携マネージャー）
