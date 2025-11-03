# ローカルバックエンド Docker 起動手順

Web クライアント開発チーム向けに、従来サーバー（Java 8 / WildFly 10 ベース）とモダナイズ版サーバー（Java 17 / WildFly 33 ベース）の両方を Docker Compose で起動できる構成を用意した。既定では従来サーバーを利用し、モダナイズ版を評価したい場合にのみ明示的に起動する。

## 前提条件
- Docker Desktop 4.x 以上（または Docker Engine 24.x 以上）と Docker Compose v2 系列。
- 初回ビルド時は Maven 依存ライブラリのダウンロードが発生するため、安定したネットワーク環境を用意すること。
- サーバー側コード (`server/`、`server-modernized/`) は改変しない。設定は `docker/server/custom.properties` と環境変数で行う。

## 構成概要
| サービス | プロファイル / オーバーレイ | 役割 | ポート | 永続化 |
| --- | --- | --- | --- | --- |
| `db` | 常時 | PostgreSQL 14（アプリ用 DB） | 5432 (`POSTGRES_PORT`) | `postgres-data` ボリューム |
| `server` | 常時 | WildFly 10.1.0.Final + 旧 OpenDolphin WAR | 8080 (`APP_HTTP_PORT`), 9990 (`APP_ADMIN_PORT`) | なし |
| `server-modernized` / `server-modernized-dev` | `--profile modernized` または `docker-compose.modernized.dev.yml` を追加 | WildFly 33.0.2.Final + モダナイズ版 WAR | 8080 / 9080（`MODERNIZED_APP_HTTP_PORT`）、9990 / 9995（`MODERNIZED_APP_ADMIN_PORT`） | なし |

- `server` はデフォルトで起動対象。`server-modernized` を利用する場合は、`docker compose --profile modernized ...` もしくは後述の `docker-compose.modernized.dev.yml` 追加指定のどちらかを選択する（推奨は後者）。
- いずれのサーバーでも `custom.properties` は `docker/server/custom.properties` をベースにビルド時コピーされる。値を変更したい場合はファイルを編集して再ビルドする。
- モダナイズ版 WAR のビルドは Java 17 + Maven 3.9、従来版は Java 8 + Maven 3.9 で行う。
- WildFly のデータソース `java:jboss/datasources/ORCADS` は CLI スクリプトで自動作成し、PostgreSQL コンテナへ接続する。

## 共通セットアップ手順
1. `docker/server/custom.properties` を開き、施設名や `claim.jdbc.url`（デフォルトは `jdbc:postgresql://db:5432/opendolphin`）等をローカル事情に合わせて修正する。
2. プロジェクトルートの `.env.sample` をコピーして `.env` を作成し、必要な環境変数を上書きする。
   ```env
   POSTGRES_DB=opendolphin
   POSTGRES_USER=opendolphin
   POSTGRES_PASSWORD=opendolphin
   APP_HTTP_PORT=8080
   APP_ADMIN_PORT=9990
   POSTGRES_PORT=5432
   SYSAD_USER_NAME=1.3.6.1.4.1.9414.10.1:dolphin
   SYSAD_PASSWORD=36cdf8b887a5cffc78dcd5c08991b993
   PLIVO_AUTH_ID=
   PLIVO_AUTH_TOKEN=
   PLIVO_SOURCE_NUMBER=
   PLIVO_BASE_URL=https://api.plivo.com/v1/
   PLIVO_ENVIRONMENT=production
   PLIVO_LOG_LEVEL=NONE
   PLIVO_LOG_MESSAGE_CONTENT=false
   PLIVO_DEFAULT_COUNTRY=+81
   ```
3. DB コンテナをビルドしておく: `docker compose pull db`（イメージ取得のみの場合）または `docker compose up -d db`。

