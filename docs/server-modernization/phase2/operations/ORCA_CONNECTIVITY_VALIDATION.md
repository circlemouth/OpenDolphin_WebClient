# ORCA 接続検証タスクリスト

- 作成日: 2025-11-12
- 対象: `docker/orca/jma-receipt-docker` で提供される WebORCA コンテナと、`docker-compose.modernized.dev.yml` （または `scripts/start_legacy_modernized.sh`）で起動するモダナイズ版 OpenDolphin サーバー。
- 目的: ORCA のバージョンアップ後もモダナイズ版サーバーが継続して疎通・API 呼び出しを完了できるよう、準備〜検証〜証跡化までの作業を標準化する。
- 参照: [ORCA API 公式仕様](https://www.orca.med.or.jp/receipt/tec/api/overview.html) / [オフラインコピー](assets/orca-api-spec/README.md) / [技術情報ハブ（帳票・CLAIM・MONTSUQI 等）](assets/orca-tec-index/README.md)

> **方針**: ORCA 連携は Modernized サーバー × 新 Web クライアントの業務フロー維持を目的とし、旧クライアントや Legacy サーバー側の継続稼働は対象外。Legacy での結果は比較用に採取する場合のみ Evidence へ記録する。

> **成果物**
> 1. `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md`（または同ディレクトリ内の適切なファイル）へ実施ログを追記。
> 2. `artifacts/orca-connectivity/<UTC>/` にコマンド出力・API 応答 JSON・`docker network inspect` の結果を保存。
> 3. `docs/web-client/planning/phase2/DOC_STATUS.md` で本ドキュメントのステータスを Active に保ち、次の担当者へ引き継ぎ可否を明記。

## 1. スコープと前提条件

| 項目 | 内容 |
| --- | --- |
| ORCA コンテナ | `docker/orca/jma-receipt-docker` サブモジュール。Apple Silicon では `DOCKER_DEFAULT_PLATFORM=linux/amd64` 指定。`ORMASTER_PASS`（デフォルト `ormaster`）の更新が必要なら `.env` を併用。 |
| OpenDolphin コンテナ | `opendolphin-server`（Legacy）と `opendolphin-server-modernized[-dev]`。本チェックでは **モダナイズ版** が ORCA と通信できることを主目的とするが、必要に応じ Legacy をベースラインとして並行起動して差分を比較する。 |
| ネットワーク | `jma-receipt-docker-for-ubuntu-2204_default` ネットワークへ ORCA/Legacy/Modernized の各コンテナを参加させる。`docker compose` 実行前に external ネットワークが存在することを確認。 |
| 設定ファイル | `ops/shared/docker/custom.properties`、`ops/modernized-server/docker/custom.properties` などで `claim.conn=server` / `claim.host=orca` / `claim.send.port=8000` / `claim.send.encoding=MS932` を統一。パラメータ差分は Evidence に記録。 |
| データ | `docker/orca/jma-receipt-docker` 標準のマスタデータ + OpenDolphin のローカル seed（`patientId=7001-7010` 等）。データ整合性が崩れている場合は ORCA 側で `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 /scripts/init.sh` を再実行し、業務データの再投入方針を `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` に従って判断する。 |

## 2. 実施フロー概要

1. **準備**: サブモジュール同期 → ORCA コンテナ起動 → ネットワーク共有 → OpenDolphin（モダナイズ）起動。
2. **接続確認**: ネットワーク/ポート疎通 → `ServerInfoResource` による `claim.conn` 値確認 → ORCA API への直接アクセス。
3. **API 検証**: 公式仕様に沿って 53 API をカテゴリ別にテストし、OpenDolphin からの利用シナリオと照合。
4. **結果整理**: Evidence 保管、`PHASE2_PROGRESS.md` または該当ワーカーログへリンク、ブロッカー発生時のエスカレーション。

以下セクションで各フェーズの詳細とチェックリストを示す。

## 3. 準備チェックリスト

### 3.1 サブモジュールとビルド素材

```bash
# リポジトリ直下で実行
git submodule update --init docker/orca/jma-receipt-docker
```

- 取得後は `docker/orca/jma-receipt-docker` 内の `README` と `docker-compose.yml` を確認し、想定 ORCA バージョンから乖離がないか `git -C docker/orca/jma-receipt-docker log -1 --oneline` で記録。
- 差分がある場合は `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` にコミット ID とビルドログを追記。

### 3.2 WebORCA コンテナ起動

```bash
cd docker/orca/jma-receipt-docker
DOCKER_DEFAULT_PLATFORM=linux/amd64 \
ORMASTER_PASS="${ORMASTER_PASS:-ormaster}" docker compose up -d --build
```

- 既存で稼働している場合は再起動不要。`docker ps --format '{{.Names}} {{.Status}}' | grep jma-receipt` で状態を取得し、ログファイルへ貼り付け。
- 疎通確認:
  - ホスト: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/` → `200`。
  - ネットワーク内: `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1 -s -o /dev/null -w "%{http_code}" http://orca:8000/` → `200`。
- ログ採取: `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --tail 200 > artifacts/orca-connectivity/<UTC>/orca.log`。

### 3.3 モダナイズ版サーバー起動

```bash
./scripts/start_legacy_modernized.sh start --build   # Legacy との比較が必要な場合
./scripts/start_legacy_modernized.sh start-modernized # モダナイズ単体の場合（存在しない場合は docker compose -f docker-compose.modernized.dev.yml up）
```

- 起動後に `docker ps` で `opendolphin-server-modernized-dev`（または `opendolphin-server-modernized`）が `Up` であることを記録。
- 代替: `docker compose -f docker-compose.modernized.dev.yml up -d opendolphin-server-modernized-dev`。

### 3.4 ネットワーク共有と alias 衝突チェック

- ORCA ネットワークが存在するか: `docker network ls | grep jma-receipt-docker-for-ubuntu-2204_default`。
- OpenDolphin コンテナ参加状況: `docker network inspect jma-receipt-docker-for-ubuntu-2204_default | jq '.[0].Containers | keys'`。
- 参加していない場合: `docker network connect jma-receipt-docker-for-ubuntu-2204_default opendolphin-server-modernized-dev`。
- `db` エイリアス衝突防止: Legacy/Modernized 双方で `DB_HOST` に固有名（例: `opendolphin-db`）を設定しているか `docker inspect opendolphin-server-modernized-dev --format '{{range .Config.Env}}{{println .}}{{end}}' | grep DB_HOST` で確認。`SERVER_MODERNIZED_STARTUP_BLOCKERS.md` Appendix の回避策に従う。
- Compose プロジェクト名は `jma-receipt-docker-for-ubuntu-2204` を正とし、同名プレフィックスの ORCA コンテナのみ常時稼働させる。旧 `jma-receipt-docker` 系はテスト実験用のため通常は停止状態を維持し、誤って `docker compose up` で再作成しないようログに明記する。

### 3.5 設定ファイル

- `ops/shared/docker/custom.properties` と `ops/modernized-server/docker/custom.properties` を比較:
  - `claim.conn=server`
  - `claim.host=orca`
  - `claim.send.port=8000`
  - `claim.send.encoding=MS932`
  - `claim.jdbc.url` が ORCA ではなく OpenDolphin DB を指しているか。
- 差分がある場合は `git diff ops/**/custom.properties` を Evidence へ保存し、`PHASE2_PROGRESS.md` の当日欄に報告。
- ServerInfo で要求される認証ヘッダーは §4.1「認証ヘッダー一覧」を参照し、curl の `-H userName` / `-H password` へ正しい値を反映する。

#### 差分監査サブチェックリスト（Docker 再作成なし）

1. `export UTC_RUN=$(date -u +%Y%m%dT%H%M%SZ)` → `mkdir -p artifacts/orca-connectivity/${UTC_RUN}` で証跡ディレクトリを用意する。
2. `rg -n 'claim\.' ops/shared/docker/custom.properties` で ORCA 連携キー（`claim.conn` / `claim.jdbc.url` / `claim.user` / `claim.password` / `claim.host` / `claim.send.port` / `claim.send.encoding`）を抽出し、`tee artifacts/orca-connectivity/${UTC_RUN}/config_shared.txt` で記録。
3. `rg -n 'claim\.' ops/modernized-server/docker/custom.properties 2> artifacts/orca-connectivity/${UTC_RUN}/config_modernized_missing.log || true` を実行し、ファイル未配置時（2025-11-12 時点で modernized 側テンプレートは未収録）のログも証跡に残す。
4. `git diff --no-index ops/shared/docker/custom.properties ops/modernized-server/docker/custom.properties | tee artifacts/orca-connectivity/${UTC_RUN}/config_diff.txt || true` を実行し、ファイル欠如の場合でも差分結果（削除扱い）を保存する。
5. 差分内容を `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ貼り付け、`config_diff.txt` のパスを併記する。
6. 依存サービスを確認: `claim.conn` / `claim.jdbc.*` / `claim.user` / `claim.password` は `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java` が参照し、`claim.host` / `claim.send.port` / `claim.send.encoding` は `ClaimSender` / `ServerInfoResource` で送信経路を決定する点をログへ明記する。
7. `claim.conn` 差分がある場合は `curl http://localhost:9080/openDolphin/resources/serverinfo/claim/conn` を再実行して結果をログへ追記する。
8. `claim.host` 差分がある場合は `docker exec opendolphin-server-modernized-dev getent hosts <host>` と `nc -vz <host> <port>` をセットで実行し、通信確認を記録する。
9. `claim.jdbc.url` 等 DB 向け差分は `docker exec opendolphin-postgres-modernized psql -c '\l'` の結果と併せて貼り付け、誤接続がないか明文化する。
10. `PHASE2_PROGRESS.md` と `docs/web-client/planning/phase2/DOC_STATUS.md`（備考欄）へ設定監査テンプレ更新済みである旨を残し、次担当者が `git diff` のみで再確認できる状態にする。

### 3.6 証跡ディレクトリ

- `mkdir -p artifacts/orca-connectivity/$(date -u +%Y%m%dT%H%M%SZ)`
- `mkdir -p docs/server-modernization/phase2/operations/logs`
- ログファイル命名例: `docs/server-modernization/phase2/operations/logs/2025-11-12-orca-connectivity.md`

## 4. 接続確認タスクリスト

### 4.1 監査項目

| No | 手順 | コマンド例 / 成功条件 | 証跡 |
| --- | --- | --- | --- |
| 1 | ORCA HTTP 健康状態 | `curl http://localhost:8000/` → HTML ログイン画面が返る。 | `orca-healthcheck_<UTC>.txt` |
| 2 | コンテナ間 HTTP | `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1 http://orca:8000/api01rv2/systeminfv2` | `intra-network-systeminfv2_<UTC>.json` |
| 3 | DNS / alias | `docker exec opendolphin-server-modernized-dev getent hosts orca` → ORCA IP が解決。 | `getent_orca_<UTC>.txt` |
| 4 | ポート開放 | `docker exec opendolphin-server-modernized-dev bash -lc 'nc -vz orca 8000'` → `succeeded` | `nc_orca_8000_<UTC>.txt` |
| 5 | `ServerInfoResource` | `curl http://localhost:9080/openDolphin/resources/serverinfo/claim/conn` → `"server"` | `serverinfo_claim_conn_<UTC>.txt` |
| 6 | モダナイズ API → ORCA | `curl -H 'Content-Type: application/json' -d @req.json http://localhost:9080/openDolphin/resources/claim/patient/search`（該当 REST が ORCA API を参照するもの） | `openDolphin_claim_patient_search_<UTC>.json` |
| 7 | Claim 送信ループ | `./ops/tools/send_parallel_request.sh POST /claim/send SAMPLE_RUN_ID` で ORCA 側へダミー電文送信、`docker logs ... | grep ClaimSender` で検証 | `claim_sender_<UTC>.log` |
| 8 | 監査イベント | `docker exec opendolphin-postgres-modernized psql -c "select * from d_audit_event where action like 'ORCA_%' order by created_at desc limit 20"` | `audit_event_orca_<UTC>.sql` |

- 失敗時は `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` と `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#4.4` のトラブルシュート節を参照。

#### 認証ヘッダー一覧（ServerInfoResource）

| アカウント | userName header | password hash | 結果 | 備考 |
| --- | --- | --- | --- | --- |
| sysad (`1.3.6.1.4.1.9414.10.1`) | `1.3.6.1.4.1.9414.10.1:dolphin` | 未取得（Basic 認証のみ記録） | 401 (`authentication_failed`) | `/dolphin` 以外を拒否するため監査性 NG。証跡: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md:21`. |
| LOCAL.FACILITY.0001 | `LOCAL.FACILITY.0001:dolphin` | `36cdf8b887a5cffc78dcd5c08991b993` | 200 (`server`) | `serverinfo_claim_conn_local.json` で成功応答を取得済み。証跡: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md:22`. |

> curl 用ヘッダー雛形は `docs/server-modernization/phase2/operations/assets/orca-api-requests/00_headers_examples.md` を参照し、`-H userName` / `-H password` / `-H clientUUID` に展開する。

### 4.2 ログ相関チェック

1. **ログ採取**: `UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)` を発番し、`artifacts/orca-connectivity/validation/$UTC_TAG/logs/` を作成して以下を保存する。  
   - モダナイズサーバー: `docker logs opendolphin-server-modernized-dev --tail 200 > artifacts/.../logs/server-modernized.log`（または `docker compose -f docker-compose.modernized.dev.yml logs --tail 200 server-modernized-dev`）。  
   - ORCA（標準）: `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --tail 200 > artifacts/.../logs/orca.log`.  
   - ORCA（200 行制限を超える場合）: `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 2h > artifacts/.../logs/orca_since.log 2>&1` のように `--since <ISO8601|1h|2h>` を明示して再取得する。`docker logs` はスタックトレースを `stderr` に吐き出すため、必ず `2>&1` でまとめて保存する。  
   - 取得直後に `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へパスを追記し、Runbook §4 の証跡欄とリンクさせる。
  - **永続ログ運用時**: `docker/orca/jma-receipt-docker/logs/orca` が `/var/log/orca` と bind mount されているため、必ず RUN_ID ごとに以下を実施する。  
    1. `RUN_ID=<事前に発番>`、`UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)` を決め、`mkdir -p artifacts/orca-connectivity/${RUN_ID}/logs` で出力先を用意する。  
    2. HTTP ログ本体:  
       ```bash
       tail -F docker/orca/jma-receipt-docker/logs/orca/http.log \
         | ts '%Y-%m-%dT%H:%M:%SZ' \
         | tee "artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log"
       ```  
       `ts`（moreutils）が無い場合は `while read line; do printf "%s %s\n" "$(date -u +%FT%TZ)" "$line"; done` を挟んで同等のタイムスタンプを付与する。`Ctrl+C` で停止後もファイルは残る。  
    3. 再起動直後の欠損保険:  
       ```bash
       docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 20m --timestamps \
         > "artifacts/orca-connectivity/${RUN_ID}/logs/docker_orca_since_${UTC_TAG}.log" 2>&1
       ```  
       `--since` は現場状況に応じて 15m/2h へ調整する。  
    4. マウント構造の証跡: `ls -l docker/orca/jma-receipt-docker/logs/orca > artifacts/orca-connectivity/${RUN_ID}/logs/host_orca_log_dir_${UTC_TAG}.txt`。  
    5. シンボリックリンクの証跡: `readlink docker/orca/jma-receipt-docker/logs/orca/orca_http.log > artifacts/orca-connectivity/${RUN_ID}/logs/orca_http_symlink_${UTC_TAG}.txt`。  
    6. `docker logs` で取得した `orc a.log` / `orca_since.log` も従来通り保持しつつ、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に `http_live_*`／`docker_orca_since_*`／`host_orca_log_dir_*`／`orca_http_symlink_*` の各ファイルパスを列挙して Runbook §4.5 と相互リンクさせる。
2. **モダナイズサーバーの追跡**: `rg -n "traceId" artifacts/.../server-modernized.log` を実行し、対象 API（例: `visit.touch` → `POST /jtouch/document`）の `traceId`、ユーザー、payload サイズ、`open.dolphin.audit.*` の `event=start/success` を抜粋する。SQL/Hibernate ログが混ざる場合は同じタイムスタンプで括り、`documentPk` や `ClaimSender` のジョブ ID をメモする。
3. **ORCA 側の追跡**: `rg -n "/api" artifacts/.../orca.log` などで HTTP リクエスト行と `System Error` を特定し、モダナイズ側のタイムスタンプとの差分を記録する。`--tail 200` に目的の時刻が含まれない場合は `--since 15m` 以上で再取得し、それでも欠落する場合は「該当時刻の出力なし」として監査欄に明記する。必要に応じて `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 tail -n 200 /opt/jma/weborca/log/orca-db-patch.log` 等のファイルログも確認し、RUN_ID のタイムスタンプが含まれるかをダブルチェックする。
4. **監査結果テンプレ**: `| 実施ID | API | Modernized traceId / 結果 | ORCA 側ログ | 証跡 |` 形式で `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に追記し、Runbook から参照できるようにする。

