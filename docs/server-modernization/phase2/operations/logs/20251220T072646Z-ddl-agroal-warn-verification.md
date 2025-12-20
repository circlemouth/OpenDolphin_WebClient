# DDL 変換 WARN / Agroal クラスロード WARN 検証（RUN_ID=20251220T072646Z）

## 目的
- `d_factor2_*` / `d_stamp_tree` の型変換 WARN（OID/bytea 変換失敗）が再現しないことを確認する。
- `DatasourceMetricsRegistrar` の `AgroalDataSource` クラスロード WARN（`WELD-000119`）が再現しないことを確認する。

## 実施内容
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` でモダナイズ版サーバー + Web クライアントを起動。
- サーバー起動ログを取得し、対象 WARN の有無を検索。

## 実行コマンド（抜粋）
```bash
WEB_CLIENT_MODE=npm ./setup-modernized-env.sh

docker logs --since 10m opendolphin-server-modernized-dev > tmp/20251220T072646Z-server-modernized.log
rg -n "d_factor2|d_stamp_tree|cannot be cast automatically|WELD-000119|AgroalDataSource" tmp/20251220T072646Z-server-modernized.log
```

## ログ採取
- `tmp/20251220T072646Z-server-modernized.log`

## 検証結果
- 対象ログに以下の WARN は出力されず、再現しないことを確認。
  - `alter table if exists d_factor2_* ... set data type oid` + `cannot be cast automatically`
  - `alter table if exists d_stamp_tree ... set data type bytea` + `cannot be cast automatically`
  - `WELD-000119: Not generating any bean definitions ... AgroalDataSource` など

## 補足
- ORCA 接続情報ファイルが未配置のため、起動ログに `localhost:18080` へのフォールバック警告が出力されたが、本件の WARN とは無関係。
