# 09_統合 E2E 接続確認（Web クライアント連携）

- RUN_ID: `20251122T071146Z`（親 RUN_ID=`20251120T131731Z` から証跡導線を拡張）
- 期間: 2025-12-12 09:00 〜 2025-12-17 09:00 (JST)
- 優先度: High / 緊急度: Low
- エージェント: claude code
- YAML ID: `src/modernized_server/09_統合E2E接続確認（Webクライアント連携）.md`
- ステータス: 暫定クローズ（Stage 接続先未提供のため E2E 実測は Blocked。接続先情報を入手し次第、再度 RUN_ID を採番して再開予定）

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## 禁止事項 / 前提
- `server/` 配下やサーバースクリプトの変更は禁止。Legacy 資産（`client/` `common/` `ext_lib/`）は参照のみ。
- Python スクリプト実行は禁止（明示指示がある場合のみ例外）。CLI/ブラウザ操作・既存シェルツールのみ使用可。
- WebORCA/モダナイズ接続は開発用設定に限定し、P12 証明書・本番経路・ローカル ORCA コンテナ・`curl --cert-type P12` は使用しない。接続情報は `docs/web-client/operations/mac-dev-login.local.md` 参照。
- RUN_ID は `20251122T071146Z` で統一し、ログ・証跡・DOC_STATUS・報告草案すべて同一値を用いる。派生 RUN_ID を作る場合は親 RUN_ID を明示する。
- Web クライアント側のソース改修は本タスクのスコープ外。挙動差分はサーバー側対処可否を仕分け、クライアント連携チームへエスカレーションする。

## ゴール
- 開発中 Web クライアントとモダナイズ版サーバーを接続し、認証・主要業務フロー・エラーハンドリングの E2E を実測する。
- サーバー側で解決可能な課題（設定/互換レイヤー/データ seed）とクライアント側エスカレーション項目を仕分け、優先度付きで整理する。
- 実測結果・証跡・再現手順を `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md` と `artifacts/e2e-connect/20251122T071146Z/` に集約し、DOC_STATUS へ連携可能な状態にする。

## スコープ / 非スコープ
- スコープ: 認証/セッション更新、受付/予約フロー、カルテ閲覧・保存系（DocInfo/ChartEvent）、ORCA ラッパー経由の代表 API、エラーハンドリング（トークン失効・4xx/5xx・ネットワーク遮断）を Web クライアント UI 経由で実測。
- 非スコープ: Web クライアントの UI/UX 改修、サーバーコード変更、ORCA 本番接続、CI/CD 設定変更、Python スクリプトによる自動化。

## Stage 前提とデータセット
- 本タスクの更新 RUN_ID: `20251122T071146Z`（親 RUN_ID=`20251120T131731Z`）。証跡・ログは子 RUN_ID へ統一し、必要に応じて親 RUN_ID を備考に併記する。
- 接続先: `mac-dev-login.local.md` 記載の開発用モダナイズ版サーバー（Stage 相当）。Web クライアントは MSW/Service Worker を無効化し、`VITE_DEV_PROXY_TARGET` を Stage へ向ける。
- 認証: Stage 既定の管理者/医師アカウント（`mac-dev-login.local.md` を参照）。セッション延長は refresh トークンまたは再ログインで実施。
- 患者/受付データ: `operations/LOCAL_BACKEND_DOCKER.md` で投入済みのテスト患者 `WEB1001`〜`WEB1010` を利用。必要に応じて来院ステータスを受付画面で登録する。
- ORCA 連携: mac-dev-login の ORCA 開発環境を使用。Trial や本番経路は利用しない。Billing/CLAIM 送信は doctor seed 前提で、未整備の場合は Blocked 判定とする。
- 観測: TraceContext 送出と UI への TraceId 表示は `docs/web-client/operations/otel-webclient-init.md` の設定済みとする。サーバーログは `server_latest_logs.txt` を採取し、TraceId 突合を行う。