> **Plivo SMS 認証情報**: `PLIVO_AUTH_ID` / `PLIVO_AUTH_TOKEN` / `PLIVO_SOURCE_NUMBER` は必須。Sandbox を利用する場合は `PLIVO_ENVIRONMENT=sandbox` とし、必要に応じて `PLIVO_BASE_URL` を `https://api.sandbox.plivo.com/v1/` へ変更する。環境変数が未設定のまま SMS エンドポイントを呼び出すと 500 エラー（`SMSException`）となるため注意。

## 従来サーバー（既定）の起動
1. `docker compose build server` を実行し、旧 `server/` モジュールをビルドした WAR を WildFly 10 イメージへ組み込む。旧イメージからアップデートする場合は `docker compose build --no-cache server` を推奨する。
2. `docker compose up -d` を実行し、`db` と `server` を起動する。
3. 起動後、以下のヘルスチェックコマンドが 0 で終了し、JSON が返ることを確認する。
   ```bash
   curl -sf \
     -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
     -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
     http://localhost:${APP_HTTP_PORT:-8080}/openDolphin/resources/dolphin
   ```

## モダナイズ版スタック（WildFly 33 / Jakarta EE 10）の起動
`docker-compose.modernized.dev.yml` を併用すると、従来サーバーと共存したまま Jakarta EE 10 版を検証できる。

1. `.env` に必要なモダナイズ用パラメータを追記する（未指定時はデフォルト値を利用）。
   ```env
   MODERNIZED_POSTGRES_DB=opendolphin_modern
   MODERNIZED_POSTGRES_USER=opendolphin
   MODERNIZED_POSTGRES_PASSWORD=opendolphin
   MODERNIZED_POSTGRES_PORT=55432
   MODERNIZED_APP_HTTP_PORT=9080
   MODERNIZED_APP_ADMIN_PORT=9995
   MODERNIZED_DB_SSLMODE=prefer
   FIDO2_RP_ID=localhost
   FIDO2_RP_NAME=OpenDolphin Dev
   FIDO2_ALLOWED_ORIGINS=https://localhost:8443,http://localhost:9080
   FACTOR2_AES_KEY_B64=<32byte鍵をBase64化した値>
   ```
   - ポートは既定で `9080/9995` を利用し、従来サーバーの 8080/9990 と分離する。
2. イメージをビルドする。
   ```bash
   docker compose -p modern-testing \
     -f docker-compose.yml \
     -f docker-compose.modernized.dev.yml \
     build server-modernized-dev
   ```
   - この段階で WAR を生成するため、`server-modernized/pom.xml` の依存定義が最新であることを確認する。
3. サービスを起動する。
   ```bash
   docker compose -p modern-testing \
     -f docker-compose.yml \
     -f docker-compose.modernized.dev.yml \
     up -d db-modernized server-modernized-dev
   ```
4. SYSAD アカウントでヘルスチェックを行い、JSON が返ることを確認する。
   ```bash
   curl -sf \
     -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
     -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
     http://localhost:${MODERNIZED_APP_HTTP_PORT:-9080}/openDolphin/resources/dolphin
   ```
5. Web クライアントからモダナイズ版 API を呼び出す場合は、`web-client/.env.local` の `VITE_DEV_PROXY_TARGET` を `http://localhost:${MODERNIZED_APP_HTTP_PORT:-9080}` へ変更する。

> **補足**: 使用後は `docker compose -p modern-testing down` で `db-modernized` / `server-modernized-dev` を停止する。従来サーバー側とポートや DB が混在しないよう注意。

### 2025-11-03 ビルド検証メモ（Worker0/1 修正反映後の確認）

