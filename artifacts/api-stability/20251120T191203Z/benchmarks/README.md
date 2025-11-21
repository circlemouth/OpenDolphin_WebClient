# Benchmarks (RUN_ID=20251120T191203Z)

計測は `ops/tools/send_parallel_request.sh` を利用し、`PARITY_OUTPUT_DIR=artifacts/api-stability/20251120T191203Z/benchmarks` へ保存する前提。今回は `BASE_URL_MODERN=http://localhost:9080/openDolphin/resources --profile modernized-dev --targets modern --loop 3 --loop-sleep 0.2 --run-id 20251120T191203Z`、ヘッダー `tmp/parity-headers/api_stability_20251120T191203Z.headers`（Basic + MD5 パスワード）で実行。`tmp/api-stability-seed.sql` を modernized/ORCA 双方の DB へ流した後に **`docker restart opendolphin-server-modernized-dev`** を掛け、起動時の `ChartEventServiceBean.initializePvtList` で seed 済み PVT をメモリに取り込ませてから計測した（起動後に seed を流すと pvtList キャッシュが空のまま残り、`{"list":null}` になるため必ず「seed → 再起動（または `/pvt2` POST でウォームアップ）」の順序で実施）。`docker compose -f docker-compose.modernized.dev.yml up -d` は既存 `opendolphin-minio` とコンテナ名衝突するため未使用。

## 計測パラメータ
- プロファイル: `--profile modernized-dev`（送信先: `BASE_URL_MODERN=http://localhost:9080/openDolphin/resources`）
- ループ: `--loop 3 --loop-sleep 0.2`（targets=modern）
- トレース: `--run-id 20251120T191203Z`
- ヘッダー: `tmp/parity-headers/api_stability_20251120T191203Z.headers`（`userName=1.3.6.1.4.1.9414.72.103:doctor1` / `password=MD5(doctor2025)` / Basic=`MS4z...` / `X-Trace-Id=api-stability-20251120T191203Z`）
- 事前準備:
  - `docker exec ... psql -d opendolphin_modern < tmp/api-stability-seed.sql`（facility/user/patient/karte/doc/pvt + doc module、PVT 日付を UTC 今日に更新、tensu stub/tbl_syskanri/tbl_dbkanri/tbl_genericname を作成）。
  - ORCA 接続先 DB（`claim.jdbc.url` = `jdbc:postgresql://db:5432/opendolphin`）にも同じ stub テーブル/データを投入。
  - **seed 反映後に modernized サーバーを再起動** し、起動直後の `GET /pvt2/pvtList` が list 付きで返ることを確認してから計測。

## 結果サマリ（modernized-dev, RUN_ID=20251120T191203Z, loop=3）
| 領域 | エンドポイント | ステータス / 中央値 / 90p | ペイロードメモ |
| --- | --- | --- | --- |
| Charts | `GET /karte/docinfo/1012,2024-01-01%2000:00:00,true` | 200 / 13.2ms / 50.9ms | seed 文書 1 件を返却（docPk=1013/title=API Seed Progress Note）。`from` は `yyyy-MM-dd HH:mm:ss` 形式必須で、初回のみ 50ms 台のウォームアップ。 |
| Reception | `GET /pvt2/pvtList` | 200 / 5.0ms / 5.1ms | `list[1]` を返却（pvtPk=1014, pvtDate=`2025-11-21T07:07:09Z`, state=2, memo=`api stability seed`, patientId=`0000001`）。 |
| Administration | `GET /user/1.3.6.1.4.1.9414.72.103:doctor1` | 200 / 10.2ms / 21.5ms | roles 配列に `doctor` を返却。 |
| ORCA wrapper | `GET /orca/tensu/name/プロパネコール,20240401,true/` | 200 / 11.6ms / 66.6ms | stub 行（srycd=110001110, ten=120, yakkakjncd=1234567890）を返却。初回のみ 60ms 台。 |

## 備考
- docinfo/tensu/user は 200 で応答（初回のみ 20〜70ms、2 回目以降は 10ms 前後）。pvtList は list 返却を確認済み。
- PVT は seed→再起動の順にすると list が初回から返却される。起動後に seed を流した場合は `ChartEventServiceBean.initializePvtList` のキャッシュが空のまま残るため、再起動を挟むか `/pvt2` POST（ウォームアップ）で明示的に追加する。再計測・自動化時はスクリプトに「seed投入 → 再起動 or `/pvt2` POST」順序を組み込むこと。
- 証跡: `artifacts/api-stability/20251120T191203Z/benchmarks/reception_pvtlist_loop001/modern/response.json` / `meta.json`（他の loop=002/003 も同ディレクトリに保存）。
