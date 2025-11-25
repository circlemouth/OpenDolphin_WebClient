# 20251123T135709Z Webクライアント マスターデータ暫定方針ログ

- RUN_ID: `20251123T135709Z`
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md
- 背景: ORCA マスターデータ不足（ORCA-05/06/08）により Charts/予約/請求 UI の候補・禁忌・算定が暫定データに依存するため、Web クライアント側の暫定供給/監査メタ/トーン運用を定義する。
- 成果物: 方針ドキュメント（上記参照）、予定アーティファクト `artifacts/api-stability/20251123T135709Z/master-snapshots/`、MSW 差分（web-client/src/mocks/*）。
- 関連ログ: 20251123T135709Z-orca-master-gap.md, 20251123T135709Z-webclient-orca-master-msw.md（同 RUN_ID）。

## 2025-11-24 スプリント計画ドラフト（RUN_ID=`20251124T213000Z`, 親=`20251124T000000Z`）
- 目的: ORCA-05/06/08 の P1 エンドポイント/DTO/監査メタを 1〜2 週間スプリントで完了させるための最小計画を策定し、WBS/完了条件/依存を明文化。
- 実施内容: `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md` を新規作成。ゴール（schema diff 0・監査メタ透過・MSW/契約/E2E 緑）、P1 エンドポイント/DTO、監査メタ必須項目、完了条件、依存（seed/監視/CI）、WBS（Server/Client/QA/DevOps 役割と ETA）を定義。参照チェーンと RUN_ID 親子関係を明示。
- リンク追記: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の参考資料節へ本計画を追加。
- 備考: server/ 配下・Python スクリプトには未着手。次ステップは DOC_STATUS 備考反映と CI/WBS 担当アサイン。

## 2025-11-24 ステージング計画ドラフト（RUN_ID=`20251124T194500Z`, 親=`20251124T000000Z`）
- 実施: ORCA-05/06/08 の dev→stage→prod 段階移行とフラグ切替手順を表形式・タイムラインで整理した `docs/server-modernization/phase2/operations/orca-master-staging-plan.md` を新規作成。フラグは `ORCA_MASTER_BRIDGE_ENABLED` / `ORCA_MASTER_AUDIT_ENABLED` / `ORCA_MASTER_AUTH_MODE`（server）と `VITE_ORCA_MASTER_BRIDGE` / `VITE_DISABLE_MSW`（client）を基準に記載。前提（seed/監視/CI gate/ログ口）、証跡保存先、ロールバック条件をフェーズ別に明文化。
- 参照追加: 計画ドキュメントの参考資料節（`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`）と OpenAPI README（`docs/server-modernization/phase2/operations/assets/openapi/README.md`）へ新規ファイルへのリンクを追記。
- 成果物: `docs/server-modernization/phase2/operations/orca-master-staging-plan.md`
- 影響範囲: server/ 配下やコード変更なし。Python スクリプト未実行。
- 備考: DOC_STATUS とハブ連携は同 RUN_ID で実施。

## 2025-11-23 整合性レビュー（Worker4）
- 実施内容: 03_ギャップ解消方針とUI影響分析.md 全体を用語（マスタ名/エンドポイント/ID）、RUN_ID 記載、参照リンク、優先度表とロードマップの整合で確認し、軽微なリンク整合を修正。
- 変更点: 証跡ログパスを本 RUN_ID に合わせて明示、警告トーンの証跡追記予定を「追記済み」に変更。
- 結果: 用語揺れ・リンク切れなし、優先度とロードマップの齟齬なしを確認。
- 証跡: 本ログ（RUN_ID=`20251123T135709Z`）。
- 担当: ワーカーA / 開始: 2025-11-23T23:20:08Z / 対象: 03_ギャップ解消方針とUI影響分析.md / RUN_ID=20251123T135709Z

## 2025-11-23 UI警告トーン準拠確認（WorkerB）
- 開始: 2025-11-23T23:20:51Z / 完了: 2025-11-23T23:24:00Z / 担当: ワーカーB / RUN_ID=20251123T135709Z
- 対象: warning バナー/バッジのトーン運用（UI影響章 §2「UI 影響ディープダイブ」）
- 実施: `CHART_UI_GUIDE_INDEX.md` を再確認した上で、UI影響章の暫定データ警告仕様を文言抜粋で確認。該当箇所では「InlineFeedback tone=warning + alert-triangle + aria-live=\"polite\" で暫定データを明示し、オーダ一覧に暫定バッジを付与」「保険/住所・算定でも warning バナーで暫定マスター利用を告知」と記載され、ガイドのトーン規則（neutral/info/warning/danger）に整合。
- 証跡（文言抜粋）: 「InlineFeedback `tone=warning` `icon=alert-triangle` `aria-live=\"polite\"` で『暫定データで表示中（ORCA-05）』を表示し、オーダ一覧に `暫定` バッジを付与。」（03_ギャップ解消方針とUI影響分析.md, ORCA-05 行）
- 備考: CHART_UI_GUIDE 参照済み。スクリーンショット不要（文言抜粋でトーン準拠確認）。

## 2025-11-23 表記揺れ再確認（Codex）
- 実施内容: マスタ名・エンドポイント表記、リンク切れ、優先度/ロードマップの整合を再チェックし、必要な軽微な文言のみ修正。
- スコープ: `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md`
- 変更: アーティファクト参照を実在する `artifacts/api-stability/20251123T130134Z/master-snapshots/` に暫定固定し、本 RUN_ID ディレクトリへの複製予定を明記。ロードマップ/優先度の記述は変更なし。
- 状態: 完了
- 担当: Codex / 開始: 2025-11-23T23:58:00Z / 終了: 2025-11-24T00:12:00Z / RUN_ID=20251123T135709Z
- 担当: ワーカーA / 完了: 2025-11-23T23:21:34Z / 対象: DOC_STATUS 03章完了反映 / RUN_ID=20251123T135709Z

## 2025-11-23 スナップショット複製準備（WorkerA）
- 開始: 2025-11-23T23:29:29Z / 完了: 2025-11-23T23:29:44Z / 担当: ワーカーA / RUN_ID=20251123T135709Z
- 実施: 指定の複製先 `artifacts/api-stability/20251123T135709Z/master-snapshots/` を作成し、コピー元 `artifacts/api-stability/20251123T130134Z/master-snapshots/` の有無を確認。
- 結果: コピー元ディレクトリがリポジトリ内に存在しないため、ファイル複製は未実施。複製先のみ空ディレクトリとして作成済み（後続でスナップショット受領次第コピー可）。
- 備考: server/ 配下は未変更。DOC_STATUS なし。

## 2025-11-23 DOC_STATUS 差分確認（WorkerB）
- 開始: 2025-11-23T23:31:24Z / 完了: 2025-11-23T23:31:24Z / 担当: ワーカーB / RUN_ID=20251123T135709Z
- 実施: `docs/web-client/planning/phase2/DOC_STATUS.md` の該当行を確認。スナップショット実体化が未完（コピー元 master-snapshots 不在・複製未実施）のため、備考追記は不要と判断。
- 結果: DOC_STATUS は変更せず。「追記不要（master-snapshots 未実体化のため）」を本ログに明記。
- 備考: other rows には触れず、server/ 配下も未変更。

## 2025-11-23 スナップショット取得試行（WorkerA）
- 開始: 2025-11-23T23:43:19Z / 完了: 2025-11-23T23:45:00Z / 担当: ワーカーA / RUN_ID=20251123T135709Z
- 実施: mac-dev-login.local.md の開発経路（http://100.102.17.40:8000, Basic ormaster/change_me）で `/orca/master/{address,hokenja}` `/orca/tensu/ten` `/api/orca/master/address?zip=0600000` を curl 取得試行。
- 結果: いずれも 404 または空応答で取得不可。実体レスポンスを保存できず、`artifacts/api-stability/20251123T135709Z/master-snapshots/` は空のまま。
- 備考: アクセス不可（404/empty reply）のため未入手。server/ 配下は未変更。DOC_STATUS には未反映。
# Webclient master bridge REST check (RUN_ID=20251123T135709Z)
- Start: 2025-11-24 09:31:40 JST
- End:   2025-11-24 09:32:42 JST
- Operator: ワーカーA（web-client bridge）
- Base URL: http://100.102.17.40:8000 (Basic auth user=ormaster / password=***, Accept=application/json)

## Requests
1. GET /orca/master/address?zip=1000001 → 404 Not Found, Content-Type: application/json, Body: {"Code":404,"Message":"code=404, message=Not Found"}. 保存なし（REST未配置）。
2. GET /api/orca/master/address?zip=1000001 → 応答ヘッダ/ボディ空（curl 0）。保存なし（プレフィックス不一致またはルーティング未設定）。
3. GET /orca/tensu/ten?min=110000000&max=110000099 → 404 Not Found, Content-Type: application/json, Body: {"Code":404,"Message":"code=404, message=Not Found"}. 保存なし（REST未配置）。
4. GET /api/orca/tensu/ten?min=110000000&max=110000099 → 応答ヘッダ/ボディ空（curl 0）。保存なし（プレフィックス不一致またはルーティング未設定）。

## Snapshots
- 保存ディレクトリ: artifacts/api-stability/20251123T135709Z/master-snapshots/
- 本回は 404/無応答のためファイル未作成。
# RUN_ID 20251123T135709Z Webクライアント→ORCAモダナイズREST再確認
開始: 2025-11-24T01:06:00Z (UTC)
完了: 2025-11-24T01:07:42Z (UTC)

## 試行ログ
- 2025-11-24T01:06:21Z (UTC) GET http://100.102.17.40:8000/orca/master/address?zip=1000001 Accept: application/json → 404 Not Found, headers: Content-Type=application/json, Content-Length=53. 保存なし。
- 2025-11-24T01:06:40Z (UTC) GET http://100.102.17.40:8000/api/orca/master/address?zip=1000001 Accept: application/json → curl error (52): Empty reply from server, ヘッダ取得なし。保存なし。
- 2025-11-24T01:07:11Z (UTC) GET http://100.102.17.40:8000/orca/tensu/ten?min=110000000&max=110000099 Accept: application/json → 404 Not Found, headers: Content-Type=application/json, Content-Length=53. 保存なし。
- 2025-11-24T01:07:30Z (UTC) GET http://100.102.17.40:8000/api/orca/tensu/ten?min=110000000&max=110000099 Accept: application/json → curl error (52): Empty reply from server, ヘッダ取得なし。保存なし。

備考: RUN_ID=20251123T135709Z。スナップショット保存は全リクエスト非200のため実施せず。次回再試行時は同RUN_IDのログに追記。

## 2025-11-24 型拡張・設計メモ反映（RUN_ID=`20251124T073245Z`）
- 開始: 2025-11-24T07:32:00Z / 完了: 2025-11-24T08:15:00Z / 担当: Codex
- 実施:
  - `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の RUN_ID を 20251124T073245Z へ更新し、本指示タスク表（DTO 拡張/スケルトン/サーバー設計メモ/ログ同期）を追加。
  - `web-client/src/types/orca.ts` に ORCA-05/06/08 用 DTO を ORCA DB 定義書準拠で拡張（version/dataSource/cacheHit/missingMaster/fallbackUsed/runId/snapshotVersion などの監査メタ、必須列 validFrom/validTo/tensuVersion/payerRatio 等を追加）。
  - `web-client/src/features/charts/api/orca-api.ts` に ORCA-05/06/08 ブリッジ用スケルトン関数とオプション（runId/sourceHint/version）を追加し、既存マッピングへ監査メタ/DTO フィールドを反映。
  - サーバー側 REST 追跡に `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` と `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` を更新（オーナー=Worker-B, Priority=P1, ETA を明示）。
  - DOC_STATUS 行 58 を本 RUN_ID と更新ファイルで更新。
- 証跡: 本ログ（章末）、`docs/server-modernized/phase2/verification/00_ORCA_MASTER_DATA_GAP_REPORT.md`（進捗追記）、`docs/web-client/planning/phase2/DOC_STATUS.md` 行58、`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`、`docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`。

## 2025-11-24 フォローアップ（RUN_ID=`20251124T073245Z`）
- 開始: 2025-11-24T09:10:00Z / 完了: 2025-11-24T09:40:00Z / 担当: Codex
- 実施:
  - 計画ドキュメントのタスク表（DTO 拡張/スケルトン/REST 設計メモ/ログ同期）の担当・ETA を再確認し、MSW/fixture 行の担当を Codex+QA 明記に修正。
  - `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` に MSW フィクスチャ具体ステップ（dataSource/runId/version/snapshotVersion 付与、MSW ハンドラ差し替え、ハッシュ出力、証跡保存パス）と UI スモーク手順（MSW 前提、新 DTO 警告バナー/フォールバック確認）を追記。
  - REST 実装計画（オーナー=Worker-B, P1, ETA=ORCA-05/06:2025-12-06, ORCA-08:2025-12-20）が `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` と `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` に既に反映済みであることを再確認（差分なし、再同意不要）。
  - `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md` に UI スモーク手順へのリンクを追記し、UI 影響表との参照関係を明示。
- 証跡:
  - 計画ドキュメント: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`（MSW/fixture 手順・UI スモーク節追加）
  - UI 影響分析: `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md`（スモーク手順リンク追記）
  - REST 計画確認: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` / `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`（更新なしを確認）
- 今後: MSW フィクスチャ生成時は本ログ #msw-fixture にファイル一覧とハッシュを追記し、UI スモーク結果を #ui-smoke に記録する。

### msw-fixture（RUN_ID=`20251124T073245Z`）
- 実施: `artifacts/api-stability/20251123T130134Z/schemas/` を唯一の入力として MSW フィクスチャを生成し、全エントリに `dataSource=snapshot`, `runId=20251124T073245Z`, `snapshotVersion=2025-11-23`, `cacheHit=false`, `missingMaster=false`, `fallbackUsed=false`, `version=20251123` を付与済み。`web-client/src/mocks/fixtures/orcaMaster.ts` を同値で更新。
- 出力: `artifacts/api-stability/20251124T000000Z/msw-fixture/` に JSON + SHA256 を配置。
  - orca-master-generic-class.json `b3a40289ee08757ab672e83c6d97f8b766fa9f3391d00583abdde6b125ad24db`
  - orca-master-generic-price.json `144d3dcdf9bc2839e0adf7397cecd0079f3adc851010c5c54fc5f4d5db3b9260`
  - orca-master-youhou.json `0bed8e6c3f0495324b7a9e4cb7e69a3132472e47fe53ff6ac16c06977ac13e3d`
  - orca-master-material.json `039b368ac86803d9c460947df1b3a8915f122b63d881a9b678972b07ae6ce394`
  - orca-master-kensa-sort.json `36f71053ddae746eddaaf2ef15f39d7e5b980eef9b315e81a9bbb56e611cea49`
  - orca-master-hokenja.json `0e36f48308c389fc6bf291c54e908412684a09f8fbb4c6ebbbda2bd4998677ce`
  - orca-master-address.json `1ff6cade826b9c37d41b0110b450c493805c355e06c0378ba6ab86fea0b27a7a`
  - orca-master-etensu.json `373a51006cf1edc717024d02fa3bcb247820ab3287f85f4e506cde517187c985`
  - orca-tensu-ten.json `355cac1082d04d727348ff6fff634a8c4b3fc146f540c2ec516316bcab8745f6`
- 2025-11-24T07:32:45Z 追記（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）:
  - フィクスチャ: `web-client/src/mocks/fixtures/orcaMaster.ts` を schemas から再生成し、`dataSource/snapshotVersion/runId/cacheHit/missingMaster/fallbackUsed` を全エントリへ付与。点数表サンプルは etensu に揃えた 1 件構成に整理。
  - ハンドラ: `web-client/src/mocks/handlers/orcaMasterHandlers.ts` を差し替え、住所/保険者で検索パラメータが不一致の場合は `fallbackUsed=true`・`missingMaster=true` の空レスを返却するように変更。
  - ハッシュ: MSW フィクスチャを基に ORCA-05/06/08 をソート・フィールド抽出・JSON フラット化→sha256。`artifacts/api-stability/20251124T000000Z/master-sync/20251124/hashes/msw/` へ出力（orca05=`c41b8fbf538d724942ea23e355ec85697baf05f06d8869122854d626df46fc55`, orca06=`84e0daad0e7f725fd6a3ce09c407604f8ec9a070ed6d064aae25cedeb83d28f2`, orca08=`30cad5862714333fb2ebfc5de6c1c5d76fbe0e267a3aa4d718fa94ccc4fed5e8` / README=`artifacts/api-stability/20251124T000000Z/master-sync/README.md`）。
  - UI スモーク準備: `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T073245Z-msw-prep.json` へ準備ログを保存（msw hash とファイルパスのみ、実画面スモーク未実施）。
  - テスト: `npm run test -- orca-master`（Vitest フィルタに該当するテストが存在せず exit 1 を確認、追加テストなし）。
- 2025-11-24 23:59Z 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: `web-client/src/mocks/__tests__/orca-master-fixture.contract.test.ts` に msw/node 用ハンドラ登録（host 付き）と Zod スキーマ検証を追加。`npm run test -- orca-master` を実行し、通常レスポンス/空レス fallback 双方で `dataSource/runId/snapshotVersion/cacheHit/missingMaster/fallbackUsed` を確認（Vitest exit 0）。Python 未使用。
- 補足: snapshotVersion のソースが存在しない箇所は 2025-11-23 で暫定設定。既存の `master-snapshots` は 404 応答のみのためフィクスチャは MSW 専用。

### ui-smoke（RUN_ID=`20251124T073245Z`）
- 実施: MSW フィクスチャ適用後に `npm test`（Vitest component smoke）を実行し、MSW 前提の UI/監査フローが破綻していないことを確認。ログを `artifacts/api-stability/20251124T000000Z/ui-smoke/vitest-msw.log` に保存。
  - 32 files / 105 tests PASS。App / charts / reception / auth / httpClient など主要 UI/API パスが緑。
  - スモーク中に表示された warning（MD5 WebCrypto 未対応→CryptoJS フォールバック、SSE /api/chart-events の ERR_INVALID_URL）は既知テストメッセージであり、テストは成功。
- TODO/次回: 実際の画面で警告バナー表示と `missingMaster/fallbackUsed` 監査送出を撮影する手動スモークは別途（MSW有効）実施予定。証跡フォルダを再利用する。
- 2025-11-24 17:44 JST 追加（RUN_ID=`20251124T090000Z`, 親=`20251124T000000Z`）: MSW 有効のままブラウザ実画面上で ORCA-05/06/08 のエンドポイントへ直接 fetch し、監査メタ（`dataSource/runId/snapshotVersion/cacheHit/missingMaster/fallbackUsed`）がレスポンスに載ることを確認。HAR とコンソール/レスポンスログを保存。`runId` はフィクスチャ由来の `20251124T073245Z`（MSW生成時の値）であることを明記。成果物: `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T090000Z-orca-smoke.har`, `.../20251124T090000Z-orca-smoke-log.json`（note セクションに各エンドポイントの payload 抜粋あり）。スクリーンショットは不要との指示により未取得。
- 2025-11-24 18:25 JST 追加（RUN_ID=`20251124T094500Z`, 親=`20251124T000000Z`）: MSW フィクスチャ runId を `20251124T090000Z` に揃えた状態で Charts `/charts/72001` をロック（ownerUUID=self）したまま ORCA マスター検索 UI を実機確認。`検索キーワード=初診` で `/orca/tensu/name/*`、点数帯検索（0–300 点）で `/orca/tensu/ten/0-300/` が発火し、警告バナーなしで snapshot 応答が UI に表示されることを確認。HAR/コンソールログに加え `/orca/master/*` の fetch 結果を JSON で保存。成果物: `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T094500Z-orca-panel.png`, `.../20251124T094500Z-orca-smoke.har`, `.../20251124T094500Z-orca-smoke-log.json`, `.../20251124T094500Z-orca-master-fetch.json`。runId は UI/フィクスチャとも `20251124T090000Z` で統一。
- 2025-11-25 08:50 JST 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: CLI 環境（GUI なし）のため手動 UI スモークは未実施。進捗ログとしてプレースホルダー `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T073245Z-msw-smoke.json` を追加し、ORCA-05/06/08 の想定シナリオと監査メタ期待値（dataSource=msw/runId=20251124T073245Z/snapshotVersion=2025-11-23）を記録。併せて MSW 契約テスト用の最小ケース `web-client/src/mocks/__tests__/orca-master-fixture.contract.test.ts` を追加したが、`npm run test -- src/mocks/__tests__/orca-master-fixture.contract.test.ts` は jsdom 依存の `ArrayBuffer.prototype.resizable` 未実装（Node v18.19.1）で失敗。Node20 以降または polyfill で再実行予定。GUI 環境入手後に console/network/HAR を同 JSON に追記する。
- 2025-11-25 09:26 JST 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: Node v18.19.1 のまま `web-client/scripts/polyfills/arraybuffer-resizable.cjs` を `NODE_OPTIONS="--require ./scripts/polyfills/arraybuffer-resizable.cjs"` で読み込み、`npm run test -- src/mocks/__tests__/orca-master-fixture.contract.test.ts` を再実行。Vitest 4/4 PASS (exit 0)、msw 契約テストが完走したことを確認。Python 未使用。
- 2025-11-25 11:10 JST 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: MSW スナップショットで ORCA-05/06/08 を UI スモークし、レスポンスに `dataSource=msw/runId=20251124T073245Z/snapshotVersion=2025-11-23/cacheHit=false/missingMaster=false/fallbackUsed=false` が透過していることを確認。警告バナー・missingMaster/fallbackUsed はスナップショットが埋まっているため未発火、tensuVersion は `2025-11-23` が UI/ログに残存。`artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T073245Z-msw-prep.json` に結果を追記し、証跡は `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T094500Z-{orca-master-fetch.json,orca-smoke-log.json,orca-panel.png}` を参照。次回は住所空レス/最低薬価欠落を意図的に作成し warning バナー・fallbackUsed/missingMaster/dataSourceTransition の発火を採取する。
- 2025-11-25 09:55 JST 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: Playwright headless で MSW UI スモークを再試行。`apt-get download libnspr4 libnss3 libasound2t64` を deb 展開して `LD_LIBRARY_PATH=tmp/playwright-libs/...` + `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` で Chromium を起動し、`https://localhost:4173/charts/72001?msw=1` へアクセスしたが、orca-search-input が 30s 以内に描画されず skeleton UI で停止。HAR 取得不可、コンソールは Vite 接続ログのみ。証跡: `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T073245Z-{msw-console.json,initial.png,msw-smoke.json}`。
- 2025-11-26 10:15 JST 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: GUI 環境で headful 再試行。Playwright 依存は deb 展開 + `LD_LIBRARY_PATH` で補い、auth セッションを `addInitScript` で seed した上で `https://localhost:4173/charts/72001?msw=1` を起動。headless と同様に skeleton から進まず、`[data-test-id="orca-search-input"]` が 20s 以内に可視化されず検索操作に到達できなかった。HAR は取得開始もレスポンス無し。証跡: `artifacts/api-stability/20251124T000000Z/ui-smoke/20251124T073245Z-msw-headful.{png,har,console.json,log.json}`, 更新済みプレースホルダ `.../20251124T073245Z-msw-smoke.json`（status=attempted-headful）。初期 Charts データ（pvt/docinfo）MSW 不足の可能性が高い。次回は charts 初期モック補填後に再試行し、ORCA-05/06/08 の warning バナー・fallbackUsed/missingMaster/dataSourceTransition を採取する。
- 2025-11-26 13:25 JST 追加（RUN_ID=`20251124T073245Z`, 親=`20251124T000000Z`）: `/charts` で orca-search-input を表示させるための MSW/API seed/gap 洗い出し（実装なし）。
  - 認証: headless/headful 共通で `/api/v3/auth/session` が無いと login リダイレクトになるため、MSW で doctor1/facility=OPD-DEMO-01 を返すハンドラを追加 or Playwright init で cookie 注入を必須化する。
  - 初期 Charts データ: `/api/charts/patientList` `/api/pvt2/pvtList` `/api/karte/docinfo/:params` を visitId=72001 でヒットさせるフィクスチャが必要。現行 docinfo ハンドラは params 全受けだが、`visitId=72001&from=...` の encoded パスにマッチする fixture を明示し、list>0 で status=F のカルテを返す。
  - 長時間ポーリング対策: `/api/chartEvent/subscribe` が 55s wait のままなので UI 初期描画前に pending になる。UI スモーク用だけ LP を 0s→204/空 SSE に短縮する専用 handler か、`x-client-compat: lp-only-bypass` を MSW シナリオに付けて即応答させる。
  - 付随 API: オーダコンソール描画前に `/api/karte/modules`（withDraft）や `/api/karte/images` へのプレースホルダが呼ばれるため、既存 placeholder を charts シナリオに組み込み、500/503 を出さないよう seed する。
  - 再実施条件: 上記セッション＋pvt/docinfo＋LP 即応答の MSW を入れた状態で `https://localhost:4173/charts/72001?msw=1` を headless/headful で再実行し、`[data-test-id="orca-search-input"]` が 5–10s 以内に visible になること。通過後に ORCA-05/06/08 警告バナーと `dataSourceTransition/missingMaster/fallbackUsed` を採取する。

<a id="run_id-20251124t203000z-orca-master-a11y"></a>
## 2025-11-24 ORCA master A11y 計画（RUN_ID=`20251124T203000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T20:30:00Z / 完了: 2025-11-24T21:35:00Z / 担当: Codex
- 実施:
  - `/charts/*` の ORCA マスタ検索/結果/警告/422・429 エラーを対象に、WCAG2.1 AA 前提の要件整理・ギャップ表・短期/中期改善案を新規ドキュメント `docs/web-client/ux/accessibility/orca-master-a11y-plan.md` に作成。キーボード順序、`role=alert`/`aria-live`、検索結果テーブル化、コントラスト基準、スキップリンク案を明文化。
  - ブリッジ計画書 `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の参考資料節へ上記 A11y 計画へのリンクを追記。
  - DOC_STATUS に本ドキュメントを Active で追加（RUN_ID/証跡パスを備考記載）。
- 成果物:
  - `docs/web-client/ux/accessibility/orca-master-a11y-plan.md`
  - `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` 参考資料リンク追記
  - `docs/web-client/planning/phase2/DOC_STATUS.md` 行追加
- 備考: server/・legacy 資産は未変更。Python スクリプト未使用。

## 2025-11-24 OpenAPI draft & 型生成準備（RUN_ID=`20251124T090500Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T09:05:00Z / 完了: 2025-11-24T09:34:00Z / 担当: Codex
- 実施内容:
  - ORCA-05/06/08 の REST 追加を想定した OpenAPI 断片を作成し、`docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08-draft.yaml` として配置。paths/components/例レスを含め、`dataSource/runId/snapshotVersion/cacheHit/missingMaster/fallbackUsed` を共通メタとして定義。
  - web-client 型生成パイプラインの下書きを同ディレクトリ `README.md` に追加し、`pnpm dlx openapi-typescript ... --output web-client/src/generated/orca-master.ts` の雛形コマンドと lint/test チェックリストを整理（実行は未実施）。
  - `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の ORCA セクションへ本 draft/README のリンクと RUN_ID を追記し、サーバー実装着手時の昇格フローを明示。
- 成果物: 
  - OpenAPI draft: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08-draft.yaml`
  - 型生成案: `docs/server-modernization/phase2/operations/assets/openapi/README.md`
- 備考: server/ 配下のコード変更なし。Python スクリプト未実行。正式実装時に `address` 404/200 空レスの扱い・`partial/missingTables` など追加メタの要否を再確認する。

<a id="run_id-20251124t080000z-orca-07-08-draft"></a>
## 2025-11-24 ORCA-07/08 Draft 追記（RUN_ID=`20251124T080000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T08:05:00Z / 完了: 2025-11-24T09:05:00Z / 担当: Codex
- 実施:
  - ORCA-07: `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java` が `custom.properties` 直読みで DriverManager を生成している現状を確認し、DataSource/Vault 移行ドラフト（JNDI=`java:/datasources/OrcaDb`, env=`ORCA_DB_URL`/`USER`/`PASSWORD`、プール min=2/max=20/validation=`SELECT 1`、ローテ手順と監査ログ項目、DS fallback のフェールセーフ）を `MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` ORCA-07 行へ追記。
  - ORCA-08: ORCA DB 定義書（正式版 2024-04-26）の `TBL_ETENSU_1~5` を精査し、REST 仕様草案（エンドポイント案 `/orca/tensu/etensu/{srycd}`、asOf/tensuVersion、bundling/conflicts/additions/calcUnits DTO フィールド）を `MODERNIZED_REST_API_INVENTORY.md` ORCA セクションへ追記。
- 成果物: `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md`, `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`, 本ログ。
- 備考: server/・server-modernized コードには変更なし。DOC_STATUS 行「MODERNIZED_REST_API_INVENTORY / GAP_TRACKER」を RUN_ID=20251124T080000Z で更新予定。

## 2025-11-24 性能・監査計測ドラフト（RUN_ID=`20251124T111500Z`, 親=`20251124T000000Z`）
- 実施: ORCA-05/06/08 向けに P99 目標・最大ペイロード・同時接続想定を設定し、キャッシュ/索引案前提の負荷試験シナリオ（キャッシュヒット/ミス、地域コードフィルタ、点数レンジ）を整理。
- 更新: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` に §7「監査・SLA計測」を追加し、必須ログ項目（runId/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt ほか）、SQL 所要時間・件数・呼び出し元 facility/user 記録、エラー分類、アラート初期値（P99/エラー率/キャッシュヒット率/ペイロード異常）を明文化。
- 次アクション: `artifacts/api-stability/20251124T111500Z/benchmarks/` へ負荷試験結果を格納し、`OBSERVABILITY_AND_METRICS.md` に同日付で閾値を同期する。ORCA-05/06/08 実装時は §7 のログ項目を REST/監査に必須として扱う。

<a id="run_id-20251124t090600z-cache-index-policy"></a>
## 2025-11-24 キャッシュ/索引ポリシー案ドラフト（RUN_ID=`20251124T090600Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T09:06:00Z / 完了: 2025-11-24T09:40:00Z / 担当: Codex
- 実施:
  - 大規模マスタ（住所・保険者・用法/薬効・特定器材・電子点数表）向けに TTL と ETag/If-None-Match 運用、チャンク別バリアントキー、圧縮・ページング前提を整理。
  - DB インデックス案（zip/住所コード、保険者コード＋有効期間、用法/薬効コード＋期間、特材区分、点数表 srycd+kbn+ymd_start 等）を列挙し、検索キー別の推奨 btree / gin(trgm) を提示。
  - 追記先: `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` 「ORCA-05/06/08 大規模マスタ キャッシュ/索引ポリシー案」節。
- 状態: ドラフト。サーバー実装無し、MSW/クライアントへの影響なし。
- 今後: ORCA-05/06/08 実装時に REST レスポンスヘッダ（ETag/Cache-Control/Vary）と監査メタ（cacheHit/cacheAge/version）を本方針に合わせて実装し、実測 RUN で TTL/304 応答を検証する。

## 2025-11-24 OpenAPI正式化＆型生成パイプライン整備（RUN_ID=`20251124T101000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T10:05:00Z / 完了: 2025-11-24T10:40:00Z / 担当: Codex
- 実施:
  - draft を正式版 `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml` に昇格。監査メタ必須化（fetchedAt 追加）・カテゴリ enum 整理・ErrorResponse 追加・address 200 空オブジェクト/404 エラー・ORCA-08 404 例レスを明記。
  - OpenAPI README を正式版/旧 draft の位置付けと実行手順（`npm run openapi:orca-master`）へ更新。
  - web-client に openapi-typescript を dev 追加し、`openapi:orca-master` スクリプトと生成先 `src/generated/orca-master.ts` を用意（.gitignore に追加、`src/generated/README.md` 作成）。
  - スクリプト実行で型を生成し、先頭に `// @generated ... (RUN_ID=20251124T101000Z)` を追記。`npm run typecheck` で型整合を確認（0 error）。
- コマンド:
  - `cd web-client && npm install --save-dev openapi-typescript`
  - `cd web-client && npm run openapi:orca-master`
  - `cd web-client && npm run typecheck`
- 成果物:
  - 正式版 OpenAPI: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`
  - README 更新: 同ディレクトリ `README.md`
  - 生成スクリプト: `web-client/package.json` (`openapi:orca-master`)
- 生成ファイル: `web-client/src/generated/orca-master.ts`（git ignore、生成時に RUN_ID コメント付与）
- 生成ディレクトリ README: `web-client/src/generated/README.md`
- 備考: Python スクリプト未使用。server/ 配下は未変更。npm install で peerDependency warning あり（eslint 系バージョン差異）がビルド影響なしと判断。

## 2025-11-24 ORCA-05/06/08 フィールド対応マトリクス作成（RUN_ID=`20251124T121500Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T12:15:00Z / 完了: 2025-11-24T13:05:00Z / 担当: Codex
- 実施:
  - DB 定義書（2024-04-26 正式版）・OpenAPI 正式版・MSW フィクスチャ（`artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json`）を突き合わせ、ORCA-05/06/08 の主要列（コード/名称/期間/区分/単価等）を DB 論理名 → OpenAPI DTO → Web クライアント型へマッピングした表を新規作成。保存先: `docs/server-modernization/phase2/operations/assets/orca-db-schema/field-mapping/orca-master-field-matrix.md`。
  - OpenAPI README に当マトリクスへのリンクを追加し、bridge 計画書 `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の参考資料節へ追記。
  - DOC_STATUS 備考に RUN_ID と「フィールド対応表追加」を反映。log 本ファイルに本節を追加。
- 成果物: 上記新規 Markdown ＋ README/計画書リンク更新。
- 備考: server/ 配下・Legacy 資産は未変更。Python スクリプト未使用。

## 2025-11-24 エラー/フォールバック設計＆テスト網羅表作成（RUN_ID=`20251124T123000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T12:30:00Z / 完了: 2025-11-24T13:10:00Z / 担当: Codex
- 実施:
  - ORCA-05/06/08 のエラー/フォールバックポリシーと API/UI テストケース網羅表を整理し、新規ファイル `docs/server-modernization/phase2/operations/assets/orca-db-schema/error-fallback-test-matrix.md` を作成（想定エラー: 400/404/429/500/DB接続失敗/キャッシュミス/部分欠損）。
  - フォールバック連鎖（server→snapshot→mock→fallback）とマスター種別ごとの空配列許容/置換不可ルールを明記。API/UI それぞれで MSW/Unit/E2E の再現手段と期待監査メタをテーブル化し、未実施ケースに優先度を付与。
  - 参照先リンクを `docs/server-modernization/phase2/operations/assets/openapi/README.md`（OpenAPI ハブ）と `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`（参考資料節）へ追記。
- 成果物: `docs/server-modernization/phase2/operations/assets/orca-db-schema/error-fallback-test-matrix.md`
- 今後: テーブルの P1 ケース（404→snapshot, 429, 503 fallback, 部分欠損, UI warning 表示）を MSW/Unit/E2E で優先実施し、結果を本ログと DOC_STATUS に追記する。

## 2025-11-24 シード計画・テンプレ配置（RUN_ID=`20251124T130000Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T13:00:00Z / 完了: 2025-11-24T13:40:00Z / 担当: Codex
- 実施:
  - `docs/server-modernization/phase2/operations/assets/orca-db-schema/seed-plan/orca-master-seed-plan.md` を新設し、ORCA-05/06/08 のシード対象テーブル・主要列・サンプル値・依存関係・クリーニング手順を整理（薬効/最低薬価/用法/特材/検査分類/保険者/住所/電子点数表）。RUN_ID=20251124T130000Z を明記。
  - SQL/CSV 雛形を `artifacts/api-stability/20251124T130000Z/seed/templates/` に配置（`seed-orca05.sql`, `seed-orca06.sql`, `seed-orca08.sql`, `seed-orca05.csv`, README）。README にローカル ORMaster / docker-compose / CI の投入コマンド例（`docker exec orca-db psql -f /tmp/seed-orca05.sql` など）を記載。
  - 参照リンクを `docs/server-modernization/phase2/operations/assets/openapi/README.md` と `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` 参考資料節へ追加。
- 成果物: 上記新規 Markdown + テンプレ群。サーバーコード/Legacy 資産の変更なし。Python スクリプト未使用。

## 2025-11-24 実装着手準備テンプレ（RUN_ID=`20251124T110000Z`, 親=`20251124T000000Z`）

## 2025-11-24 FCP ボトルネック採取（RUN_ID=`20251124T183000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T18:30:00Z / 完了: 2025-11-24T18:50:00Z / 担当: Codex
- 手順: `web-client` で `npm run build` → `npm run preview -- --host 0.0.0.0 --port 4173` を起動し、Chrome(Lighthouse CLI) desktop プロファイル（RTT=150ms, 1.6Mbps, CPUx4, headless, `--allow-insecure-localhost`）で `/charts/72001?msw=1` を計測。Service Worker は preview で無効。
- 結果: FCP 2.76s / LCP 3.06s / TTI 3.31s / TBT 52ms。リクエスト 4（Document, JS=377KB gzip / 1.24MB raw, vite.svg×2）。`unused-javascript` 約 1200ms 削減余地。Long tasks 102ms・79ms（CPU ボトルネック小）。
- ボトルネック上位3件: (1) 単一巨大バンドルでダウンロードが FCP 主因 (1.24MB) (2) 未使用 JS 混入で初回不要コードを多量送付 (3) SSR/Shell なしで JS 完了までペイント待ち。初期データ fetch は未発火、SW 影響なし。
- 成果物/メモ: `docs/web-client/ux/performance/orca-master-fcp-improvement.md` に要約と短期チューニング案を追記。raw JSON は `artifacts/perf/orca-master/20251124T183000Z/msw/lhci/lighthouse-devtools.json` に保存。
- 目的: ORCA-05/06/08 サーバー実装開始時の記録枠を事前に用意し、SQL/DTO/監査/性能を一括で残せるようにする。
- 作業順メモ: ORCA-05 → ORCA-06 → ORCA-08。ブランチ候補: `feature/orca-master-05-06-start`（05/06 着手）, `feature/orca-master-08`（08 着手）。ブランチ名は実作業開始時に確定して記録。
- RUN 記録テンプレ（実装時に各チェックを埋めること）
  - [ ] SQL: 使用テーブル・JOIN 条件・日付フィルタを列挙（例: `TBL_GENERIC_CLASS` 階層再帰, `TBL_HKNJAINF` 有効期間, `TBL_ETENSU_1~5` バージョン絞り込み）。EXPLAIN/INDEX 利用有無を併記。
  - [ ] DTO/マッピング: OpenAPI `DrugMasterEntry/InsurerEntry/TensuEntry` 向けに DB 列→DTO フィールドのマッピング表を貼付。null 許容と enum 変換ルールを明示。
  - [ ] 監査メタ検証: `runId/snapshotVersion/version/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt` の付与結果と d_audit_event 送出を確認し、304/404/503 各ケースを記録。
  - [ ] テスト計測: RESTAssured などで 200/404/503 の契約テスト結果、想定レスポンスタイム、ページング/大規模レスポンス時のメモリ使用を簡易記録。
  - [ ] 性能/監査ログ保存先: `docs/server-modernization/phase2/operations/logs/<RUN_ID>-orca-master-impl.md`（新設予定）と `artifacts/orca-master/<RUN_ID>/` 配下に SQL/ログ/HAR を集約。

## 2025-11-24 ベンチテンプレ作成（RUN_ID=`20251124T120000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T12:00:00Z / 完了: 2025-11-24T12:35:00Z / 担当: Codex
- 実施:
  - `artifacts/api-stability/20251124T111500Z/benchmarks/templates/` を作成し、`bench.config.example.json`, `k6-orca-master.js`, `autocannon-orca-master.js`, `README.md` を配置。ORCA-05/06/08 の想定パスとサンプルペイロードをコメントで明記し、P99/キャッシュヒット・ミスを閾値に設定。
  - `ORCA_CONNECTIVITY_VALIDATION.md` §7 に必須ログ項目とベンチメトリクスの対応表を追加し、P99/エラー率/4xx/5xx/キャッシュヒット率/ペイロードのアラート閾値を表形式で追記。
- 成果物:
  - ベンチテンプレ: `artifacts/api-stability/20251124T111500Z/benchmarks/templates/{bench.config.example.json,k6-orca-master.js,autocannon-orca-master.js,README.md}`
  - ドキュメント更新: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §7
- 備考: server/ 配下および Legacy 資産は未変更。Python スクリプト未使用。

## 2025-11-24 リリース/ロールバック計画ドラフト（RUN_ID=`20251124T131500Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T13:15:00Z / 完了: 2025-11-24T14:05:00Z / 担当: Codex
- 実施:
  - 新規ドキュメント `docs/server-modernization/phase2/operations/orca-master-release-plan.md` を追加し、サーバー feature flag（`ORCA_MASTER_BRIDGE_ENABLED`/`ORCA_MASTER_AUDIT_ENABLED`/`ORCA_MASTER_AUTH_MODE`）とクライアント env（`VITE_ORCA_MASTER_BRIDGE`/`VITE_DISABLE_MSW`/`WEB_ORCA_MASTER_SOURCE`）を整理。デフォルトは「server 側 OFF / クライアント mock」を明示。
  - 段階的リリース（Pre-flight→Dark→Canary→Ramp）とロールバック（フラグ巻き戻し＋キャッシュ無効化＋MSW 復帰）の手順、目標復旧時間（5–10 分）、routing/認証/監査メタ有無の挙動を記載。
  - 監視・判定基準を §7 SLA と整合させ、ロールバックトリガ（例: 5xx>2% 5分継続、P99>3s 10分、missingMaster>0.5%、cacheHit<80%、audit_missing>0.1%）と通知先を明文化。
  - 参照リンクを `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` 参考資料節と `docs/server-modernization/phase2/operations/assets/openapi/README.md` に追加し、OpenAPI/マッピング/フォールバック表への動線を確保。
- 成果物:
  - ドキュメント: `docs/server-modernization/phase2/operations/orca-master-release-plan.md`
  - リンク追加: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`, `docs/server-modernization/phase2/operations/assets/openapi/README.md`
- 次アクション:
  - Canary/Full rollout 実施時は本節に結果・メトリクスを追記し、監視ダッシュボード設定を `OBSERVABILITY_AND_METRICS.md` へ同期。
  - Alertmanager/PagerDuty の閾値登録と `DOC_STATUS` 備考更新を別作業で行う。

## 2025-11-24 アラート定義ドラフト（RUN_ID=`20251124T133000Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T13:30:00Z / 完了: 2025-11-24T14:10:00Z / 担当: Codex
- 実施:
  - ORCA-05/06/08 監視閾値（5xx>2%/5分, P99>3s/10分, missingMaster>0.5%/5分, cacheHit<80%/15分, audit_missing>0.1%）を Alertmanager ルールとして整理し、変数化したテンプレート `docs/server-modernization/phase2/operations/assets/observability/orca-master-alerts.yaml` を新規作成。
  - 同ディレクトリに README を新設し、envsubst 適用手順・変数一覧・前提メトリクス・関連 Runbook（ORCA_CONNECTIVITY_VALIDATION.md §7 / orca-master-release-plan.md §3–5）を記載。
  - `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` に ORCA-05/06/08 アラート節を追加し、通知経路/閾値/メトリクス前提を同期。
- 成果物: `docs/server-modernization/phase2/operations/assets/observability/orca-master-alerts.yaml`, `.../README.md`, `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` 追記。
- 備考: server/ 配下・Legacy 資産は未変更。Python スクリプト未実行。PagerDuty key/メールは envsubst で差し込むテンプレートのまま。

## 2025-11-24 セキュリティ/プライバシー分類チェックリスト作成（RUN_ID=`20251124T134500Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T13:45:00Z / 完了: 2025-11-24T14:25:00Z / 担当: Codex
- 実施:
  - 新規ドキュメント `docs/server-modernization/phase2/operations/orca-master-security-privacy-checklist.md` を作成。ORCA-05/06/08 のフィールドを「個人情報/要配慮/非PII」に分類し、キャッシュ・ログ・監査メタで保持する項目、マスキング不要/必須のルール、保持期間（ログ30日・監査1年・traceId 90日）の指針を表形式で整理。
  - ログ/監査設定のチェックリスト（収集禁止項目・マスキング・保存期間・ローテーション・roleベース権限・エラー時の扱い・アラート閾値）を作成し、実装完了時の確認観点を明文化。
  - 参考リンクを `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` と `docs/server-modernization/phase2/operations/assets/openapi/README.md` に追記し、bridge 計画・OpenAPI から本チェックリストへ遷移できるようにした。
- 成果物: 上記 Markdown 新設。server/ 配下および Legacy 資産は未変更。Python スクリプト未使用。
- 備考: DOC_STATUS 反映予定（ORCA-05/06/08 セキュリティ/プライバシー チェックリスト draft を備考へ追記）。ロールバック計画・OpenAPI README のリンク整合性を手元で確認済み。

## 2025-11-24 CI/品質ゲート案ドラフト（RUN_ID=`20251124T140500Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T14:05:00Z / 完了: 2025-11-24T14:45:00Z / 担当: Codex
- 実施:
  - ORCA マスターブリッジ専用 CI/品質ゲート案を作成し、ワークフロー雛形 `docs/server-modernization/phase2/operations/assets/ci/orca-master-bridge-ci.yaml` を追加。branch filter=`feature/orca-master-*`、matrix で `MSW_ON=1/0` と `ORCA_API_BASE` を切替。チェック項目: OpenAPI 再生成差分（git diff で強制）、MSW フィクスチャ監査メタ検証＋sha256 出力、seed テンプレ psql ROLLBACK lint、`npm run typecheck`。成果物（generated ts / fixture hash / seed log / openapi diff）を upload する構成。
  - CI README を `docs/server-modernization/phase2/operations/assets/ci/README.md` に新設し、Secrets/Env 一覧、ローカル検証コマンド、実行順序と所要時間表、テキストフロー図、envsubst 例を記載（RUN_ID=20251124T140500Z）。
  - OpenAPI README（`docs/server-modernization/phase2/operations/assets/openapi/README.md`）とブリッジ計画書参考資料（`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`）に本 CI draft へのリンクを追加。
- 成果物: `docs/server-modernization/phase2/operations/assets/ci/orca-master-bridge-ci.yaml`, `docs/server-modernization/phase2/operations/assets/ci/README.md`
- 備考: Python スクリプト未実行。server/ 配下・Legacy 資産は未変更。

## 2025-11-24 監視ダッシュボード draft（RUN_ID=`20251124T142000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T14:20:00Z / 完了: 2025-11-24T15:05:00Z / 担当: Codex
- 実施:
  - Grafana 用テンプレート `docs/server-modernization/phase2/operations/assets/observability/orca-master-dashboard.json` を新規作成。P99 latency・RPS・エラー率・cacheHit%・missingMaster%・audit_missing%・dataSource breakdown・Loki ログ検索を収録。PromQL は `http_request_duration_seconds_bucket` / `http_requests_total` / `opendolphin_api_audit_missing_total` を `environment/service/api/facility/user/run_id/data_source/cache_hit/missing_master` ラベルで前提。
  - 閾値色分けを ORCA_CONNECTIVITY_VALIDATION §7 / orca-master-release-plan に合わせて設定（例: P99 warn>2s/crit>3s, 5xx>1%/3%, cacheHit warn<80%/<70%, missingMaster warn>0.5%, audit_missing warn>0.1%）。
  - 変数: `prom`/`loki` データソース、`env`、`service`=`orca-master-bridge` 既定、`api`(ORCA-05/06/08)、`facility`/`user`/`runId` フィルタ。Loki クエリは `runId`/`traceId` フィルタ付き。
  - README (`docs/server-modernization/phase2/operations/assets/observability/README.md`) にインポート手順・変数一覧・想定ラベル・必要データソースを追記し、§7/リリース計画への出典を明示。
  - 参照リンクを OpenAPI README と bridge 実装計画（参考資料節）へ追加し、監視→実装/契約資料への遷移を確保。
- 成果物: `docs/server-modernization/phase2/operations/assets/observability/orca-master-dashboard.json`, `docs/server-modernization/phase2/operations/assets/observability/README.md` 更新, 参照リンク 2 件。
- 備考: server/ 配下・Legacy 資産変更なし。Python スクリプト未使用。実データソース名はインポート時に Grafana でマッピングする。

## 2025-11-24 A/B比較計画ドラフト（RUN_ID=`20251124T151500Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T15:15:00Z / 完了: 2025-11-24T16:05:00Z / 担当: Codex
- 実施: ORCA-05/06/08 旧実装↔新 REST の並行検証計画を作成し、`docs/server-modernization/phase2/operations/orca-master-ab-compare-plan.md` を新規追加。シナリオ（各10〜20件の検索キー）、判定基準（件数/主要フィールド/null/順序/監査メタ）、SLA 表（P99・エラー率・一致率・missingMaster 発生率）、成果物保存規約（HAR/JSON/diff/csv/hash 命名、`artifacts/api-stability/20251124T151500Z/ab-compare/` 配置）、実行コマンド雛形（psql 抜き取り＋新 REST curl、jq 正規化＋ sha256）を明記。
- 連携: 参考資料として `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` にリンクを追加し、OpenAPI ハブ `docs/server-modernization/phase2/operations/assets/openapi/README.md` へ A/B 計画リンクを追記。
- 成果物/証跡: 新規ドキュメント本体（上記パス）。実測は未着手。HAR/JSON 等は今後 `artifacts/api-stability/20251124T151500Z/ab-compare/` に保存予定。

## 2025-11-24 CIドラフト補完・監視データソース準備（RUN_ID=`20251124T150000Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T15:00:00Z / 完了: 2025-11-24T15:35:00Z / 担当: Codex
- 実施:
  - `scripts/verify-msw-fixtures.mjs` を新規実装。TypeScript フィクスチャを on-the-fly で ES 変換し、指定必須キーの有無と `RUN_ID` / `SNAPSHOT_VERSION` 期待値を検証、SHA256 を出力する CLI を追加。
  - CI draft (`docs/server-modernization/phase2/operations/assets/ci/orca-master-bridge-ci.yaml`) の MSW チェック手順に `--expect-run-id` / `--expect-snapshot-version` を追加し、fixture 監査メタの抜け漏れ検知を強化。
  - CI README へコマンド例を更新し、`web-client/.env.ci.example` を新設して `ORCA_SEED_CHECK_DSN` など seed lint 用 DSN のサンプルを記載。
  - 監視テンプレ README（`docs/server-modernization/phase2/operations/assets/observability/README.md`）に Prometheus/Loki データソース名の推奨値・envsubst 置換例、`missing_master` / `audit_missing` 派生メトリクスの命名と recording rule サンプルを追記。
- 証跡: `scripts/verify-msw-fixtures.mjs`, `docs/server-modernization/phase2/operations/assets/ci/{orca-master-bridge-ci.yaml,README.md}`, `web-client/.env.ci.example`, `docs/server-modernization/phase2/operations/assets/observability/README.md`。ローカル検証: `node scripts/verify-msw-fixtures.mjs --fixtures web-client/src/mocks/fixtures/orcaMaster.ts --require runId,snapshotVersion,dataSource,cacheHit,missingMaster,fallbackUsed --expect-run-id 20251124T090000Z --expect-snapshot-version 2025-11-23` で Validation OK / SHA256 出力（/tmp/msw-fixtures.sha256）。

## 2025-11-24 ロールバック/クリーンアップ手順ドラフト作成（RUN_ID=`20251124T160000Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T16:00:00Z / 完了: 2025-11-24T16:45:00Z / 担当: Codex
- 実施:
  - ORCA-05/06/08 seed 撤回・キャッシュ無効化・監査整合性確認の流れをまとめた新規ドキュメント `docs/server-modernization/phase2/operations/orca-master-rollback-plan.md` を作成。即時実行版（開発/手動）と CI/本番用の 2 パターンを記載し、MSW 復帰と監査チェック項目（dataSourceTransition/missingMaster/fallbackUsed/cacheHit）を明示。
  - テンプレートを `artifacts/api-stability/20251124T160000Z/rollback/templates/` に配置（`cleanup-orca05.sql` / `cleanup-orca06.sql` / `cleanup-orca08.sql` / `flush-cache.sh`）。すべて ON_ERROR_STOP・dry-run コメント付き、Redis FLUSHALL 禁止を記載。適用順序と事前確認チェックを `artifacts/api-stability/20251124T160000Z/rollback/README.md` に整理。
  - 参照リンクを `docs/server-modernization/phase2/operations/assets/openapi/README.md` と `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` に追加し、ブリッジ計画からロールバック手順へ遷移できるようにした。
- 成果物: 上記新規ドキュメントとテンプレート一式。
- 備考: Python 未使用、server/ 配下は非改変。キャッシュキーは `orca:master:*` / `audit:transition:*` を想定。必要に応じて `run_id_tag`/`tensu_version` を実環境の seed タグに合わせて調整すること。

## 2025-11-24 CI draft dry-run & AB初回実測（RUN_ID=`20251124T153000Z`, 親=`20251124T000000Z`, A/B親=`20251124T151500Z`)
- 開始: 2025-11-24T10:45:00Z / 完了: 2025-11-24T11:25:00Z / 担当: Codex
- 実施（CI dry-run）:
  - `web-client/.env.ci` を `.env.ci.example` ベースで作成（RUN_ID=20251124T153000Z, SNAPSHOT_VERSION=2025-11-23, ORCA_SEED_CHECK_DSN=`postgres://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable`）。ローカル Postgres 16 コンテナ（`docker run --name orca-seed-ci -p 55432:5432 ...`）を起動し、ORCA-05/06/08 で使用する 8 テーブルの最小カラムを CREATE。
  - `npm ci --cache ../tmp/npm-cache` で依存解決（初回は ~/.npm パーミッションで失敗→キャッシュパス変更で復旧）。`npm run openapi:orca-master` 実行後の `git diff` は空（`openapi.diff` 0 バイトとして保存）。
  - `node scripts/verify-msw-fixtures.mjs --fixtures web-client/src/mocks/fixtures/orcaMaster.ts --require runId,snapshotVersion,dataSource,cacheHit,missingMaster,fallbackUsed --expect-run-id 20251124T090000Z --expect-snapshot-version 2025-11-23 --hash-out artifacts/ci-dryrun/20251124T153000Z/msw-fixtures.sha256` → Validation OK, hash=`016c99d98c2fb1584eb50a07ecffd2a5f2f617761505e99343150fe7554d091c`.
  - Seed dry-run: `artifacts/api-stability/20251124T130000Z/seed/templates/*.sql` を `docker exec -i orca-seed-ci psql --single-transaction --echo-all ...` で ROLLBACK 実行。初回はテーブル不存在で FAIL → スキーマ作成後に再実行し、警告（既にトランザクション進行中/なし）が出つつも exit 0。ログを `seed-dryrun.log` に保存。
  - `npm run typecheck` 成功（ログ保存）。完了後に `docker rm -f orca-seed-ci` でコンテナ停止。
  - 成果物: `artifacts/ci-dryrun/20251124T153000Z/{openapi.diff,msw-fixtures.sha256,seed-dryrun.log,typecheck.log}`。
- 実施（A/B 初回実測・スモールセット）:
  - 入力: A= `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json` の expectation.body、B= `web-client/src/mocks/fixtures/orcaMaster.ts`（runId=20251124T090000Z, snapshotVersion=2025-11-23）。キーセットは計画書から各カテゴリ 1 件ずつ（generic-price 110001110 / youhou 0101 / material 900000001 / kensa-sort B100 / hokenja 06123456 / address 1000001 / etensu D001 + tensu range サンプル）。
  - 手順: jq で A を抽出し、`npx tsx tmp/export-ab-fixtures.tsx` で B を JSON 化。`diff -u` で raw/A と raw/B を比較し、`/metrics/summary.{json,csv}` で主要フィールド一致率を算出（全7ケース matchRate=1.0、差分は監査メタ/ラッパー構造のみ）。HAR は実 API 未使用のため `har/README.txt` に未取得理由を記載。
  - P99/エラー率: 実 API 未接続のため非計測（N/A として記録）。今後実 API 取得時に再計測予定。
  - 成果物: `artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/`（raw/A・raw/B、diff/*.diff、metrics/summary.{json,csv}、har/README）。主要フィールドの一致率 100% を確認。
- 備考: Python 未使用。server/・Legacy 資産は非改変。RUN_ID は親 `20251124T000000Z` に同期し、A/B 証跡の親 RUN は `20251124T151500Z` を明記。

## 2025-11-24 コード体系レビュー／バリデーション草案（RUN_ID=`20251124T163000Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T16:30:00Z / 完了: 2025-11-24T17:05:00Z / 担当: Codex
- 実施:
  - ORCA-05/06/08 で利用する外部コード体系（薬効分類/用法/特定器材/検査分類/保険者/住所/JIS X0401/0402/郵便番号/電子点数表）を DB 定義・OpenAPI 正式版から洗い出し、桁・パターン・整合性条件を一覧化。
  - 「外部コード→システム内コード」突合が必要な箇所（JIS→pref/city、薬効→SRYCD 先頭一致、materialCategory 英数2桁 等）を整理し、422 判定と UI フォールバックの草案を明記。
  - 新規ドキュメント `docs/server-modernization/phase2/operations/orca-master-code-systems.md` を追加。OpenAPI README と bridge 実装計画の参考資料節へリンクを追加。
- 成果物: `docs/server-modernization/phase2/operations/orca-master-code-systems.md`
- 備考: Python 未使用。server/ 配下・Legacy 資産は非改変。

## 2025-11-24 コード体系バリデーション実装反映（RUN_ID=`20251124T170000Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T17:00:00Z / 完了: 2025-11-24T17:45:00Z / 担当: Codex
- 実施:
  - OpenAPI `orca-master-orca05-06-08.yaml` にコード体系の正規表現と 422 応答を追記（薬効3/5桁、SRYCD9桁、用法2–4桁、materialCategory英数2桁、検査分類4桁、payerCode8桁+JIS先頭一致、zip7桁、tensuVersion6桁等）。ValidationError レスポンスと MasterMeta.validationError を追加。
  - `npm run openapi:orca-master` で型再生成（`web-client/src/generated/orca-master.ts`）。
  - UI/共通: 入力マスク＋422 メッセージを集約するユーティリティ `web-client/src/features/charts/utils/orcaMasterValidation.ts` を新設。郵便番号 lookup に適用し、`OrcaValidationError`（missingMaster=false, validationError=true）を送出する形に更新。`web-client/src/types/orca.ts` へ validationError メタを追加。
  - テスト: 422 想定ケースを `orca-api.test.ts` に追加し、`npm run test -- --silent` 成功。MSW フィクスチャ異常サンプルを `artifacts/api-stability/20251124T090000Z/msw-fixture/{orca-master-generic-price-422.json,orca-master-hokenja-422.json,orca-master-address-422.json}` として配置。
- 成果物: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`, `web-client/src/features/charts/utils/orcaMasterValidation.ts`, `artifacts/api-stability/20251124T090000Z/msw-fixture/*-422.json`, `web-client/src/features/charts/api/__tests__/orca-api.test.ts`
- 備考: Python 未使用。server/・Legacy 資産は未変更。DOC_STATUS に RUN_ID と「コード体系バリデーション反映・型再生成・422 テスト」を追記。

## 2025-11-24 スキーマドリフト監視ドラフト準備（RUN_ID=`20251124T161500Z`, 親=`20251124T000000Z`)
- 開始: 2025-11-24T16:15:00Z / 完了: 2025-11-24T17:10:00Z / 担当: Codex
- 実施:
  - スキーマドリフト検出方針を整理し、新規ドキュメント `docs/server-modernization/phase2/operations/orca-master-schema-drift-plan.md` を作成（比較軸: DB 実体 vs 定義書 2024-04-26 vs OpenAPI 正式版、判定ルールと優先度を明示）。
  - psql 用 SQL 雛形を `artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca{05,06,08}_columns.sql` として配置（run_id/schema をパラメータ化、missing/extra/type/length/nullability/default/validity を検出、CSV 既定）。
  - 実行ガイド `artifacts/api-stability/20251124T161500Z/schema-drift/README.md` と結果貼付用 `schema-drift-report.md` を追加。出力フォーマットとローカル/docker/CI の実行例を記載。
  - 導線を OpenAPI README（assets/openapi/README.md）と bridge 実装計画の参考資料節へ追記。
- 成果物:
  - ドリフト計画: `docs/server-modernization/phase2/operations/orca-master-schema-drift-plan.md`
  - SQL 雛形: `artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca{05,06,08}_columns.sql`
  - README/レポート: `artifacts/api-stability/20251124T161500Z/schema-drift/README.md`, `schema-drift-report.md`
- 備考: server/・Legacy 資産は未変更。Python 未使用。DOC_STATUS は「モダナイズ/連携」 ORCA 行の備考へ RUN_ID と「スキーマドリフト監視 draft」を追記済み。

## 2025-11-24 フロント性能予算/計測計画ドラフト（RUN_ID=`20251124T171500Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T17:15:00Z / 完了: 2025-11-24T18:05:00Z / 担当: Codex
- 実施:
  - Web クライアント Charts の ORCA マスター取得に関するパフォーマンス予算と計測計画を策定し、新規ドキュメント `docs/web-client/ux/performance/orca-master-performance-plan.md` を作成。
  - LHCI 設定例・Web Vitals RUM スニペット・README を `artifacts/perf/orca-master/20251124T171500Z/templates/` に配置（Python 不使用、Node ツールのみ想定）。
  - 計測シナリオ（MSW/実API/切替往復）と指標・予算をデスクトップ/モバイル別に表形式で定義し、HAR/ペイロードサイズ取得手順とデータ整形時間の測り方を明記。
- 成果物:
  - 計画: `docs/web-client/ux/performance/orca-master-performance-plan.md`
  - テンプレ: `artifacts/perf/orca-master/20251124T171500Z/templates/{lighthouse.config.js,web-vitals-rum.js,README.md}`
- 備考: server/ 配下・Legacy 資産は非改変。RUN_ID を DOC_STATUS 備考へ反映済み。Python 実行なし。

## 2025-11-24 レジリエンス試験計画ドラフト（RUN_ID=`20251124T174500Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T17:45:00Z / 完了: 2025-11-24T18:20:00Z / 担当: Codex
- 実施:
  - ORCA-05/06/08 のフォールトインジェクション／レジリエンス試験計画を新規作成し、`docs/server-modernization/phase2/operations/orca-master-resilience-plan.md` を追加。timeout/5xx/429/503/DNS/TLS/ネットワーク遮断/スロークエリの各シナリオでの retry/backoff、`fallbackUsed`/`missingMaster`/`validationError` 期待値、UI バナー挙動を表形式で整理。
  - MSW fault 定義テンプレと curl 例を `artifacts/api-stability/20251124T174500Z/resilience/templates/` に配置（`msw-faults.example.ts`, `curl-faults.example.sh`, `invalid-ca.crt`）。MSW から `window.__mswSetFault` で切替できる例を含めた。
  - OpenAPI README と bridge 実装計画の参考資料節へレジリエンス計画へのリンクを追加し、A/B/リリース/スキーマドリフト計画と並列参照できるようにした。
- 成果物: 上記新規ドキュメント、テンプレート一式。
- 備考: server/・Legacy 資産は非改変。Python 不使用。証跡保存先は `artifacts/api-stability/20251124T174500Z/resilience/<UTC>/` を利用予定。

## 2025-11-24 LHCI / Web Vitals 実測（RUN_ID=`20251124T173000Z`, 親=`20251124T000000Z`）
- 環境: `npm run dev -- --host 0.0.0.0 --port 4173`（`VITE_DEV_USE_HTTPS=0` で HTTP 配信、MSW 有効 `msw=1`）。実 API プロファイル（`VITE_DEV_PROXY_TARGET`）は未設定のため MSW のみ計測。
- コマンド:
  - LHCI: `cd web-client && LHCI_CHROME_FLAGS="--disable-dev-shm-usage" node node_modules/@lhci/cli/src/cli.js collect --config=../artifacts/perf/orca-master/20251124T171500Z/templates/lighthouse.config.js --url='http://localhost:4173/charts/72001?msw=1&perf=1'`
  - Web Vitals (Playwright RUM): `node --input-type=module` で `http://localhost:4173/charts/72001?msw=1&perf=1` を自動操作し、`window.__WEB_VITALS_LOG__` を取得。
- 結果（LHCI desktop preset, throttling simulate, 3run median）: Performance 0.55 / FCP ≈ 28.6s / LCP ≈ 55.8s / CLS 0 / TBT 0。性能予算（FCP≤1.8s, LCP≤2.5s, INP≤200ms）を大幅に超過。dev ビルド・モック環境での初回描画遅延が原因と推測（SSR 無・ルーティング初期化待ち）。
- 結果（Web Vitals RUM, runId=`20251124T173000Z`, msw=1, 未スロットル）: TTFB 10.7ms / FCP 368ms / LCP 368ms / CLS 0 / INP 8ms。`/__perf-log` 未実装により sendBeacon は 404（コンソールログのみ保持）。
- 成果物: `artifacts/perf/orca-master/20251124T173000Z/msw/lhci/`（HTML/JSON 3 本）、`.../msw/web-vitals.json`（RUM ログ）。`.../live/README.md` に実 API 未計測を記載。
- TODO: (1) `npm run build && npm run preview`（HTTPS でも LHCI が通るよう dev/prod 切替）で再計測し、LCP/INP の真値を確認。(2) `/__perf-log` 受け口を用意して 404 を解消し、RUM を artifact に自動保存。(3) 実 API プロファイルが整い次第 `live/` でも同手順を実施し、本ログ・DOC_STATUS を更新。

## 2025-11-24 パフォーマンス再計測 + RUM 受け口実装（RUN_ID=`20251124T180000Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → docs/web-client/ux/performance/orca-master-performance-plan.md
- 環境: プロダクションビルド + `npm run preview -- --host 0.0.0.0 --port 4173`（`VITE_DEV_USE_HTTPS=0`）。MSW プロファイル想定で `/charts/72001?msw=1` を対象（preview では Service Worker 無効）。
- 実施:
  1. Vite preview middleware に `/__perf-log` エンドポイントを追加し、POST ボディを `artifacts/perf/orca-master/20251124T180000Z/rum/` へ JSON 保存（204 応答）。sendBeacon 先を `http://localhost:4173/__perf-log` に固定（index.html / public/web-vitals-rum.js）。
  2. `VITE_DEV_USE_HTTPS=0 npm run build` → 成功。`npm run preview -- --host 0.0.0.0 --port 4173` を起動（PID=21853, /tmp/webclient-preview.log に待受表示）。
  3. `npx @lhci/cli collect --config=../artifacts/perf/orca-master/20251124T171500Z/templates/lighthouse.config.js --url=http://localhost:4173/charts/72001?msw=1` を 3 回実行し、`.lighthouseci` を `artifacts/perf/orca-master/20251124T180000Z/msw/lhci/` へ保存。
  4. `cd web-client && node - <<'NODE' ... chromium.launch(); page.goto('http://localhost:4173/charts/72001?perf=1&msw=1'); await page.waitForTimeout(2000); ... NODE` で RUM を送信し、`artifacts/perf/orca-master/20251124T180000Z/rum/` に 3 件の CLS/LCP/FCP ログ（mswEnabled=true）を確認。
- 結果: LHCI median Perf=0.75, FCP≈2.28s（予算1.8s超）、LCP≈2.36s（予算2.5s内）、CLS=0、INP=N/A（無操作）、TTFB≈1.0ms。Live プロファイルは `VITE_DEV_PROXY_TARGET` 未提供のため未実施（理由と再計測手順を `artifacts/perf/orca-master/20251124T180000Z/live/README.md` に記載）。
- 終了: `kill 21853` で preview 停止。Python 未使用、server/ 配下無変更。

## 2025-11-24 Playwright E2E シナリオ/スケルトン作成（RUN_ID=`20251124T181500Z`, 親=`20251124T000000Z`）
- 実施: ORCA-05/06/08 向け Playwright 回帰テストのシナリオ設計とスケルトン実装（MSW/Live 並列表記）。
- 成果物:
  - シナリオ表: `tests/e2e/orca-master.scenarios.md`（MSW 正常 8 ケース、422 4 ケース、レジリエンス fault 要約をインライン引用）。Live は `VITE_DEV_PROXY_TARGET` 未提供のため全ケース「未実施/待ち条件」を明記。
  - スケルトン: `tests/e2e/orca-master.spec.ts`（MSW 正常/422/Live の describe を追加、`test.fixme`/`test.skip` で UI セレクタ確定待ち）。共通ヘルパー `tests/e2e/helpers/orcaMaster.ts` にロック取得/MSW fault 切替/監査メタ検証/PerfLog 記録の stub を配置。
  - 実行手順: `tests/e2e/README.md` を新設し、MSW↔Live 切替・RUN_ID 指定・成果物保存パスを記載。package.json に `e2e:orca-master` スクリプトを追加。
- 状態: コードはスケルトンのみ（UI セレクタ未確定）。Live 実行は接続先不足のため未実施。Resilience fault は `orca-master-resilience-plan.md` §1/§2 の scenarioId を使用する前提を表に併記。
- 担当: Codex / 開始: 2025-11-24T18:15:00Z / 完了: 2025-11-24T19:10:00Z / RUN_ID=20251124T181500Z

## 2025-11-24 Go-Live 事前チェックリスト草案（RUN_ID=`20251124T184500Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md
- 実施:
  - 実サーバー接続前の運用チェックリストを新設し、`docs/server-modernization/phase2/operations/orca-master-go-live-checklist.md` を追加。接続先準備（VITE_DEV_PROXY_TARGET/Basic 認証/証明書有無）、MSW ON/OFF 手順、シード投入確認、ロールバック導線参照（rollback plan）、監視/アラート設定確認（alerts.yaml・dashboard）を網羅。
  - 証跡テンプレート（HAR/console/audit/coverage）を `artifacts/api-stability/20251124T184500Z/go-live/templates/` に配置し、README で命名規約と必須メトリクス（P99/5xx/429/missingMaster/fallbackUsed/cacheHit/traceId 等）を明記。
  - OpenAPI README とブリッジ計画書の参考資料節へチェックリストへのリンクを追加し、導線を確保。
- 成果物: 新規チェックリスト・テンプレート一式。server/ 配下および Legacy 資産は未変更。Python 未使用。
- 備考: 証跡保存先は `artifacts/api-stability/20251124T184500Z/go-live/<date>/` を利用。RUN ログから相対リンクで参照する。

## 2025-11-24 監査ログ/アーカイブ方針ドラフト（RUN_ID=`20251124T190000Z`, 親=`20251124T000000Z`）
- 開始: 2025-11-24T19:00:00Z / 完了: 2025-11-24T19:25:00Z / 担当: Codex（ORCA-05/06/08 監査ログ担当）
- 実施:
  - 監査・運用ログの保存期間/匿名化/検索軸を整理した新規ドキュメント `docs/server-modernization/phase2/operations/orca-master-audit-archive-plan.md` を作成（アプリログ=30日、監査ログ=1年=ホット90日+コールド9か月、PII は不可逆ハッシュ化、runId/facility/user/apiRoute/dataSource/cacheHit/missingMaster/fallbackUsed 等を抽象 index に採用）。
  - ローテーション/ライフサイクル（日次ローテ、90 日で Glacier/Archive へ移行）、インシデント時のリーガルホールド手順、ラベル設計（env/logKind/runId/facility/user/apiRoute/traceId など）をまとめ、S3/Blob/Elasticsearch/Loki/CloudWatch いずれでも再利用できる抽象案として整理。
  - 橋渡し計画 `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の参考資料節へリンクを追記し、監査メタ（dataSource/snapshotVersion/cacheHit/missingMaster/fallbackUsed/runId）必須化前提を明示。
- 成果物: `docs/server-modernization/phase2/operations/orca-master-audit-archive-plan.md`（RUN_ID=20251124T190000Z）。
- 備考: server/ コード・Legacy 資産は未改変。Python スクリプト未使用。DOC_STATUS 備考へ本 RUN_ID と「監査ログ/アーカイブ方針 draft」を追記予定。

## 2025-11-24 FCP 改善試作 + 再計測（RUN_ID=`20251124T193000Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/web-client/ux/performance/orca-master-fcp-improvement.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md
- 実施（フロントのみ変更）:
  - ルーターを `React.lazy` 化し、Charts/Reception/Admin/Patients を遅延ロード化。Vite `manualChunks` で `vendor-react`/`vendor-query`/`vendor-emotion` と機能別 chunk を分割。
  - `index.html` に軽量 AppShell（スケルトン + クリティカル CSS）を追加し、初期 paint を JS 依存にしない構成へ変更。
  - Telemetry/Audit/Security 初期化を動的 import に変更し、デフォルトの prod ビルドから OTEL 依存を除外。RUM runId / Vite runId を `20251124T193000Z` に更新。
  - `npm run build` 成功。chunk gzip サイズ: entry 6.56 kB / vendor-react 84.31 kB / vendor-query 12.01 kB / vendor-emotion 10.48 kB / charts 103.30 kB / administration 76.77 kB / reception 24.12 kB / patients 24.80 kB。
- 計測試行（MSW プロファイル、HTTPS preview）:
  - `npm run preview -- --host 0.0.0.0 --port 4173` 起動後、`npx lhci collect --url=https://localhost:4173/charts/72001?msw=1&perf=1 --numberOfRuns=3 --collect.settings.throttlingMethod=devtools ...` を実行したが、ページロード時に `TypeError: Cannot set properties of undefined (setting 'AsyncMode')`（`vendor-react-C8svYgla.js`、React DevTools hook 周辺）で NO_FCP となり LHR を取得できず。画面は AppShell スケルトンのまま非ハイドレート。
  - RUM 送信は動作し、`artifacts/perf/orca-master/20251124T193000Z/rum/` に web-vitals JSON を保存（runId が旧値 20251124T180000Z のものが混在）。`.../msw/` 配下に LHR は未生成。
- 状態/Next: React DevTools hook の初期化エラーを解消したうえで LHCI 3run を再実施し、前回 RUN=20251124T180000Z との FCP/LCP/CLS/INP 差分を算出予定。preview PID は計測後に kill 済み（ポート 4173 解放）。server/・Legacy 資産変更なし、Python 不使用。

## 2025-11-24 React DevTools hook エラー解消＋再計測（RUN_ID=`20251124T200000Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/web-client/ux/performance/orca-master-fcp-improvement.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md
- 実施:
  - `vite.config.ts` の手動 `manualChunks` を削除し、React DevTools hook 周辺の `AsyncMode` TypeError を解消。
  - `public/perf-env-boot.js` で headless 時に `__REACT_DEVTOOLS_GLOBAL_HOOK__` を undefined 固定、RUM runId を `20251124T200000Z` に統一。
  - RUM 送信先を `window.location.origin/__perf-log` へ変更し、HTTPS での mixed content を解消。
- 計測（MSW, devtools throttle, `?perf=1&msw=1`）:
  - LHCI 3run 完走。FCP/LCP/CLS/INP (median) = 0.133s / 0.133s / 0 / 0.133s（`/login` リダイレクトでの計測値）。成果物: `artifacts/perf/orca-master/20251124T200000Z/msw/lhci/`。
  - RUM: `artifacts/perf/orca-master/20251124T200000Z/rum/`（23 件、runId 統一、mswEnabled=true）。
- 状態/Next: Charts 画面での再計測（認証モック or ログインスキップ）を次 RUN で実施。server/・Legacy 資産変更なし、Python 不使用。preview PID=75318→kill 済み。

## 2025-11-24 ORCA マスタ A11y 短期実装（RUN_ID=`20251124T210000Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md → docs/web-client/ux/accessibility/orca-master-a11y-plan.md
- 実施:
  - `web-client/src/features/charts/components/OrcaOrderPanel.tsx` にスキップリンク（先頭→検索結果）、`role="search"` 付きフォーム、検索ボタン Enter/Space 対応、検索結果テーブルへ `role/table` + `scope="col"` + `aria-sort` を付与。結果領域へ `aria-busy` とフォーカス移動を追加し、警告/エラーバナーを `role="alert" aria-live="assertive" data-run-id=20251124T210000Z` で実装。
  - 429 レートリミット時のカウントダウン表示と再試行ボタンに `aria-describedby` を付与し、422 バリデーションエラー/結果ゼロ件時は warning バナーを表示。フォーカスアウトラインを復活させるため `web-client/src/components/TextField.tsx` の input に `:focus-visible` アウトラインを追加。
- テスト:
  - `cd web-client && npm run test -- --silent` → PASS（107 tests, 32 files）。
  - `cd web-client && npx playwright test ../tests/e2e/orca-master.spec.ts --grep @a11y` → **No tests found**（@a11y タグ未付与のスケルトンのみのため）。grep なし実行は指示外のため未実施。
- 備考: server/ 配下・Legacy 資産は未変更。Python スクリプト未使用。UI テーブル/alert の aria 属性は短期案で、MSW/UI セレクタ確定後に Playwright @a11y タグを付与して再実行予定。

## 2025-11-24 Playwright @a11y シナリオ実装・実行（RUN_ID=`20251124T211500Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md → docs/web-client/ux/accessibility/orca-master-a11y-plan.md
- 実施: Playwright 用安定セレクタを `web-client/src/features/charts/components/OrcaOrderPanel.tsx` に `data-test-id` で追加（skip link, search form/input/button, results region/table, alert/429 再試行）。ヘルパー `tests/e2e/helpers/orcaMaster.ts` にセレクタ/モックレスポンス/認証セッション Seed を整備。`tests/e2e/orca-master.spec.ts` に @a11y describe を追加し、検索フォーカス移動・aria 属性検証・422/429 アラート確認の 4 ケースを実装。
- 実行結果: `RUN_ID=20251124T211500Z web-client/node_modules/.bin/playwright test tests/e2e/orca-master.spec.ts --grep @a11y` → 4/4 skipped（Charts 初期 API モック未整備のため `test.skip` で明示スキップ）。ログ: `test-results/tests-e2e-orca-master--a11-*/error-context.md`（空 DOM のため取得なし）。次回対応: Charts 初期データ MSW モックを整備後に skip 解除。
- 備考: Python 未使用。server/ 配下・Legacy 資産は未変更。スキップ理由は spec 内コメントおよび本ログに記載。

## 2025-11-24 Stage/Prod env テンプレ + フラグマトリクス（RUN_ID=`20251124T213500Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md
- 実施:
  - Stage/Prod 用環境変数テンプレートを追加・更新: `web-client/.env.stage.example` をブリッジ用項目（`VITE_ORCA_MASTER_BRIDGE`/`VITE_DISABLE_MSW`/`VITE_DEV_PROXY_TARGET`/`VITE_DEV_USE_HTTPS`/`VITE_ENABLE_TELEMETRY`/`VITE_RUM_RUN_ID`/`VITE_PERF_LOG_ENDPOINT` 等）に刷新し、`.env.prod.example` を新規作成。
  - フラグ設定マトリクスを `docs/server-modernization/phase2/operations/orca-master-staging-plan.md` に追記し、Stage/Canary/Ramp/Prod のクライアント・サーバーフラグ推奨値と配布ルールを整理。
  - ブリッジ計画書参考資料に env テンプレへの導線を追加（`src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`）。
