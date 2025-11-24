# ORCA-05/06/08 シードテンプレート (RUN_ID=20251124T130000Z, 親=20251124T000000Z)

目的: ORCA-05/06/08 結合テスト用の最小マスタを CI/ローカルに投入するための SQL/CSV 雛形を提供する。実データ作成時は本 RUN_ID をファイル名とコメントに必ず付与する。

## ディレクトリ構成
- `seed-orca05.sql` : 薬剤分類/最低薬価/用法/特材/検査分類の INSERT 雛形
- `seed-orca06.sql` : 保険者/住所の INSERT 雛形
- `seed-orca08.sql` : 電子点数表 (TBL_ETENSU_1) の INSERT 雛形
- `seed-orca05.csv` : CSV 例（generic-price 用）

## ローカル ORMaster への投入
```bash
psql -h 127.0.0.1 -U ormaster -d ormaster -f seed-orca05.sql
psql -h 127.0.0.1 -U ormaster -d ormaster -f seed-orca06.sql
psql -h 127.0.0.1 -U ormaster -d ormaster -f seed-orca08.sql
```
- `PGPASSWORD` は環境変数で渡すこと。実行ログに RUN_ID を含めて保存する。

## docker-compose 環境 (サービス名例: `orca-db`)
```bash
docker cp seed-orca05.sql orca-db:/tmp/
docker cp seed-orca06.sql orca-db:/tmp/
docker cp seed-orca08.sql orca-db:/tmp/
docker exec -i orca-db psql -U ormaster -d ormaster -f /tmp/seed-orca05.sql
docker exec -i orca-db psql -U ormaster -d ormaster -f /tmp/seed-orca06.sql
docker exec -i orca-db psql -U ormaster -d ormaster -f /tmp/seed-orca08.sql
```
- 投入後に件数確認: `docker exec -i orca-db psql -U ormaster -d ormaster -c "SELECT COUNT(*) FROM TBL_GENERIC_PRICE;"`

## CI 想定コマンド例 (GitHub Actions ステップ)
```bash
psql -v ON_ERROR_STOP=1 -U ormaster -d ormaster -f artifacts/api-stability/20251124T130000Z/seed/templates/seed-orca05.sql
psql -v ON_ERROR_STOP=1 -U ormaster -d ormaster -f artifacts/api-stability/20251124T130000Z/seed/templates/seed-orca06.sql
psql -v ON_ERROR_STOP=1 -U ormaster -d ormaster -f artifacts/api-stability/20251124T130000Z/seed/templates/seed-orca08.sql
```
- CI では `
set -euo pipefail` を推奨。投入前後で件数差分をログ出力し、`docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` にリンクする。

## 生成ルール
- 文字コード UTF-8, 改行 LF。
- 数値/日付フォーマットは ORCA DB 定義書 (YYYYMMDD) に合わせる。
- 監査目的で `-- RUN_ID=20251124T130000Z` コメントを各ファイル先頭に残す。
- Python スクリプト生成は禁止。必要な場合はシェル/Node で行う。
