# ORCA 技術情報ハブ（firecrawl 取得アーカイブ）

## 目的
- https://www.orca.med.or.jp/receipt/tec/index.html を起点に公開されている技術資料をオフライン参照できるよう Markdown 化し、ネットワーク遮断時でも仕様確認・監査証跡作成を可能にする。
- API 以外の設計ガイド（帳票、画面、カスタマイズ命名規約、CLAIM 通信廃止日時など）を `operations/ORCA_CONNECTIVITY_VALIDATION.md` や `docs/web-client/operations/*.md` から直接参照できるようにする。

## ディレクトリ構成
- `manifest.json`: firecrawl 取得結果（`slug / url / title / status`）。`jq '.[] | {slug,url}'` でクイック参照可。
- `raw/<slug>.md`: HTML→Markdown 変換済み本文。元 URL・HTTP ステータスは `.md.source` / `.md.status` に保存。
- `tmp/orca_tec_pages.txt`: (非Git) 取得対象 URL リスト。更新時に `curl`+`jq` ループへ渡す。

## firecrawl 取得メモ
```bash
# 1. 対象リスト（必要に応じて追記）
cat <<'URLS' > tmp/orca_tec_pages.txt
https://www.orca.med.or.jp/receipt/tec/index.html
https://www.orca.med.or.jp/receipt/tec/api/
https://www.orca.med.or.jp/receipt/tec/api/pushapi.html
# ... 以下略
URLS

# 2. ループで Markdown 化
TARGET=docs/server-modernization/phase2/operations/assets/orca-tec-index/raw
mkdir -p "$TARGET"
while read -r url; do
  slug=$(basename "${url%/}"); slug=${slug:-index}; slug=${slug%.html}
  clean=$(echo "$slug" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g')
  payload=$(jq -n --arg url "$url" '{url:$url}')
  resp=$(curl -s -X POST http://localhost:3002/v0/scrape -H 'Content-Type: application/json' -d "$payload")
  echo "$resp" | jq -r '.data.markdown' > "$TARGET/${clean}.md"
  echo "$resp" | jq -r '.data.metadata.url' > "$TARGET/${clean}.md.source"
  echo "$resp" | jq -r '.data.metadata.pageStatusCode' > "$TARGET/${clean}.md.status"
  echo "$resp" | jq -r --arg slug "$clean" '{slug:$slug,url:.data.metadata.url,title:.data.metadata.title,status:.data.metadata.pageStatusCode}'
done < tmp/orca_tec_pages.txt | jq -s '.' > docs/server-modernization/phase2/operations/assets/orca-tec-index/manifest.json
```
> Python/Perl 実行は禁止されているため、`bash + jq + curl` のみで構成。

