# 添付ファイル既存スタック検証ログ (RUN_ID=20251118TattachmentDbZ1)

## 1. 実施サマリ
- RUN_ID: 20251118TattachmentDbZ1
- MODE_LABEL: database-preview
- 参照手順: `ops/tests/storage/attachment-mode/smoke_existing_stack.sh`
- WildFly 既存スタック: (例) `server-modernized-dev`（docker 再構築なし）
- 設定投入パス: `/opt/jboss/config/attachment-storage.yaml`

## 2. 前段確認
- [x] `load_config.sh --mode database --config tmp/attachment-storage.override.yaml --no-reload --dry-run`
- [x] `tmp/attachment-mode/minio.env` を `minio.env.example` から複製し、主要変数を `source` して確認
- [ ] `curl -sf -H userName:<SYSAD> -H password:<SYSAD_MD5> http://localhost:9080/openDolphin/resources/dolphin` でヘルス確認（既存スタック停止中のため保留）
- [x] `artifacts/parity-manual/attachments/20251118TattachmentDbZ1/README.md` を本テンプレで作成

## 3. 実行ログ貼付
1. `MODE_LABEL=database-preview` で `smoke_existing_stack.sh --run-id 20251118TattachmentDbZ1 --dry-run` を実行。
2. `logs/` フォルダは `dry-run.log` のみ生成。HTTP 実リクエストと docker compose logs はスタック未起動のため未取得。
3. `hashes/` の検証は本実行待ち。README に手順のみ保持。

```
例:
MODE_LABEL=manual \
  SYSAD_USER_NAME=... SYSAD_PASSWORD=... \
  bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh \
    --output-root artifacts/parity-manual/attachments \
    --sample-file ops/tests/storage/attachment-mode/payloads/sample-attachment.txt
```

## 4. 結果サマリ
- DB モード: `DRY-RUN - server-modernized-dev が停止中のため HTTP 実行待ち`
- S3 モード: 未試行（別 RUN_ID=20251118TattachmentS3Z1 で dry-run 済み）
- 追加メモ: WildFly/MinIO の再起動禁止ポリシーにより CLI smoke はテンプレ生成のみ。

## 5. 次アクション
- [x] `docs/server-modernization/phase2/notes/storage-mode-checklist.md` の該当セクションへ結果反映（2025-11-12）
- [x] `docs/web-client/planning/phase2/DOC_STATUS.md` を RUN_ID 単位で更新（2025-11-12）
- [ ] `artifacts/parity-manual/attachments/20251118TattachmentDbZ1/` へのリンクを報告チャネルへ共有
