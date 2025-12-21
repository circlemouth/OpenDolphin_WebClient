# ORCA-08_前提ドキュメント整備
- 期間: 2025-12-24 10:00 - 2025-12-25 10:00 / 優先度: high / 緊急度: high
- YAML ID: `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_前提ドキュメント整備.md`

## 目的
- ORCA-08（電子点数表・診療行為区分）の実装に必要な前提資料（テーブル定義/エンドポイント/検証観点/監査要件）を先行整備する。
- Web クライアントが依存する MSW/型/計算ロジックの前提と、モダナイズ版サーバー実装の差分を一本化する。

## 前提・制約
- Phase2 文書は Legacy/Archive（参照専用）。更新対象外。
- 旧サーバー資産（`server/`）は変更禁止。
- 変更対象は Web クライアント資産と `server-modernized/` のみ。
- モダナイズ版サーバーと Web クライアントは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、認証情報はスクリプト記載のものを使用する。
- ORCA 実環境に接続する場合は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の RUN_ID ルールに従う。

## 参照リンク（現行）
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `docs/server-modernization/server-api-inventory.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/operations/debugging-outpatient-bugs.md`
- `src/server_modernized_gap_20251221/00_factcheck/現状棚卸し_ギャップ確定.md`
- `src/predeploy_readiness/02_feature_implementation/バリデーション・スキーマ整備.md`
- `src/predeploy_readiness/02_feature_implementation/エラーハンドリング・リトライ整備.md`
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
- `server-modernized/src/main/java/open/orca/rest/EtensuDao.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaTensuEntry.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaEtensuAddition.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaEtensuBundlingMember.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaEtensuCalcUnit.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaEtensuConflict.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaEtensuSpecimen.java`
- `artifacts/api-stability/20251123T130134Z/schemas/orca-master-etensu.json`
- `artifacts/api-stability/20251124T161500Z/schema-drift/README.md`
- `artifacts/api-stability/20251124T161500Z/schema-drift/templates/check_orca08_columns.sql`
- `artifacts/api-stability/20251124T130000Z/seed/templates/seed-orca08.sql`
- `artifacts/api-stability/20251124T111500Z/benchmarks/templates/README.md`

## 参照リンク（Legacy/Archive）
- `src/LEGACY:webclient_modernized_bridge/02_ORCAマスターデータギャップ報告精査.md`
- `src/LEGACY:webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md`
- `src/LEGACY:webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
- `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`
- `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`

## 作業手順書（ORCA-08 前提整備）
1. `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の ORCA-08 項目を確認し、対象エンドポイント（`/orca/tensu/etensu`）と P0/P1/P2 の優先度を整理する。
2. `OrcaMasterResource#getEtensu` の入力仕様（`keyword`/`category`/`asOf`/`tensuVersion`/`page`/`size`）とバリデーション条件を棚卸しし、UI/契約テストの期待値へ転記する。
3. `EtensuDao` のクエリ構築と詳細ロード（加算・算定単位・包括・検体・禁忌）を確認し、参照するテーブル一覧と最低限必要なカラムを整理する。
4. 電子点数表の DTO（`OrcaTensuEntry` + `OrcaEtensu*`）を確認し、Web クライアントの型/計算/監査項目と突合する。
5. `schema-drift/templates/check_orca08_columns.sql` と `seed-orca08.sql` を参照し、テーブル定義・差分検証・シード投入の想定を本ドキュメントへ反映する。
6. 監査ログ（`recordMasterAudit`）の必須項目を `web-client-api-mapping.md` と照合し、`masterType=orca08-etensu` の監査要件を明文化する。
7. ベンチマーク/性能観点（ページング/ETag/TTL）を `benchmarks/templates/README.md` から抽出し、テスト観点へ追加する。

## テーブル定義（ORCA-08 対象）
- **主テーブル**: `TBL_ETENSU_1`（電子点数表の基本情報）
- **関連テーブル**:
  - `TBL_ETENSU_2` / `TBL_ETENSU_2_JMA` / `TBL_ETENSU_2_OFF` / `TBL_ETENSU_2_SAMPLE`（包括・除外・検体）
  - `TBL_ETENSU_3_1` / `TBL_ETENSU_3_2` / `TBL_ETENSU_3_3` / `TBL_ETENSU_3_4`（禁忌・同月/同日/同一/同週）
  - `TBL_ETENSU_4`（加算グループ）
  - `TBL_ETENSU_5`（算定単位・回数）
- **代表カラム（EtensuDao の投影）**:
  - `SRYCD`（診療行為コード）
  - `kubun`/`category`/`etensuCategory`（区分/カテゴリ）
  - `name`/`tanka`/`unit`（名称/点数/単位）
  - `startDate`/`endDate`/`tensuVersion`/`chgYmd`（有効期間/改正年月）
  - `hGroup1~3`/`hTani1~3`、`nGroup`、`cKaisu`、`rDay`/`rMonth`/`rSame`/`rWeek`

## 検証観点（最小セット）
- **入力バリデーション**: `category` は 1〜2 桁数値、`asOf` は `YYYYMMDD`、`tensuVersion` は `YYYYMM`、`page/size` は正数。
- **ヒットなし/空結果**: `items` 空時の 404 と `missingMaster=true` の扱いが UI 期待と一致するか。
- **ページング**: `size` 上限 2000、`page` オフセット計算が大規模データでも破綻しないか。
- **検索条件**: `keyword`（コード/名称）・`category`・`asOf`・`tensuVersion` を組み合わせたフィルタ結果が MSW フィクスチャと整合するか。
- **詳細付与**: conflict/addition/calcUnit/bundling/specimen の関連データが `asOf` で適切に絞り込まれるか。
- **ETag/TTL**: `If-None-Match` による 304 とキャッシュ TTL が `masterType=orca08-etensu` で正しく設定されるか。

## 監査要件（最低限）
- **監査イベント**: `recordMasterAudit` が `masterType=orca08-etensu`、`apiRoute=/orca/tensu/etensu` を記録すること。
- **監査メタ**: `runId` / `traceId` / `dataSource` / `cacheHit` / `missingMaster` / `fallbackUsed` / `status` / `totalCount` を出力。
- **差分検出**: `tensuVersion` 不一致や欠損時に `validationError=true` を記録し、UI の警告バナー/トーストと連動できること。
- **秘密情報**: DB 接続情報・認証ヘッダーの値は監査/ログへ出力しない。

## 期待成果物
- ORCA-08（電子点数表）向けの前提資料（テーブル定義/エンドポイント/検証観点/監査要件）を整理した本ドキュメント。
- 実装タスクに着手できる参照リンクと確認項目の一覧。

## 非対象
- Phase2/Legacy 文書の更新。
- ORCA 実接続・Stage/Preview 実測。
- 旧サーバー（`server/`）の改修。
