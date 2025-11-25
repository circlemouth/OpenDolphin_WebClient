# ORCA REST API / receipt_route 設定照会票

## 1. 依頼概要
- RUN_ID=`20251113TorcaConfigW40`（取得時刻: 2025-11-13 02:20:10Z）で WebORCA コンテナ内の設定ファイルと環境変数を一括採取したところ、REST API を POST で有効化するための `API_ENABLE_*`／`API_ROUTE_*`／`HYBRID_*` などのキーを見つけられませんでした。
- `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` に記録しているとおり、`/api01rv2/patientgetv2` は 404、`/orca11/acceptmodv2`／`/orca14/appointmodv2`／`/api21/medicalmodv2` など POST 系は 405（`Allow: GET, OPTIONS`）のままで、OpenDolphin からの連携テストを進められない状況です。
- ORCA サポート窓口に対して、REST API を POST で許可するための正式な手順書／設定ファイルの所在／期待する環境変数値を確認したく、下記の証跡と質問事項を共有予定です。

## 2. 収集済み証跡
| No | 証跡 | 目的 | 備考 |
| -- | ---- | ---- | ---- |
| 1 | `artifacts/orca-connectivity/20251113T022010Z/config_dumps/env_API_ROUTE_HYBRID.txt` | `env | grep -E 'API|ROUTE|HYBRID'` 実行結果 | ファイルサイズ 0 byte。API/HYBRID 系の環境変数が未定義であることを示す。 |
| 2 | `artifacts/orca-connectivity/20251113T022010Z/config_dumps/online.env` | `/opt/jma/weborca/releases/receipt/20251028-1/etc/online.env` の現物 | HTTP/DB 設定のみで `API_ENABLE_*` や `ALLOW_METHODS` が存在しない。抜粋は §3.1 を参照。 |
| 3 | `artifacts/orca-connectivity/20251113T022010Z/config_dumps/jma-receipt.env` | `LOGDIR` などサービス全体の環境ファイル | REST/API 切替に関するキーが未定義。差分確認のため全文を添付。 |
| 4 | `artifacts/orca-connectivity/20251113T022010Z/config_dumps/route_yml_search.txt` / `route_yaml_search.txt` | `docker exec ... find /opt/jma/weborca -name '*route*.yml' -o -name '*route*.yaml'` 実行結果 | どちらも 0 byte。`receipt_route.yml` などのルーティング定義がコンテナ内に存在しないことを示す。 |
| 5 | `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` §4.5 | 404/405 再現ログ | RUN_ID=`20251113TorcaP0OpsZ1` ～ `Z3` の API 実行履歴を掲載済み。 |
| 6 | `artifacts/orca-connectivity/20251113T011831Z/P0_retry/` | 405/404 応答の HTTP dump | `acceptmodv2` などの `Allow: OPTIONS, GET` ヘッダー付きレスポンスを保存済み。 |

## 3. 設定抜粋
### 3.1 `/opt/jma/weborca/app/etc/online.env`
```ini
TZ=Asia/Tokyo
COB_LIBRARY_PATH=/opt/jma/weborca/site-lib:/opt/jma/weborca/app
LD_LIBRARY_PATH=/opt/jma/weborca/cobol/libcob
HTTP_PORT=8000
HTTP_HOST=http://localhost
HTML_INDEX=/opt/jma/weborca/mw/bin/html/login.html
DBNAME=orca
DBUSER=orca
DBPASS=orca
DBHOST=localhost
DBPORT=5432
DBENCODING="UTF-8"
STORAGE_PATH=/var/tmp
SKIP_CERT_CHECK=1
```

### 3.2 環境変数ダンプ
```text
# docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 env | grep -E 'API|ROUTE|HYBRID'
# （出力なし / env_API_ROUTE_HYBRID.txt にも 0 行で保存）
```

### 3.3 ルートファイル探索
```bash
# docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 find /opt/jma/weborca -name '*route*.yml' -o -name '*route*.yaml'
# （出力なし / route_yml_search.txt, route_yaml_search.txt）
```

## 4. ログ参照先
- `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`：§4.5 に HTTP 404/405 トリアージ手順と `RUN_ID=20251113TorcaP0OpsZ1～Z3` の結果を列挙。
- `artifacts/orca-connectivity/20251113T002140Z/P0_smoke/requests/`：初回 POST 失敗時の `curl -v` ログ。
- `artifacts/orca-connectivity/20251113T015626Z/api-prefix-test/`：`/api/apiXX` プレフィックス試験の 404/405 応答。

## 5. 確認したい事項（案）
1. WebORCA 22.04（image: `jma-receipt-weborca:22.04`）で REST API を POST まで開放するために設定すべき `API_ENABLE_*` や `receipt_route.*` ファイルの正式な配置方法を教えてください。
2. `receipt_route.ini`／`receipt_route.yml` 等のサンプルや、`ALLOW_METHODS=POST` を有効化するための推奨テンプレートが存在するか確認させてください。無ければ必要なキー一覧を提示してもらえますか。
3. Hybrid（ORCA ↔ 外部システム）向けの `HYBRID_*` 環境変数が従来のドキュメントにしか載っていないようですが、22.04 版での有効・無効の既定値と設定手順を共有してもらえますか。
4. 405 応答時のログを `/opt/jma/weborca/log` へ出力させる公式手順があるか、もしくは `LOGDIR` や `REDIRECTLOG` を変更しても支障がないか教えてください。
5. API 有効化後に再起動が必要なコンポーネント（`weborca` 本体、Tomcat、nginx 等）と、変更反映にかかる目安時間／想定ダウンタイムを教えてください。

以上をサポート窓口へ送付予定です。追加で必要な証跡があれば指示してください。
