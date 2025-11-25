# 添付ファイル保存モード検証ログ (2025-11-08T20:54:51Z)

- 指示内容: `MODERNIZED_STORAGE_MODE=db`／`s3` の双方で `ops/tests/storage/attachment-mode/*.sh` を実行し、アップロード/ダウンロード結果と `shasum -a 256` を比較する。
- 実施状況: リポジトリ内に `ops/tests/storage/attachment-mode/` ディレクトリやスクリプトは存在せず、`rg -n "attachment-mode" -g "*"` にもヒットがなかったため実行不能。
- 追加調査: `server-modernized/config/attachment-storage.sample.yaml` 以外に `attachment-storage.yaml` を読み込むコード・設定が確認できず、`rg -n "attachment-storage"` でもドキュメント以外の参照が見つからなかった。
- 結論: 検証に必要なスクリプトと S3/MinIO 構成がレポジトリへ未コミットのため、アップロード/ダウンロード試験を開始できない。スクリプトおよび `MODERNIZED_STORAGE_MODE` 切替ロジックの提供が必要。
