# 添付ファイル既存スタック検証ログ (RUN_ID=20251118TattachmentS3Z2)

## 1. 実施サマリ
- RUN_ID: 20251118TattachmentS3Z2
- MODE_LABEL: s3
- 参照手順: `ops/tests/storage/attachment-mode/smoke_existing_stack.sh`
- WildFly 既存スタック: (例) `server-modernized-dev`（docker 再構築なし）
- 設定投入パス: `/opt/jboss/config/attachment-storage.yaml`

## 2. 前段確認
- [x] `load_config.sh --mode s3 --config tmp/attachment-storage.s3.override.yaml --target-path /opt/jboss/wildfly/standalone/configuration/attachment-storage.yaml` を実行し、`docker exec -u root` で chmod/chown → `jboss-cli :reload`
- [x] `source tmp/attachment-mode/minio.env` 済み（MinIO エンドポイント/アクセスキーも export）
- [x] `curl -sf -H userName:1.3.6.1.4.1.9414.10.1:dolphin -H password:36cdf8b887a5cffc78dcd5c08991b993 http://localhost:19080/openDolphin/resources/dolphin`
- [x] 本 README と `s3/` 配下テンプレ生成済み

## 3. 実行ログ貼付
1. `MODE_LABEL=s3`、`--use-existing`、`ATTACHMENT_MODE_PATIENT_QUERY=000` で `smoke_existing_stack.sh` を実行（DB モードと同じ既存ユーザーセット）。
2. 既存フォワーダー (`attachment-forward`) 経由で `localhost:19080` → `server-modernized-dev:8080` に HTTP を送出。
3. `/karte/{patientId}` 呼び出しで DB モードと同一の `ObservationModel` 例外が再発し、アップロード処理開始前に終了（`s3/smoke-error.log`）。
4. `s3/logs/*.log` に `docker compose logs` を保存し、MinIO 側ログで S3 認証エラーが無いことを確認。

```
例:
MODE_LABEL=manual \
  SYSAD_USER_NAME=... SYSAD_PASSWORD=... \
  bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh \
    --output-root artifacts/parity-manual/attachments \
    --sample-file ops/tests/storage/attachment-mode/payloads/sample-attachment.txt
```

## 4. 結果サマリ
- S3 モード: **NG** - `/openDolphin/resources/karte/2,2000-01-01%2000:00:00` が `ObservationModel` 未マップで 500（traceId=`2315b9df-c71d-47e8-968f-ab997a345804`）。MinIO 側にはアクセスが来ておらず、アプリ層のカルテ取得が根本ブロッカー。
- 追加メモ:
  - `load_config.sh` 実行時の `storage.s3.*` WARN はテンプレ内で `${FACILITY_ID}` などが残っていることが原因。今回は WARN を許容し、MinIO 側は `docker compose logs minio` でエラーが無いことのみ確認。

## 5. 次アクション
- [ ] `docs/server-modernization/phase2/notes/storage-mode-checklist.md` の該当セクションへ結果反映
- [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` を RUN_ID 単位で更新
- [ ] `artifacts/parity-manual/attachments/20251118TattachmentS3Z2/` へのリンクを報告チャネルへ共有
