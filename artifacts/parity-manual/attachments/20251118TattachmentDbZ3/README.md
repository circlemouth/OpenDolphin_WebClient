# 添付ファイル既存スタック検証ログ (RUN_ID=20251118TattachmentDbZ3)

## 1. 実施サマリ
- RUN_ID: 20251118TattachmentDbZ3
- MODE_LABEL: database
- 参照手順: `ops/tests/storage/attachment-mode/smoke_existing_stack.sh`
- WildFly 既存スタック: (例) `server-modernized-dev`（docker 再構築なし）
- 設定投入パス: `/opt/jboss/config/attachment-storage.yaml`

## 2. 前段確認
- [x] 既存スタックは database モードで稼働済み（`attachment-storage.yaml` の書き戻しを確認済みにつき `load_config.sh` 実行は不要）
- [ ] DB モードのため MinIO シークレット展開は不要（`tmp/attachment-mode/minio.env` 未使用）
- [x] `smoke_existing_stack.sh` 内の `enforce_health` により `http://localhost:19080/openDolphin/resources/dolphin` へ SYSAD ヘルスチェックを実施
- [x] 本 README をテンプレートから作成

## 3. 実行ログ貼付
1. `MODERNIZED_APP_HTTP_PORT=19080` と既存施設アカウント (`1.3.6.1.4.1.9414.72.103:{admin,doctor1}`) を環境変数で指定し、`bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh --mode-label database --run-id 20251118TattachmentDbZ3 --use-existing` を実行。
2. `database/logs/` に WildFly / MinIO tail（400 行）を採取。`attachment-forward` 経由で HTTP 200 を確認。
3. `database/hashes.txt` へアップロード元とダウンロード結果の SHA-256 を記録し、`source/download` いずれも `9a8b6e...cc5b8` で一致することを確認。

```
例:
MODE_LABEL=manual \
  SYSAD_USER_NAME=... SYSAD_PASSWORD=... \
  bash ops/tests/storage/attachment-mode/smoke_existing_stack.sh \
    --output-root artifacts/parity-manual/attachments \
    --sample-file ops/tests/storage/attachment-mode/payloads/sample-attachment.txt
```

## 4. 結果サマリ
- DB モード: **OK** - `/karte/document` → `/karte/attachment/{id}` の往復で 200 を確認し、添付 SHA-256 が一致。証跡: `database/{document_request,document_response,attachment_response}.json`。
- S3 モード: `RUN_ID=20251118TattachmentS3Z3` を参照。
- 追加メモ: 途中失敗した試行は `database_failed_attempt{1,2}/` に保管（ObservationModel 未マッピング／ヘッダー認証ミスマッチによる 500/401 発生ログ）。

## 5. 次アクション
- [x] `docs/server-modernization/phase2/notes/storage-mode-checklist.md` の該当セクションへ結果反映（§1/§5 を RUN_ID=`20251118Tattachment{Db,S3}Z3` に更新済み）
- [x] `docs/web-client/planning/phase2/DOC_STATUS.md` を RUN_ID 単位で更新（同行を Z3 成功に書き換え済み）
- [ ] `artifacts/parity-manual/attachments/20251118TattachmentDbZ3/` へのリンクを報告チャネルへ共有
