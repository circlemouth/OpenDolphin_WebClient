# 08_Web クライアント向け API 安定化　✓

- RUN_ID: `20251120T191203Z`
- 期間: 2025-12-08 09:00 〜 2025-12-12 09:00 (JST)
- 優先度: Medium / 緊急度: Low
- エージェント: Codex
- YAML ID: `src/modernized_server/08_Webクライアント向けAPI安定化.md`

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## 禁止事項 / 前提
- `server/` 配下の変更は禁止。Legacy 資産（`client/` `common/` `ext_lib/`）は参照のみ。
- Python スクリプトの実行は禁止（明示指示がある場合のみ例外）。
- WebORCA 接続が必要な検証は開発用 ORCA サーバー（`mac-dev-login.local.md` 参照）に限定し、P12 証明書・本番証明書・ローカル ORCA コンテナは使用しない。
- RUN_ID は本タスクの `20251120T191203Z` に統一し、ログ・証跡・DOC_STATUS へ同一値で記録する。
- フロントエンド（Web クライアント）の UI 改修はスコープ外。互換レイヤーはモダナイズ版サーバー側で提供する。

## ゴール
- 開発中 Web クライアントが利用する API について、破壊的変更を吸収する互換レイヤー（パラメータ/レスポンス変換・バージョニング・フォールバック）を準備する。
- `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` で定義される SLA に合わせ、主要エンドポイントのレスポンス時間とペイロードサイズを計測し、閾値と改善策を提示する。
- バックワード互換テストと簡易モック（MSW/fixture）を用意し、クライアント開発チームが即時利用できる形で共有する。

## スコープ / 非スコープ
- スコープ: モダナイズ版サーバーの互換レイヤー設計・実装方針整理、SLA 計測計画と実測、バックワード互換テストケースとモック資材の提供、関連ドキュメント更新。
- 非スコープ: Web クライアント UI/UX 改修、Legacy サーバー資産の変更、本番 ORCA への接続、CI/CD パイプラインの恒久変更。

## 期待アウトプット（DoD）
1. 互換レイヤーの設計方針（対象 API と変換ルール、バージョン切替/feature-flag 手順、破壊的変更リスク一覧）が本ファイルおよびログに整理されている。
2. `CHART_UI_GUIDE_INDEX.md` の SLA に対するレスポンス時間・ペイロード実測表が作成され、閾値超過時の改善案/暫定フォールバックが提示されている。
3. バックワード互換テスト（回帰用のシナリオ/入力/期待レスポンス）と簡易モックが `artifacts/api-stability/20251120T191203Z/` に格納され、クライアント開発チームへ共有可能な状態になっている。
4. RUN_ID=`20251120T191203Z` を `DOC_STATUS.md` 備考欄と関連ログへ反映できるよう準備されている。

## タスク分解
- **A. 対象 API と SLA の洗い出し**
  - `docs/web-client/architecture/REST_API_INVENTORY.md` と `docs/web-client/process/API_UI_GAP_ANALYSIS.md` から Web クライアントが利用するエンドポイントを抽出し、監査・認可・トレース必須ヘッダーの有無を確認する。
  - `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` に記載の SLA（応答時間・ペイロード上限・タイムアウト/リトライ要件）を API ごとに紐付け、計測対象を確定する。
- **B. 互換レイヤー設計（破壊的変更の吸収）**
  - 既存 API との非互換点（フィールド名変更、型/値域差分、エラーコード差異）を列挙し、サーバー側でのマッピング・デフォルト値補完・非推奨ヘッダー受付の方針を決める。
  - バージョニング／feature flag（例: `X-Client-Compat`, profile-based config）で切替できる設計をまとめ、デフォルト挙動とロールバック手順を定義する。
- **C. 計測パスとベンチマーク**
  - `ops/tools/send_parallel_request.sh` など既存ツールを用いた計測手順を定義し、代表 API（Charts/Reception/Administration/ORCA wrapper）のレスポンス時間とペイロードを取得する。
  - SLA 超過時の暫定対応（圧縮、レスポンス縮約、ページング強制、キャッシュ TTL）と恒久対応候補を表形式で整理する。
- **D. バックワード互換テスト & モック**
  - 旧クライアント契約をカバーする回帰テストケースを設計し、期待レスポンスを JSON/MD で保存する。
  - MSW などフロント用モックやサーバー側簡易モックエンドポイントの配置先・起動手順をまとめ、クライアントチーム向け README を用意する。