- 手元環境に Apache Maven 3.9.6 を手動配置（`$HOME/.local/apache-maven-3.9.6`）し、`export PATH=$HOME/.local/apache-maven-3.9.6/bin:$PATH` を設定した上で各コマンドを実行。
- `mvn -f pom.server-modernized.xml -pl common -DskipTests -ntp package` は成功。
- `mvn -f pom.server-modernized.xml -s docker/server/settings.xml -pl server-modernized -am -DskipTests -ntp package` はコンパイルエラーで失敗。`ADM20_EHTServiceBean` の `com.yubico.webauthn.credential.*`、`MeterRegistryProducer` の `jakarta.naming.*`、`ChartEventStreamResource` の `jakarta.ws.rs.sse.SseElementType`、`PlivoSender`／`MessageSender` の `okhttp3.*`・`ConnectionSpec`・`TlsVersion`、`ExternalServiceAuditLogger` の可視性、および `Logger#log(Level, Supplier, Throwable)` 呼び出しが未解決。
- 同一エラーが `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml build server-modernized-dev` でも発生し、`server-modernized/target/opendolphin-server.war` は生成されない。
- ログ採取例: `mvn ... | tee /tmp/mvn_server.log`、`docker compose ... | tee /tmp/docker_build.log`。

## 初期ログイン情報（2025-11-02 更新）

- 施設 ID: `1.3.6.1.4.1.9414.72.103`
- 管理者アカウント: `admin`
  - 平文パスワード: `admin2025`
  - MD5: `e88df8596ff8847e232b1e4b1b5ffde2`
- 医師アカウント: `doctor1`
  - 平文パスワード: `doctor2025`
  - MD5: `632080fabdb968f9ac4f31fb55104648`

### 生成手順メモ

1. 管理者アカウントの JSON ペイロードを作成する（パスは任意）。
   ```bash
   cat <<'JSON' > /tmp/create-admin.json
   {
     "userId": "admin",
     "password": "e88df8596ff8847e232b1e4b1b5ffde2",
     "sirName": "管理",
     "givenName": "者",
     "commonName": "管理 者",
     "email": "admin@example.com",
     "memberType": "FACILITY_USER",
     "registeredDate": "2025-11-02",
     "facilityModel": {
       "facilityName": "OpenDolphin ローカル検証クリニック",
       "zipCode": "1000000",
       "address": "東京都千代田区1-1-1",
       "telephone": "03-0000-0000",
       "memberType": "FACILITY_USER",
       "registeredDate": "2025-11-02"
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
   }
   JSON
   ```
2. `/openDolphin/resources/dolphin` に対して `SYSAD_USER_NAME` / `SYSAD_PASSWORD` をヘッダーに付与して POST し、施設と管理者を登録する。
   ```bash
   curl -H "Content-Type: application/json" \
        -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
        -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
        -d @/tmp/create-admin.json \
        http://localhost:${APP_HTTP_PORT:-8080}/openDolphin/resources/dolphin
   ```
3. 医師ユーザーの JSON を用意し、`userId` と `roles[].userId` に施設 ID を含む複合キーを設定する。
   ```bash
   cat <<'JSON' > /tmp/create-doctor.json
   {
     "userId": "1.3.6.1.4.1.9414.72.103:doctor1",
     "password": "632080fabdb968f9ac4f31fb55104648",
     "sirName": "テスト",
     "givenName": "太郎",
     "commonName": "テスト 太郎",
     "email": "doctor1@example.com",
     "memberType": "FACILITY_USER",
     "registeredDate": "2025-11-02",
     "facilityModel": { "id": 24, "facilityId": "1.3.6.1.4.1.9414.72.103" },
     "licenseModel": { "license": "doctor", "licenseDesc": "医師", "licenseCodeSys": "MML0026" },
     "departmentModel": { "department": "01", "departmentDesc": "内科", "departmentCodeSys": "MML0028" },
     "roles": [ { "role": "user", "userId": "1.3.6.1.4.1.9414.72.103:doctor1" } ]
   }
   JSON
   ```