## 収録ページ概要（2025-11-13 RUN_ID=`20251113TorcaTecIndexZ1`）
| スラッグ | 主な内容 | 運用での使いどころ |
| --- | --- | --- |
| `index` | 技術情報ハブ本体。ソース公開（5.2.0/5.1.0/5.0.0）、基本設計書13種、カスタム帳票テンプレート(`receipt.*.tar.gz`)、ユーザカスタマイズ留意事項PDFリンク集を掲載。 | Server/Client 双方の仕様原典。tar/PDF を取得する際は `raw/index.md` の表から URL・更新日・用途を転記し、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ証跡を残す。 |
| `api` | 日医標準レセプトソフト API 概要。GLサーバ→ORCAサーバ→MIKANサーバの三層構成、Basic認証＋トークン、リソース一覧、サンプル JSON/XML を記載。 | `operations/ORCA_CONNECTIVITY_VALIDATION.md` §4 の前提。OpenDolphin 側で `claim.conn=server` を設定する理由を説明する根拠に使用。 |
| `pushapi` | WebSocket 接続先（オンプレ=ws://localhost:{9400|8000}, クラウド=wss://weborca.cloud.orcamo.jp 等）、TLS 要件、イベント別 payload（受付/患者登録/診療行為/入退院/メモ/入院診療） | Web クライアントのリアルタイム更新実装、および PUSH API テストスクリプト作成時のフィールド定義。 |
| `claim` | CLAIM 通信フロー、運用形態、送受信モジュール。先頭に「2026年3月末でCLAIM通信廃止」の公式告知。 | Legacy CLAIM 連携から API/PUSH へ移行する際の根拠。Runbook §7 の代替策説明に引用。 |
| `cobol` | OpenCOBOL を用いたビルド手順 (`cobc -m ORCXXX.CBL`)、Makefile 自動化、MONTSUQI とのリンク手順。 | カスタム帳票/県単独モジュールのビルド再現性を確保。`site-upgrade.sh` フローの解説材料。 |
| `customize_howto` | `/usr/local/site-jma-receipt/` 配下への配置、`site-upgrade.sh`、`bd`ファイル・`kentan.inc` 設定、シェル起動方法を手順化。 | 県単独ジョブ導入や `HC??.sh` 呼び出し調査時に参照。 |
| `customize_name` | 都道府県向けカスタムモジュール命名規約（`ORC`接頭辞禁止、`SC**`／`SEIKYU@ @**.sh` 等）。 | モジュール衝突や帳票ID管理のガイドラインとして使用。 |
| `database_table_definition_edition` | 2024-10-25速報版を含むテーブル定義 PDF リスト。令和2〜6年改定版へのリンクを網羅。 | DB スキーマ差分確認やETL設計資料。DL後は `docs/server-modernization/phase2/operations/logs/<date>` にファイル名と取得理由を記録。 |
| `glade` | 画面作成フロー（Glade＋libglade＋MONTSUQI）、Gtk/GNOME 依存、EUC-JP 保存注意、1画面1ファイル原則。 | Web クライアントで再現すべき画面遷移や MONTSUQI→Web 移植時の参考。 |
| `monpe` | 帳票設計ツール MONPE の概要、COPY句自動生成手順、dia→monpe 変換 (`dia2red`) と Ruby スクリプト例。 | 帳票カスタマイズのCI自動化、COPY句同期フロー整備のベース。 |
| `montsuqi` | MONTSUQI 全体構成、`overview`/`description`/PDF へのシンプルなポータル。 | UI/帳票両面の OSS リンク集。 |
| `recompile` | 自動リコンパイル配置規約。`/usr/lib/jma-receipt/site-lib` と `/usr/local/site-jma-receipt/` の役割分担、各サブディレクトリ用途。 | カスタムコードのデプロイ/アップグレード時の Diff チェック。 |
| `report` | オンライン帳票（カルテ・処方箋等）をユーザが作成する際の命名規約（先頭に`A`）、プリンタ指定、`ORCSPRTNM` サブルーチン使用手順。 | Web クライアントの帳票出力要件と整合させる際の必須リファレンス。 |
| `report2` | 日次・月次統計帳票のカスタマイズ方法、`daily-statistics`/`monthly-statistics` PDF のダウンロードリンク。 | 統計帳票の改修依頼に備えた根拠。 |
| `user-customize-attention` | 2025-04-15 版を含むカスタマイズ留意事項PDF（処方箋・診療費明細・領収書等）と「古い資料は現状と異なる場合あり」注意。 | 改定対応タスクで履歴を遡る際の索引。 |
| `api_overview` | 53 API の業務カテゴリ／エンドポイント／サンプル仕様を一覧化し、`Request_Number` で機能を切り替えるケースの注記（※1）も明示。 | Runbook で優先 API を俯瞰する際に最短でリファレンスへ飛ぶリンク集として利用。 |
| `api_syoho-period` | コメントコード `099208103` を使った処方箋使用期間の入力ルールと、HAORI/ORCA API の XML サンプル（`YY-MM-DD` 形式や `Medication_Input_Code` の配置）を掲載。 | 処方便の改訂や HAORI 連携で日付コメントを維持する際の実装テンプレ。 |
| `api_comment85-831` | `8501xxxx`～`8521xxxx`/`831xxxxx` コメントコードのフォーマット（例: 時刻→`12-02`、処置時間→`120`、診療コード9桁→`160000310`）と `medicalgetv2` の返却例を整理。 | API 電文でのコメント格納・復元ロジックを検証するときの根拠。 |
| `api_comment842-830-bui` | `842xxxxxx`（検査値等）と `830xxxxxx`（撮影部位コード）の設定方法、正負表記、部位コードの補足を記載。 | 放射線系のコメント連携や検査値コメント入力チェックで参照。 |
| `api_covid19` | 新型コロナ臨時入院料の算定サンプル（`Hospital_Charge`/`Hospital_Charge_NotApplicable`）、公費028の組み合わせ、35日上限/3倍算定時の転科処理などを時系列で整理。 | COVID-19 期間の入院登録や課金ロジックを再現する際の手順書。 |
| `api_userkanri` | `/orca101/manageusersv2` のユーザ管理 API 仕様。ユーザ一覧/登録/変更/削除のリクエスト・レスポンス定義、Ruby サンプル、エラーメッセージ一覧を収録。 | ORCA ⇔ OpenDolphin のユーザ同期や権限差分調査で参照。 |
| `claim_comment85-831` | CLAIM 電文における `85/831` コメントコードの `claim:number` 設定例と表示確認、和暦⇔西暦変換の注意をまとめたもの。 | CLAIM 側とのデータ整合で API と CLAIM のフォーマット差異を説明する資料。 |
| `claim_comment842-830-bui` | CLAIM 電文での `842/830` コメント値や撮影部位コードの埋め込み方、`claim:bodySite` との対応表を掲載。 | レセ電送信前のコメント整形・検証に活用。 |
| `montsuqi_overview` | MONTSUQI の構成要素・特徴（軽負荷/モジュラー/HA構成）と DB 二重化・フォルトトレラント戦略を説明。 | MONTSUQI → Web クライアント移行時に既存アーキテクチャを理解するためのハイレベル資料。 |
| `montsuqi_description` | `glclient/glserver/glauth/WFC/apsCOBOL/COBOL` など各モジュールの責務、キュー制御、ラッパー構成を詳細化。 | 既存 Swing/MONTSUQI 資産と Web クライアントの橋渡しをする際の内部挙動リファレンス。 |
| `push-api` | PUSH通知の特設ハブ。`push-exchanger` の最新版、Ruby MONPE ライブラリ同梱、帳票データ取得APIなど関連資料へのリンクと更新履歴（例: 2024-08-21版）を掲載。 | PUSH 用ミドルウェアのバージョン確認や関連ツールのダウンロード元として利用。 |

