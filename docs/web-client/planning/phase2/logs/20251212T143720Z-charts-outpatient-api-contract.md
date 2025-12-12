# Charts 外来 API 契約テーブル確定ログ（RUN_ID=20251212T143720Z）

## 1. 目的
- ガント「[webclient charts production outpatient plan] 03_モダナイズ外来API契約テーブル確定」の成果物として、Charts が利用する外来 API の契約（呼び出し条件・ヘッダー・監査・UI 反映・再試行/ガード）を単一ソースとして固定する。
- `dataSourceTransition/cacheHit/missingMaster/fallbackUsed/traceId` を UI と auditEvent に透過させるルールを明文化し、今後の Playwright フィクスチャの基準とする。

## 2. 生成物
- 契約テーブル: `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`

## 3. 更新したハブ/台帳（RUN_ID 同期）
- `docs/web-client/README.md`
- `docs/web-client/planning/phase2/DOC_STATUS.md`

## 4. 補足（制約順守）
- Legacy 資産（`client/`, `common/`, `ext_lib/`）および `server/` 配下は変更なし。
- ORCA 実接続や証明書操作は未実施（ドキュメント更新のみ）。
