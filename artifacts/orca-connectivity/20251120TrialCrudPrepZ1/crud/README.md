# CRUD 証跡プレースホルダー

- ここには `acceptmodv2`, `appointmodv2`, `medicalmodv2` などエンドポイント別にサブディレクトリを作成し、以下を保存する。
  1. `request.json` / `response.json`
  2. `curl.log`（`curl -vv -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/<endpoint> -H 'Content-Type: application/json' -d @payloads/<file>.json`）
  3. UI との突合スクリーンショット（該当する場合）
- 2025-11-20 時点では CLI サンドボックスからトライアル環境へ接続できないため未実施。ネットワーク許可済み端末で実行したら、本 README を置き換えて各エンドポイントのサブディレクトリを作成すること。
