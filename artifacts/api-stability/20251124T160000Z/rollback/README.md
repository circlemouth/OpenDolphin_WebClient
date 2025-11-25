# ORCA-05/06/08 ロールバック・クリーンアップ手順テンプレ (RUN_ID=20251124T160000Z)

目的: ORCA-05/06/08 のシード投入後に障害/検証失敗が発生した際、データ・キャッシュ・フラグを安全に巻き戻すためのテンプレートをまとめる。親 RUN_ID=20251124T000000Z。

## 適用順序
1. **事前確認**
   - DB/キャッシュのバックアップ: `psql -c "SELECT current_database(), now();"` で接続確認、直近バックアップの有無を運用表で確認。
   - ロック有無: `ps -ef | grep psql` / `SELECT * FROM pg_locks WHERE relation::regclass::text LIKE 'tbl_%';` で長期ロックを確認。
   - 対象 RUN_ID/タグ: seed 付与タグ（例: `seed-run-20251124T130000Z`）を控える。
2. **フラグ OFF**: web-client feature flag `WEB_ORCA_MASTER_SOURCE` を `mock` に設定し、MSW を再有効化（必要なら `.env.local` / Launch 設定を切替）。
3. **キャッシュ無効化**: `templates/flush-cache.sh` を DRY_RUN=1 で確認 → 実行。Redis FLUSHALL は禁止。
4. **シード削除**: psql で対象テンプレートを実行。
   - ORCA-05: `templates/cleanup-orca05.sql`
   - ORCA-06: `templates/cleanup-orca06.sql`
   - ORCA-08: `templates/cleanup-orca08.sql`
5. **監査ギャップ確認**: `SELECT count(*)` と API `/orca/master/*` の件数を再取得し、監査ログの `missingMaster/fallbackUsed` が想定通り true になることを確認。
6. **MSW 戻し**: MSW フィクスチャを再度デフォルトにし、`VITE_DISABLE_MSW` を外す。必要なら `npm run test -- orca-master` を再実行。
7. **ログ/報告**: RUN_ID=20251124T160000Z で `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md` へ結果を追記し、DOC_STATUS 備考を同期。

## 事前チェックリスト
- [ ] 対象 RUN_ID の seed/tag が一意に識別できること。
- [ ] バックアップ/スナップショットが直近に存在すること。
- [ ] 長期ロックやバッチが走っていないこと。
- [ ] Redis/アプリキャッシュの鍵パターンを確認済み。
- [ ] ON_ERROR_STOP が有効であることを psql で確認。

## ファイル一覧
- `templates/cleanup-orca05.sql` : 薬剤分類/最低薬価/用法/特材/検査分類削除。
- `templates/cleanup-orca06.sql` : 保険者・住所削除。
- `templates/cleanup-orca08.sql` : 電子点数表削除。
- `templates/flush-cache.sh` : Redis/feature flag 無効化用シェル。

## 所要時間目安
- フラグ OFF + キャッシュ無効化: 3〜5 分（Redis 規模に依存）
- シード削除 (psql): 5〜10 分（テーブル件数/インデックスに依存）
- 検証・ログ更新: 10 分

## ロールバック失敗時の対応
- DELETE が 0 件の場合はタグ/条件ミスを疑い、Dry-run SELECT を再実行。
- ロックで進まない場合は待機またはアラート解除後に再試行。緊急時のみ `pg_terminate_backend` を検討（本テンプレでは実行しない）。
- キャッシュ削除後も UI が旧データを表示する場合、ブラウザキャッシュ/React Query の TTL（5 分）経過を待つか、UI 再起動を案内。