4. 管理者資格情報をヘッダーに指定し、`/openDolphin/resources/user` へ POST してユーザーを追加する。
   ```bash
   curl -H "Content-Type: application/json" \
        -H "userName:1.3.6.1.4.1.9414.72.103:admin" \
        -H "password:e88df8596ff8847e232b1e4b1b5ffde2" \
        -H "clientUUID:11111111-2222-3333-4444-555555555555" \
        -d @/tmp/create-doctor.json \
        http://localhost:${APP_HTTP_PORT:-8080}/openDolphin/resources/user
   ```
5. 生成済みアカウントは以下で確認できる。
   ```bash
   curl -H "userName:1.3.6.1.4.1.9414.72.103:admin" \
        -H "password:e88df8596ff8847e232b1e4b1b5ffde2" \
         http://localhost:${APP_HTTP_PORT:-8080}/openDolphin/resources/user/1.3.6.1.4.1.9414.72.103:admin
   ```

> `facilityModel.id` は `GET /openDolphin/resources/user/1.3.6.1.4.1.9414.72.103:admin` のレスポンスに含まれる数値（初期セットアップ直後は `24`）。環境で異なる場合は適宜読み替える。

## Web クライアント（Vite）から接続する

ローカルの従来サーバーに対して Web クライアントを `npm run dev` で起動する際は、Vite のプロキシ先を `VITE_DEV_PROXY_TARGET` で `http://localhost:8080/openDolphin/resources` に指定する。

```bash
# 1. バックエンドを起動（未起動の場合）
docker compose up -d

# 2. Web クライアントを開発モードで起動
cd web-client
npm install            # 初回のみ
VITE_DEV_PROXY_TARGET=http://localhost:8080/openDolphin/resources npm run dev -- --host
```

ブラウザで `https://localhost:5173` を開き、医師アカウント `1.3.6.1.4.1.9414.72.103:doctor1`（パスワード `doctor2025`）などでログインできることを確認する。

## テスト患者データ投入（2025-11-02 登録済み）

`POST /openDolphin/resources/patient` に管理者資格情報を付与してリクエストすると、施設内のテスト患者を一括登録できる。以下の 10 件を挿入済み（施設 `1.3.6.1.4.1.9414.72.103`）。

| 患者ID | 氏名 | 性別 | 生年月日 |
| --- | --- | --- | --- |
| WEB1001 | 青木 太郎 | M | 1980-01-15 |
| WEB1002 | 青木 花子 | F | 1984-05-02 |
| WEB1003 | 石田 健 | M | 1975-09-18 |
| WEB1004 | 上田 美咲 | F | 1990-12-07 |
| WEB1005 | 大野 誠 | M | 1972-03-30 |
| WEB1006 | 加藤 結衣 | F | 1995-08-21 |
| WEB1007 | 佐藤 陸 | M | 2001-11-03 |
| WEB1008 | 高橋 美優 | F | 1998-04-12 |
| WEB1009 | 中村 光 | F | 1988-07-09 |
| WEB1010 | 山本 陽菜 | F | 2003-02-27 |

再投入が必要な場合は、1 行 1 JSON オブジェクトのファイルを作成し、`while` ループで送信する。

