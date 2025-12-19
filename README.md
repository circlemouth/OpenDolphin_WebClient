# OpenDolphin Web Client & Modernized Server

本リポジトリは、オープンソース電子カルテシステム **OpenDolphin** をベースに、サーバーのモダナイゼーション（Jakarta EE 10 対応）と、新規 Web クライアントの開発を行うプロジェクトです。

フォーク元の Legacy 資産（Java Swing クライアント、旧サーバー）は**参照専用**として保持し、並行して新しいアーキテクチャでの開発を進めています。

## 📚 ドキュメント・開発ハブ

本プロジェクトのドキュメントは役割別に集約されています。開発作業は必ず以下のハブドキュメントを起点に進めてください。

### 開発状況（単一参照）
👉 **[docs/DEVELOPMENT_STATUS.md](docs/DEVELOPMENT_STATUS.md)**
*   Phase2 ドキュメントの位置付け（Legacy/Archive）
*   現行作業の参照順とルール

### Web クライアント開発
👉 **[docs/web-client/README.md](docs/web-client/README.md)**
*   UX/UI 設計、画面仕様
*   新規実装計画 (Login, Reception, Chart, etc.)
*   Web クライアント運用ルール

### サーバーモダナイズ & ORCA 連携
👉 **[docs/server-modernization/](docs/server-modernization/)**
*   Jakarta EE 10 移行、API 設計
*   ORCA (WebORCA) 連携仕様・接続ルール
*   サーバー運用・デプロイ手順

---

## 📂 リポジトリ構成

| ディレクトリ | 説明 | ステータス |
| :--- | :--- | :--- |
| **`web-client/`** | **新規 Web クライアント** (React, TypeScript) | **Active Development** |
| **`docs/`** | プロジェクト全般のドキュメントハブ | **Active Development** |
| `client/` | 旧 OpenDolphin クライアント (Java Swing) | ⛔️ Legacy (Read-only) |
| `server/` | 旧 OpenDolphin サーバー (Java EE 7) | ⛔️ Legacy (Read-only) |
| `ext_lib/` | 旧ビルド依存ライブラリ | ⛔️ Legacy (Read-only) |

> **Legacy 資産 (`client/`, `server/`) について**
> これらのディレクトリに含まれるコードは、機能比較や仕様確認のためにのみ残されています。
> **修正・変更・保守作業は行いません。**



## Original License & Credits

本プロジェクトは以下の OpenDolphin 2.7.1 をフォーク・継承しています。

### OpenDolphin 2.7.1
*   皆川和史、王勝偉　[オープンドルフィン・ラボ](http://www.opendolphin.com)

### ライセンス & 謝辞
*   OpenDolphinのライセンスは GNU GPL3 です。
*   OpenDolphinは下記先生方の開発されたソースコードを含んでいます。
    - 札幌市元町皮ふ科の松村先生
    - 和歌山市増田内科の増田先生
    - 新宿ヒロクリニック
    - 日本RedHat Takayoshi KimuraさんのJBoss as7 へのポーティング

これらの部分の著作権はそれぞれの先生に帰属します。