## Stage 前提 E2E テストマトリクス（Web クライアント経由）
| 観点 | 判定基準 (Pass 条件) | 必要データセット | Stub / Mock 前提 | 証跡パス（`artifacts/e2e-connect/20251122T071146Z/` 配下に保存） |
| --- | --- | --- | --- | --- |
| 認証 / セッション延長 | ログイン成功後、アクセストークン期限切れで 401→自動 refresh or 再ログインが成功し再度 200 を返すこと。再ログイン後もセッションが UI に反映される。 | mac-dev-login Stage 認証情報（管理者/医師）、ブラウザをシークレットモードで開始。 | MSW 無効。認証系の Stub/Mock は使用しない。 | `httpdump/auth/patientlst2v2_20251122T132823Z.{curl.log,xml}`（mac-dev ORCA 404 証跡。UI/HAR=未取得） |
| 診療録一覧取得 | `/api/karte/docinfo/list` への呼び出しが 200 かつ一覧が UI に表示され、患者 `WEB1001` で DocInfo が 1 件以上返る。 | 患者 `WEB1001`（受付済み）、facility は Stage 既定値。 | MSW 無効。DocInfo モック非使用。 | 未取得（Stage API URL 不明・UI 未実測） |
| 診療録詳細閲覧 | 一覧から 1 件選択し `/api/karte/docinfo/{id}`→`/api/chartEvent/{id}` が 200、UI で本文・スタンプが表示される。TraceId がサーバーログと一致。 | `WEB1001` の既存ドキュメント（なければ `WEB1002`）。 | MSW 無効。ChartEvent モック非使用。 | 未取得（Stage API URL 不明・UI 未実測） |
| 受付登録（新規来院） | 受付画面で患者検索→受付登録が 200 / UI 反映（ステータス=受付済み）。重複受付は 409 で UI がエラー表示する。 | 患者 `WEB1002`（未受付）を使用。受付後は同患者で重複登録を試験。 | MSW 無効。受付モック非使用。 | 未取得（Stage seed / UI 未実測） |
| 請求連携（CLAIM 送信） | 診療録保存後の CLAIM 送信が ORCA 開発環境へ到達し 200/Api_Result=00（doctor seed 有効時）。警告や 40x/50x は UI にエラーメッセージ/再送ガイドが表示される。 | doctor seed 有効な診療科コード、保険組合せ設定済み患者（例: `WEB1003`）。 | ORCA down 時は Blocked 判定。代替 Stub/Mock は使用せず、必要なら再実行待ちにする。 | 未取得（ORCA 接続未確定・UI 未実測） |
| 監査ログ生成 | 上記操作で `d_audit_event` に認証/受付/カルテ/CLAIM イベントが記録され、RequestId・TraceId が格納されている。サーバーログと DB 抜粋を突合。 | Stage DB へアクセスできる監査ビュー（読み取り専用）。 | Stub/Mock なし。DB 抜粋はマスキングして保存。 | 未取得（Stage DB 未接続） |
| TraceId 表示 | UI のエラートースト/デバッグパネルに TraceId が表示され、サーバーログの traceId と一致するスクリーンショットが取得できる。 | 任意の 500 系エラー（例: 故意に無効な endpoint へ遷移）または CLAIM 警告時。 | MSW 無効。TraceId は実サーバーの値を使用。 | `../../artifacts/observability/20251122T071146Z/traceid-error-boundary.png` |
| 再接続リトライ（ネットワーク遮断） | ネットワーク遮断→復帰で SSE/WebSocket/HTTP ポーリングが自動再接続し、最大リトライ回数内に復旧する。復旧失敗時は UI が再接続ボタンを提示。 | ブラウザ devtools で offline → online 切替、`WEB1001` を対象に SSE/Polling が動作する画面を使用。 | MSW 無効。通信層リトライは実装済み axios/RTK Query を使用。 | 未取得（UI 未実測） |

## 期待アウトプット（DoD）
1. E2E シナリオ一覧（認証/受付/予約/カルテ/ORCA 呼び出し/エラー系）がログに整理され、各シナリオの結果・証跡パス・判定（Pass/Fail/Blocked）が記録されている。
2. サーバー側で対処可能な項目とクライアントエスカレーション項目が仕分け表になっており、担当/優先度/次アクションが明記されている。
3. 証跡（HAR/HTTP dump/スクリーンショット/サーバーログ抜粋）が `artifacts/e2e-connect/20251122T071146Z/` に保存され、ログから参照できる。
4. RUN_ID=`20251122T071146Z` を `DOC_STATUS.md` 備考欄へ反映できる準備が整い、ハブドキュメント（Web クライアント README / Phase2 INDEX）と同日付で同期可能な状態になっている。