```bash
cat <<'JSONL' > /tmp/patient-seed.jsonl
{"patientId":"WEB1001","familyName":"青木","givenName":"太郎","fullName":"青木 太郎","kanaFamilyName":"アオキ","kanaGivenName":"タロウ","kanaName":"アオキ タロウ","gender":"M","genderDesc":"男性","birthday":"1980-01-15","telephone":"03-6200-1001","email":"web1001@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-1"}}
{"patientId":"WEB1002","familyName":"青木","givenName":"花子","fullName":"青木 花子","kanaFamilyName":"アオキ","kanaGivenName":"ハナコ","kanaName":"アオキ ハナコ","gender":"F","genderDesc":"女性","birthday":"1984-05-02","telephone":"03-6200-1002","email":"web1002@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-2"}}
{"patientId":"WEB1003","familyName":"石田","givenName":"健","fullName":"石田 健","kanaFamilyName":"イシダ","kanaGivenName":"ケン","kanaName":"イシダ ケン","gender":"M","genderDesc":"男性","birthday":"1975-09-18","telephone":"03-6200-1003","email":"web1003@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-3"}}
{"patientId":"WEB1004","familyName":"上田","givenName":"美咲","fullName":"上田 美咲","kanaFamilyName":"ウエダ","kanaGivenName":"ミサキ","kanaName":"ウエダ ミサキ","gender":"F","genderDesc":"女性","birthday":"1990-12-07","telephone":"03-6200-1004","email":"web1004@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-4"}}
{"patientId":"WEB1005","familyName":"大野","givenName":"誠","fullName":"大野 誠","kanaFamilyName":"オオノ","kanaGivenName":"マコト","kanaName":"オオノ マコト","gender":"M","genderDesc":"男性","birthday":"1972-03-30","telephone":"03-6200-1005","email":"web1005@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-5"}}
{"patientId":"WEB1006","familyName":"加藤","givenName":"結衣","fullName":"加藤 結衣","kanaFamilyName":"カトウ","kanaGivenName":"ユイ","kanaName":"カトウ ユイ","gender":"F","genderDesc":"女性","birthday":"1995-08-21","telephone":"03-6200-1006","email":"web1006@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-6"}}
{"patientId":"WEB1007","familyName":"佐藤","givenName":"陸","fullName":"佐藤 陸","kanaFamilyName":"サトウ","kanaGivenName":"リク","kanaName":"サトウ リク","gender":"M","genderDesc":"男性","birthday":"2001-11-03","telephone":"03-6200-1007","email":"web1007@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-7"}}
{"patientId":"WEB1008","familyName":"高橋","givenName":"美優","fullName":"高橋 美優","kanaFamilyName":"タカハシ","kanaGivenName":"ミユ","kanaName":"タカハシ ミユ","gender":"F","genderDesc":"女性","birthday":"1998-04-12","telephone":"03-6200-1008","email":"web1008@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-8"}}
{"patientId":"WEB1009","familyName":"中村","givenName":"光","fullName":"中村 光","kanaFamilyName":"ナカムラ","kanaGivenName":"ヒカリ","kanaName":"ナカムラ ヒカリ","gender":"F","genderDesc":"女性","birthday":"1988-07-09","telephone":"03-6200-1009","email":"web1009@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-9"}}
{"patientId":"WEB1010","familyName":"山本","givenName":"陽菜","fullName":"山本 陽菜","kanaFamilyName":"ヤマモト","kanaGivenName":"ヒナ","kanaName":"ヤマモト ヒナ","gender":"F","genderDesc":"女性","birthday":"2003-02-27","telephone":"03-6200-1010","email":"web1010@example.com","address":{"zipCode":"1600023","address":"東京都新宿区西新宿1-1-10"}}
JSONL

while IFS= read -r payload; do
  printf '%s' "$payload" | curl -sS -X POST \
    -H 'Content-Type: application/json' \
    -H 'userName:1.3.6.1.4.1.9414.72.103:admin' \
    -H 'password:e88df8596ff8847e232b1e4b1b5ffde2' \
    --data @- \
    http://localhost:8080/openDolphin/resources/patient
  printf '\n'
done < /tmp/patient-seed.jsonl
```

登録内容は `GET /openDolphin/resources/patient/digit/WEB100` などで確認できる。既存データを全削除する場合は Postgres の `d_patient` テーブルから対象施設の行を削除するか、環境を再構築してから再投入する。

## モダナイズ版サーバーの起動（サマリ）
> **注意:** `server` と `server-modernized-dev` はポート競合するため同時に起動できない。切り替える際は片方を停止してからもう一方を起動すること。

1. 既存の `server` コンテナが起動している場合は `docker compose down` で停止する。
2. モダナイズ版のビルド:  
   ```bash
   docker compose -p modern-testing \
     -f docker-compose.yml \
     -f docker-compose.modernized.dev.yml \
     build server-modernized-dev
   ```
