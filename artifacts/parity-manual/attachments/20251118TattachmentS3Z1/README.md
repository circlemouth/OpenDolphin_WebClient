# 添付ファイル既存スタック検証ログ (RUN_ID=20251118TattachmentS3Z1)

## 1. 実施サマリ
- RUN_ID: 20251118TattachmentS3Z1
- MODE_LABEL: s3-preview
- 参照手順: `ops/tests/storage/attachment-mode/smoke_existing_stack.sh`
- WildFly 既存スタック: (例) `server-modernized-dev`（docker 再構築なし）
- 設定投入パス: `/opt/jboss/config/attachment-storage.yaml`

## 2. 前段確認
- [x] `load_config.sh --mode s3 --config tmp/attachment-storage.s3.override.yaml --no-reload --dry-run`
- [x] `tmp/attachment-mode/minio.env` を `source` し、MinIO/アクセスキー系の既定値を確認
- [ ] `curl -sf -H userName:<SYSAD> -H password:<SYSAD_MD5> http://localhost:9080/openDolphin/resources/dolphin` でヘルス確認（未実施）
- [x] `artifacts/parity-manual/attachments/20251118TattachmentS3Z1/README.md` を本テンプレで作成

## 3. 実行ログ貼付
1. `MODE_LABEL=s3-preview` で `smoke_existing_stack.sh --run-id 20251118TattachmentS3Z1 --dry-run` を実行。
2. `logs/` フォルダは `dry-run.log` のみ生成。MinIO へのアクセスは無効化。
3. `hashes/` の採取は MinIO/既存スタック稼働後に実施予定。

```
例:
MODE_LABEL=manual \
  SYSAD_USER_NAME=... SYSAD_PASSWORD=... \
  bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh \
    --output-root artifacts/parity-manual/attachments \
    --sample-file ops/tests/storage/attachment-mode/payloads/sample-attachment.txt
```

## 4. 結果サマリ
- DB モード: RUN_ID=20251118TattachmentDbZ1 を参照
- S3 モード: `DRY-RUN - MinIO シークレット整合性のみ確認し、本実行は保留`
- 追加メモ: `load_config.sh --dry-run` で WARN が出る `storage.s3.*` はテンプレ内部のコメント表記未整備に起因（今後テンプレ更新予定）。

## 5. 次アクション
- [x] `docs/server-modernization/phase2/notes/storage-mode-checklist.md` の該当セクションへ結果反映（2025-11-12）
- [x] `docs/web-client/planning/phase2/DOC_STATUS.md` を RUN_ID 単位で更新（2025-11-12）
- [ ] `artifacts/parity-manual/attachments/20251118TattachmentS3Z1/` へのリンクを報告チャネルへ共有