### チェック項目別証跡（RUN_ID=20251122T071146Z）
| チェック項目 | 証跡 | ステータス / 備考 |
| --- | --- | --- |
| E2E シナリオ一覧・結果判定 | `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md#予定シナリオと証跡配置` | Blocked（2025-11-22 CLI 端末ではブラウザ/UI 操作不可のため未実測）。証跡リンク整合は確認済み。GUI 端末で再開が必要。 |
| サーバー側/クライアント側仕分け表 | `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md` | Blocked（実測結果が未取得のため仕分け不可）。 |
| HAR / HTTP dump / スクリーンショット / サーバーログ | `artifacts/e2e-connect/20251122T071146Z/httpdump/`（取得済） / `.../server-logs/`（取得済） / `.../har/`（未取得） / `.../screenshots/`（未取得） | CLI で取得した疎通証跡のみ存在（`httpdump/tls/*` ハンドシェイク失敗ログ、`http_head_100.102.17.40_8000.txt` 405、`server-logs/server_latest_logs_excerpt.txt`）。HAR/UI スクショは未取得。 |
| RUN_ID 連携（DOC_STATUS 備考更新） | `docs/web-client/planning/phase2/DOC_STATUS.md` 該当行 | 本タスクで備考を「リンク整合確認済み（RUN_ID=20251122T071146Z）」へ更新済。 |
| TraceId 表示・Trace 継承 | `docs/server-modernization/phase2/operations/logs/20251122T071146Z-{tracing,links}.md` / `artifacts/observability/20251122T071146Z/traceid-error-boundary.png` | 済（実バックエンド 500 → TraceErrorBoundary/TraceNoticeCenter 同一 ID で確認済）。 |
| 監査ログ・エラーハンドリング強化 | `src/modernized_server/05_エラーハンドリングと監査ログ強化.md` / `docs/server-modernization/phase2/operations/logs/20251120T193040Z-error-audit.md` | 設計済み。E2E 実測時に `d_audit_event` 発火を確認（保留）。 |

## タスク分解
- **A. 参照チェーン確認と RUN_ID 宣言**
  - 本ファイルとログ冒頭に RUN_ID・期間・証跡パスを明記し、関連チェックリストと整合を取る。
- **B. 環境ベースライン確立**
  - `mac-dev-login.local.md` を参照し、モダナイズ版サーバー接続先・資格情報・MSW 無効化手順を確認。Stage 実測時は `VITE_API_BASE_URL= VITE_DISABLE_MSW=1 npx vite --host --mode stage --port 4173 --clearScreen false` を使用し、`--https` は付与しない。
  - サーバー側ログ取得方法（`server_latest_logs.txt` ほか）とブラウザ HAR/コンソール収集手順を決定。
- **C. シナリオ設計（E2E パス）**
  - 認証/セッション延長、受付検索・登録、予約作成/更新、カルテ閲覧/保存（DocInfo/ChartEvent）、ORCA ラッパー経由 API（acceptmod/appointmod 等）を想定し、前提データと期待結果を整理。
  - エラー系（トークン失効、ネットワーク遮断、HTTP 4xx/5xx）の再現手順と期待 UI 挙動を定義。
- **D. 実測と証跡収集**
  - シナリオを実行し、HAR/HTTP dump/スクリーンショット/サーバーログを `artifacts/e2e-connect/20251122T071146Z/` に保存。成功/失敗条件を明記。
- **E. 仕分け・エスカレーション**
  - サーバー側で完結する課題（設定/seed/互換レイヤー）とクライアント連携が必要な課題を一覧化し、対応者/期限/必要ドキュメントを記載。
- **F. ドキュメント連携**
  - `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md` を更新し、必要に応じて `DOC_STATUS.md` とハブドキュメントへ RUN_ID・備考を反映。

## 追加ゲート: 監視・Trace 確認
- Web クライアント OTel 計測が有効（traceparent/tracestate/baggage 送出）であることを E2E 実行時に確認する。
- UI に TraceId 表示（エラートースト/デバッグパネルなど）が出ることをスクリーンショットで証跡化する。
- API 呼び出し時のラベルセットが `env,service,facility`（必要に応じ `version,queue,job_type`）で揃っているか、収集メトリクスを確認する。
- 異常系（5xx/タイムアウト）でも TraceId がサーバー側ログと突合できることをサンプル 1 件で確認する。

### Stage 起動手順（Vite 6.4 以降）
- **注意**: Vite 6.4 以降は `npm run dev:stage --https` が非対応。`--https` なしで次を利用する。  
  `VITE_API_BASE_URL= VITE_DISABLE_MSW=1 npx vite --host --mode stage --port 4173 --clearScreen false`
- `.env.stage` は空のままにし、接続先は `VITE_API_BASE_URL` で直接指定する。MSW/Service Worker は無効化前提。
- 4173 番ポートは HTTPS 自動付与なし。証跡は HTTP アクセスで取得し、ブラウザ側で自己署名を受け入れない。