3. モダナイズ版の起動:  
   ```bash
   docker compose -p modern-testing \
     -f docker-compose.yml \
     -f docker-compose.modernized.dev.yml \
     up -d db-modernized server-modernized-dev
   ```
4. 起動後、以下のヘルスチェックで JSON が返ることを確認する。  
   ```bash
   curl -sf \
     -H "userName:${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}" \
     -H "password:${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}" \
     http://localhost:${MODERNIZED_APP_HTTP_PORT:-9080}/openDolphin/resources/dolphin
   ```
5. 使い終わったら `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml down` で `db-modernized` / `server-modernized-dev` を停止する。

## データベースの初期データ投入
- 本リポジトリには ORCA/電子カルテ用スキーマやマスターデータを含めていない。実運用データをコピーするか、別途提供される初期化スクリプトを `docker-entrypoint-initdb.d/` に配置して `db` サービスを再起動する。
- 既存環境のバックアップをリストアする場合は、`postgres-data` ボリュームを削除してから実施する。

## ログ・メンテナンス
- アプリログ閲覧: `docker compose logs -f server`（モダナイズ版利用時は起動方法に応じて `server-modernized` または `server-modernized-dev` を指定）。
- DB ログ閲覧: `docker compose logs -f db`
- コンテナ停止: `docker compose down`
- 永続ボリューム削除（DB リセット）: `docker compose down -v`（データが消えるため要注意）

## トラブルシュート
- サーバーのヘルスチェックが失敗する場合は、`docker compose logs server` またはモダナイズ版のサービス名（`server-modernized` / `server-modernized-dev`）で WildFly の起動ログを確認する。ヘルスエンドポイント `openDolphin/resources/dolphin` にアクセスする際の `SYSAD_USER_NAME` / `SYSAD_PASSWORD` 設定ミスやデータベース未起動・`custom.properties` の記述ミスなどが典型。
- Postgres 接続情報を変更した場合は `custom.properties` と `.env` の双方を整合させたうえで、対象サーバーの `docker compose build ...` → `docker compose up -d ...` の順で再構築する。
- 既存機能で追加の外部サービス（SMTP/SMS 等）が必要な場合は、別途モックコンテナを用意するか `custom.properties` 上で無効化する。
- WildFly 管理ポートへ Maven プラグイン経由でデプロイする場合は、`.env` に記載した `WILDFLY_HOSTNAME` / `WILDFLY_PORT` / `WILDFLY_SERVER_ID` と、`~/.m2/settings.xml` の `<server>` 定義（管理ユーザー・パスワード）を整合させる。コマンド例: `mvn -f server-modernized/pom.xml -Dwildfly.hostname=$WILDFLY_HOSTNAME -Dwildfly.port=$WILDFLY_PORT -Dwildfly.serverId=$WILDFLY_SERVER_ID wildfly:deploy`。

## 既存利用者向けアップデート手順

以前の WildFly 10 ベースイメージのみを利用していたローカル環境は、以下の手順で新構成へ移行する。

1. 旧コンテナを停止: `docker compose down`。
2. キャッシュされたビルド成果物を削除: `docker builder prune` や `docker image rm opendolphin-server` を必要に応じて実行。
3. `.env` に `WILDFLY_HOSTNAME` / `WILDFLY_PORT` / `WILDFLY_SERVER_ID` を追記し、WildFly 管理資格情報は `~/.m2/settings.xml` の `<servers>` に設定する（例: `wildfly-management`）。
4. 従来サーバーを再構築する場合は `docker compose build --no-cache server` → `docker compose up -d`。
5. モダナイズ版を評価する場合は上記「モダナイズ版サーバーの起動（サマリ）」に従い、`docker-compose.modernized.dev.yml` を併用した `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml build/up` コマンドを実行する。
6. いずれかを切り替える際はポート競合を避けるため、片方のコンテナを確実に停止してからもう一方を起動する。