- **E. ドキュメントと棚卸し**
  - ログ: `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md` を作成し、設計方針・計測結果・テスト/モック一覧を集約する。
  - `docs/web-client/planning/phase2/DOC_STATUS.md` へ RUN_ID と証跡パスを追記し、必要に応じてハブ（README/INDEX）へ同日反映する。

## 証跡配置
- ログ: `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md`
- アーティファクト: `artifacts/api-stability/20251120T191203Z/{benchmarks,mocks,schemas}/`

## スケジュール目安
- 12/08 (Day1): 参照チェーン確認、対象 API & SLA 確定、互換レイヤー設計ドラフト。
- 12/09 (Day2): 計測パス確立と初回ベンチマーク採取、互換マッピング表の初版作成。
- 12/10 (Day3): バックワード互換テストケース・モック整備、SLA 超過への暫定対応案を整理。
- 12/11 (Day4): 証跡ログ/アーティファクト整備、DOC_STATUS 反映、レビュー反映。
- 12/12 09:00 まで: 残課題/Blocker を明記した引き継ぎメモを添付しクローズ。

## リスクと留意点
- SLA 基準が UI ガイド側で更新された場合の差分検知遅延リスク → `CHART_UI_GUIDE_INDEX.md` 更新日付を計測ログに記載し、差分を確認してから計測する。
- ORCA Trial 依存の API は 404/405 のままになる可能性 → Trial 前提の Blocker を明記し、Modernized 側でのフォールバック（仕様ベース実装/モック）を準備する。
- 計測環境差によるばらつき → 同一 RUN_ID でパラメータ（回数・並列度・ネットワーク条件）を固定し、中央値/90p を採用して比較する。

## 進捗メモ（RUN_ID=20251120T191203Z）
- API 利用/SLA 整理: `REST_API_INVENTORY.md`・`API_UI_GAP_ANALYSIS.md` から Charts/Reception/Administration/ORCA 主要 API を抽出し、SLA は `WEB_CLIENT_REQUIREMENTS.md`（基本 3s、ORCA 5s）と `process/ROADMAP.md`（ロングポーリング 55s×5 回）を暫定値として紐付け。詳細は `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md#1-web-クライアント利用-api-と-sla-紐付け計測対象` を参照。
- 互換レイヤー方針: `PUT /karte/document` vs `/karte/document/{id}`、ChartEvent LP/SSE 併存、ORCA stub の `apiResult`、User roles/facility 欠落補完、`DELETE /pvt*` 戻り値差異について `X-Client-Compat` で切替可能なマッピング（デフォルト値・ロールバック手順付き）を整理。
- ベンチマーク: modernized-dev で `send_parallel_request.sh --targets modern --loop 3` を実行し、docinfo 13.2/50.9ms・tensu 11.6/66.6ms・pvtList 5.0/5.1ms・user 10.2/21.5ms（いずれも 200）を再計測。pvtList は seed→再起動で list 返却を確認し、起動後 seed の場合は `/pvt2` POST ウォームアップで復旧できる手順依存を README/ログへ記録。
- テスト/モック: バックワード互換シナリオ (`charts-docinfo`, `reception-pvtlist`, `admin-user-profile`, `orca-tensu-name`) を `artifacts/api-stability/20251120T191203Z/schemas/` へ追加。MSW 用 `apiStabilityHandlers` を `artifacts/api-stability/20251120T191203Z/mocks/` に配置し、クライアントが即利用可能な形で共有。
- RUN_ID=`20251121T231000Z`（Task-A/B 反映）: 開発用 ORCA（接続情報は `docs/web-client/operations/mac-dev-login.local.md` 参照）で baseline=`20251121T153100Z` は `acceptmodv2`/`appointmodv2`=HTTP405（Allow: OPTIONS, GET）、`acceptlstv2`/`appointlstv2`/`medicalmodv2`=200・`Api_Result=13/12/10`（doctor/patient seed 不足）。seed fix=`20251121SeedFixZ1` で patient `00001` を登録しても doctor 未登録のため `acceptmodv2`/`appointlstv2`/`medicalmodv2` が `Api_Result=14/12/21`。証跡ログ: `docs/server-modernization/phase2/operations/logs/{20251121T153100Z-orca-connectivity.md,20251121SeedFixZ1-orca-connectivity.md}`、Artifacts: `artifacts/orca-connectivity/{20251121T153100Z,20251121SeedFixZ1}/`。405/seed Blocker を互換レイヤー検討時の前提として残し、doctor seed 手順確立後に再測する。