## ダウンロード URL メモ
- **ソースコード**: `jma-receipt.r_5_2_branch.zip` など 9 つの zip（本体/地域公費/公開帳票）。`raw/index.md` の表を spreadsheet 化すると差分管理しやすい。
- **基本設計書 PDF**: `orca_bd_*.pdf` 系列（患者登録/受付/予約/収納 等13本）。改定年ごとにファイルが分かれるため、必要な章だけ抽出して `docs/server-modernization/phase2/operations/assets/` 配下へ再整理すること。
- **テーブル定義**: `database-table-definition-edition-*.pdf`、`202410-kaisei-...fast.pdf`。最新2版は NEW マーク付き。
- **帳票テンプレート**: `receipt.{gairai,nyuin}.custom_4.{7,8}.tar.gz`（外来/入院）、`sokatsu.custom.grp.tar.gz` 等。展開時は `docs/server-modernization/phase2/operations/assets/seeds/` ではなく `artifacts/orca-connectivity/<RUN_ID>/` に置き、一時利用後削除する。
- **カスタマイズ留意事項 PDF**: 2012〜2025年までの履歴を `user-customize-attention` 内に羅列。必要な改定分だけ取得してドキュメントへ抜粋する。

## 参照先との連携
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` の「参照」節から本 README へリンク済み。API 以外の仕様差分はここから逆引きする。
- `docs/web-client/planning/phase2/DOC_STATUS.md` で本資料を Active 管理。Archive 判定時は `docs/archive/<YYYYQn>/` へ移動し、`raw/` 以下の Markdown をそのまま保管する。
- firecrawl 取得ログは `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` の RUN_ID=`20251113TorcaTecIndexZ1` セクションに記載。次回更新時は同ログへ追記して履歴を繋げる。