#### ログ永続化導入済み（W44: 2025-11-13, RUN_ID=`20251113T032614Z`）

- **適用結果**: `docker/orca/jma-receipt-docker/docker-compose.override.yml.example` を `docker-compose.override.yml` としてコピーし、`volumes` に `./logs/orca:/opt/jma/weborca/log` を定義。`mkdir -p docker/orca/jma-receipt-docker/logs/orca` → `docker compose up -d --force-recreate orca` を実行して WebORCA コンテナのみを再作成した。`port 8000` が既存 `jma-receipt-docker-for-ubuntu-2204-orca-1` と競合する場合は、再作成前に `docker stop jma-receipt-docker-for-ubuntu-2204-orca-1` で解放してから実施すること。適用ログは `artifacts/orca-connectivity/20251113T032614Z/log-persistence/success.log` に保存済み。
- **バインド確認**: `docker exec jma-receipt-docker-orca-1 grep LOGDIR /opt/jma/weborca/app/etc/jma-receipt.env` で `LOGDIR=/opt/jma/weborca/log` を確認し、ホスト側 `docker/orca/jma-receipt-docker/logs/orca/` と `/opt/jma/weborca/log/` の内容が同期することを `ls -R` で証跡化する。現状は `orca-db-install-*.log`／`orca-db-patch.log` 等がホストにも出力されており、再起動後も削除されない。
- **監査とのひも付け**: Runbook §4.2 のログ採取手順で `docker logs` を参照する前に、永続ディレクトリから必要なファイル（例: `docker/orca/jma-receipt-docker/logs/orca/orca-db-patch.log`）を `cp` して Evidence に残す。リアルタイム監視は `tail -F docker/orca/jma-receipt-docker/logs/orca/<file>` を推奨し、旧手順の `/var/log/orca/http.log` 参照はこのディレクトリに読み替える。
- **LOGDIR 定義と変更手順**: `/opt/jma/weborca/app/etc/jma-receipt.env`（86 行目前後）の `LOGDIR` はこれまで通りアプリ起動時に `online.env`→`jma-receipt.conf` 経由で読み込まれる。ボリューム先を別パスへ差し替える場合は以下を再利用する。  
  ```bash
  export ORCA_LOGDIR=/opt/jma/weborca/log   # 例: /opt/jma/weborca/log/persistent など
  cd docker/orca/jma-receipt-docker
  docker compose exec -u root orca \
    sh -c "sed -i \"s|^LOGDIR=.*|LOGDIR=${ORCA_LOGDIR}|\" /opt/jma/weborca/app/etc/jma-receipt.env && \
           grep -n LOGDIR /opt/jma/weborca/app/etc/jma-receipt.env"
  docker compose up -d --force-recreate orca
  ```
-  `sed` 実行後は `artifacts/orca-connectivity/validation/<UTC>/jma-receipt.env` を更新し、RUN_ID メモ（Evidence Index）に差し替えパスを必ず記録する。
- **追認（RUN_ID=`20251119TrouteLogTestZ1`, 2025-11-13 実施）**: `docker/orca/jma-receipt-docker/example/receipt_route.ini` を `docker cp` で `/opt/jma/weborca/app/etc/receipt_route.ini` へ配置し、`artifacts/orca-connectivity/20251119TrouteLogTestZ1/config/receipt_route.ini` にダンプ（テンプレとの差分なし → 「テンプレ適用済み」）。`docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 ls -l /opt/jma/weborca/log` とホスト側 `ls -l docker/orca/jma-receipt-docker/logs/orca` を `logs/orca-log-dir-listing.txt`／`host_orca_log_dir.txt` として保存し、`LOGDIR=/opt/jma/weborca/log`（`config/jma-receipt-env-logdir.txt`）が維持されていることを確認した。2025-11-13 14:55 JST 時点では `orca-db-install*.log`／`orca-db-patch.log` に加えて `http.log`（`orca_http.log -> http.log` のシンボリックリンク）が生成されているため、以下の `REDIRECTLOG` 節に沿ってファイル出力と `docker logs` を併用する。
- **REDIRECTLOG / HTTP ログ追跡（RUN_ID=`20251119TorcaHttpLogZ1`, 2025-11-13 実施）**  
  - `docker/orca/jma-receipt-docker/jma-receipt.env:86-88` で `REDIRECTLOG="/var/log/orca/http.log"` を明示し、ベンダー既定（`#REDIRECTLOG="/var/lib/jma-receipt/dbredirector/orca.log"`）との差分を Evidence（`artifacts/orca-connectivity/20251119TorcaHttpLogZ1/config/jma-receipt.env.REDIRECTLOG.txt`）として保存した。  
  - `start-weborca.sh` の `prepare_redirect_log()` は `/var/log/orca` を `/opt/jma/weborca/log` へシンボリックリンク化し、`target_dir==/var/log/orca` の場合に `ln -sf http.log /var/log/orca/orca_http.log` を作成する。続く `start_weborca()` は `exec /opt/jma/weborca/mw/bin/weborca 2>&1 | tee -a '${REDIRECTLOG}'` で STDOUT/STDERR をファイルと `docker logs` の両方へ流すため、リアルタイム監視と履歴採取を同時に実行できる。  
  - Compose override（`./logs/orca:/opt/jma/weborca/log`）のおかげで `/var/log/orca/http.log` ≒ `docker/orca/jma-receipt-docker/logs/orca/http.log`（ホスト）となる。`ls -l docker/orca/jma-receipt-docker/logs/orca`（`host_orca_log_dir.txt`）と `readlink docker/orca/jma-receipt-docker/logs/orca/orca_http.log`（`orca_http_symlink.txt`）を RUN_ID 配下へ残し、シンボリックリンク構造を証跡化した。  
  - `tail -n 200 docker/orca/jma-receipt-docker/logs/orca/http.log > artifacts/.../logs/http.log` でサンプルを保存済み。監査時は以下の 2 コマンドを同時に走らせ、`tail -F`（ファイル追従）と `docker logs --since`（再起動直後の補完）の両方を Evidence にまとめる。  
    ```bash
    RUN_ID=20251119TorcaHttpLogZ1
    UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)
    tail -F docker/orca/jma-receipt-docker/logs/orca/http.log \
      | ts '%Y-%m-%dT%H:%M:%SZ' \
      | tee "artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log"
    docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 15m --timestamps \
      > "artifacts/orca-connectivity/${RUN_ID}/logs/docker_orca_since_${UTC_TAG}.log" 2>&1
    ```  
    `tail -F` 側はホストの bind mount を直接読むため `docker exec` が不要で、`Ctrl+C` で切断してもファイルが残る。`docker logs` 側は `--since` と `--timestamps` を付与し、`ts`（moreutils。未導入なら `while read line; do printf "%s %s\n" "$(date -u +%FT%TZ)" "$line"; done` などで代替）付き HTTP ログとタイムスタンプで突き合わせる。

#### HTTP 404/405 調査テンプレ

> 運用ハンドブック: `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md`（RUN_ID 発番～報告テンプレートまで 1 ページに集約）。以下の手順と併せて参照する。

1. **ログ採取**: §4.2 の「永続ログ運用時」手順に従い、`http_live_${UTC_TAG}.log`／`docker_orca_since_${UTC_TAG}.log`／`host_orca_log_dir_${UTC_TAG}.txt`／`orca_http_symlink_${UTC_TAG}.txt` を `artifacts/orca-connectivity/${RUN_ID}/logs/` 配下へ必ず残す。`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` にはこれらファイル名をそのまま貼り付ける。  
2. **404/405 抽出**:  
   ```bash
   rg -n '404|405|Method Not Allowed' \
     "artifacts/orca-connectivity/${RUN_ID}/logs/http_live_${UTC_TAG}.log" \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/http_404405_extract_${UTC_TAG}.log"
   ```  
   監査欄には `http_404405_extract_*` から該当行のみ引用する。  
