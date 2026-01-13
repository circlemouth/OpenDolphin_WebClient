# firecrawl 実行ログ（RUN_ID=20260113T053127Z）

## 目的
ORCA API 仕様（非入院）+ 帳票印刷 API 資産 + PUSH 仕様 + WebORCA/Trial 参照の不足分を firecrawl で取得し、非Legacyに整理する。

## 事前確認
- 既存 firecrawl 取得物（Legacy/Phase2）は以下を参照し、重複取得は最小限に留めた。
  - `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/*.md`
  - `docs/server-modernization/phase2/operations/assets/orca-tec-index/raw/push-api.md`
  - `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`

## firecrawl 起動・復旧手順（今回の詰まり）
- `firecrawl-api-1` が `ECONNREFUSED 127.0.0.1:5432` で停止したため、`NUQ_DATABASE_URL` を明示する override を使用。
```bash
cat <<'YAML' > /tmp/firecrawl-override.yml
services:
  api:
    environment:
      NUQ_DATABASE_URL: postgresql://postgres:postgres@nuq-postgres:5432/postgres
      NUQ_DATABASE_URL_LISTEN: postgresql://postgres:postgres@nuq-postgres:5432/postgres
YAML

docker compose -f /Users/Hayato/Documents/GitHub/firecrawl/docker-compose.yaml \
  -f /tmp/firecrawl-override.yml up -d api
```

## 取得対象（不足分のみ）
- report_print 外来 HTML: `shohosen / okusuri_techo / karte_no1 / karte_no3 / seikyusho / meisaisho`
- report_print PDF: request/response 項目一覧 + 共通エラー
- report_print Ruby サンプル: 6 本
- push docs: 帳票データ取得 API / PUSH 仕様 PDF
- WebORCA / Trial: 非Legacy 参照用に再取得

## 実行コマンド（要約）
```bash
RUN_ID=20260113T053127Z
BASE_DIR=docs/server-modernization/operations/assets/orca-firecrawl
RAW_DIR="$BASE_DIR/raw"

payload=$(jq -n --arg url "https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html" '{url:$url}')
resp=$(curl -s -X POST http://localhost:3002/v0/scrape -H 'Content-Type: application/json' -d "$payload")

printf '%s\n' "$resp" | jq -r '.data.markdown' > "$RAW_DIR/report_print_shohosen.md"
printf '%s\n' "$resp" | jq -r '.data.metadata.url' > "$RAW_DIR/report_print_shohosen.md.source"
printf '%s\n' "$resp" | jq -r '.data.metadata.pageStatusCode' > "$RAW_DIR/report_print_shohosen.md.status"
```

## 出力
- `docs/server-modernization/operations/assets/orca-firecrawl/raw/*.md`
- `docs/server-modernization/operations/assets/orca-firecrawl/manifest.json`
- `docs/server-modernization/operations/assets/orca-firecrawl/README.md`
- `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md`

## ステータス
- 全対象 URL は `manifest.json` 上で status `200`。
- 入院系（`hs*` / `*_n*`）は除外。
