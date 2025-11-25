# 添付ファイル既存スタック検証ログ (RUN_ID=20251118TattachmentDbZ2)

## 1. 実施サマリ
- RUN_ID: 20251118TattachmentDbZ2
- MODE_LABEL: database
- 参照手順: `ops/tests/storage/attachment-mode/smoke_existing_stack.sh`
- WildFly 既存スタック: (例) `server-modernized-dev`（docker 再構築なし）
- 設定投入パス: `/opt/jboss/config/attachment-storage.yaml`

## 2. 前段確認
- [x] `load_config.sh --mode database --config tmp/attachment-storage.override.yaml --target-path /opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml` を実行し、`jboss-cli :reload` で反映（`docker compose cp` が read-only volume に阻まれるため、`docker exec -u root` で chmod/chown を補完）
- [x] `source tmp/attachment-mode/minio.env` で MinIO/S3 変数を展開
- [x] `curl -sf -H userName:1.3.6.1.4.1.9414.10.1:dolphin -H password:36cdf8b887a5cffc78dcd5c08991b993 http://localhost:19080/openDolphin/resources/dolphin` に成功（port 9080 は `attachment-forward` コンテナ経由で port-forward）
- [x] 本 README と `database/` 配下のテンプレ群を生成済み

## 3. 実行ログ貼付
1. `MODE_LABEL=database`、`--use-existing`、`ATTACHMENT_MODE_PATIENT_QUERY=000` で `smoke_existing_stack.sh` を実行（SYSAD=1.3.6.1.4.1.9414.72.103:admin / DOCTOR=1.3.6.1.4.1.9414.72.103:doctor1 を再利用）。
2. `/opt/homebrew/bin/socat` と `docker run --name attachment-forward` で host→`opendolphin-server-modernized-dev:8080` を 19080 へポートフォワードし、CLI から HTTP を送出。
3. `/openDolphin/resources/karte/{patientId},{from}` 呼び出しで `org.hibernate.query.sqm.UnknownEntityException: ObservationModel` が発生し、アップロード API まで到達できずに `smoke-existing` が終了（詳細: `database/smoke-error.log`）。
4. 失敗時点の `docker compose logs` を `database/logs/*.log` へ保存し、MinIO 側のログも同梱。

```
例:
MODE_LABEL=manual \
  SYSAD_USER_NAME=... SYSAD_PASSWORD=... \
  bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh \
    --output-root artifacts/parity-manual/attachments \
    --sample-file ops/tests/storage/attachment-mode/payloads/sample-attachment.txt
```

## 4. 結果サマリ
- DB モード: **NG** - `/karte/<patientId>` 取得で Hibernate が `ObservationModel` を解決できず 500 応答（traceId=`925cddbe-2df6-49d5-8298-68f24a2c7fb7`）。患者取得までは成功したが、カルテ取得がブロッカーとなり添付アップロード/ダウンロード処理へ進めず。
- 追加メモ:
  - `load_config.sh` は `/opt/jboss/config/attachment-storage.yaml` が bind-mount されているため chmod で失敗する。`--target-path /opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml` 指定 + root での chmod/chown を併用する回避策で反映。
  - host から 9080/TCP へ直接アクセスするとレスポンスが戻らないため、`legacy-vs-modern_default` ネットワーク上に `attachment-forward` (alpine+socat) をデプロイし、`localhost:19080` → `server-modernized-dev:8080` に多段フォワードしている。

## 5. 次アクション
- [ ] `docs/server-modernization/phase2/notes/storage-mode-checklist.md` の該当セクションへ結果反映
- [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` を RUN_ID 単位で更新
- [ ] `artifacts/parity-manual/attachments/20251118TattachmentDbZ2/` へのリンクを報告チャネルへ共有
