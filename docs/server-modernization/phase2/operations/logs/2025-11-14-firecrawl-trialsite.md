# firecrawl 実行ログ（RUN_ID=20251114TorcaTrialSiteZ1）

- 実施日時: 2025-11-14 16:05 JST（UTC `20251114T070500Z`）
- 対象: `https://jma-receipt.jp/trialsite/index.html`
- 目的: WebORCA トライアルサーバー（開発検証用 ORCA サーバー）の公開情報を firecrawl で Markdown 化し、オフライン参照・証跡保管を可能にする。
- 参照ドキュメント: `docs/server-modernization/phase2/operations/assets/orca-trialsite/README.md`

## 1. 実施サマリ
| 項目 | 結果 |
| --- | --- |
| firecrawl コンテナ稼働確認 | `docker ps` で `firecrawl-api-1` など 4 コンテナ稼働を確認。
| 取得ステータス | HTTP 200 (`manifest.json` の `status=200`)
| 出力 | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md(.source/.status)`、`manifest.json`、`tmp/firecrawl_jma_trialsite.json`
| 主要情報 | 接続先 `https://weborca-trial.orca.med.or.jp/`、ユーザー `trial` / パスワード `weborcatrial`、利用不可機能・初期データ一覧 等を確認。

## 2. 手順
1. `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep firecrawl` で firecrawl サービスの起動を確認。
2. `curl -s -X POST http://localhost:3002/v0/scrape -H 'Content-Type: application/json' -d '{"url":"https://jma-receipt.jp/trialsite/index.html"}' | tee tmp/firecrawl_jma_trialsite.json >/dev/null` を実行し、レスポンス JSON を保存。
3. `jq` で `data.markdown` を `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` に展開し、`url` / `status` を `.source` / `.status` へ分離。メタデータは `manifest.json` に整形。
4. README へ目的・構成・サマリを記述し、再取得手順を転記。

## 3. 次アクション
1. `docs/web-client/planning/phase2/DOC_STATUS.md` および `docs/web-client/README.md` に新資料のリンクとステータスを追記する。
2. macOS / Windows 向けローカルログイン手順書（`docs/web-client/operations/mac-dev-login.local.md` など）へ、トライアルサーバーの URL・資格情報・利用制限を引用する。
3. CLAIM 接続タスクでは、本資料記載の「CLAIM サーバーは起動していない」注意書きを参照し、Runbook 上のスコープ判定に利用する。
