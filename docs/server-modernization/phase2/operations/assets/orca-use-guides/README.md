# ORCA 利用者向け運用ガイド（SSL/認証系）アーカイブ

## 目的
- `https://www.orca.med.or.jp/receipt/use/` 配下の運用マニュアル（例: glserver と証明書認証で通信する手順）を firecrawl で Markdown 化し、オフラインでも参照できるようにする。
- ORCA CONNECTIVITY Runbook から証明書インストール・SSL クライアント認証手順へ即時アクセスできるよう、保存場所と参照方法を統一する。

## ディレクトリ構成
- `raw/<slug>.md` : 取得したマニュアル本文。画像はリンク、コード・設定例はテキストとして保持。
- `.md.source` / `.md.status` : 元 URL と HTTP ステータス。
- `manifest.json` : 収録 slug・URL・タイトルの一覧。

## 収録ページ（2025-11-13 RUN_ID=`20251113TorcaSSLGuideZ1`）
| スラッグ | タイトル | 主な内容 |
| --- | --- | --- |
| `glserver_ssl_client_verification4` | ORCA Project： glserverでのSSLクライアント認証設定(4) | glserver⇔クライアント間の証明書配布、`client.pem` 作成、自前CA署名、`glserver_ssl_client_verification` 設定、`openssl verify` による疎通チェック手順を図付きで解説。 |

## 参照ルール
- Runbook／Log から参照するときは `assets/orca-use-guides/raw/<slug>.md` を指す。
- 新しい運用マニュアルを追加した場合は、本 README と `manifest.json` を更新し、取得 RUN_ID をログ (`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md`) に追記すること。
- 大容量 PDF や添付ファイルがある場合は `artifacts/orca-connectivity/<RUN_ID>/downloads/` に保存し、本 README からリンクする。
