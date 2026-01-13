# ORCA firecrawl 追加取得アーカイブ（非Legacy）

## 目的
- ORCA API 仕様（入院系除外）・帳票印刷 API（report_print）関連・PUSH 仕様・WebORCA/Trial 参照の不足分を firecrawl で取得し、非Legacy領域で追跡可能にする。
- 既存の Legacy (Phase2) アーカイブは参照のみとし、新規取得は本ディレクトリへ整理する。

## 取得範囲（2026-01-13, RUN_ID=20260113T053127Z）
- **report_print 外来 HTML**: `shohosen / okusuri_techo / karte_no1 / karte_no3 / seikyusho / meisaisho`
- **report_print PDF 資産**: request/response 項目一覧 + 共通エラー
- **report_print サンプルコード**: Ruby サンプル 6 種
- **push docs**: 帳票データ取得 API ページ + PUSH 仕様 PDF
- **WebORCA/Trial**: `weborca` / `trialsite` を非Legacyに再取得

※ 入院系（`hs*`、`*_n*`）は除外ポリシーに従い未取得。

## ディレクトリ構成
- `raw/*.md`: firecrawl の Markdown 変換結果
- `raw/*.md.source`: 取得元 URL
- `raw/*.md.status`: HTTP ステータス
- `manifest.json`: `slug/url/title/status` の一覧

## 既存 (Legacy/Phase2) 取得済み資産（参照のみ）
- **ORCA API 仕様 (非入院含む)**: `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/*.md`
  - 例: `overview` / `patientget` / `acceptmod` / `systemkanri` / `report_print` (index) など
- **PUSH API 入口ページ**: `docs/server-modernization/phase2/operations/assets/orca-tec-index/raw/push-api.md`
- **Trial サイト**: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`

## firecrawl 実行メモ（再現用）
```bash
BASE_DIR=docs/server-modernization/operations/assets/orca-firecrawl
RAW_DIR="$BASE_DIR/raw"
mkdir -p "$RAW_DIR"

payload=$(jq -n --arg url "https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html" '{url:$url}')
resp=$(curl -s -X POST http://localhost:3002/v0/scrape -H 'Content-Type: application/json' -d "$payload")

printf '%s\n' "$resp" | jq -r '.data.markdown' > "$RAW_DIR/report_print_shohosen.md"
printf '%s\n' "$resp" | jq -r '.data.metadata.url' > "$RAW_DIR/report_print_shohosen.md.source"
printf '%s\n' "$resp" | jq -r '.data.metadata.pageStatusCode' > "$RAW_DIR/report_print_shohosen.md.status"
```

## 注意事項
- firecrawl が起動できない場合は `NUQ_DATABASE_URL` を明示しないと `localhost:5432` へ接続し失敗することがある。詳しい復旧手順は `docs/server-modernization/operations/logs/20260113T053127Z-orca-firecrawl.md` を参照。
- 取得対象に入院系が混在する場合は除外パターン（`hs*`, `*_n*`）を適用する。
