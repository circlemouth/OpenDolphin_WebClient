# Codex 仮想環境向けサーバーセットアップ手順

本ドキュメントは Codex 仮想環境でモダナイズ版サーバーをビルドするために必要な前提条件を自動構成する `scripts/setup_codex_env.sh` の利用方法を示します。

## スクリプト概要

`scripts/setup_codex_env.sh` は以下の処理を順番に実行します。

1. OpenJDK 17 および補助ユーティリティ（`wget` など）のインストール
2. Apache Maven 3.9.6 の導入（公式ミラーが 404 の場合は Apache Archive へ自動フェイルオーバー）と `mvn` コマンドの再リンク
3. `JAVA_HOME` を `/etc/profile.d/opendolphin-java.sh` に定義
4. `docker/server/settings.xml` を `~/.m2/opendolphin-server-settings.xml` へ複製し、WildFly 依存のリポジトリ設定を常用可能にする
5. `ext_lib/AppleJavaExtensions.jar` と `ext_lib/iTextAsian.jar` をローカル Maven リポジトリへ登録
6. ルート POM（`opendolphin:opendolphin:2.7.1`）と `common` モジュールをローカル Maven リポジトリへインストール
7. 上記で用意した設定ファイルを指定して `server-modernized` モジュールをビルド（テストはスキップ）し、依存関係を事前取得

登録される座標は以下の通りです。

- `com.apple:AppleJavaExtensions:1.6`
- `opendolphin:itext-font:1.0`

## 前提条件

- Codex 仮想環境のコンテナで root 権限を保持していること
- リポジトリのルートに移動済みであること（`pom.xml` が存在する場所）
- ネットワークへアクセスできること（Maven 取得および APT リポジトリに接続するため）

## 使用方法

```bash
sudo ./scripts/setup_codex_env.sh
```

コンテナが既に root ユーザーであれば `sudo` は不要です。処理の途中で Maven や JDK が既に条件を満たす場合はスキップされます。`~/.m2/opendolphin-server-settings.xml` は Codex 環境専用に複製されるため、既存の `settings.xml` を上書きすることはありません。

## 実行後の確認

- `mvn -v` で `Apache Maven 3.9.6` と `Java version: 17` が表示される
- `ls ~/.m2/repository/com/apple/AppleJavaExtensions/1.6/` に `AppleJavaExtensions-1.6.jar` が存在する
- `ls ~/.m2/repository/opendolphin/itext-font/1.0/` に `itext-font-1.0.jar` が存在する
- `ls ~/.m2/repository/opendolphin/opendolphin/2.7.1/` に `opendolphin-2.7.1.pom` が存在する
- `ls ~/.m2/repository/opendolphin/opendolphin-common/2.7.1/` に `opendolphin-common-2.7.1.jar` が存在する
- `ls ~/.m2/opendolphin-server-settings.xml` で WildFly 用リポジトリ設定が展開されていることを確認する

これらの条件が揃っていれば、モダナイズ版サーバーのビルドに必要な依存関係が正しく揃っています。
