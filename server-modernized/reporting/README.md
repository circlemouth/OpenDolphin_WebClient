# 帳票テンプレート運用ガイド

## テンプレート配置
- すべての Velocity テンプレートは `server-modernized/reporting/templates/` に配置する。
- 多言語対応はファイルサフィックスで区別し、`patient_summary_ja_JP.vm` のようにロケールコードを付与する。
- 共通パーツは `common/` ディレクトリへまとめ、`#parse("common/header.vm")` のように読み込む。

## ビルド設定
- `server-modernized/pom.xml` の通常ビルドに OpenPDF と Velocity 2.3 を組み込んでおり、WAR 生成時に最新テンプレートが同梱される。
- プレビュー生成・アクセシビリティ検証の具体的な手順は `docs/server-modernization/reporting/3_5-reporting-modernization.md` の CI セクションを参照する。

## テンプレート更新フロー
1. `templates/` で変更を行い、CI の `Reporting Preview` ワークフロー結果を確認して Velocity 構文エラーがないことを確認。
2. ローカルでプレビューが必要な場合は `docs/server-modernization/reporting/3_5-reporting-modernization.md` に従い、Docker 上の OpenPDF ラッパースクリプトで PDF を生成。
3. 生成物を Git LFS に登録し、Pull Request に貼付した上で QA チームへレビュー依頼。

## Secrets
- PDF 署名鍵は `reporting/secrets/signature.p12` をデプロイパイプラインでマウントし、ローカルではダミー鍵 (`reporting/secrets/sample-signature.p12`) を利用する。
