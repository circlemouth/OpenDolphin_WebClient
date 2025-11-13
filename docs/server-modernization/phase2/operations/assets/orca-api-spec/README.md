# ORCA API 仕様オフライン参照パッケージ (2025-11-13)

## 目的
- https://www.orca.med.or.jp/receipt/tec/api/overview.html 配下の公式仕様がネットワーク遮断時でも参照できるよう、`firecrawl` コンテナ経由で Markdown 化したコピーを `git` 管理する。
- `operations/ORCA_CONNECTIVITY_VALIDATION.md` や `assets/orca-api-requests/` から直接リンクできる整形済みインデックスを提供し、API 対応番号 (#1-53) と仕様ページの対応を明示する。

## ディレクトリ構成
- `raw/*.md` : 各 API 仕様ページの Markdown 変換結果。`.source` に取得元 URL、`.status` に HTTP ステータスを保持。
- `manifest.json` : `slug / apiName / endpoint / localPath` などのメタデータ一覧。`node scripts/tools/orca-spec-manifest.js` で再生成可能。
- `orca-api-matrix.with-spec.csv` : 既存の `assets/orca-api-matrix.csv`（No, URL, 優先度...）に `SpecSlug / LocalSpec / SpecRemote` を付加した相互参照リスト。

## firecrawl 取得手順メモ
1. firecrawl の稼働確認
   ```bash
   docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep firecrawl
   ```
2. 仕様ページ一覧の抽出（リンクコレクション）
   ```bash
   curl -s -X POST http://localhost:3002/v0/scrape \
     -H 'Content-Type: application/json' \
     -d '{"url":"https://www.orca.med.or.jp/receipt/tec/api/overview.html"}' > /tmp/orca_overview.json

   jq -r '.data.linksOnPage[] | select(test("/receipt/tec/api/"))' /tmp/orca_overview.json \
     | sed 's/#.*$//' | sed 's|/$||' | sort -u > tmp/orca_api_urls.txt
   ```
3. 各ページの Markdown 化（`curl` + `firecrawl`）
   ```bash
   target_dir=docs/server-modernization/phase2/operations/assets/orca-api-spec/raw
   mkdir -p "$target_dir"
   while read -r url; do
     [ -z "$url" ] && continue
     slug=$(basename "$url")
     slug=${slug%.html}
     clean_slug=$(echo "$slug" | sed 's/[^A-Za-z0-9_-]/-/g')
     payload=$(jq -n --arg url "$url" '{url:$url}')
     response=$(curl -s -X POST http://localhost:3002/v0/scrape -H 'Content-Type: application/json' -d "$payload")
     printf '%s\n' "$response" | jq -r '.data.markdown' > "$target_dir/${clean_slug}.md"
     printf '%s\n' "$response" | jq -r '.data.metadata.url' > "$target_dir/${clean_slug}.md.source"
     printf '%s\n' "$response" | jq -r '.data.metadata.pageStatusCode' > "$target_dir/${clean_slug}.md.status'
     sleep 0.3
   done < tmp/orca_api_urls.txt
   ```
4. メタデータ再生成
   ```bash
   node scripts/tools/orca-spec-manifest.js
   ```

## 利用方法
- API 番号から仕様へ飛ぶ: `orca-api-matrix.with-spec.csv` を開き、No 列で検索 → `LocalSpec` 列が `raw/<slug>.md` への相対パス。`SpecRemote` 列は公式 URL。
- 仕様のディフ確認: `raw/*.md` はテキスト差分を取りやすいよう画像レス化済み。閲覧時は Markdown ビューアで参照。
- Runbook から参照する場合は `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §1「参照」へリンクを追加済み。新しい資料を追加した際は本 README と `DOC_STATUS.md` を更新すること。

## 注意事項
- firecrawl 経由での取得は 200 レスポンスであること、`日医標準レセプトソフト API` の表記が変わっていないことを `manifest.json` の `statusCode` で確認する。
- `report_print` 配下は `https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html` を基点に 10 API が列挙されているため、クロール後に個別ページが追加された場合は `manualSlugMap`（`scripts/tools/orca-spec-manifest.js` 内）へ追記する。
- Python スクリプトの利用は禁止されているため、更新時は上記の `jq` + `bash` + `node` 手順のみを使用する。