### フェイルセーフ / 切替手順
- リトライ: UI/axios レイヤーで最大 3 回（1s→2s→4s バックオフ）。`traceparent` / `request-id` を同一値で継承し、サーバーログと突合可能にする。
- 接続先未設定ガード: `VITE_API_BASE_URL` が未設定かつ MSW 無効化の起動時は、画面上部に「接続先未設定（Stage URL を .env.stage に記入してください）」バナーを自動表示し、実サーバー接続漏れを即時検知する。
- TraceId/RequestId 表示とコピー: 500 系は TraceErrorBoundary/TraceNoticeCenter で ID を表示し、再試行ボタンも同 ID を header に再付与する。TraceId/RequestId コピー ボタンを追加し、サポート突合用にクリップボードへ転記できるようにした（証跡: `artifacts/observability/20251122T071146Z/traceid-error-boundary.png`、`artifacts/observability/20251122T071146Z/missing-endpoint-banner.png`。コピー動作はデバッグ通知挿入で確認）。
- ユーザー通知文言: 「通信に失敗しました。リクエスト ID: <value>。再試行しても解消しない場合は管理者へ連絡してください。」をトーストで表示。
- Stub/Mock/手動オペ: 個別 API 障害時は MSW/互換レイヤーの Stub を一時有効化し、医事側手動登録を依頼する暫定フォールバックを `artifacts/e2e-connect/20251122T071146Z/fallback/` に記録する。ORCA 本番/Trial の操作は禁止。
- 切替トリガー: 連続失敗 3 回以上、または SLA 超過時に Stub へ切替。切替と復旧は `docs/server-modernization/phase2/operations/logs/20251122T071146Z-incident.md` へ追記。

### 監査・セキュリティ最終チェックリスト
- [ ] 監査ログ発火: 認証/受付/カルテ/CLAIM の各操作が `d_audit_event` と `server_latest_logs.txt` に記録される（保存先: `artifacts/e2e-connect/20251122T071146Z/server-logs/`）。E2E 実測時に確認。
- [ ] PII マスキング: HAR/HTTP dump の patient_id / token を保存前にマスクする（`sed` で置換し README に手順を残す）。
- [ ] 権限ロール別アクセス: doctor/nurse/office ロールでの 403/200 を UI スクショで確認し、権限逸脱がないことを記録。
- [x] TraceContext に個人情報を含めない: `docs/server-modernization/phase2/operations/logs/20251122T071146Z-tracing.md` で baggage/label を確認済。通知は TraceId のみ。
- [ ] 通信経路 TLS: `mac-dev-login.local.md` の HTTPS 経路で `openssl s_client` を再取得し、証跡を `artifacts/e2e-connect/20251122T071146Z/httpdump/tls/` へ保存。2025-11-22 CLI では 100.102.17.40:443/8443/8000 すべてハンドシェイク失敗（証明書なし）を記録済み。稼働ポート確認後に再取得する。

## 証跡配置
- ログ: `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md`
- アーティファクト: `artifacts/e2e-connect/20251122T071146Z/{har,httpdump,screenshots,server-logs,fallback}/`
- 観測系ログ: `docs/server-modernization/phase2/operations/logs/20251122T071146Z-{tracing,links,alerts,metrics,incident,artifacts}.md`
- 既存スクリーンショット: `artifacts/observability/20251122T071146Z/traceid-error-boundary.png`
- スクショ: 接続先未設定バナー / TraceId コピー UI を `artifacts/observability/20251122T071146Z/missing-endpoint-banner.png` に取得済み。

### リンク整合チェック（2025-11-22 07:11:46Z）
- `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md`：存在を確認。
- `artifacts/e2e-connect/20251122T071146Z/httpdump/auth/patientlst2v2_20251122T132823Z.{curl.log,xml}`：存在（ORCA 404 応答）。
- `artifacts/e2e-connect/20251122T071146Z/httpdump/charts/version_localhost_20251122T132903Z.curl.log`：存在（localhost 接続拒否）。
- `artifacts/e2e-connect/20251122T071146Z/httpdump/tls/*.txt`：存在（すべて TLS ハンドシェイク失敗を記録）。
- `artifacts/e2e-connect/20251122T071146Z/server-logs/server_latest_logs_excerpt.txt`：存在（抜粋保存済）。
- `artifacts/e2e-connect/20251122T071146Z/fallback/README.md`：存在。
- `artifacts/e2e-connect/20251122T071146Z/har/`：未取得（Stage 接続先待ち、ディレクトリのみ）。
- `artifacts/e2e-connect/20251122T071146Z/screenshots/`：未取得（Stage 接続先待ち、ディレクトリのみ）。
- `artifacts/e2e-connect/20251122T071146Z/trace/`：未取得（Stage 接続先待ち、ディレクトリ未使用）。
- `artifacts/observability/20251122T071146Z/traceid-error-boundary.png`：存在（TraceId UI 表示スクショ）。

