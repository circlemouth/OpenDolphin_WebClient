# ORCA-05/06/08 ロールバック／データクリーンアップ手順ドラフト（RUN_ID=20251124T160000Z, 親=20251124T000000Z）

目的: ORCA マスターブリッジ（ORCA-05/06/08）のシード投入・キャッシュ更新が失敗した場合に、即時復旧と監査整合性を確保するためのロールバック手順を整理する。対象は web クライアント側の運用であり、server/ 配下の変更は行わない。

## 0. 参照と配置
- テンプレート: `artifacts/api-stability/20251124T160000Z/rollback/templates/`
  - `cleanup-orca05.sql` / `cleanup-orca06.sql` / `cleanup-orca08.sql`
  - `flush-cache.sh`
  - README/順序: `artifacts/api-stability/20251124T160000Z/rollback/README.md`
- 参考計画: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
- OpenAPI/seed 由来: `docs/server-modernization/phase2/operations/assets/openapi/README.md`, `docs/server-modernization/phase2/operations/assets/orca-db-schema/seed-plan/orca-master-seed-plan.md`

## 1. 全体フロー（時系列）
1) 失敗検知: CI/監視/Grafana で異常（HTTP 5xx・ハッシュ差分・件数欠落）を検知したら RUN_ID=20251124T160000Z を発行。
2) フラグ OFF: `.env.local` または環境変数で `WEB_ORCA_MASTER_SOURCE=mock` に戻し、MSW を有効化。CI では `export WEB_ORCA_MASTER_SOURCE=mock; VITE_DISABLE_MSW=0` を明示。
3) キャッシュ無効化: `DRY_RUN=1` で `flush-cache.sh` を確認後実行し、Redis の ORCA マスター系キーと dataSourceTransition ログを削除。
4) seed 削除/リストア: psql で該当テンプレート（ORCA05/06/08）を実行。削除対象は seed タグ（例 `seed-run-20251124T130000Z`）や `tensu_version` で限定。
5) 監査ギャップ確認: `/orca/master/*` の件数取得または `SELECT count(*)` で空データを確認し、監査ログで `missingMaster=true` / `fallbackUsed=true` が送出されることを確認。
6) MSW 戻し: MSW フィクスチャをデフォルトに戻し、必要なら `npm run test -- orca-master` を再実行。feature flag を `snapshot`/`server` へ戻すのは検証完了後。
7) 記録: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` に RUN_ID で結果を追記し、`docs/web-client/planning/phase2/DOC_STATUS.md` 備考を同日更新。

## 2. 即時実行版（開発/手動）
- 前提: mac-dev ORCA・Redis へ直接アクセス可能、Python 不使用。
- 手順:
  1. フラグ OFF & MSW 有効化
     ```bash
     export WEB_ORCA_MASTER_SOURCE=mock
     export VITE_DISABLE_MSW=0
     ```
  2. キャッシュ無効化（Dry-run → 実行）
     ```bash
     cd artifacts/api-stability/20251124T160000Z/rollback/templates
     DRY_RUN=1 ./flush-cache.sh
     REDIS_URL=redis://127.0.0.1:6379 ./flush-cache.sh
     ```
  3. seed 削除（例: ORCA-05）
     ```bash
     psql "postgresql://ormaster:***@127.0.0.1:5432/ormaster" \
       -v run_id_tag="seed-run-20251124T130000Z" \
       -f cleanup-orca05.sql
     ```
     ORCA-06/08 も同様に `cleanup-orca06.sql` / `cleanup-orca08.sql` を実行。
  4. 確認: `SELECT count(*) FROM TBL_GENERIC_PRICE;` などで空/件数戻りを確認。UI 側は MSW で最低限のデータが表示され、監査ログで `missingMaster=true` が出力されることを確認。

## 3. CI/本番用（慎重手順）
- 原則: 事前バックアップ必須、トランザクション内で限定削除、ON_ERROR_STOP 有効。
- 実行例:
  ```bash
  # 1) フラグ OFF（デプロイ変数）
  export WEB_ORCA_MASTER_SOURCE=mock
  export VITE_DISABLE_MSW=0

  # 2) キャッシュ削除（Dry-run → 実行）
  cd artifacts/api-stability/20251124T160000Z/rollback/templates
  DRY_RUN=1 REDIS_URL="$REDIS_URL" ./flush-cache.sh
  DRY_RUN=0 REDIS_URL="$REDIS_URL" ./flush-cache.sh

  # 3) seed 削除（psql, ON_ERROR_STOP）
  psql "$ORCA_DB_URL" --set=ON_ERROR_STOP=on \
    -v run_id_tag="seed-run-20251124T130000Z" \
    -v zip_tag="1000001" \
    -v tensu_version="202404" \
    -f cleanup-orca05.sql
  psql "$ORCA_DB_URL" --set=ON_ERROR_STOP=on -v run_id_tag="seed-run-20251124T130000Z" -v zip_tag="1000001" -f cleanup-orca06.sql
  psql "$ORCA_DB_URL" --set=ON_ERROR_STOP=on -v run_id_tag="seed-run-20251124T130000Z" -v tensu_version="202404" -f cleanup-orca08.sql
  ```
- 検証: `/orca/master/*` の API をヘルスチェック用リクエストで確認し、件数 0 または期待件数に戻ったことを Grafana/監査ログで確認。
- 再投入が必要な場合は `seed-plan/orca-master-seed-plan.md` の順序に従い、ロールバック RUN_ID をログに残してから再シードする。

## 4. 監査整合性チェック
- 目的: ロールバック後に UI/監査の欠損状態を明示し、意図しない残存データを検出する。
- チェック項目:
  - `dataSourceTransition`: `mock|snapshot` へ戻ったイベントが記録されること。
  - `missingMaster` / `fallbackUsed`: ロールバック直後の取得で true になること。
  - `cacheHit`: キャッシュ削除直後は false になり、再取得で true へ戻ること。
  - ハッシュ: `artifacts/api-stability/20251124T000000Z/master-sync/*/hashes/msw/*.hash` との差分がないことを確認。
- ログ保存先: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#run-20251124t160000z-rollback`（本 RUN で追記）。

## 5. 既知の注意点
- Redis の `FLUSHALL` は禁止。必ずパターン削除かキー指定で行う。
- 住所/保険者テーブルは外部参照が多いため、削除後に参照整合性エラーが出た場合はトランザクションをロールバックし、タグ条件を再確認する。
- UI キャッシュ（ブラウザ/React Query）は TTL=5 分のため、即時反映にはリロードまたは TTL 超過を待つ。
- Python スクリプトでの操作は不可。SQL とシェルのみを使用する。

## 6. TODO（今後の拡張）
- CI ジョブ: `verify-msw-fixtures` にロールバックステップを組み込み、ハッシュ差分検知で自動実行するかを検討。
- 自動バックアップ: seed 実行直前の pg_dump / Redis RDB スナップショットを自動取得するオプションを追加予定。
