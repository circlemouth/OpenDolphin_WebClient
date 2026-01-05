# ORCA トライアルサーバー公開情報（firecrawl 取得アーカイブ）

## 目的
- `https://jma-receipt.jp/trialsite/index.html` に掲載されている WebORCA トライアルサーバーの接続情報をオフラインで参照できるよう Markdown 化し、開発/検証時の資格情報・利用制約を即時確認できるようにする。
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` や `docs/web-client/operations/mac-dev-login.local.md` から、試用サーバーでの UI/UX 検証フローにリンクできる参照資料を用意する。

## ディレクトリ構成
- `manifest.json`: 取得メタデータ（`slug / url / title / status / scrapeId / fetchedAt`）。
- `raw/trialsite.md`: firecrawl の Markdown 変換結果。画像やリンクは原文 URL を保持。
- `raw/trialsite.md.source`: 取得元 URL。
- `raw/trialsite.md.status`: HTTP ステータスコード（200 を確認済み）。

## firecrawl 取得メモ（RUN_ID=`20251114TorcaTrialSiteZ1`）
```bash
URL=https://jma-receipt.jp/trialsite/index.html
curl -s -X POST http://localhost:3002/v0/scrape \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"$URL\"}" \
  | tee tmp/firecrawl_jma_trialsite.json >/dev/null
TARGET=docs/server-modernization/phase2/operations/assets/orca-trialsite/raw
mkdir -p "$TARGET"
jq -r '.data.markdown' tmp/firecrawl_jma_trialsite.json > "$TARGET/trialsite.md"
jq -r '.data.metadata.url' tmp/firecrawl_jma_trialsite.json > "$TARGET/trialsite.md.source"
jq -r '.data.metadata.pageStatusCode' tmp/firecrawl_jma_trialsite.json > "$TARGET/trialsite.md.status"
cat tmp/firecrawl_jma_trialsite.json \
  | jq '{slug:"trialsite",url:.data.metadata.url,title:.data.metadata.title,status:.data.metadata.pageStatusCode,scrapeId:.data.metadata.scrapeId,fetchedAt:"2025-11-14"}' \
  > docs/server-modernization/phase2/operations/assets/orca-trialsite/manifest.json
```
> Python/Perl は禁止されているため、`bash + curl + jq` のみで取得している。

## 公開内容サマリ（2025-11-14 時点）
> **注意**: 本ドキュメントは参考情報です。実際の開発・検証接続先は `docs/web-client/operations/mac-dev-login.local.md` を参照してください。以下の接続情報はアーカイブとして残されていますが、使用しないでください。

- **接続先・資格情報**: Chrome で `https://weborca-trial.orca.med.or.jp/` へアクセスし、ユーザー `<MASKED>` / パスワード `<MASKED>` を入力するとマスターメニューが開く。
- **想定環境**: 1024×768 以上の解像度、Chrome ブラウザが必須。Windows 10/11 と macOS 11〜15 で動作確認済みと記載。
- **データ取扱い注意**: サーバーは一般公開され、登録データは誰でも閲覧可能。管理者による定期全消去あり。実在患者/医療機関情報の入力は禁止。
- **利用できない機能**: プログラム/マスタ更新、システム管理マスタ登録、レセプト一括・電算・月次統計・データ出力・CSV 作成、CLAIM 通信、プリンタ出力などは無効化。レセプトは個別作成のみ可で並列実行時の競合に注意。
- **初期データ**: 「システムの設定情報」節に施設情報（医療機関コード `1234567`、名称「医療法人 オルカクリニック」、所在地=東京都文京区本駒込2-28-16 等）、診療科（01内科〜26眼科）、施設基準、算定・チェック設定、職員アカウント（`doctor1` など）を掲載。患者番号の標準構成桁数は 5 桁。
- **補助リンク**: 利用不可機能一覧、初期患者データ一覧、オンラインマニュアル、業務メニュー画面キャプチャへのリンクが含まれる。

## 開発/検証での使いどころ
- Web クライアントの ORCA 画面フロー確認や UI 文言差異調査時に、本アーカイブを参照すればネットワーク遮断環境でもログイン手順と制約を説明できる。
- `CLAIM` 通信が起動していないことが明記されているため、`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` の CLAIM 検証手順を省略する条件づけに利用できる。
- 初期職員/患者情報を `docs/web-client/operations/mac-dev-login.local.md` のログインテンプレへ転記し、テストデータ共有に活用する。

## Runbook/ログ向け引用テンプレ
- 参照要約: `raw/trialsite.md` 先頭に `Snapshot Summary (2025-11-19)` を追記し、接続情報・データポリシー・利用不可機能・初期データの要点を整理した。Runbook ではこの節を引用し、必要に応じて下位見出し（例: `# お試しサーバの接続法`, `# お使いいただけない機能等`, `# システムの設定情報`）へリンクする。
- CRUD 許可表現: Trial サイト本文の「どなたでも自由に」「業務メニューが一部を除き自由」の記述を根拠に「新規登録／更新／削除 OK（トライアル環境でのみ）」と明記し、すべてのコマンド例は `curl -u <MASKED>:<MASKED> https://weborca-trial.orca.med.or.jp/...` 形式へ揃える。
- ログ保存: CRUD 操作ログは `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` または `2025-11-19-orca-trial-cutover.md` から `artifacts/orca-connectivity/TRIAL_SWITCH/` へリンクし、`RUN_ID=TorcaTrialCrudZ#` を Evidence 直下の README に併記する。
- Seed/PRF への扱い: `artifacts/orca-connectivity/seed/` 配下や `api21_medical_seed.sql` を参照する際は「参考アーカイブ（Trial 環境の CRUD で再登録する）」旨を Runbook 側に添え、直接投入しない運用を徹底する。

## フォローアップ
- トライアルサイトの内容が更新された場合は、同 RUN 手順で再取得し、`manifest.json` の `fetchedAt` とログ (`docs/server-modernization/phase2/operations/logs/2025-11-14-firecrawl-trialsite.md`) に RUN_ID を追記する。
- 追加で公開されている別ページ（例: `#limit`, `#sample` アンカーの独立ページ）があれば `tmp/orca_trialsite_pages.txt` を作成して複数 URL をループ取得すること。
