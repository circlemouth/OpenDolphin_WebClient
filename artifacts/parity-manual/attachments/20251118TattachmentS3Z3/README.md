# 添付ファイル既存スタック検証ログ (RUN_ID=20251118TattachmentS3Z3)

## 1. 実施サマリ
- RUN_ID: 20251118TattachmentS3Z3
- MODE_LABEL: s3
- 参照手順: `ops/tests/storage/attachment-mode/smoke_existing_stack.sh`
- WildFly 既存スタック: (例) `server-modernized-dev`（docker 再構築なし）
- 設定投入パス: `/opt/jboss/config/attachment-storage.yaml`

## 2. 前段確認
- [x] `attachment-storage.s3.yaml` を `/opt/jboss/wildfly/standalone/configuration/` へコピーし、`jboss-cli :reload` で反映（docker 再起動なし）
- [ ] MinIO 用の `.env` は既に適切なアクセスキーを含むため、`tmp/attachment-mode/minio.env` は未使用（既定値のまま）
- [x] `smoke_existing_stack.sh` のヘルスチェックで `http://localhost:19080/openDolphin/resources/dolphin` が 200 であることを確認
- [x] 本 README をテンプレートから作成

## 3. 実行ログ貼付
1. `MODERNIZED_APP_HTTP_PORT=19080`、`--mode-label s3 --run-id 20251118TattachmentS3Z3 --use-existing` で `smoke_existing_stack.sh` を実行。MinIO 側は `opendolphin/opendolphin-secret` を設定済み。
2. `s3/logs/` に WildFly / MinIO / minio-mc の tail を採取し、`attachment-storage.yaml` の `type: s3` 切替後でも REST 200 を維持することを確認。
3. `s3/hashes.txt` に `source/download` とも `9a8b6e...cc5b8` を記録し、S3 経由でもバイナリ整合性がとれることを確認。

```
例:
MODE_LABEL=manual \
  SYSAD_USER_NAME=... SYSAD_PASSWORD=... \
  bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh \
    --output-root artifacts/parity-manual/attachments \
    --sample-file ops/tests/storage/attachment-mode/payloads/sample-attachment.txt
```

## 4. 結果サマリ
- DB モード: `RUN_ID=20251118TattachmentDbZ3` を参照。
- S3 モード: **OK** - `/karte/document` → `/karte/attachment/{id}` の往復で 200 を確認、MinIO 側 `server-tail.log` にアップロードキーが出力されている。
- 追加メモ: 検証完了後に `attachment-storage.database.yaml` を再配置し、WildFly を再読み込みしてデフォルト構成へ戻した。

## 5. 次アクション
- [x] `docs/server-modernization/phase2/notes/storage-mode-checklist.md` の該当セクションへ結果反映（§1/§5 を RUN_ID=`20251118Tattachment{Db,S3}Z3` に更新済み）
- [x] `docs/web-client/planning/phase2/DOC_STATUS.md` を RUN_ID 単位で更新（同行を Z3 成功に書き換え済み）
- [ ] `artifacts/parity-manual/attachments/20251118TattachmentS3Z3/` へのリンクを報告チャネルへ共有
