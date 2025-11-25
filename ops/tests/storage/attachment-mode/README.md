# ops/tests/storage/attachment-mode

添付ファイル保存モード (DB / S3) の検証用スクリプト群。`run.sh` は docker-compose.modernized.dev.yml を利用してモダナイズ版サーバー + MinIO を起動し、以下を自動実行する。

1. SYSAD で施設管理者を登録し、医師ユーザーを追加。
2. デモ患者 (SystemServiceBean が複製した `D_0001` 系) のカルテ ID を取得。
3. サンプル添付ファイル (`payloads/sample-attachment.txt`) を `/karte/document` でアップロード。
4. `/karte/attachment/{id}` からダウンロードし、SHA-256 ハッシュで突合。
5. 結果と API レスポンス、MinIO ログ、WildFly CLI を `artifacts/parity-manual/attachments/<UTC>` に保存。

## 使い方

```bash
# 例: 2 モード連続で実行 (DB → S3)
ops/tests/storage/attachment-mode/run.sh \
  --compose-file docker-compose.modernized.dev.yml \
  --output-root artifacts/parity-manual/attachments
```

- 依存コマンド: `bash`, `curl`, `jq`, `base64`, `sha256sum` (macOS の場合は `shasum` 自動フォールバック)
- 実行後、対象アーティファクトフォルダには `database/` と `s3/` のサブディレクトリが作成され、各モードのリクエスト/レスポンス・ハッシュ・ログが格納される。