3. **シンボリック確認**: `ls -l` / `readlink` の結果は `host_orca_log_dir_*` / `orca_http_symlink_*` として証跡化済みであることをログ欄に明記し、「/var/log/orca → docker/orca/.../logs/orca」の構造が維持されているか毎回チェックする。  
4. **再現リクエスト保存**: `curl -v -X POST ...` など再現コマンドは API ごとに `artifacts/orca-connectivity/${RUN_ID}/httpdump/<api>/request.http`、レスポンスは `.../response.http` に保存し、§4.5 の表や所見から該当フォルダへリンクする。  
5. **後続分析**: `docker logs` 結果と `http_live_*` のタイムスタンプを突き合わせ、レスポンスヘッダー (`Allow:` など) や `System Error` の差分を `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の監査テンプレへ転記する。必要に応じ `rg -n '/api' artifacts/.../orca.log` でモダナイズ側との相関を補足する。

> **W41（2025-11-13, RUN_ID=`20251113TorcaApiPrefixW41`）補足**  
> `tmp/sql/api21_medical_seed.sql` で医師・診療科履歴・中途診療行為のダミーデータを投入し、WebORCA コンテナから `/api/api21/medicalmodv2?class=01` を再実行したが `Api_Result=10`（患者番号未検出）のまま。`patientmodv2` で ID=`000001` を直接登録しようとすると `患者番号の桁数が違います` エラーが返るため、患者番号桁数設定または追加テーブル（保険・同意情報）の不足が原因と考えられる。Evidence: `artifacts/orca-connectivity/20251113T030214Z/api-prefix-test/api21_success/`。W47 では `patientmodreq` を XML/UTF-8（`Request_Number=01`、`Perform_Mode=01`、`Mod_Key=patient-create`）で再試行し、`Patient_ID` を空のまま送ると `Api_Result=01 (患者番号未設定)`、6〜8 桁で指定すると `Api_Result=P1 (患者番号の桁数が違います。)` になることを確認した（`artifacts/orca-connectivity/20251113T042053Z/patientmodv2_official/response_api*.http`）。`tbl_syskanri (kbncd=1065)` の `ORCBPTNUMCHG` が `追加桁数=1` で有効になっているため、採番ロジックが旧 6 桁 seed と一致していない点を Runbook §5 / テンプレで周知すること。

> **W50（2025-11-13, RUN_ID=`20251113Tapi21RetryZ1`）補足**  
> `docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql`（旧 `tmp/sql/...`）に `tbl_ptinf` / `tbl_ptnum` / `tbl_pthkninf` / `tbl_ptkohinf` を追加し、患者番号・保険テーブルを再投入したうえで `/api/api21/medicalmodv2?class=01` を再実行。HTTP 200 ではあるものの `Api_Result=10 / Api_Result_Message="患者番号に該当する患者が存在しません"` が継続し、`/api/api21` 経路では患者番号桁数設定が依然ボトルネックであることが判明した。Evidence: `artifacts/orca-connectivity/20251113Tapi21RetryZ1/response.json`（`Api_Result` 採取）および同ディレクトリ内 `orca.log` / `postgres.log`。

> **W53（2025-11-13, RUN_ID=`20251113T044130Z`）補足**  
> 公式 seed（7 桁 `patient_id_1` + `ptnum`、保険2系統、`tbl_ptkohinf`）に加え `tbl_uketuke` の当日受付を同 SQL へ統合し、`docker exec jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca < docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` で適用。WebORCA コンテナ内から `curl -u ormaster:change_me -H 'Content-Type: application/xml; charset=UTF-8' --data-binary @tmp/orca-api-payloads/03_medicalmodv2_payload.xml http://localhost:8000/api/api21/medicalmodv2?class=01` を実行し XML リクエスト/レスポンス・`docker logs`（orca/postgres）を `artifacts/orca-connectivity/20251113T044130Z/api21_seed_retry/` に保存したが、HTTP 200 / `Api_Result=10` のまま。患者 seed だけでは `/api/api21` 側の照合条件を満たさない点を記録。

> **W55（2025-11-13, RUN_ID=`20251113TorcaApi21SeedZ1`）補足**  
> `api21_medical_seed.sql` を 8 桁 `patient_id_1` / `ptnum`（`00000001`）へ更新し、`artifacts/orca-connectivity/20251113T061111Z/` に `seed_psql.log` / `seed_verification.txt` を保存。`/tmp/orca-api-payloads/03_medicalmodv2_payload.xml` も 8 桁へ揃えて `/api/api21/medicalmodv2?class=01` を実行したが、HTTP 200 / `Api_Result=10`（患者番号未検出）が継続。アプリログ（`http.log`）には `API-:orca ormaster medicalmodv2 ORAPI021S1V2` が出力される一方、DB ログには該当クエリが残らず、患者 ID 解決ロジック（`tbl_ptnum_public`→`ptid` 変換）で停止している可能性が高い。Evidence: `artifacts/orca-connectivity/20251113T061159Z/api21_seed_retry/`。

> **W20（2025-11-13 UTC 00:22）抜粋**  
> - *W18* `POST /jtouch/document`（doctor1, payload 1493）: `visit.touch` traceId `4e344047-a7c6-4c39-b8ee-9f158aae6057` / `36228727-5d8d-475a-969b-fe81c4e12bc3`、`open.dolphin.audit.JsonTouch` traceId `3b416904-b991-439a-93aa-ed36b9a59436` が `documentPk=-44` で完了。  
> - *W19* 同 API（payload 2273）: traceId `c4279a17-3796-4572-8123-06840839c11a` / `93e8ee07-6492-43fa-9a38-941d7dea44d8`、`open.dolphin.audit.JsonTouch` traceId `43972786-ee43-43ba-b4b5-e0b75f913736` が `documentPk=-43` で完了。  
> - ORCA ログ（`artifacts/orca-connectivity/validation/20251113T002225Z/logs/orca.log`）の末尾 200 行には 09:22JST 以降の HTTP アクセスが含まれておらず、再取得が必要であることを監査欄に記載。

### 4.5 HTTP 404/405 対応フロー

> 参考: RUN_ID=`20251113TorcaP0OpsZ1`（[ログ](logs/2025-11-13-orca-connectivity.md)、[artifacts/orca-connectivity/20251113T002140Z/P0_smoke/](../../../artifacts/orca-connectivity/20251113T002140Z/P0_smoke/)）
>
> 再実行: RUN_ID=`20251113TorcaP0OpsZ2`（[ログ: 2025-11-13 追記節](logs/2025-11-13-orca-connectivity.md)、[artifacts/orca-connectivity/20251113T011831Z/P0_retry/](../../../artifacts/orca-connectivity/20251113T011831Z/P0_retry/)）

> **W45（2025-11-13, RUN_ID=`20251113TorcaRouteApplyW45`）**  
> `artifacts/orca-connectivity/templates/` から `receipt_route.template.ini` / `route.template.yaml` を RUN_ID 付き作業ディレクトリへコピーし、`docker cp`→`chown orca:orca`→`chmod 640` の手順で `/opt/jma/weborca/app/etc/` に再配置した。Runbook 指示どおり `su -s /bin/bash orca -c '/opt/jma/weborca/mw/bin/weborca stop && ... start'` を複数回実行したが、`weborca` バイナリは `stop` サブコマンドを解釈せず常に新規起動し、既存プロセスが 8000/TCP を保持しているため `listen tcp :8000: bind: address already in use` で失敗した（ログ: `artifacts/orca-connectivity/20251113TorcaRouteApplyW45/receipt-route-test/weborca_restart.log`）。最終的に `docker restart jma-receipt-docker-orca-1`（コンテナ毎再起動）で再読み込みを完了。再起動後も `GET /api01rv2/patientgetv2?id=000001` は 404、`POST /orca11/acceptmodv2?class=01` は 405（`Allow: OPTIONS, GET`）のままで、receipt_route テンプレ適用だけでは 404/405 改善に至らないことを確認した。Evidence: `artifacts/orca-connectivity/20251113TorcaRouteApplyW45/receipt-route-test/`（`patientgetv2_direct.http`, `acceptmodv2_direct.http`, `README.md`）。以降は `questions/RECEIPT_ROUTE_REQUEST.md` の問い合わせテンプレに沿い、API_ENABLE_* / route サービス公開手順の正式な回答待ちであることを `PHASE2_PROGRESS.md` にも記載する。

> **RUN_ID=`20251119TrouteLogTestZ1`（2025-11-13, route/log テンプレ追認）**  
> - `docker/orca/jma-receipt-docker/example/receipt_route.ini` を `docker cp ... /opt/jma/weborca/app/etc/receipt_route.ini` で上書き後、同ファイルを `artifacts/orca-connectivity/20251119TrouteLogTestZ1/receipt_route.ini` へ再取得して `diff -u`（テンプレ vs. コンテナ）で差分ゼロを確認。  
> - `docker ps`（`docker-ps.txt`）、`COMPOSE_PROJECT_NAME=jma-receipt-docker-for-ubuntu-2204 docker compose ... ps`（`docker-compose-ps.txt`）、`docker exec ... ps -ef`（`orca-ps.txt`）を RUN_ID 配下へ保存し、再作成禁止の条件下で ORCA/DB 2 コンテナのみ稼働していることと route/log 変更がホット適用できたことを証跡化した。  
> - `docker exec ... ls -l /opt/jma/weborca/log` を `logs/orca-log-dir-listing.txt`、ホスト側 `ls -l docker/orca/jma-receipt-docker/logs/orca` を `logs/host_orca_log_dir.txt` に記録し、マウント直下には `orca-db-install-5.2.0.log` / `orca-db-install-thistime.log` / `orca-db-patch.log` の 3 ファイルのみが存在することを確認。中身は `logs/*.log` として丸ごと吸い上げたが `orca_http.log` は生成されておらず、HTTP ログ出力先の究明は §4.2 の残タスク（`REDIRECTLOG` 追跡）として継続する。  
> - `docker exec ... grep -n LOGDIR /opt/jma/weborca/app/etc/jma-receipt.env` 結果を `config/jma-receipt-env-logdir.txt` に保存し、`LOGDIR=/opt/jma/weborca/log` が override で維持されていることを再確認。Evidence: `artifacts/orca-connectivity/20251119TrouteLogTestZ1/` 一式（route ファイル／差分ログ／ps 出力）。

1. **ServerInfo 認証確認**  
   - `curl -s -u "${CLAIM_USER}:${CLAIM_PASS}" -H 'X-Client-UUID:00000000-0000-0000-0000-000000000000' http://localhost:9080/openDolphin/resources/serverinfo/claim/conn -w ' %{http_code}\n'` を実行し、HTTP 200 / ボディ `server` を取得できるかチェックする。  
   - 401 が返る場合は `LOCAL.FACILITY.0001:dolphin` など DB 登録済みユーザーへ切り替え、`serverinfo_claim_conn_<UTC>.txt` を Evidence に保存する。ServerInfo が認証エラーのままだと OpenDolphin 側の API キュー投入が拒否され、後続の 404/405 切り分けが進まない。
2. **API 有効化設定確認（W23結果参照）**  
   - `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 grep -E 'api|rest' /opt/jma/weborca/app/etc/online.env` や `docker exec ... cat /opt/jma/weborca/app/etc/receipt_route.ini` を実行し、`api01rv2` / `orca11` / `orca14` / `api21` 系エンドポイントが `ENABLE=1`、`ALLOW_METHODS=POST` など W23 で確認済みの設定と一致するか照合する。  
   - `receipt_route.ini` / `route.yaml` が存在しない場合の再生成手順:  
     1. `artifacts/orca-connectivity/templates/` に保存した `receipt_route.template.ini`（INI）または `route.template.yaml`（YAML）を `cp artifacts/.../receipt_route.template.ini artifacts/orca-connectivity/<RUN_ID>/config_dump/receipt_route.ini` のように RUN_ID 付き作業ディレクトリへ複製し、環境固有の `facility_cidr` や `UPSTREAM_HOST` を追記する。  
     2. `docker cp artifacts/orca-connectivity/<RUN_ID>/config_dump/receipt_route.ini jma-receipt-docker-for-ubuntu-2204-orca-1:/opt/jma/weborca/app/etc/receipt_route.ini` を実行し、同様に YAML が必要であれば `route.yaml` もアップロードする。  
     3. `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 chown orca:orca /opt/jma/weborca/app/etc/receipt_route.ini /opt/jma/weborca/app/etc/route.yaml 2>/dev/null || true` で所有者を `orca` に戻し、`chmod 640` を付与する。  
     4. `docker exec -it jma-receipt-docker-for-ubuntu-2204-orca-1 su -s /bin/bash orca -c '/opt/jma/weborca/mw/bin/weborca stop && /opt/jma/weborca/mw/bin/weborca start'` で **orca ユーザーとして** 再起動したうえで、`docker logs ... | rg -n 'route'` を確認し 404/405 が解消したかを記録する。  
   - W23 では REST API が初期状態で無効化されていた例が共有されているため、Runbook 実施前に `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` の「課題・フォローアップ」を参照し、どの設定ファイル・サービスを更新したかを確認する。差分は `artifacts/.../P0_smoke/config_diff.txt` へ保存し、`PHASE2_PROGRESS.md` の該当 RUN_ID へリンクする。