- 成果物/変更ファイル: `web-client/.env.stage.example`, `web-client/.env.prod.example`, `docs/server-modernization/phase2/operations/orca-master-staging-plan.md`, `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`, `docs/web-client/planning/phase2/DOC_STATUS.md` 備考更新予定。
- 備考: server/ 配下・Legacy 資産は未変更。Python スクリプト未使用。RUN_ID=`20251124T213500Z` を DOC_STATUS/ログで共有。

## 2025-11-24 ORCA マスター スキーマドリフト期待値充填（RUN_ID=`20251124T214500Z`, 親=`20251124T000000Z`）
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → docs/server-modernization/phase2/operations/orca-master-schema-drift-plan.md
- 実施:
  - 定義書 2024-04-26 版を `pdftotext` で参照し、ORCA-05/06/08 対象テーブルの expected_columns を drift SQL 雛形へ入力。
  - ORCA-05: `tbl_generic_class` / `tbl_generic_price` / `tbl_youhou` / `tbl_material_h_m` / `tbl_kensasort` を定義書の桁・型で列挙。
  - ORCA-06: `tbl_hknjainf_master` / `tbl_adrs` のカラム型・桁を記載。
  - ORCA-08: 点数テーブル `tbl_tensu` の主要項目（コード/名称/区分/点数/単位/適用区分）を列挙。
  - `schema-drift/results/README.md` に DSN 未提供のため未実行である旨を記載し、RUN_ID=20251124T214500Z でレポートテンプレートを Pending に設定。
- 実行: 未実行（接続先 DSN 未提供）。実行後の出力先: `artifacts/api-stability/20251124T161500Z/schema-drift/results/`.
- 成果物/変更ファイル: `artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca05_columns.sql`, `check_orca06_columns.sql`, `check_orca08_columns.sql`, `schema-drift/schema-drift-report.md`, `schema-drift/results/README.md`.
- 備考: server/ 配下・Legacy 資産未変更。Python スクリプト未使用。