## スケジュール目安
- 12/12 (Day1): 参照チェーン確認、環境ベースライン確立、シナリオ草案作成。
- 12/13 (Day2): 認証/受付/予約シナリオの実測と証跡収集。
- 12/14 (Day3): カルテ/ORCA 呼び出し・エラー系シナリオ実測、仕分け表初版作成。
- 12/15 (Day4): 再現/フォローアップ、エスカレーション内容確定、ログ整理。
- 12/16〜12/17 09:00: DOC_STATUS 連携と引き継ぎメモを添付してクローズ。

## 証跡リスト（RUN_ID=20251122T071146Z）
- `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md`（E2E 手順・証跡リンクのハブ）
- `docs/server-modernization/phase2/operations/logs/20251122T071146Z-{tracing,links,alerts,metrics,incident,artifacts}.md`（観測・切替・リンク整理）
- `artifacts/e2e-connect/20251122T071146Z/README.md`（HAR/HTTP dump/スクショ/監査ログ雛形。未取得項目は Stage 接続先待ちで運用）
- `artifacts/e2e-connect/20251122T071146Z/har/README.md`（HAR 採取テンプレ。Stage 接続先未定のため未取得）
- `artifacts/e2e-connect/20251122T071146Z/{har,httpdump,screenshots,server-logs,fallback}/`（E2E 証跡置き場、HAR/スクショは Stage 接続先待ち）
- `artifacts/observability/20251122T071146Z/`（TraceId/UI スクリーンショット、ダッシュボード JSON / 未取得スクショ: `missing-endpoint-banner.png`）
- 保留予定: `artifacts/e2e-connect/20251122T071146Z/httpdump/tls/`（TLS 証明書取得後に配置）

## 参照
- 10 章 オブザーバビリティ: `src/modernized_server/10_オブザーバビリティと運用運転.md`

## リスクと留意点
- ORCA Trial 由来の 404/405 や seed 不足で成功シナリオが揃わない可能性 → Blocker として明記し、代替手段（モダナイズ側スタブ/互換レイヤー/seed 手順）を提案する。
- MSW やブラウザキャッシュが実サーバー計測を妨げるリスク → 実施前に Service Worker/キャッシュを無効化し、`VITE_DEV_PROXY_TARGET` の向き先を確認する。
- 認証トークン有効期限や同時ログイン制限で再現が不安定になるリスク → セッション延長手順を準備し、失効時の UI/HTTP 応答を証跡に残す。
- 証跡に機微情報が混入しないよう、ログ保存時はマスキング（患者 ID / トークン）と匿名化を徹底する。

### Stage 接続先情報リクエスト
- 目的: Ops/SRE から Stage 接続先を取得し、E2E 実測を再開できる状態にする。
- 送付テンプレ（RUN_ID を必ず記載し、メール/Issue/Slack いずれでも可）:
  - 件名例: `RUN_ID=<YYYYMMDDThhmmssZ> Stage 接続先情報リクエスト（Web クライアント E2E）`
  - 本文雛形:
    - 実施目的: Web クライアント × モダナイズ版サーバー Stage での E2E 実測準備
    - 希望回答期限: \<日付>（E2E 実測開始予定日）
    - 参照ログ: `docs/server-modernization/phase2/operations/logs/20251122T071146Z-e2e.md`（親 `20251120T131731Z`）
    - 取得してほしい項目（下記箇条書きをそのまま貼付）
- 必須取得項目
  - API ベース URL（例: `https://<host>/openDolphin`）と環境名
  - TLS ポート / 証明書取得手順（中間 CA / ルート CA 配布方法を含む）
  - 認証方式（Basic/Bearer/mTLS 等）と資格情報の置き場（Vault/1Password/ローカル .env など）
  - CORS / 追加ヘッダ要件（許可オリジン、認証ヘッダの pass-through 有無、SSE/WebSocket 可否）
  - MSW 無効化要否（本番相当でモック禁止の場合は `VITE_DISABLE_MSW=1` を指定する旨）
  - ブラウザ設定（証明書インポート・ HSTS 回避手順・プロキシ例外設定など）
