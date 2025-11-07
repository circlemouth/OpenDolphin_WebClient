# 帳票テンプレート運用ガイド

## テンプレート配置
- すべての Velocity テンプレートは `server-modernized/reporting/templates/` に配置する。ビルド時に `reporting/templates` として WAR 内へ同梱される。
- 多言語対応はファイルサフィックスで区別し、`patient_summary_ja_JP.vm` のようにロケールコードを付与する。
- 共通パーツは `common/` ディレクトリへまとめ、`#parse("common/header.vm")` のように読み込む。
- 実行時の読み込みディレクトリは `open.dolphin.templates.dir`（システムプロパティ）または環境変数 `OPENDOLPHIN_TEMPLATES_DIR` で上書きできる。未設定の場合は `server-modernized/reporting/templates` が自動検出される。

## ビルド設定
- `server-modernized/pom.xml` の通常ビルドに OpenPDF と Velocity 2.3 を組み込んでおり、WAR 生成時に最新テンプレートが同梱される。
- プレビュー生成・アクセシビリティ検証の具体的な手順は `docs/server-modernization/reporting/3_5-reporting-modernization.md` の CI セクションを参照する。

## テンプレート更新フロー
1. `templates/` で変更を行い、CI の `Reporting Preview` ワークフロー結果を確認して Velocity 構文エラーがないことを確認。
2. ローカルでプレビューが必要な場合は下記の `PdfRendererKt` を利用し、OpenPDF ベースの PDF を生成してアクセシビリティを確認。
3. 生成物を Git LFS に登録し、Pull Request に貼付した上で QA チームへレビュー依頼。

### ローカルプレビュー（例）

```
mvn -pl server-modernized -am -DskipTests package
java \
  -cp "$(find server-modernized/target -name 'classes' -o -name '*.jar' -print | paste -sd: -)" \
  open.dolphin.reporting.PdfRendererKt \
  --templates server-modernized/reporting/templates \
  --output reporting/output/sample-ja.pdf \
  --locale ja-JP
```

署名設定を併用する場合は `--config server-modernized/reporting/signing-config.sample.json` を追加する。

## Secrets
- PDF 署名鍵は `reporting/secrets/signature.p12` をデプロイパイプラインでマウントし、ローカルではダミー鍵 (`reporting/secrets/sample-signature.p12`) を利用する。
- 署名設定 (`signing-config.json`) に TSA 情報が含まれていて接続に失敗した場合でも、自動的に署名無しの PDF を生成しつつ警告ログを出力する。
