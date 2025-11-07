# テスト用 OpenDolphin サーバーの構築手順

このドキュメントは、Web クライアントを検証する目的で既存の OpenDolphin Java EE サーバー (WildFly + PostgreSQL) をローカルに展開し、アカウントを登録するまでの流れをまとめたものです。

## 0. ローカル Docker 構成で用意した初期アカウント（2025-11-02）

- 施設 ID: `1.3.6.1.4.1.9414.72.103`
- 管理者: `1.3.6.1.4.1.9414.72.103:admin` / パスワード `admin2025`（MD5: `e88df8596ff8847e232b1e4b1b5ffde2`）
- 医師ユーザー: `1.3.6.1.4.1.9414.72.103:doctor1` / パスワード `doctor2025`（MD5: `632080fabdb968f9ac4f31fb55104648`）
- テスト患者: `WEB1001` 〜 `WEB1010`（青木 太郎 ほか 10 名）。氏名・生年月日・再投入手順は [`operations/LOCAL_BACKEND_DOCKER.md`](LOCAL_BACKEND_DOCKER.md#テスト患者データ投入2025-11-02-登録済み) を参照。

作成手順の詳細と `curl` 例は [`operations/LOCAL_BACKEND_DOCKER.md`](LOCAL_BACKEND_DOCKER.md) を参照。Docker Compose で環境を再構築した場合は同手順で再発行すること。

## 1. 前提条件

- JDK 1.8.0_60 以上、および Maven 3.3.3 以上をインストールしておくこと。
- リポジトリの `ext_lib/` に含まれる手動インストールが必要な JAR (`iTextAsian.jar`, `AppleJavaExtensions.jar`) をローカル Maven リポジトリへ登録済みであること。
- WildFly 9 系 (9.0.1.Final 推奨) が利用でき、PostgreSQL へ接続可能な `PostgresDS` データソースを定義できること。
- サーバーは既存の REST API を前提としており、ソースコードの改変は行わない。

## 2. 依存ライブラリの登録

`ext_lib/` 配下の JAR を Maven へ手動登録します。リポジトリ直下で以下を実行してください。

```bash
mvn install:install-file \
  -Dfile=ext_lib/iTextAsian.jar \
  -DgroupId=opendolphin \
  -DartifactId=itext-font \
  -Dversion=1.0 \
  -Dpackaging=jar

mvn install:install-file \
  -Dfile=ext_lib/AppleJavaExtensions.jar \
  -DgroupId=com.apple \
  -DartifactId=AppleJavaExtensions \
  -Dversion=1.6 \
  -Dpackaging=jar
```

## 3. サーバーモジュールのビルド

1. ルートで Maven を実行し、共通モジュールを含めた WAR を生成します。
   ```bash
   mvn clean package -pl server -am
   ```
   成功すると `server/target/opendolphin-server.war` が生成されます。
2. ビルド時に `JAVA_HOME` が JDK 1.8 を指していること、およびコンパイルターゲットが 1.8 になっていることを確認してください。

## 4. WildFly の設定（2025-11-03 更新）

1. WildFly を任意のディレクトリへ展開し、管理ユーザーを作成します。
   ```bash
   bin/add-user.sh
   ```
   JMS 向けの認証が別途必要な場合は、同コマンドで `-a` オプションを付与し `guest` ロールへ追加してください。
2. `standalone/configuration/standalone-full.xml` を運用プロファイルとして利用します。以下を事前に確認します。
   - `datasources` に PostgreSQL 用の `PostgresDS` が存在し、OpenDolphin 用データベースへ接続できること。
   - `security-domain` (または Elytron 設定) が `施設ID:ユーザーID` 形式で `servletRequest.getRemoteUser()` を解決できること。
   - `subsystem messaging-activemq` の `server=default` にて `default-resource-adapter-name="activemq-ra"` が設定されていること。
3. OpenDolphin 固有の設定ファイル `custom.properties` や `license.properties` を `${JBOSS_HOME}/` 直下へ配置し、ORCA 接続やライセンス情報を用意します。
4. サーバーを `standalone-full.xml` プロファイルで起動します。
   ```bash
   bin/standalone.sh -c standalone-full.xml
   ```
   起動ログに例外が無いこと、管理コンソールから `PostgresDS` が正常に接続できることを確認します。
5. WildFly 起動後に管理 CLI で ActiveMQ/JMS 設定と認証を確認します（手順詳細は [`operations/LOCAL_BACKEND_DOCKER.md`](LOCAL_BACKEND_DOCKER.md#activemqjms-確認手順2025-11-03-更新) を参照）。
   ```bash
   bin/jboss-cli.sh --connect <<'CLI'
   /subsystem=messaging-activemq/server=default:write-attribute(name=default-resource-adapter-name,value=activemq-ra)
   /subsystem=messaging-activemq/server=default:read-attribute(name=default-resource-adapter-name)
   jms-queue list
   quit
   CLI
   ```
   `jms-queue list` 実行後に運用が想定するキュー（例: `DocumentNotificationQueue`, `RealtimeEventQueue` 等）が列挙され、CLI の終了コードが 0 であることを確認してください。必要に応じて CLI から `jms-queue read --name=<queueName>` を実行し、認証設定（`entries` や `durable` フラグ）が想定通りであるかを確認します。

## 5. WAR のデプロイ

1. 生成した `opendolphin-server.war` を WildFly の `standalone/deployments/` へコピーします。
2. デプロイが完了すると `standalone/log/server.log` に `"Deployed "opendolphin-server.war"` が出力され、REST エンドポイントが `/api` 配下で待ち受けます。

## 6. 管理者・ユーザーアカウントの登録

OpenDolphin サーバーはデフォルトでは管理者を自動生成しません。以下の順に API を呼び出してアカウントを準備します。

### 6.1 施設 + 管理者アカウントの初期登録

`POST /api/dolphin` (認証不要) で施設情報と管理者ユーザーを同時に作成します。`password` には MD5 ハッシュ値を指定してください。

```bash
curl -k https://localhost:8443/api/dolphin \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "admin",
    "password": "21232f297a57a5a743894a0e4a801fc3",
    "sirName": "オープン",
    "givenName": "ドルフィン",
    "commonName": "オープン ドルフィン",
    "email": "admin@example.com",
    "memberType": "FACILITY_USER",
    "registeredDate": "2024-04-30",
    "facilityModel": {
      "facilityName": "テストクリニック",
      "zipCode": "1000000",
      "address": "東京都千代田区",
      "telephone": "03-0000-0000",
      "memberType": "FACILITY_USER",
      "registeredDate": "2024-04-30"
    },
    "licenseModel": {
      "license": "doctor",
      "licenseDesc": "医師",
      "licenseCodeSys": "MML0026"
    },
    "departmentModel": {
      "department": "01",
      "departmentDesc": "内科",
      "departmentCodeSys": "MML0028"
    },
    "roles": [
      { "role": "admin" },
      { "role": "user" }
    ]
  }'
```

レスポンスには `施設ID:ユーザーID` が返るため、以降のログインに使用します。また、デモ患者やスタンプツリーが自動的に複製されます。

### 6.2 追加ユーザーの登録

1. 管理者でログインし、MD5 ハッシュ化したパスワードと `clientUUID` を準備します。MD5 は `echo -n 'password' | md5sum` などで生成できます。
2. `POST /api/user` を呼び出してユーザーを登録します。ヘッダーには `userName` (施設ID:管理者ID)、`password` (MD5)、`clientUUID` を指定する必要があります。

```bash
curl -k https://localhost:8443/api/user \
  -H 'Content-Type: application/json' \
  -H 'userName: <facilityId>:<adminId>' \
  -H 'password: <adminPasswordMd5>' \
  -H 'clientUUID: 11111111-2222-3333-4444-555555555555' \
  -d '{
    "userId": "doctor1",
    "password": "5f4dcc3b5aa765d61d8327deb882cf99",
    "sirName": "架空",
    "givenName": "花子",
    "commonName": "架空 花子",
    "email": "doctor1@example.com",
    "memberType": "FACILITY_USER",
    "registeredDate": "2024-04-30",
    "facilityModel": { "facilityId": "<facilityId>" },
    "licenseModel": { "license": "doctor", "licenseDesc": "医師" },
    "departmentModel": { "department": "01", "departmentDesc": "内科" },
    "roles": [ { "role": "user" } ]
  }'
```

3. 必要に応じて `PUT /api/user` や `DELETE /api/user/{facilityId:userId}` で更新・削除が行えます。

## 7. 動作確認

1. `GET /api/user/<facilityId>:<userId>` を呼び出し、登録したユーザー情報が取得できることを確認します。
2. Web クライアント側で `facilityId / userId / パスワード` を入力し、ログインおよびカルテ一覧が取得できることを確認してください。

---

**備考（2025-11-03 更新）**

- WildFly の管理 CLI を利用すると、`deploy`, `undeploy`, `datasource` 設定の自動化が容易になります。JMS まわりの確認結果は `server/log/server.log` にも出力されるため、CLI の終了後に併せて確認してください。
- DB 名や接続文字列が `.env` や `custom.properties` と一致しているかを、CLI の `/subsystem=datasources/data-source=PostgresDS:read-resource(include-runtime=true)` または `bin/jboss-cli.sh --connect --commands="data-source read-resource --name=PostgresDS"` で必ず確認してください。
- PostgreSQL のログ (`docker logs db` など) を確認し、認証エラーや接続再試行が発生していないことを検証します。
- `docker-compose.modernized.dev.yml` のヘルスチェック（`server-modernized-dev` セクションの `curl`）を再実行し、HTTP ステータスが 2xx となることを最終確認してください。ヘルスチェックの再実行タイミングは JMS 設定反映後・WAR 再デプロイ後のいずれでも必須です。
- ORCA 連携を行う場合は `custom.properties` の接続パラメータと、`PostgresDS` から参照するデータベースユーザーに十分な権限が必要です。
