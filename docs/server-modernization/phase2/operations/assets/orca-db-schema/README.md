# ORCA データベーステーブル定義書アーカイブ（firecrawl取得）

- 目的: ORCA 公式「日医標準レセプトソフト データベーステーブル定義書」PDFを firecrawl（docker 稼働中）で Markdown 化し、オフラインでも参照できるよう保存。
- RUN_ID: 20251123T213733Z
- 参照優先度: 基本は **令和6年4月26日版（現行スキーマ本体）** を使用し、長期収載品選定療養カラムなど追加情報が必要な場合のみ **令和6年9月25日改定対応 速報版** を併用する。

## ファイル構成
- `manifest.json`: スラッグ、版、URL、ローカルパス、取得日時をまとめたメタデータ。
- `raw/*.pdf`: 公式 PDF のオリジナルコピー。
- `raw/*.md`: firecrawl による Markdown 変換結果（全文テキスト、図版なし）。
- `raw/*.md.source`: 取得元 URL。
- `raw/*.md.status`: firecrawl レスポンスの HTTP ステータス（PDF は null になる場合あり）。

## 取得手順（再実行時）
1. firecrawl コンテナ稼働確認:
   ```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep firecrawl
   ```
2. 例: 正式版の再取得
   ```bash
URL=https://ftp.orca.med.or.jp/pub/data/receipt/tec/database-table-definition-edition-20240426.pdf
SLUG=database-table-definition-edition-20240426
RESP=tmp/orca-db-schema/${SLUG}.json
curl -s -X POST http://localhost:3002/v0/scrape \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"$URL\"}" > "$RESP"
jq -r '.data.markdown' "$RESP" > docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/${SLUG}.md
jq -r '.data.metadata.url' "$RESP" > docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/${SLUG}.md.source
jq -r '.data.metadata.pageStatusCode' "$RESP" > docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/${SLUG}.md.status
curl -L -o docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/${SLUG}.pdf "$URL"
   ```
3. `manifest.json` の `fetchedAt` を更新し、必要なら `scope`/`edition` を追記。

## 利用ノート
- オーダー実装時は原則 2024-04-26 正式版を参照し、速報版は長期収載品選定療養関連カラムを確認する場合に限定する。
- PDF から図表を抜粋する場合はライセンスに留意し、引用元と版を必ず記載する。
