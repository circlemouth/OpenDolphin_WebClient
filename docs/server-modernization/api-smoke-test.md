# API スモークテスト運用手順

旧サーバーとモダナイズサーバーのレスポンス同等性を検証するためのスモークテスト手順を以下に示します。テストでは `ops/tests/api-smoke-test/` 配下のスクリプトとインベントリを利用します。

## 構成ファイル

- `api_inventory.yaml`
  - 既存サーバーで公開している全 REST エンドポイントを列挙したマニフェストです。
  - リソース名・HTTP メソッド・URL テンプレート (`{}` 内はパスパラメータ)・ボディ要否などのメタデータを含みます。
- `generate_config_skeleton.py`
  - 上記インベントリからテスト設定ファイルの雛形を自動生成します。
- `run_smoke.py`
  - 雛形に実データを入力した設定ファイルを読み込み、API を順番に叩いて結果を比較します。
- `test_config.sample.yaml`
  - 設定ファイル記述時の参考例です。
- `requirements.txt`
  - スクリプト実行時に必要な Python 依存ライブラリ (httpx / PyYAML)。

## 事前準備

1. Python 3.11 以降を利用できる環境を用意します。
2. 必要なライブラリをインストールします。
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r ops/tests/api-smoke-test/requirements.txt
   ```
3. インベントリからテスト設定の雛形を生成します。
   ```bash
   python ops/tests/api-smoke-test/generate_config_skeleton.py \
     --output ops/tests/api-smoke-test/test_config.yaml
   ```
4. 生成された `test_config.yaml` を編集し、全エンドポイントの `path_params`・`query`・`headers`・`body` などを実際の検証データに置き換えます。
   - `<REQUIRED>` と書かれた項目は必須です。未設定のまま実行するとスクリプトがエラーを返します。
   - `requires_body: true` のエンドポイントは JSON など適切なボディを指定してください。

## スモークテスト実行

### 旧サーバー単体テスト

モダナイズ版が未整備の場合でも、旧サーバーに対して一括でリクエストを投げてステータスを確認できます。

```bash
python ops/tests/api-smoke-test/run_smoke.py \
  --config ops/tests/api-smoke-test/test_config.yaml \
  --primary-base-url https://legacy.example.com/api \
  --artifact-dir artifacts/legacy-only
```

- `--artifact-dir` を指定するとリクエスト／レスポンスが JSON で保存され、差分調査が容易になります。
- `--allow-skips` を付けない場合、設定ファイル内で `skip: true` としたエンドポイントが残っていると失敗扱いになります。

### 旧新比較テスト

旧サーバーとモダナイズ版のレスポンス同等性を検証する場合は両方のベース URL を指定します。

```bash
python ops/tests/api-smoke-test/run_smoke.py \
  --config ops/tests/api-smoke-test/test_config.yaml \
  --primary-base-url https://legacy.example.com/api \
  --secondary-base-url https://modern.example.com/api \
  --artifact-dir artifacts/compare
```

- ステータスコードが `expected_status` と異なる場合、または JSON/テキストの内容が一致しない場合は `FAIL` もしくは `MISMATCH` として結果に表示されます。
- TLS 証明書を検証できない検証環境では `--insecure` を追加してください。

## テスト結果の読み方

スクリプト完了後、コンソールに以下の集計が表示されます。

- `成功`: ステータス・レスポンス共に期待通りだったエンドポイント数
- `不一致`: ステータスは一致したがレスポンスボディが異なった件数
- `失敗`: ステータス不一致や通信エラーなどで判定 NG になった件数
- `スキップ`: 設定ファイルで `skip: true` と指定した件数

詳細を確認したい場合は `artifact-dir` 配下の `request.json`・`primary_response.json`・`secondary_response.json` を参照してください。

## CI 自動化とベースライン比較

GitHub Actions に `API Smoke Test` ワークフロー（`.github/workflows/api-smoke-test.yml`）を追加し、旧サーバーとモダナイズ版を Docker Compose で順番に起動してレスポンスを比較できるようにしました。ワークフローでは以下の流れで実行します。

1. `docker compose -f ops/tests/api-smoke-test/docker-compose.yml up -d db server` で旧サーバーを起動し、`test_config.ci.yaml` で定義した最小エンドポイントに対して `run_smoke.py` を実行し成果物 (`artifacts/baseline/`) を生成する。
2. 旧サーバーを停止した後、`docker compose -f ops/tests/api-smoke-test/docker-compose.yml --profile modernized up -d server-modernized` でモダナイズ版を起動し、同一設定で再度 `run_smoke.py` を実行する。この際 `--baseline-dir artifacts/baseline` を指定して、直前に取得した旧サーバー結果とレスポンスを比較する。
3. `artifacts/modernized/` 以下にモダナイズ版のレスポンスを保存し、アーティファクトとしてアップロードする。

CI 用の設定ファイル `ops/tests/api-smoke-test/test_config.ci.yaml` は認証ヘッダーのみで疎通できる `/dolphin` および `/serverinfo/*` エンドポイントを対象とした最小構成です。追加で比較したい API がある場合は、同ファイルにケースを追記しつつ、必要なテストデータを `generate_config_skeleton.py` で生成した雛形に従って補完してください。

### `--baseline-dir` オプション

`run_smoke.py` に `--baseline-dir` オプションを追加し、`--secondary-base-url` を指定せずとも過去の成果物ディレクトリとレスポンスを比較できるようにしています。ベースライン成果物（`<endpoint-id>/primary_response.json`）内のボディ・ステータスを読み込んで、新しい実行結果と差分を判定します。以下のシナリオで利用してください。

```bash
# 旧サーバーからベースラインを取得
python run_smoke.py --config test_config.yaml \
  --primary-base-url https://legacy.example.com/api \
  --artifact-dir artifacts/legacy

# モダナイズ版と比較
python run_smoke.py --config test_config.yaml \
  --primary-base-url https://modern.example.com/api \
  --baseline-dir artifacts/legacy \
  --artifact-dir artifacts/modern
```

`--baseline-dir` と `--secondary-base-url` は同時に指定できません。比較対象サーバーを直接叩きたい場合は従来通り `--secondary-base-url` を利用してください。

## 注意事項

- 旧サーバーの API は 300 件以上存在します。雛形生成後にすべてのプレースホルダーへ実データを設定してから実行してください。
- `compare.mode` を `status` や `bytes` に変更することで JSON 以外のレスポンス比較方法を調整できます。JSON フィールドで差分を許容する場合は `compare.ignore_fields` に無視したいキー (トップレベル) を列挙してください。
- 実行前に `docs/server-modernization/server-api-inventory.md` を参照し、業務的に不要な API が含まれていないか確認してください。
- `/20/adm/factor2/totp/*` および `/20/adm/factor2/fido2/*` を検証した場合は、`SELECT action FROM d_audit_event ORDER BY event_time DESC LIMIT 5;` を実行して監査ログが記録されていることを確認してください。