3. **公開資料に設定記載が無い場合のサポートエスカレーション**  
   - `notes/orca-api-field-validation.md` §6 に整理した公開 PDF（システム管理サイト手順書／push-exchanger・CLAIM Receiver 設定サンプル／Hybrid 運用手順）を確認し、`API_ENABLE_*` や `receipt_route.ini` の操作方法が未掲載である旨を Evidence として RUN_ID ログへ貼る。  
   - 【W40 2025-11-13】`artifacts/orca-connectivity/20251113T022010Z/config_dumps/` に WebORCA の `online.env`・`jma-receipt.env`・route 設定ファイル探索ログを保存済み。Step2/Step3 の設定確認で不足情報があれば同ディレクトリを参照する。  
   - `weborca-support@orcamo.jp`（050-5491-7453）宛に「API_ENABLE_* / receipt_route.ini 公開設定がないため、405 解消可否を照会する」旨を記載し、問い合わせ送付日時と担当者を `PHASE2_PROGRESS.md` の課題欄「外部エスカレーション要否」に追記する。Slack/Jira には問い合わせ内容と回答 SLA を共有し、返答待ちは Blocker として扱う。**注**: 現在の WebORCA コンテナはローカル検証専用であり、本番系への影響がない場合はサポート問い合わせを後回しにしても構わない。問い合わせ実行有無はマネージャー判断とし、送付を見送った場合でも理由と代替対応（例: route テンプレ再配置）の記録だけは残す。

   #### 質問テンプレ（API/ROUTE/HYBRID 未定義・route\*.yml 不在時）

   - 送付雛形: `questions/RECEIPT_ROUTE_REQUEST.md` に現状整理済み。RUN_ID・担当者・送付予定日を更新してからサポート窓口へ転記する。  
   - 添付必須ファイル（`artifacts/orca-connectivity/20251113T022010Z/config_dumps/` 配下を最新 RUN_ID で差し替えること）  
     1. `env_API_ROUTE_HYBRID.txt`: `env | grep -E 'API|ROUTE|HYBRID'` の実行結果（0 byte なら未定義である証跡）。  
     2. `online.env`: `/opt/jma/weborca/releases/<build>/etc/online.env` の全文。`HTTP_PORT` 等しか無いことを明示する。  
     3. `jma-receipt.env`: `LOGDIR`/`HTTP_HOST` の既定値のみで `API_ENABLE_*` が無いことを示す。  
     4. `route_yml_search.txt` / `route_yaml_search.txt`: `find /opt/jma/weborca -name '*route*.yml' -o -name '*route*.yaml'` の出力。ヒットが無い場合も 0 byte のまま提出する。  
   - 設定差分の書き方  
     - `online.env` 抜粋（HTTP/DB 設定のみ、`API_ENABLE_*` 無し）を `ini` ブロックで引用。  
     - `env` 探索コマンドの出力が空であることをコメントとして残す。  
     - route ファイル探索コマンドと結果（ヒットゼロ）を `bash` ブロックで示す。  
   - ログ参照先を明記  
     - 404/405 実行ログ: `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` §4.5（`RUN_ID=20251113TorcaP0OpsZ1～Z3` など）。  
     - HTTP dump: `artifacts/orca-connectivity/<RUN_ID>/P0_*`、`api-prefix-test` ディレクトリ。  
   - サポートへ投げる質問例  
     1. WebORCA 22.04 で `API_ENABLE_*`／`receipt_route.*` を設定する正式手順と再起動要件。  
     2. `receipt_route.ini`（または `.yml`）のサンプル有無、`ALLOW_METHODS=POST` を許可するキー一覧。  
     3. `HYBRID_*` など Hybrid 用環境変数の既定値と導入方法。  
     4. 405 応答ログをファイル出力させる推奨パス（`LOGDIR`／`REDIRECTLOG` 変更可否）。  
     5. 設定変更後の想定ダウンタイムと検証観点。  
   - 送信後は `PHASE2_PROGRESS.md` の対応履歴と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` のフォローアップ欄の双方へ記録し、回答待ちの場合は Blocker に分類する。
4. **ORCA ログ確認**  
   - `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 15m | rg -n '404|405|System Error'` で直近の拒否レスポンスを抽出し、`artifacts/.../logs/orca-404405_<UTC>.log` に保存する。  
   - `REDIRECTLOG` 永続化済みの場合（例: RUN_ID=`20251119TorcaHttpLogZ1`）は、`tail -F docker/orca/jma-receipt-docker/logs/orca/http.log | ts '%Y-%m-%dT%H:%M:%SZ' | tee artifacts/.../logs/http_live_<UTC>.log` を並走させ、`docker logs` と同じタイムスタンプで HTTP 405 応答を捕捉する。セッション終了後に `ls -l docker/orca/jma-receipt-docker/logs/orca > artifacts/.../logs/host_orca_log_dir.txt` と `readlink .../orca_http.log` を取得し、`/var/log/orca/http.log` → `./logs/orca/http.log` のシンボリックリンク構造を証跡化する。  
   - ルーティング層（nginx）・WebORCA アプリ層のいずれが応答しているかを `HTTP/1.1 404` や `method not allowed` 文言で判別し、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の監査欄へ抜粋を貼る。
5. **代替リクエスト方法**  
   - `scripts/tools/orca-curl-snippets.js` で生成したテンプレを `tmp/orca-curl-snippets/*.sh` から引用し、`curl -v -X POST -H 'Content-Type: application/json' --data @assets/orca-api-requests/<api>.json http://localhost:9080/openDolphin/resources/claim/<path>` のように **モダナイズサーバー経由** と `curl http://orca:8000/<api>` の **ORCA 直打ち** を焼き合わせる。  
   - POST が 405 のままの場合は GET 版の `/acceptlstv2` など疎通可能な API を先に投げ、レスポンス成功が確認できる環境で `acceptmodv2` 等を再試行する。直打ち結果は `artifacts/.../P0_smoke/requests/<api>/<timestamp>.json` に、OpenDolphin 経由の結果は `openDolphin_<api>_<UTC>.json` に分けて保存し、RUN_ID メモに URL を記載する。

> **チェックリスト**: HTTP 404/405 トリアージは [logs/TEMPLATE-orca-http-error.md](logs/TEMPLATE-orca-http-error.md) を `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ貼り付け、ServerInfo 認証→API 有効化設定→`/api/apiXX` 試行→`docker logs --since`→Evidence Index 更新の順に全項目へ結果を記録してから RUN_ID をクローズする。

### 4.6 ORCA API 404/405 再検証スクリプト

`ops/tests/orca/api-smoke.sh` で `/route/<endpoint>` と通常パスの双方へ `curl -isS` を一括送信し、HTTP 404/405 の差分を採取する。スクリプトはヘッダー+ボディをそのまま保存するため、`receipt_route.ini` の有効化状況や Reverse Proxy 側の挙動を証跡化しやすい。

1. **実行前準備**  
   - `RUN_ID={{YYYYMMDD}}TorcaApiSmokeZ#` を採番し、`artifacts/orca-connectivity/<RUN_ID>/` を作成する。`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に同一 RUN_ID の節を用意する。  
   - 認証が必要な環境では `--` 以降に `curl` オプション（例: `-u ormaster:change_me -H 'Accept: application/json'`）を列挙する。
2. **コマンド**  
   ```bash
   RUN_ID=20251113TorcaApiSmokeZ1 \
   ops/tests/orca/api-smoke.sh \
     -o artifacts/orca-connectivity/20251113TorcaApiSmokeZ1 \
     --base-url http://orca:8000 \
     --prefixes route,direct \
     -- -u ormaster:change_me -H 'Accept: application/json'
   ```
   - `--prefixes route,direct` で `/route/<endpoint>`・`/<endpoint>` の両方を確認する。`--prefixes route` のみを指定すれば `receipt_route` 有効化チェック専用として利用できる。
3. **成果物**  
   - 各エンドポイントのヘッダー+本文を `artifacts/orca-connectivity/<RUN_ID>/<label>_<prefix>.http` に保存。  
   - `summary.csv` に `prefix,label,method,url,http_status,output_file` を追記し、期待ステータスとの差分を確認できるようにする。  
   - 失敗時（例: `curl_error_6`）もファイルへ標準エラーが追記されるため、ネットワーク不達の Evidence として利用可能。
4. **期待ステータス**（TORCA P0 API ベースライン: RUN_ID=`20251113TorcaP0OpsZ1/Z2`）

| ラベル | ルート経由 (`/route/...`) | 直接 (`/...`) | 根拠・備考 |
| --- | --- | --- | --- |
| `patientgetv2` (`GET /api01rv2/patientgetv2?id=000001`) | 404 Not Found | 404 Not Found | WebORCA 側で GET API が未公開。 |
| `appointmodv2` (`POST /orca14/appointmodv2?class=01`) | 405 Method Not Allowed | 405 Method Not Allowed | POST が拒否されている。`Allow=GET,OPTIONS` のみ。 |
| `medicalmodv2` (`POST /api21/medicalmodv2?class=01`) | 405 Method Not Allowed | 200 OK（`/api/api21` 経由, `Api_Result=10`） | 直接 `/api21` は依然 405 だが、W52（RUN_ID=`20251113TorcaApi21LenW52`）で `/api/api21` へ送ると 6/7 桁および ptid/内部 ID すべて 200 / `Api_Result=10`（患者未検出）。患者 seed と `ORCBPTNUMCHG` 桁数設定の不整合が原因。 |
| `acceptmodv2` (`POST /orca11/acceptmodv2?class=01`) | 405 Method Not Allowed | 405 Method Not Allowed | 受付登録 API が HTTP レイヤーで無効化。 |
| `acceptlstv2` (`POST /api01rv2/acceptlstv2?class=01`) | 200 OK (`Api_Result=00/13/14`) | 200 OK (`Api_Result=00/13/14`) | seed 状況に応じて `Api_Result` が変化。HTTP 200 を維持しているかを確認。 |
| `patientmemomodv2` (`POST /orca06/patientmemomodv2`) | 405 Method Not Allowed | 405 Method Not Allowed | 患者メモ CRUD が POST 無効化状態。 |

ルート経由の期待値は `receipt_route.ini` で該当 API が direct パスへフォワードされている前提のため、直接アクセスの結果と揃わない場合は `route` テーブル未登録または ALLOW 設定漏れを疑う。

> **Run 実績**: `RUN_ID=20251113TorcaApiSmokeZ1` では ORCA コンテナ未起動環境で実行したため、全リクエストが `curl_error_6 (Could not resolve host: orca)` となった。接続エラーもそのまま `.http` / `summary.csv` に記録されるため、ネットワーク疎通前のチェックとしても利用できる。

### 4.9 コマンド生成スクリプト

テンプレート（`assets/orca-api-requests/*.json` / `*.xml`）をもとに cURL 実行例を一括生成し、Runbook §4 の疎通手順へ流用できるようにした。

1. **生成**: リポジトリ直下で `node scripts/tools/orca-curl-snippets.js` を実行すると、API 番号順に整列したコマンドリストが `tmp/orca-curl-snippets.txt` に出力される。スクリプトはテンプレファイルを読み込むだけで cURL を実行しない。
2. **Dry-run**: 実行前に送信内容を確認したい場合は `node scripts/tools/orca-curl-snippets.js --dry-run` または `npm run orca-snippets:dry` を使用し、標準出力に展開される一覧を確認する。ログは `artifacts/orca-connectivity/validation/<UTC>/snippets_dry.log` へ保存して Evidence 化する（通信は行われない）。
3. **内容**: JSON テンプレは `curl -X <METHOD> http://orca:8000/<path> -H 'Content-Type: application/json; charset=Shift_JIS' --data @<template>`、XML テンプレは `curl -X <METHOD> http://orca:8000/<path>` に `-H 'Content-Type: application/xml; charset=UTF-8' --data-binary @<template>` を自動付与する。`method` フィールドがなければ POST、`query` フィールドまたは XML 側 `orca-meta` の `query=` 指定があれば URL へ自動付与する。
4. **利用手順**: `tmp/orca-curl-snippets.txt` から対象 API のスニペットをコピーし、必要に応じて `docker exec ... curl` 形式へ読み替えて実行する。実行ログはこれまで通り `artifacts/orca-connectivity/<UTC>/` へ保存し、§4 の証跡欄へリンクする。

テンプレを更新した際はスクリプトを再実行し、最新のパラメータ順序が反映されたコマンドを生成してから疎通を行う。

## 5. ORCA API 検証マトリクス

- 公式仕様ページ: <https://www.orca.med.or.jp/receipt/tec/api/overview.html>
- 要領:
  1. **直接疎通**: `docker exec opendolphin-server-modernized-dev curl -s -X <METHOD> -H 'Content-Type: application/json; charset=Shift_JIS' -d @request.json http://orca:8000/<path>` でレスポンスを取得し、`jq` で整形。
  2. **OpenDolphin 経由**: 対応する Web クライアント機能（患者検索、予約、受付、入退院管理など）を実行し、モダナイズ版サーバーのログに ORCA API コールが記録されることを `grep "orca" server-modernized.log` で確認。
  3. **比較**: Legacy（必要に応じ）でも同一リクエストを発行して差分を `diff -u legacy modernized` で保存。
  4. **証跡**: API ごとに `artifacts/orca-connectivity/<UTC>/<path>_{request,response}.json` を残し、結果サマリをログファイルへ追記。

| 項番 | URL / 用途 | メソッド・主引数 | 優先度 | 確認観点 |
| --- | --- | --- | --- | --- |
| 1 | `/api01rv2/patientgetv2` 患者基本情報 | GET `id` | P0 | 既存患者（例: `000001`) を取得し、Modernized サーバーの患者詳細画面が ORCA 返却値と一致するか確認。 |
| 2 | `/orca14/appointmodv2` 予約登録/取消 | POST `class=01/02` | P0 | 予約作成 → `/serverinfo/claim/conn` が `server` の状態で予約が ORCA に記録されるか、ORCA UI で反映を確認。 |
| 3 | `/api21/medicalmodv2` 診療行為（中途） | POST `class=01-03` | P0 | 中途登録/削除/変更の各クラスを送信し、OpenDolphin の診療行為編集と双方向で不整合がないかチェック。W41（RUN_ID=`20251113TorcaApiPrefixW41`）では `tbl_list_doctor` / `tbl_ptnum_public` / `tbl_srykarrk` / `tbl_sryact` を seed したうえで `/api/api21` プレフィックスを再実行したが `Api_Result=10`（患者番号未検出）のまま。W50（RUN_ID=`20251113Tapi21RetryZ1`）で `tbl_ptinf` / `tbl_ptnum` / `tbl_pthkninf` / `tbl_ptkohinf` を追加 seed しても `Api_Result=10` が継続。W52（RUN_ID=`20251113TorcaApi21LenW52`）では `/api/api21` ルートが 200 OK であることを 6 桁/7 桁/ptid/内部 ID 10 桁の 4 パターンで確認したが、いずれも `Api_Result=10` のまま → route 設定ではなく患者 seed/lookup がボトルネック。W53（RUN_ID=`20251113T044130Z`）で公式 seed + 受付件を再適用した XML 実行も `Api_Result=10`。**W54（RUN_ID=`20251113TorcaPatientDigitsZ1`）で `tbl_syskanri` を再取得し、`PTNUM` デフォルト 7 桁 + `ORCBPTNUMCHG` 追加桁数=1 ⇒ 8 桁（例: `00000001`）で送信すべきと判明。W55（RUN_ID=`20251113TorcaApi21SeedZ1`）では 8 桁 `api21_medical_seed.sql` を適用し直したが `Api_Result=10` が継続し、`patient_id_1`→`ptid` 解決処理が未達と推測。W46（RUN_ID=`20251113TorcaPatientmodCliW46`）は `patientmodv2` で 8 桁 Patient_ID を採番できず（`Api_Result=01`）、API21 は前提未達のため未再実行。**W56（RUN_ID=`20251113TorcaPatientAutoStdZ1`）では `tbl_ptnum`／`tbl_ptnum_public` を 8 桁へ補正し `patientmodv2` で自動採番 (`Api_Result=00`, Patient_ID=`00002`) まで到達したが、`Physician_Code` が ORCA 側 doctor マスタへ解決されず `Api_Result=14 (ドクターが存在しません)` で停止。doctor マスタの登録/紐付け手順が未整備のため、API21 の最終成功条件は引き続き未達。W60（RUN_ID=`20251113TorcaDoctorManualW60`）では `/api01rv2/system01lstv2?class=02` が `Api_Result=11`、続く `/api/api21/medicalmodv2?class=01` が `Api_Result=14` で止まり、doctor マスタ seed 欠如がボトルネックであることを再確認。 Evidence: `artifacts/orca-connectivity/20251113T030214Z/api-prefix-test/api21_success/`, `artifacts/orca-connectivity/20251113Tapi21RetryZ1/`, `artifacts/orca-connectivity/20251113T043340Z/api21_length-test/`, `artifacts/orca-connectivity/20251113T044130Z/api21_seed_retry/`, `artifacts/orca-connectivity/20251113T061159Z/api21_seed_retry/`, `artifacts/orca-connectivity/20251113T054336Z/patient_id_rules/tbl_syskanri.txt`, `artifacts/orca-connectivity/20251113T065012Z/api21_patientmod_cli/`, `artifacts/orca-connectivity/20251113T084607Z/api21_patientmod_auto/`, `artifacts/orca-connectivity/20251113T123843Z/api21_doctor_manual/`. |
| 4 | `/orca11/acceptmodv2` 受付登録/取消 | POST `class=01/02` | P0 | 受付登録後に OpenDolphin の受付一覧が即時更新されるか監視。ORCA 側受付一覧との件数差分を比較。 |
| 5 | `/api01rv2/acceptlstv2` 受付一覧 | POST `class=01-03` | P0 | 指定日付で受付中/済み/全件を取得し、OpenDolphin の受付画面フィルタ結果と一致するかを CSV で比較。 |
| 6 | `/api01rv2/appointlstv2` 予約一覧 | POST `class=01` | P0 | ORCA 予約一覧と OpenDolphin 予約画面の一致確認。日付範囲フィルタを変えてレスポンス遅延も測定。 |
| 7 | `/orca102/medicatonmodv2` 点数マスタ | POST `class=01-04` | P1 | マスタ登録/削除/終了日/期間変更をそれぞれ実行し、OpenDolphin のマスタ同期タスクが異常終了しないか監視。 |
| 8 | `/api01rv2/patientlst1v2` 患者番号一覧 | POST `class=01/02` | P0 | 新規・更新対象患者のリストが OpenDolphin の同期ジョブに取り込まれることを確認。 |
| 9 | `/api01rv2/patientlst2v2` 指定患者情報（複数） | POST `class=01` | P0 | 患者複数取得 API を使ったバッチ同期が Shift_JIS 文字化けなく動作するか検証。 |
| 10 | `/api01rv2/patientlst3v2` 氏名検索 | POST `class=01` | P0 | かな検索 vs. OpenDolphin UI での氏名検索結果一致を確認。 |
| 11 | `/api01rv2/system01lstv2` システム管理情報 | POST `class=01-07` | P1 | 診療科/ドクター/職員/医療機関/入金方法等のメタデータが OpenDolphin のマスタ画面と一致するか検証。 |
| 12 | `/api01rv2/medicalgetv2` 診療行為取得 | POST `class=01-04` | P0 | 受診履歴や月次診療行為を取得し、OpenDolphin のカルテ履歴との突合を行う。 |
| 13 | `/api01rv2/diseasegetv2` 患者病名情報 | POST `class=01` | P0 | 病名一覧がカルテ診断面と一致、且つ重複登録が無いことを確認。 |
| 14 | `/orca12/patientmodv2` 患者登録/更新/削除/保険追加 | POST `class=01-04` | P0 | OpenDolphin から患者登録→ORCA 登録→再取得の一連フローを実行。**備考:** WebORCA 22.04 では XML/UTF-8（`<data><patientmodreq>`）で `Request_Number`/`Perform_Mode`/`Mod_Key` を指定し、`ORCBPTNUMCHG (kbncd=1065)` の追加桁数=1 を満たす患者番号でないと `Api_Result=P1 (患者番号の桁数が違います。)` になる。W54（RUN_ID=`20251113TorcaPatientDigitsZ1`）で `tbl_syskanri` を再確認した結果 **「7桁 + 追加1桁 = 8桁」** が現在のチェック条件であることを Evidence 化（`artifacts/orca-connectivity/20251113T054336Z/patient_id_rules/tbl_syskanri.txt`）。W46（RUN_ID=`20251113TorcaPatientmodCliW46`）は CLI 公式手順を再現したが `Api_Result=01 (患者番号未設定)` のまま新規採番できず、`tbl_ptinf/tbl_ptnum` も更新されなかった（`artifacts/orca-connectivity/20251113T065012Z/patientmodv2_official_cli/`）。W56（RUN_ID=`20251113TorcaPatientAutoStdZ1`）では `InsuranceProvider_Number` マスタ整備と `kanritbl` 更新のうえで `Patient_ID=*` を送信し、`Api_Result=00` / `Patient_ID=00002` まで到達（`artifacts/orca-connectivity/20251113T084607Z/patientmodv2_auto/patientmod_body_success.xml`）。ただし `/api/api21` 連携は doctor 未検出で停止している。[XML テンプレ参照](assets/orca-api-requests/14_patientmodv2_request.xml)。W47 実績: `artifacts/orca-connectivity/20251113T042053Z/patientmodv2_official/`。 |
| 15 | `/api01rv2/appointlst2v2` 患者予約情報 | POST `class=01` | P0 | ORCA 側の患者単位予約一覧と OpenDolphin の患者詳細タブを比較。 |
| 16 | `/api01rv2/acsimulatev2` 請求金額試算 | POST `class=01` | P0 | 見積表示に用いる API で金額・点数が一致すること、タイムアウトしないことを確認。 |
| 17 | `/orca25/subjectivesv2` 症状詳記登録/削除 | POST `class=01/02` | P0 | 主訴記録を ORCA へ送信し、OpenDolphin のカルテとの二重登録がないかチェック。 |
| 18 | `/api01rv2/visitptlstv2` 来院患者一覧 | POST | P0 | 来院日別の受診履歴取得が OpenDolphin 来院一覧ウィジェットに反映されるか。 |
| 19 | `/api01rv2/hsconfbasev2` 入院基本情報 | POST | P1 | 入院設定がベッド管理画面と一致するか。 |
| 20 | `/api01rv2/hsconfwardv2` 病棟・病室 | POST | P1 | 病棟/病室マスタとの同期を確認。 |
| 21 | `/api01rv2/tmedicalgetv2` 中途終了患者一覧 | POST | P1 | 中途終了患者がカルテ一覧に正しく表示されるか。 |
| 22 | `/api01rv2/insprogetv2` 保険者一覧 | POST | P0 | 保険者マスタ同期。 |
| 23 | `/api01rv2/hsmealv2` 入院患者食事情報 | POST | P1 | 入院患者の食事情報が OpenDolphin の入院管理画面と一致。 |
| 24 | `/api01rv2/hsptevalv2` 医療区分・ADL 点数 | POST | P1 | ADL 点数が OpenDolphin の看護必要度画面へ反映されるか。 |
| 25 | `/api01rv2/hsptinfv2` 入院患者基本情報 | POST | P1 | ベッド一覧の患者情報と突合。 |
| 26 | `/api01rv2/hsacsimulatev2` 退院時仮計算 | POST | P1 | 退院会計画面での概算と比較。 |
| 27 | `/api01rv2/incomeinfv2` 収納情報 | POST | P0 | 会計画面の収納履歴と一致。 |
| 28 | `/api01rv2/systeminfv2` システム情報 | POST | P2 | システム設定監視用。環境差異が無いことを確認。 |
| 29 | `/orca31/hsptinfmodv2` 入退院登録 | POST | P1 | 入退院登録が ORCA/ OpenDolphin 双方で二重反映されることを確認。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |
| 30 | `/orca31/hsacctmodv2` 外泊・食事登録（会計照会） | POST | P1 | 入院会計追記が OpenDolphin の入院会計ビューに現れるか。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |
| 31 | `/orca32/hsptevalmodv2` 医療区分登録 | POST | P1 | ADL 登録が最新値で保持されるか。 |
| 32 | `/orca101/manageusersv2` ユーザー管理 | POST | P2 | ORCA ユーザー同期と OpenDolphin の連携ユーザー設定が一致するか。**現状:** WebORCA 22.04 では POST が無効で `Allow: OPTIONS, GET` のまま。RUN_ID=`20251113TorcaManageUsersZ1`（Evidence: `artifacts/orca-connectivity/20251113T150730Z/manageusers/`）で Request_Number=02/03/04 を XML (`docs/.../manageusers_{register,update,delete}.xml`) から送信してもすべて `HTTP/1.1 405 Method Not Allowed` / `System Error:405`（web.ErrorHandler stacktrace）となり、`tbl_list_doctor` や `tbl_syskanri` に doctor (`taro`/`jiro`) が登録されない。doctor seed を API から投入できないため `/api/api21/medicalmodv2` も `Api_Result=14 (ドクターが存在しません)` が継続（`.../api21_manageusers/response.xml`）。`receipt_route.ini` / `online.env` 側で API #32 の POST を開放するまで、doctor マスタは seed SQL で代替する。詳細仕様: `assets/orca-tec-index/raw/api_userkanri.md` |
| 33 | `/orca21/medicalsetv2` 診療セット登録 | POST | P0 | セット登録/削除/終了日更新/取得が OpenDolphin のスタンプ同期に反映されるか。 |
| 34 | `/orca31/birthdeliveryv2` 出産育児一時金 | POST | P1 | 出産関連登録がレセ電文へ正しく出力されるか。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |
| 35 | `/api01rv2/patientlst6v2` 全保険組合せ一覧 | POST | P0 | 保険組合せが患者登録画面と一致。 |
| 36 | `/orca22/diseasev2` 患者病名登録 | POST | P0 | 病名登録/更新/削除の整合性を確認。 |
| 37 | `/orca22/diseasev3` 患者病名登録2 | POST | P0 | v2 との差異を記録し、対応する OpenDolphin フィールドを確認。 |
| 38 | `/orca31/hsacctmodv2` 入院会計作成 | POST | P1 | 入院会計作成が重複しないか。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |
| 39 | `/orca31/hspmmv2` 入院会計未作成チェック | POST | P1 | 未作成一覧と OpenDolphin のアラートが同期するか。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |
| 40 | `/orca31/hsacctmodv2` 室料差額登録 | POST | P1 | 差額ベッド料が請求へ反映されるか。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |
| 41 | `/api01rv2/pusheventgetv2` PUSH 通知 | POST | P0 | PUSH 通知 API をポーリングし、OpenDolphin の通知センターに表示されるか。 |
| 42 | `/orca42/receiptprintv3` | POST | P2 | 帳票印刷ジョブ。 |
| 43 | `/orca51/masterlastupdatev3` マスタ最終更新日 | POST | P2 | マスタ更新日を取得し、OpenDolphin 側のキャッシュ更新条件に利用。 |
| 44 | `/api01rv2/system01dailyv2` 基本情報取得 | POST | P2 | 日次の基本情報が OpenDolphin のダッシュボードに反映されるか。※UTF-8 必須（Shift_JIS→Api_Result=91, W19 証跡: `notes/orca-api-field-validation.md` §5）。 |
| 45 | `/api01rv2/patientlst7v2` 患者メモ取得 | POST | P0 | 患者メモがカルテメモと一致するか。 |
| 46 | `/api21/medicalmodv23` 初診算定日登録 | POST | P0 | 初診算定日がレセプト計算へ反映されるか。 |
| 47 | `/orca36/hsfindv3` 入院患者照会 | POST | P1 | 入院患者一覧が一致。 |
| 48 | `/api01rv2/contraindicationcheckv2` 薬剤併用禁忌チェック | POST | P0 | 禁忌チェック結果を OpenDolphin UI へ表示し、重大判定時に操作を遮断するか。 |
| 49 | `/api01rv2/insuranceinf1v2` 保険・公費一覧 | POST | P0 | 保険・公費情報が OpenDolphin の保険タブと一致。 |
| 50 | `/api01rv2/subjectiveslstv2` 症状詳記取得 | POST | P0 | 症状詳記一覧がカルテ表示と一致。 |
| 51 | `/api01rv2/patientlst8v2` 旧姓履歴取得 | POST | P1 | 旧姓履歴が OpenDolphin の患者属性表示に反映されるか。 |
| 52 | `/api01rv2/medicationgetv2` 入力・診療コード内容取得 | POST | P0 | コード検索画面の候補が一致。 |
| 53 | `/orca06/patientmemomodv2` 患者メモ登録/更新/削除 | POST | P0 | 患者メモ CRUD が双方向同期されるか。※環境設定要確認（2025-11-13 W23: POST が 405, Allow=GET/OPTIONS） |

**優先度タグ指針**

- **P0 = 受付・予約・外来診療・カルテ同期**: Web クライアントの受付/予約/カルテ導線（[CLINICAL_MODULES.md §1-§2](../../web-client/guides/CLINICAL_MODULES.md#2-受付予約サマリ運用)）と予約状態遷移の一貫性（[RESERVATION_BATCH_MIGRATION_NOTES.md §2](../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図)）に直結し、遅延すると当日業務が停止するもの。
- **P1 = 入院・長期滞在・専門会計/マスタ同期**: ベッド/病棟/入退院ワークフローや出産・入院会計といった計画業務。外来停止までは至らないが担当部署を塞ぐため、同日中にクリアすべき対象。
- **P2 = 運用基盤・帳票・バックオフィス**: システム情報・ユーザー管理・帳票などの管理系 API。Jakarta EE 10 化後のバッチ/マスタ監視（[RESERVATION_BATCH_MIGRATION_NOTES.md §1](../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#1-javax-jakarta-置換対象と設計差分)）を支えるが、本番当日の診療は代替手段で継続できるもの。

> **補足**: ORCA で `class` パラメータが必要な API は、テストケースに `class` ごとのサンプル JSON を用意し、シリアライズ時のエンコーディング（Shift_JIS or UTF-8）設定を確認する。公式サンプル `sampreq*.json` を `docker/orca/jma-receipt-docker/samples/` へ保管してから利用すると差分比較が容易。

### Appendix: Seed SQL 手順（API21 8 桁患者）

目的: `/api21/medicalmodv2` が `Api_Result=10 (patient not found)` で停止する際に、`ORCBPTNUMCHG (kbncd=1065)` へ合わせた 8 桁患者番号 `00000001`（デフォルト 7 桁 + 追加1 桁）を再現可能な状態で投入する。

1. **前提確認**
   - ORCA コンテナ名: `jma-receipt-docker-for-ubuntu-2204-orca-1`（`docker ps` で名称差異が無いか確認）。
   - `kbncd=1065` が 7 桁 + 追加1桁（`追加桁数=1`）で有効になっていることを `docker exec -it ... psql -c "SELECT * FROM tbl_syskanri WHERE kbncd=1065;"` で事前確認。
   - RUN_ID を `20251113TorcaApi21SeedZ1` 形式で採番し、UTC タイムスタンプの Evidence ルート（例: `artifacts/orca-connectivity/20251113T061111Z/`）を作成する。
2. **SQL 実行**  
   `docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` は `tbl_ptinf`/`tbl_ptnum`/`tbl_pthkninf`/`tbl_ptkohinf` の hospnum=1, ptid=1 を削除後に再挿入する。以下コマンドで再現できる。  
   ```bash
   RUN_ID=20251113TorcaSeed7DigitZ1
   UTC_RUN=20251113T031200Z
   mkdir -p artifacts/orca-connectivity/${UTC_RUN}
   docker exec -i jma-receipt-docker-for-ubuntu-2204-db-1 \
     psql -U orca -d orca \
     < docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql \
     | tee artifacts/orca-connectivity/${UTC_RUN}/seed_psql.log
   ```
   - `tee` で取得した `seed_psql.log` に `ON_ERROR_STOP` の結果を残し、`RUN_ID=${RUN_ID}` を 1 行目へ追記。
   - 既存データを保持したい場合は同ログに `BEGIN BACKUP` の通知を入れ、別名で `COPY tbl_ptinf TO ...` した CSV を Evidence に同梱する。
3. **成果物・報告**
   - Evidence: `artifacts/orca-connectivity/${UTC_RUN}/seed_psql.log`、必要に応じて `patient_check.sql` の結果（`tbl_ptnum`, `tbl_pthkninf`, `tbl_ptkohinf`, `tbl_ptnum_public` 等）を `seed_verification.txt` に保存。
   - Runbook ログ: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` に Seed 手順サマリを追記し、RUN_ID / UTC_RUN / Evidence パスを明記。
   - Evidence Index: `assets/orca-evidence-index.md` の該当行へ RUN_ID、対象 API（medicalmodv2 7 桁患者再現）、行番号リンクを追加する。

### Request Templates

| API | Request JSON | Response Sample | 備考 |
| --- | --- | --- | --- |
| 1 `/api01rv2/patientgetv2` | [01_patientgetv2_request.json](assets/orca-api-requests/01_patientgetv2_request.json) | [01_patientgetv2_response.sample.json](assets/orca-api-requests/01_patientgetv2_response.sample.json) | GET `id` 指定で患者基本情報を取得。 |
| 2 `/orca14/appointmodv2` | [02_appointmodv2_request.json](assets/orca-api-requests/02_appointmodv2_request.json) | [02_appointmodv2_response.sample.json](assets/orca-api-requests/02_appointmodv2_response.sample.json) | POST `class=01`（予約登録）例。 |
| 3 `/api21/medicalmodv2` | [03_medicalmodv2_request.json](assets/orca-api-requests/03_medicalmodv2_request.json) | [03_medicalmodv2_response.sample.json](assets/orca-api-requests/03_medicalmodv2_response.sample.json) | POST `class=01` 診療行為中途登録。 |
| 4 `/orca11/acceptmodv2` | [04_acceptmodv2_request.json](assets/orca-api-requests/04_acceptmodv2_request.json) | [04_acceptmodv2_response.sample.json](assets/orca-api-requests/04_acceptmodv2_response.sample.json) | POST `class=01` 受付登録。 |
| 5 `/api01rv2/acceptlstv2` | [05_acceptlstv2_request.json](assets/orca-api-requests/05_acceptlstv2_request.json) | [05_acceptlstv2_response.sample.json](assets/orca-api-requests/05_acceptlstv2_response.sample.json) | POST `class=01` 会計待ち一覧。RUN_ID=`20251113TorcaP0OpsZ2` は 200／`Api_Result=21`（対象受付なし）で、再 seed 前の挙動を `artifacts/orca-connectivity/20251113T012013Z/P0_retry/API05_acceptlstv2/` に保存。W36 seed 後の RUN_ID=`20251113TorcaP0OpsZ3` では患者 ID `000001` を `tbl_ptinf`/`tbl_ptnum`/`tbl_uketuke` に投入し `Medical_Information=01` で POST → 200／`Api_Result=00` を取得（証跡: `artifacts/orca-connectivity/20251113T015810Z/seed/acceptlstv2_response.http`）。 |
| 6 `/api01rv2/appointlstv2` | [06_appointlstv2_request.json](assets/orca-api-requests/06_appointlstv2_request.json) | [06_appointlstv2_response.sample.json](assets/orca-api-requests/06_appointlstv2_response.sample.json) | POST `class=01` 日別予約一覧。 |
| 7 `/orca102/medicatonmodv2` | [07_medicatonmodv2_request.json](assets/orca-api-requests/07_medicatonmodv2_request.json) | [07_medicatonmodv2_response.sample.json](assets/orca-api-requests/07_medicatonmodv2_response.sample.json) | POST `class=01` 点数マスタ登録。 |
| 8 `/api01rv2/patientlst1v2` | [08_patientlst1v2_request.json](assets/orca-api-requests/08_patientlst1v2_request.json) | [08_patientlst1v2_response.sample.json](assets/orca-api-requests/08_patientlst1v2_response.sample.json) | POST `class=01` 新規・更新患者抽出。 |
| 9 `/api01rv2/patientlst2v2` | [09_patientlst2v2_request.json](assets/orca-api-requests/09_patientlst2v2_request.json) | [09_patientlst2v2_response.sample.json](assets/orca-api-requests/09_patientlst2v2_response.sample.json) | POST `class=01` 指定 ID 複数取得。 |
| 10 `/api01rv2/patientlst3v2` | [10_patientlst3v2_request.json](assets/orca-api-requests/10_patientlst3v2_request.json) | [10_patientlst3v2_response.sample.json](assets/orca-api-requests/10_patientlst3v2_response.sample.json) | POST `class=01` 氏名検索。 |
| 11 `/api01rv2/system01lstv2` | [11_system01lstv2_request.json](assets/orca-api-requests/11_system01lstv2_request.json) | [11_system01lstv2_response.sample.json](assets/orca-api-requests/11_system01lstv2_response.sample.json) | POST `class=01` 診療科コード取得。 |
| 12 `/api01rv2/medicalgetv2` | [12_medicalgetv2_request.json](assets/orca-api-requests/12_medicalgetv2_request.json) | [12_medicalgetv2_response.sample.json](assets/orca-api-requests/12_medicalgetv2_response.sample.json) | POST `class=01` 受診履歴。 |
| 13 `/api01rv2/diseasegetv2` | [13_diseasegetv2_request.json](assets/orca-api-requests/13_diseasegetv2_request.json) | [13_diseasegetv2_response.sample.json](assets/orca-api-requests/13_diseasegetv2_response.sample.json) | POST `class=01` 患者病名。 |
| 14 `/orca12/patientmodv2` | [14_patientmodv2_request.xml](assets/orca-api-requests/14_patientmodv2_request.xml) | [14_patientmodv2_response.sample.json](assets/orca-api-requests/14_patientmodv2_response.sample.json) | POST `class=01` 患者登録。**メモ:** 公式サンプルは XML/UTF-8（`<data><patientmodreq>` + `Request_Number/Perform_Mode/Mod_Key`）。テンプレは XML 版へ差し替え済みで、`Patient_ID` の桁数ルールをコメントに記載。Evidence: `artifacts/orca-connectivity/20251113TpatientmodXMLW51/`。 |
| 15 `/api01rv2/appointlst2v2` | [15_appointlst2v2_request.json](assets/orca-api-requests/15_appointlst2v2_request.json) | [15_appointlst2v2_response.sample.json](assets/orca-api-requests/15_appointlst2v2_response.sample.json) | POST `class=01` 患者別予約一覧。 |
| 16 `/api01rv2/acsimulatev2` | [16_acsimulatev2_request.json](assets/orca-api-requests/16_acsimulatev2_request.json) | [16_acsimulatev2_response.sample.json](assets/orca-api-requests/16_acsimulatev2_response.sample.json) | POST `class=01` 請求試算。 |
| 17 `/orca25/subjectivesv2` | [17_subjectivesv2_request.json](assets/orca-api-requests/17_subjectivesv2_request.json) | [17_subjectivesv2_response.sample.json](assets/orca-api-requests/17_subjectivesv2_response.sample.json) | POST `class=01` 症状詳記登録。 |
| 18 `/api01rv2/visitptlstv2` | [18_visitptlstv2_request.json](assets/orca-api-requests/18_visitptlstv2_request.json) | [18_visitptlstv2_response.sample.json](assets/orca-api-requests/18_visitptlstv2_response.sample.json) | POST `class=01` 来院患者一覧。 |
| 19 `/api01rv2/hsconfbasev2` | [19_hsconfbasev2_request.json](assets/orca-api-requests/19_hsconfbasev2_request.json) | [19_hsconfbasev2_response.sample.json](assets/orca-api-requests/19_hsconfbasev2_response.sample.json) | POST 入院基本情報。 |
| 20 `/api01rv2/hsconfwardv2` | [20_hsconfwardv2_request.json](assets/orca-api-requests/20_hsconfwardv2_request.json) | [20_hsconfwardv2_response.sample.json](assets/orca-api-requests/20_hsconfwardv2_response.sample.json) | POST 病棟・病室マスタ。 |
| 21 `/api01rv2/tmedicalgetv2` | [21_tmedicalgetv2_request.json](assets/orca-api-requests/21_tmedicalgetv2_request.json) | [21_tmedicalgetv2_response.sample.json](assets/orca-api-requests/21_tmedicalgetv2_response.sample.json) | POST 中途終了患者一覧。 |
| 22 `/api01rv2/insprogetv2` | [22_insprogetv2_request.json](assets/orca-api-requests/22_insprogetv2_request.json) | [22_insprogetv2_response.sample.json](assets/orca-api-requests/22_insprogetv2_response.sample.json) | POST 保険者一覧。 |
| 23 `/api01rv2/hsmealv2` | [23_hsmealv2_request.json](assets/orca-api-requests/23_hsmealv2_request.json) | [23_hsmealv2_response.sample.json](assets/orca-api-requests/23_hsmealv2_response.sample.json) | POST 入院食事情報。 |
| 24 `/api01rv2/hsptevalv2` | [24_hsptevalv2_request.json](assets/orca-api-requests/24_hsptevalv2_request.json) | [24_hsptevalv2_response.sample.json](assets/orca-api-requests/24_hsptevalv2_response.sample.json) | POST 医療区分・ADL 点数取得。 |
| 25 `/api01rv2/hsptinfv2` | [25_hsptinfv2_request.json](assets/orca-api-requests/25_hsptinfv2_request.json) | [25_hsptinfv2_response.sample.json](assets/orca-api-requests/25_hsptinfv2_response.sample.json) | POST 入院患者基本情報。 |
| 26 `/api01rv2/hsacsimulatev2` | [26_hsacsimulatev2_request.json](assets/orca-api-requests/26_hsacsimulatev2_request.json) | [26_hsacsimulatev2_response.sample.json](assets/orca-api-requests/26_hsacsimulatev2_response.sample.json) | POST 退院時仮計算。 |
| 27 `/api01rv2/incomeinfv2` | [27_incomeinfv2_request.json](assets/orca-api-requests/27_incomeinfv2_request.json) | [27_incomeinfv2_response.sample.json](assets/orca-api-requests/27_incomeinfv2_response.sample.json) | POST 収納情報。 |
| 28 `/api01rv2/systeminfv2` | [28_systeminfv2_request.json](assets/orca-api-requests/28_systeminfv2_request.json) | [28_systeminfv2_response.sample.json](assets/orca-api-requests/28_systeminfv2_response.sample.json) | POST システム情報。 |
| 29 `/orca31/hsptinfmodv2` | [29_hsptinfmodv2_request.json](assets/orca-api-requests/29_hsptinfmodv2_request.json) | [29_hsptinfmodv2_response.sample.json](assets/orca-api-requests/29_hsptinfmodv2_response.sample.json) | POST 入退院登録。 |
| 30 `/orca31/hsacctmodv2` (外泊/食事) | [30_hsacctmodv2_meal_request.json](assets/orca-api-requests/30_hsacctmodv2_meal_request.json) | [30_hsacctmodv2_meal_response.sample.json](assets/orca-api-requests/30_hsacctmodv2_meal_response.sample.json) | POST 外泊・食事登録。 |
| 31 `/orca32/hsptevalmodv2` | [31_hsptevalmodv2_request.json](assets/orca-api-requests/31_hsptevalmodv2_request.json) | [31_hsptevalmodv2_response.sample.json](assets/orca-api-requests/31_hsptevalmodv2_response.sample.json) | POST 医療区分登録。 |
| 32 `/orca101/manageusersv2` | [32_manageusersv2_request.json](assets/orca-api-requests/32_manageusersv2_request.json) | [32_manageusersv2_response.sample.json](assets/orca-api-requests/32_manageusersv2_response.sample.json) | POST ユーザー管理。 |
| 33 `/orca21/medicalsetv2` | [33_medicalsetv2_request.json](assets/orca-api-requests/33_medicalsetv2_request.json) | [33_medicalsetv2_response.sample.json](assets/orca-api-requests/33_medicalsetv2_response.sample.json) | POST 診療セット登録。 |
| 34 `/orca31/birthdeliveryv2` | [34_birthdeliveryv2_request.json](assets/orca-api-requests/34_birthdeliveryv2_request.json) | [34_birthdeliveryv2_response.sample.json](assets/orca-api-requests/34_birthdeliveryv2_response.sample.json) | POST 出産育児一時金。 |
| 35 `/api01rv2/patientlst6v2` | [35_patientlst6v2_request.json](assets/orca-api-requests/35_patientlst6v2_request.json) | [35_patientlst6v2_response.sample.json](assets/orca-api-requests/35_patientlst6v2_response.sample.json) | POST 全保険組合せ一覧。 |
| 36 `/orca22/diseasev2` | [36_diseasev2_request.json](assets/orca-api-requests/36_diseasev2_request.json) | [36_diseasev2_response.sample.json](assets/orca-api-requests/36_diseasev2_response.sample.json) | POST 患者病名登録 v2。 |
| 37 `/orca22/diseasev3` | [37_diseasev3_request.json](assets/orca-api-requests/37_diseasev3_request.json) | [37_diseasev3_response.sample.json](assets/orca-api-requests/37_diseasev3_response.sample.json) | POST 患者病名登録 v3。 |
| 38 `/orca31/hsacctmodv2` (会計作成) | [38_hsacctmodv2_create_request.json](assets/orca-api-requests/38_hsacctmodv2_create_request.json) | [38_hsacctmodv2_create_response.sample.json](assets/orca-api-requests/38_hsacctmodv2_create_response.sample.json) | POST 入院会計作成。 |
| 39 `/orca31/hspmmv2` | [39_hspmmv2_request.json](assets/orca-api-requests/39_hspmmv2_request.json) | [39_hspmmv2_response.sample.json](assets/orca-api-requests/39_hspmmv2_response.sample.json) | POST 入院会計未作成チェック。仕様未確定→[notes/orca-api-field-validation.md](../notes/orca-api-field-validation.md) |
| 40 `/orca31/hsacctmodv2` (室料差額) | [40_hsacctmodv2_roomfee_request.json](assets/orca-api-requests/40_hsacctmodv2_roomfee_request.json) | [40_hsacctmodv2_roomfee_response.sample.json](assets/orca-api-requests/40_hsacctmodv2_roomfee_response.sample.json) | POST 室料差額登録。 |
| 41 `/api01rv2/pusheventgetv2` | [41_pusheventgetv2_request.json](assets/orca-api-requests/41_pusheventgetv2_request.json) | [41_pusheventgetv2_response.sample.json](assets/orca-api-requests/41_pusheventgetv2_response.sample.json) | POST PUSH 通知取得。 |
| 42 `/orca42/receiptprintv3` | [42_receipt_printv3_request.json](assets/orca-api-requests/42_receipt_printv3_request.json) | [42_receipt_printv3_response.sample.json](assets/orca-api-requests/42_receipt_printv3_response.sample.json) | POST 帳票印刷ジョブ。 |
| 43 `/orca51/masterlastupdatev3` | [43_masterlastupdatev3_request.json](assets/orca-api-requests/43_masterlastupdatev3_request.json) | [43_masterlastupdatev3_response.sample.json](assets/orca-api-requests/43_masterlastupdatev3_response.sample.json) | POST マスタ最終更新日。 |
| 44 `/api01rv2/system01dailyv2` | [44_system01dailyv2_request.json](assets/orca-api-requests/44_system01dailyv2_request.json) | [44_system01dailyv2_response.sample.json](assets/orca-api-requests/44_system01dailyv2_response.sample.json) | POST 日次基本情報。仕様未確定→[notes/orca-api-field-validation.md](../notes/orca-api-field-validation.md) |
| 45 `/api01rv2/patientlst7v2` | [45_patientlst7v2_request.json](assets/orca-api-requests/45_patientlst7v2_request.json) | [45_patientlst7v2_response.sample.json](assets/orca-api-requests/45_patientlst7v2_response.sample.json) | POST 患者メモ取得。 |
| 46 `/api21/medicalmodv23` | [46_medicalmodv23_request.json](assets/orca-api-requests/46_medicalmodv23_request.json) | [46_medicalmodv23_response.sample.json](assets/orca-api-requests/46_medicalmodv23_response.sample.json) | POST 初診算定日登録。仕様未確定→[notes/orca-api-field-validation.md](../notes/orca-api-field-validation.md) |
| 47 `/orca36/hsfindv3` | [47_hsfindv3_request.json](assets/orca-api-requests/47_hsfindv3_request.json) | [47_hsfindv3_response.sample.json](assets/orca-api-requests/47_hsfindv3_response.sample.json) | POST 入院患者照会。 |
| 48 `/api01rv2/contraindicationcheckv2` | [48_contraindicationcheckv2_request.json](assets/orca-api-requests/48_contraindicationcheckv2_request.json) | [48_contraindicationcheckv2_response.sample.json](assets/orca-api-requests/48_contraindicationcheckv2_response.sample.json) | POST 薬剤併用禁忌チェック。 |
| 49 `/api01rv2/insuranceinf1v2` | [49_insuranceinf1v2_request.json](assets/orca-api-requests/49_insuranceinf1v2_request.json) | [49_insuranceinf1v2_response.sample.json](assets/orca-api-requests/49_insuranceinf1v2_response.sample.json) | POST 保険・公費一覧。 |
| 50 `/api01rv2/subjectiveslstv2` | [50_subjectiveslstv2_request.json](assets/orca-api-requests/50_subjectiveslstv2_request.json) | [50_subjectiveslstv2_response.sample.json](assets/orca-api-requests/50_subjectiveslstv2_response.sample.json) | POST 症状詳記取得。 |
| 51 `/api01rv2/patientlst8v2` | [51_patientlst8v2_request.json](assets/orca-api-requests/51_patientlst8v2_request.json) | [51_patientlst8v2_response.sample.json](assets/orca-api-requests/51_patientlst8v2_response.sample.json) | POST 旧姓履歴取得。 |
| 52 `/api01rv2/medicationgetv2` | [52_medicationgetv2_request.json](assets/orca-api-requests/52_medicationgetv2_request.json) | [52_medicationgetv2_response.sample.json](assets/orca-api-requests/52_medicationgetv2_response.sample.json) | POST 入力・診療コード内容取得。 |
| 53 `/orca06/patientmemomodv2` | [53_patientmemomodv2_request.json](assets/orca-api-requests/53_patientmemomodv2_request.json) | [53_patientmemomodv2_response.sample.json](assets/orca-api-requests/53_patientmemomodv2_response.sample.json) | POST 患者メモ登録/更新。仕様未確定→[notes/orca-api-field-validation.md](../notes/orca-api-field-validation.md) |

### マトリクスバリデーション

1. `npm run lint:orca-matrix`（= `node scripts/tools/orca-api-matrix-validator.js`）を実行し、Markdown のマトリクス表と `assets/orca-api-matrix.csv` の整合性を確認する。
2. スクリプトは下記を判定する。
   - 項番ごとの URL・優先度が両ファイルで一致しているか。
   - Markdown/CSV いずれも 53 件そろっているか。
   - 優先度が `P0`/`P1`/`P2` のいずれかに限定されているか。
3. 正常時は `ORCA API マトリクス検証 OK: 53 件の No/URL/優先度が一致` のメッセージとともに終了コード 0 を返す。不整合がある場合は差分を列挙して終了コード 1 を返すため、該当行の Markdown/CSV を修正して再実行する。

> **Tips**: マトリクスを更新する PR では、本検証結果と修正範囲を `docs/web-client/planning/phase2/DOC_STATUS.md` の更新コメントへ添えるとレビュアーが確認しやすい。

### マトリクス警告ルール

- `確認観点` 欄の末尾に `※タグ名` 形式で備考を付与すると、`npm run lint:orca-matrix` 実行時に WARN 扱いで一覧表示される。WARN は通知目的であり、終了コードは 0 のままなので作業を継続できる。
- タグは Runbook §5 を参照するトリガーとして扱い、警告メッセージにも `see ORCA_CONNECTIVITY_VALIDATION.md §5` が自動で付与される。警告が出た場合は該当タグの対処手順を即時確認すること。

**タグ命名規則**

1. `※` に続けて 10 文字前後の短い和文または英字句を記載する（例: `※環境設定要確認`、`※UTF-8 必須`）。
2. タグ本体には句読点を含めない。補足説明は全角/半角カッコ `（` `(` で囲み、日付や証跡リンクを併記する。
3. 複数タグが必要な場合は文章の最後にまとめて列挙し、それぞれを全角スペースで区切る。

**標準タグ一覧**

| タグ | 目的 | 参照先 |
| --- | --- | --- |
| 環境設定要確認 | ORCA 側 Reverse Proxy や Basic 認証などの環境差異で一時的に POST が拒否されている。通信経路/credential を調整してから再試行する。 | 本 Runbook §5、`operations/TEST_SERVER_DEPLOY.md` §3 |
| UTF-8 必須 | Shift_JIS で送信すると ORCA 側が `Api_Result=91` を返す API。`notes/orca-api-field-validation.md` §5 に従い UTF-8 でリクエスト/レスポンスを固定する。 | 本 Runbook §5、`notes/orca-api-field-validation.md` §5 |

**Lint 期待出力**

````text
$ npm run lint:orca-matrix
ORCA API マトリクス警告: 備考タグを検出
 - API No 3: 環境設定要確認 (see ORCA_CONNECTIVITY_VALIDATION.md §5)
 - API No 44: UTF-8 必須 (see ORCA_CONNECTIVITY_VALIDATION.md §5)
ORCA API マトリクス検証 OK: 53 件の No/URL/優先度が一致
````

WARN が出力されたら、Runbook §5 と表内リンク先の証跡を参照し、タグに応じた検証や環境設定の見直しを必ず実施する。

## 6. ログおよび Evidence ルール

1. **CLI 出力**: すべて `artifacts/orca-connectivity/<UTC>/` へ保存し、ログファイル名に API 番号または手順番号を含める（例: `05_acceptlstv2_request.json`）。
2. **テンプレ Evidence**: ひな形は `artifacts/orca-connectivity/TEMPLATE/` に配置済み。RUN_ID（例: `20251112T090000Z`）を決めたら `mkdir -p artifacts/orca-connectivity/${RUN_ID}` の後に `cp -R artifacts/orca-connectivity/TEMPLATE/ artifacts/orca-connectivity/${RUN_ID}` を実行し、`00_README.md`・`01_docker_ps.txt` などの初期ファイルをコピーしてから採取を開始する。
3. **ドキュメントリンク**: 実施結果を `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の当日項へ要約し、本ドキュメントへのアンカー（例: `operations/ORCA_CONNECTIVITY_VALIDATION.md#5-orca-api-検証マトリクス`）を追記。
4. **通知**: 失敗時は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` のエスカレーションフロー（Slack `#server-modernized-alerts` → PagerDuty）を踏襲。
5. **Archive**: 30 日以上参照しないログは `docs/archive/<YYYYQn>/orcaconnect/` へ移動し、元ログファイルにはスタブを残す。
6. **Evidence ディレクトリ名**: `artifacts/orca-connectivity/<UTC>/` 直下の Evidence は UTC タイムスタンプ（形式 `YYYYMMDDThhmmssZ`、例 `20251108T101538Z`（W18 接続確認））でディレクトリ名をそろえる。命名チェックは `node scripts/tools/orca-artifacts-namer.js [scanPath]`（引数省略時はリポジトリ標準パスを走査）で実施し、命名違反があると一覧と推奨名を表示して終了コード 1 を返す。CI/ローカル問わず Evidence 保存前に必ず実行し、0 以外の終了コードは命名の手直しや Evidence 再取得を完了させてから再度実行する。
7. **Evidence インデックス**: `assets/orca-evidence-index.md` に RUN_ID／実行日／対象 API／Evidence パス／Runbook・`PHASE2_PROGRESS.md` の行番号を一覧化した。新規採取や再取得後は該当行を追記・更新してから報告テンプレを記入する。

### テンプレ動作検証ログ（2025-11-13 UTC）
- Run ID: `20251118T120000Z`。`artifacts/orca-connectivity/TEMPLATE/` を `cp -R` でコピーし、`placeholder curl output` 行を各ファイルへ 1 行ずつ追加してダミー採取を模擬した。
- 命名検証 1 回目: `TEST_TEMPLATE_RUN` のまま `node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` を実行し、`TEST_TEMPLATE_RUN` が `NG` 判定で推奨名 `20251112T234145Z` と表示されることを確認（`TEMPLATE`/`validation` も既存例外として列挙）。
- 命名検証 2 回目: `mv artifacts/orca-connectivity/TEST_TEMPLATE_RUN artifacts/orca-connectivity/20251118T120000Z` 後に再実行し、警告が `TEMPLATE`/`validation` のみとなり対象 Evidence の違反が解消されたことを確認。
- ログ保存: 両実行の CLI 出力とタイムスタンプを `artifacts/orca-connectivity/20251118T120000Z/namer_check.log` に記録。今後は同ログを参照すればテンプレ手順を再現できる。

## 7. 後続タスク

- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ 4 の ORCA セクションへ、本タスクリストとの差分を随時反映。
- ORCA バージョン更新時は、本ドキュメント冒頭に対象バージョンと変更点を追記し、必要に応じて API マトリクスに「使用停止」「新規」フラグを追加。
- Web クライアント機能側で新たに ORCA API を利用開始した場合、`docs/web-client/guides/CLINICAL_MODULES.md` へ参照リンクを追加し、ここから逆リンクを張る。
- 検証ログを `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の [ORCA 接続検証レポートテンプレ](../PHASE2_PROGRESS.md#orca-接続検証レポートテンプレ) に沿って報告し、Runbook からの逆参照を残す。

### 報告フロー

1. 本手順に沿って API マトリクスの検証を終えたら、証跡ディレクトリと RUN_ID を整理し、テンプレの各項目（Run ID / 使用コンテナ / 確認 API 範囲 / 証跡パス / 結果サマリ）を記入する。
2. `PHASE2_PROGRESS.md` へテンプレを貼り付け、同じ段落から本ドキュメントの該当セクション（例: `#5-orca-api-検証マトリクス`）へリンクする。
3. Slack / PagerDuty 等でエスカレーションが発生した場合は、テンプレの「結果サマリ」にステータス（OK/NG）と連絡先を追記し、`operations/logs/<date>-orca-connectivity.md` からもハイパーリンクで参照できるようにする。

- Run ID → `artifacts/orca-connectivity/<UTC>/README.txt` と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の見出しが一致しているか確認（例: `RUN_ID=20251112TorcaCheckZ1`）。
- 使用コンテナ → `operations/logs/<date>-orca-connectivity.md` に貼り付けた `docker compose images` / `docker ps` の出力で `orca`, `server-modernized`, `helper` のタグがテンプレ記載と一致するか突合。
- 確認 API 範囲 → `artifacts/orca-connectivity/<UTC>/api_matrix_checklist_<RUN_ID>.md` のチェック欄とテンプレに列挙した番号が同じか確認。
- 証跡パス → `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` から `artifacts/orca-connectivity/<UTC>/` のリンクにジャンプでき、両方のパスが存在するか `ls` で確認。
- 結果サマリ → `artifacts/orca-connectivity/<UTC>/serverinfo_claim_conn_<UTC>.txt` や `orca_api_status_<RUN_ID>.json` の HTTP ステータスとテンプレの OK/NG 判定が一致するか照合。

### 担当割当チェック

1. `docs/server-modernization/phase2/PHASE2_PROGRESS.md#progress-記入テンプレート` の「担当割当早見表」から、今回の RUN_ID が対象とする優先度を決め、テンプレ内の命名規則（例: `{{YYYYMMDD}}TorcaP0OpsZ#`）に沿ってダミーではない固有 RUN_ID を採番する。報告テンプレへ貼る際も同じ文字列を使用すること。
2. API ごとの推奨担当ロールは `docs/server-modernization/phase2/operations/assets/orca-api-assignments.md` を参照する。検証対象に含めた No を抽出し、担当ロール欄に記載されているロールが PHASE2_PROGRESS で割り当てた担当者と一致しているかを突き合わせる（不足があれば当日中に再アサイン）。
3. 役割突合の結果は `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に「担当割当チェック」小項目を追加して残し、PHASE2_PROGRESS 側の同 RUN_ID 記入例にも `assignments.md` 参照リンクを明記する。
4. 後続の RUN_ID を採番する際は、同じ優先度でも担当ロールが偏らないよう assignments.md の頻度表を見ながら交代制にする。特に P1 で入院担当が不足しがちなため、前回レポートの RUN_ID で入院担当が記載されていない場合は優先的に割り当てる。
