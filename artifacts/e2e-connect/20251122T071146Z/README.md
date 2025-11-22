# RUN_ID=20251122T071146Z E2E 証跡雛形（ブラウザ収集用）

- 保存先ルート: `artifacts/e2e-connect/20251122T071146Z/`（HAR/HTTP dump/スクショ/監査ログを集約）。
- 命名規則
  - HAR: `har/<scenario>_<yyyymmddThhmmssZ>.har`（ブラウザ DevTools で保存）。
  - HTTP dump: `httpdump/<feature>/<name>_<yyyymmddThhmmssZ>.{curl.log,xml,json}`（curl/ブラウザ export のいずれも可、個人情報は伏せ字）。
  - スクリーンショット: `screenshots/<scenario>_<yyyymmddThhmmssZ>.png`（UI で TraceId/リクエスト結果が分かる範囲）。
  - サーバーログ抜粋: `server-logs/<source>_<yyyymmddThhmmssZ>.log`（ログ回収時にトークン/ID をマスク）。
  - フォールバック: `fallback/<item>_<yyyymmddThhmmssZ>.md`（取得できなかった場合の理由や代替手順）。
- 取得手順（順番厳守）
  1. ブラウザで対象画面を操作し、DevTools Network から HAR を保存して `har/` へ配置。
  2. 同じ操作の UI 画面を `screenshots/` に保存（エラー表示や TraceId を含める）。
  3. API 呼び出しを `httpdump/` に保存（curl または DevTools からエクスポート）。
  4. サーバーログを `server-logs/` に保存（必要なら tail/grep 抜粋）。
  5. 上記が取得できない場合、経緯と次の試行案を `fallback/` に残す。
- 補足
  - Stage 接続先が確定したら上記順序で再取得する。確定待ちの間はディレクトリと命名だけ先に作成しておく。
  - 機微情報（患者 ID・トークン・Cookie 等）は必ずマスクする。
  - 各ファイル先頭に RUN_ID と取得日時を記載しておくとログ連携が容易になる。

## ローカル起動確認（20251122T071146Z）
- Vite 6.4 以降は `npm run dev:stage --https` が非対応。Stage 起動時は `VITE_API_BASE_URL= VITE_DISABLE_MSW=1 npx vite --host --mode stage --port 4173 --clearScreen false` を利用し、`--https` は付けない。
- コマンド: `VITE_API_BASE_URL= VITE_DISABLE_MSW=1 npx vite --host --mode stage --port 4173 --clearScreen false`（Vite 6.4 で `--https` オプション非対応のため直接起動）。`.env.stage` は空のまま。
- Dev サーバーログ: `VITE v6.4.1 stage ready in 132 ms` / Local: `https://localhost:4173/`。起動後にプロセスを kill 済み。
- ブラウザコンソール抜粋: `[MSW] 環境変数によりモックを無効化します。`、`Web Crypto での MD5 ハッシュ化に失敗しました。CryptoJS を利用します。`、`[HTTP] GET /user/9001:doctor1 …` → `404`、`SSE 接続に失敗しました。再試行します。 Error: SSE connection failed with status 404`。
- UI: 接続先未設定バナーが表示され、TraceNoticeCenter で TraceId/RequestId コピーが動作することをプレイブック上で確認（テスト用 notice を注入してコピー結果=`TraceId: trace-test-123 / RequestId: req-test-456`）。スクリーンショット: `artifacts/observability/20251122T071146Z/missing-endpoint-banner.png`。
