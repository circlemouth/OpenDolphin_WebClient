## OpenDolphin
皆川和史、王勝偉　[オープンドルフィン・ラボ](http://www.opendolphin.com)  

#### １．OpenDolphin 2.7.1
 * 2018-10-23
 * 脆弱性を対応しました。
     - ユーザアクセス制限

#### ２．ライセンス & 謝辞  
 * OpenDolphinのライセンスは GNU GPL3 です。  
 * OpenDolphinは下記先生方の開発されたソースコードを含んでいます。  
  - 札幌市元町皮ふ科の松村先生
  - 和歌山市増田内科の増田先生
  - 新宿ヒロクリニック
  - 日本RedHat Takayoshi KimuraさんのJBoss as7 へのポーティング

これらの部分の著作権はそれぞれの先生に帰属します。またOpenDolphinにはコミッターが存在しません。フォークされた場合はそれぞれ独立した開発者になっていただき、 GitHub 等でソースの共有をお願いしています。  

#### ３．開発環境  
 * jdk 1.8.0_60  
 * NetBeans 8.0.2  
 * maven 3.3.3
 * JavaEE 7
 * WildFly-9.0.1.Final
 * ソース/バイナリ形式は jdk1.8
 * ソースエンコーディングは UTF-8


#### ４．依存性  
OpenDolphinは maven でプロジェクト管理を行っています。ビルドするにはext_lib内の  
 * iTextAsian.jar  
 * AppleJavaExtensions.jar

をローカルリポジトリーに手動でインストールする必要があります。

````
mvn install:install-file -Dfile=/path/to/iTextAsian.jar -DgroupId=opendolphin -DartifactId=itext-font -Dversion=1.0 -Dpackaging=jar  
mvn install:install-file -Dfile=/path/to/AppleJavaExtensions.jar -DgroupId=com.apple -DartifactId=AppleJavaExtensions -Dversion=1.6 -Dpackaging=jar
````

#### ５．コンパイル  
 * git clone https&#58;//github.com/dolphin-dev/OpenDolphin.git ~/Desktop/OpenDolphin  
 * mvn clean  
 * mvn package  


#### ６．ローカライゼイション  
  * 最後が resources となっているパッケージ（フォルダ）内にクラス別のリソースファイルがあります。
  * 例）open.dolphin.client.ChartImpl クラスのリソース -> open.dolphin.client.resources.ChartImpl.properties
  * これをコピーし、iso3166 国名コードをアンダーバーでつないだファイルとして保存します。
  * 例）タガログ語にする場合は ChartImpl_tl.properties として保存。
  * ChartImpl_国名コード.propertiesファイルの内容をローカライズします。
  * これを全てのリソースファイルについて行います。


#### ７．Docker Image  
[Dockerのコンテナイメージ](https://github.com/dolphin-dev/docker-images)があります。これを利用するとOpenDolphinサーバーを簡単に構築することができます。


#### ８．改良&問題点
 * ターミノロジーが Janglish
 * （今にして思えば）不要なJava Interface Class が多数
 * バイナリによるデータ格納があり後利用に工夫が要る
 * 紹介状等の文書管理機能が弱い
 * ドキュメントが不足

#### ９．参考情報
 * [５分間評価](https://gist.github.com/dolphin-dev/d21c88cbfefa86c98049)
 * [設計概要](http://www.digital-globe.co.jp/architecture.html)
 * [Docker イメージ](https://github.com/dolphin-dev/docker-images)
 * [ORCAとの接続](https://gist.github.com/dolphin-dev/c75e4ca63689779bfdf7)

#### １０．OpenDolphin 2.7.0b（過去バージョン）
 * 2015-10-07
 * 国際化対応のためリリース方針を変更しました。
 * 今後はターミノロジーの英語化等において pull request を受け付ける予定があります。
 * クライアント側の機能追加はありません。


#### １１．JsonTouch / InfoModel API パリティ再現手順（2025-11-07 更新）
1. Legacy / Modern サーバーを任意の環境で起動し、`BASE_URL_LEGACY` / `BASE_URL_MODERN` をセットする（サンドボックスでは HTTP モックで代替可能）。
2. `PARITY_OUTPUT_DIR=tmp/parity-touch/<timestamp>` を指定して `ops/tools/send_parallel_request.sh --config scripts/api_parity_targets.touch.json` を実行する。
   - コンフィグは `JsonTouchResourceParityTest` / `InfoModelCloneTest` で失敗している `POST /touch/sendPackage`・`POST /touch/document`・`POST /touch/mkdocument` だけを送信する。
3. それぞれの出力（`tmp/parity-touch/<timestamp>/<request-id>/<legacy|modern>/response.json`）を `jq --sort-keys` で整形し、`diff -u` で差分を `diff.txt` に保存する。
4. 差分判定結果は `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` へ追記し、必要に応じて `docs/web-client/README.md` などの Runbook から参照できるようにする。

##### helper スクリプト（`ops/tools/helper_send_parallel_request.sh`）

Docker ホストから直接 8080/9080 へ到達できない場合は、同梱の helper ラッパーで `ops/tools/send_parallel_request.sh` を呼び出す。TRACE_RUN_ID と PARITY_OUTPUT_DIR は未指定なら UTC タイムスタンプから自動生成され、`artifacts/parity-manual/<case>/<RUN_ID>/` に保存される。

```bash
PARITY_HEADER_FILE=tmp/parity-headers/diagnosis_TEMPLATE.headers \
PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json \
TRACE_RUN_ID=20251118TdiagnosisAuditZ2 \
  ops/tools/helper_send_parallel_request.sh \
    --helper-case messaging -- \
    --profile compose POST /karte/diagnosis/claim messaging_diagnosis
```

- `TRACE_RUN_ID` を省略した場合は `YYYYmmddTHHMMSSZ` 形式が自動採番され、標準出力に採取先が表示される。`TRACE_RUN_SUFFIX` で任意のサフィックスを付与可能。
- helper は Compose ネットワーク（`legacy-vs-modern_default`）に常駐しているため、`BASE_URL_{LEGACY,MODERN}` は `ops/tools/send_parallel_request.profile.env.sample` の `compose` プロファイルで自動的に `http://opendolphin-server{,-modernized-dev}:8080/...` へ切り替わる。
- `tmp/diagnosis_seed.sql` を Gate 2.5（診断シード再投入）で必ず実行してからスクリプトを叩き、`artifacts/parity-manual/messaging/<RUN_ID>/logs/` に reseed ログと HTTP/JMS/Audit をまとめる。
- helper サービスは `docker-compose.modernized.dev.yml` (`profiles: [modernized-dev]`) に常駐し、`mcr.microsoft.com/devcontainers/base:jammy` イメージで `/workspace` にリポジトリをマウントしたまま `sleep infinity` を実行する。`COMPOSE_FILE=docker-compose.modernized.dev.yml` をセットした状態でラッパーを呼び出すと `docker compose --profile modernized-dev run --rm helper ...` が内部で実行される。
- compose ファイルに helper サービスが定義されていない場合は、自動的に `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace mcr.microsoft.com/devcontainers/base:jammy bash -lc '<script>'` へフォールバックする。ネットワーク名やイメージを調整したい場合は `HELPER_FALLBACK_NETWORK` / `HELPER_FALLBACK_IMAGE` をエクスポートしてから実行する。
- デバッグや疎通確認のみを行いたい場合は `HELPER_INNER_COMMAND=echo`（もしくは任意のシェルコマンド）を指定すると、`ops/tools/send_parallel_request.sh` の代わりにそのコマンドが実行される。`send_parallel_request` の環境読み込み（`ops/tools/send_parallel_request.profile.env.sample`）は継続するため、`BASE_URL_*` などの定義は流用できる。
- フォールバック検証（2025-11-13 JST）: `COMPOSE_FILE=docker-compose.modernized.dev.yml HELPER_INNER_COMMAND=echo TRACE_RUN_ID=20251119ThelperComposeEchoZ1 ops/tools/helper_send_parallel_request.sh --helper-case helper-tests --helper-service helper -- helper_compose_ok` を実行すると helper サービス経由で `helper_compose_ok` が出力された。`TRACE_RUN_ID=20251119ThelperFallbackEchoZ1` かつ `--helper-service helper-missing` で再実行すると docker run フォールバックへ切り替わり、`helper_fallback_ok` が返る（ログは `tmp/helper-tests/{compose,fallback}`）。

##### env-status ヘルスチェック（`ops/tools/env-status-check.sh`）

環境監視用の `env-status-check.sh` は docker compose ps／サービスログ／`/serverinfo/jamri` 応答を一括保存する。Basic 認証経由で 200 応答を確保する場合は `--basic-auth-file`（1 行に `username:password` を記述）と `--password`（MD5 ハッシュをそのまま送る）を組み合わせ、OTLP Collector 常駐時は `ops/monitoring/docker-compose.otlp.yml` を追加で読み込んだうえで `--otel-profile otlp` を指定する。

```bash
mkdir -p ~/.opendolphin
cat <<'EOF' > ~/.opendolphin/env-status-basic-auth.txt
9001:doctor1:doctor2025
EOF

RUN_ID=20251122TenvCheckZ4 \
  ops/tools/env-status-check.sh \
    --run-id "$RUN_ID" \
    --compose-file docker-compose.yml \
    --compose-file ops/base/docker-compose.yml \
    --compose-file docker-compose.modernized.dev.yml \
    --compose-file ops/monitoring/docker-compose.otlp.yml \
    --log-target server-modernized-dev \
    --log-target otel-collector \
    --skip-legacy \
    --basic-auth-file ~/.opendolphin/env-status-basic-auth.txt \
    --password 632080fabdb968f9ac4f31fb55104648 \
    --otel-profile otlp
```

出力は `artifacts/parity-manual/env-status/<RUN_ID>/` にまとまり、`modern.meta.json` の `auth.basicAuthFile` で参照元ファイル名を記録する。`--otel-profile` を付けると、すべての `docker compose ps/logs` が指定プロファイルを有効化した状態で実行されるため、`otel-collector` のような profile-only サービスの状態を同時に採取できる。
compose 管理外で稼働している Legacy 8080 側は `--skip-legacy` を併用し、代わりに `docker logs opendolphin-server --tail 400 > artifacts/parity-manual/env-status/<RUN_ID>/opendolphin-server.manual.log` で証跡を残す。
