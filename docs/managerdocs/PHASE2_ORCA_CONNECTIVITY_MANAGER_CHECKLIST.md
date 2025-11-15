# Phase2 ORCA Connectivity Run マネージャーチェックリスト（Trial サーバー重視プラン）

## 1. 背景と基本方針
- 接続先は WebORCA トライアルサーバー `https://weborca-trial.orca.med.or.jp` のみ。Basic 認証 `trial/weborcatrial` を共通で利用し、firecrawl で取得した公式 API 仕様（`docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/*.md`。例: `acceptancelst.md`, `appointmod.md`, `acceptmod.md`, `medicalmod.md`）に基づき、トライアル上で提供されている API を XML payload で実行する。
- トライアル環境の制約・利用不可機能は `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`（Snapshot 2025-11-19）を唯一の根拠とし、「お使いいただけない機能一覧」に記されている項目のみ Blocker として扱う。それ以外の API／業務機能はすべて正常に利用できる状態へ整える。
- CRUD 証跡は必ず `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` と `artifacts/orca-connectivity/<RUN_ID>/{README.md,dns,tls,crud,ui}` に保存し、`docs/web-client/planning/phase2/DOC_STATUS.md` 行 71-75（モダナイズ/外部連携（ORCA））を更新する。
- UI スクリーンショットは GUI 端末が確保できた場合のみ任意取得。CLI 環境しか使えない場合は「UI 未取得（CLI 制約）」と記録したうえで API 実測に専念する。

## 2. タスクボード
- [ ] **タスクA: seed / データ健全性確認**  
  - トライアル UI（スター → 01 医事業務）の seed 情報（患者 `00000001`、医師 `00001`、保険 `06123456`、直近日受付・予約・診療行為）を確認し、結果を `artifacts/orca-connectivity/<RUN_ID>/data-check/` に残す。CLI で UI を開けない場合は試行日時・再開条件のみ記録。
  - seed が欠落していたら trialsite で許可されている UI 操作（外来受付登録など）で補完し、補完不可な場合は Blocker（trialsite 該当節）としてログへ記載。

- [ ] **タスクB: API カバレッジ設計（firecrawl 仕様 ↔ Trial サーバー）**  
  - firecrawl 仕様一覧（`docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/*.md`）を走査し、公開 API を「Trial 提供」「Trial 非提供（trialsite で禁止）」に区分する。結果は `artifacts/orca-connectivity/<RUN_ID>/coverage/coverage_matrix.md` と `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` 冒頭へ貼付。
  - 「Trial 提供」カテゴリはすべてタスクCで実測する。「Trial 非提供」は Blocker リストへ追加し、trialsite の引用節・firecrawl 仕様の更新日を併記する。

- [ ] **タスクC: Trial サーバー CRUD 実測（XML）**  
  - DNS/TLS 事前確認: `nslookup weborca-trial.orca.med.or.jp` と `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` を RUN_ID ごとに取得し、`artifacts/.../{dns,tls}` とログへ保存。
  - `curl -vv -u trial:weborcatrial -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @payloads/<api>_trial.xml <endpoint>` で firecrawl 仕様に記載された API (例: `/api01rv2/acceptlstv2?class=01`, `/api01rv2/appointlstv2?class=01`, `/api/api21/medicalmodv2?class=01`) を実行。HTTP ステータス、`Api_Result`, `Allow` ヘッダー、レスポンス XML を `artifacts/.../crud/<api>/` に保存し、ログへ反映する。
  - Endpoint が HTTP 404/405 を返した場合も Trial サーバー結果としてログ化し、タスクDへ Blocker として引き継ぐ（ローカル ORCA での再検証は行わない）。

- [ ] **タスクD: Trial 非提供（Blocker）管理**  
  - trialsite「お使いいただけない機能一覧」および firecrawl 仕様の未提供記載を根拠に、Trial 上で利用できない API 一覧を `artifacts/orca-connectivity/<RUN_ID>/blocked/README.md` にまとめる。
  - Blocker 登録時は (1) Endpoint, (2) HTTP ステータス／メッセージ, (3) 引用した trialsite 節 or firecrawl 節, (4) 再開条件（「Trial サーバー側で提供開始」など）をログと DOC_STATUS に記載する。

- [ ] **タスクE: ドキュメント整備・棚卸し**  
  - `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3 に Trial サーバー前提の手順／Blocker 対応を追記し、firecrawl 仕様との突合状態を明記。
  - `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` と `docs/web-client/planning/phase2/DOC_STATUS.md` 行 71-75 / 79-84 に進捗を反映し、Trial Blocker や完了項目を同期。

## 3. 進捗確認（Checkpoints）
- **Check A**: seed 確認メモと CRUD ログの整合。trialsite 禁止操作は必ず引用付きで Blocker 化できているか。
- **Check B**: firecrawl 仕様 ↔ Trial カバレッジ表が作成され、Trial 提供 API はすべてタスクCにエントリが作成されているか。
- **Check C**: DNS/TLS 証跡と `curl ... --data-binary @payloads/*.xml` の証跡が RUN_ID ごとに `artifacts/.../crud/` へ残っているか。HTTP 404/405 も Trial 結果として扱われているか。
- **Check D**: Blocker 管理（trialsite 引用節、firecrawl 節、再開条件、ログ↔DOC_STATUS の同期）ができているか。
- **Check E**: Runbook / DOC_STATUS / Assignment Overview / coverage_matrix が同じ日付で更新されているか。

## 4. 【ワーカー報告】テンプレ
1. RUN_ID（ドキュメントのみは `RUN_ID=NA`）  
2. 実施内容: UI 手順 / `curl -vv ... --data-binary @payloads/<api>_trial.xml` / 編集したドキュメント  
3. 使用端末 + DNS/TLS 結果（WSL2, macOS など）。GUI が使えない場合はその旨と再開条件を記録。  
4. 証跡ディレクトリ（`artifacts/.../{dns,tls,crud,ui,coverage,blocked}`、`logs/...`）と保存したファイル。  
5. trialsite／firecrawl 仕様の引用節（更新日含む）と、「Trial 提供 or Trial 非提供」の区分。  
6. `DOC_STATUS.md` 更新有無と該当行。

## 5. 参照ドキュメント
| 種別 | ドキュメント | 役割 |
| --- | --- | --- |
| Trial Runbook | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` | Trial CRUD 手順・RUN_ID 管理 |
| trialsite 公式案内 | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` | 利用可否・注意事項 |
| firecrawl 仕様 | `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/*.md` | API パラメータ／レスポンス仕様 |
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`、`artifacts/orca-connectivity/20251120Trial*/` | DNS/TLS/CRUD/Blocked 記録 |
| 棚卸し | `docs/web-client/planning/phase2/DOC_STATUS.md` 行71-75 / 79-84 | Trial 進捗・Blocker 管理 |
| 割当状況 | `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | ORCA 接続領域の割当 |

> 最終更新: 2025-11-21 / 担当: Codex（Phase2 ORCA 接続マネージャー）
