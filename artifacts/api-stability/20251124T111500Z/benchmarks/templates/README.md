# ORCA-05/06/08 ベンチ実行テンプレート（RUN_ID=20251124T120000Z）

- 参照: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §7（P99 目標・キャッシュシナリオ）。
- 含まれるもの
  - `bench.config.example.json`: ベース URL・Basic 認証・Run/Facility/User メタ・シナリオ定義。
  - `k6-orca-master.js`: k6 用テンプレ（キャッシュヒット/ミス、住所/点数表）。
  - `autocannon-orca-master.js`: autocannon 用テンプレ（CLI only）。
- 想定パスとペイロード（コメント内に明記）
  - ORCA-05: `/orca/master/{generic-class|generic-price|material|kensa-sort}` + `asOf`/`limit`/`keyword`
  - ORCA-06: `/orca/master/{hokenja|address}` + `pref`/`keyword` or `zip`
  - ORCA-08: `/orca/tensu/{ten|etensu}` + `asOf`/`tensuVersion`/`pageSize`
  - サンプルメタ: `X-Run-Id`, `X-ORCA-Facility`, `X-ORCA-User`, `Accept: application/json`

## 使い方

1. 設定をコピー
   ```bash
   cp bench.config.example.json bench.config.json
   # baseUrl/basicAuth/runId/facilityId/userId を実環境に合わせて編集
   ```
2. k6 実行（P99 閾値はスクリプト内で定義済み）
   ```bash
   k6 run k6-orca-master.js --out json=bench-result.json
   ```
3. autocannon 実行（Node >=18）
   ```bash
   node autocannon-orca-master.js > autocannon.log
   ```
4. 収集
   - `db_time_ms`, `row_count`, `payload_bytes` を k6 Trend で取得。
   - レスポンスヘッダに `X-Orca-Db-Time` / `X-Orca-Row-Count` / `X-Orca-Cache-Hit` を付与するとメトリクスと突合しやすい。
5. 保存先
   - 実測結果は `artifacts/api-stability/20251124T111500Z/benchmarks/<RUN_ID>/` 配下に RUN_ID 名で保存し、本 README からリンクする。

## チェックポイント
- キャッシュヒット: 同一 `asOf`/キーを 30 並列で投げ、P99 が目標以下かを確認。
- キャッシュミス: 未来日 `asOf` などでミスを発生させ、DB 時間と P99 を確認。
- アラート確認: P99 超過や `http_req_failed` が 1% を超える場合は §7 の閾値表に従い Warning/Critical を判定。
