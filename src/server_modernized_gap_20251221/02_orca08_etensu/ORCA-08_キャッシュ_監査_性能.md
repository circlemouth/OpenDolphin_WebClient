# ORCA-08 キャッシュ/監査/性能
- 期間: 2025-12-30 09:00 - 2025-12-31 09:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`

## 目的
- ORCA-08 (ETENSU) 応答の ETag/TTL/監査メタを本番仕様に合わせる。
- 大型レスポンス時の性能劣化を抑止するための設計と計測ポイントを整理する。

## 実装状況
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
  - ETag 生成・`Cache-Control` ヘッダー・`stale-while-revalidate` 設定を実装済み。
  - `/orca/tensu/etensu` の監査イベント記録（`recordMasterAudit`）を実装済み。
  - TTL は `address/hokenja=7日`, それ以外 `5分` の方針で実装済み。
  - 監査メタに `status` / `traceId` / `totalCount` / `rowCount` / `dbTimeMs` / `loadFailed` を追加。
  - `size` 上限 2000 を DB 取得前に適用し、監査メタの `size` にも反映。
  - バリデーションエラー (422) 時の監査記録を追加（`validationError`/`errorCode` を details に出力）。
  - ETENSU 応答に `X-Orca-Db-Time` / `X-Orca-Row-Count` / `X-Orca-Total-Count` / `X-Orca-Cache-Hit` を付与。
- `server-modernized/src/main/java/open/orca/rest/EtensuDao.java`
  - 取得結果の `dbTimeMs` を集計し、監査/ヘッダ連携へ渡す。
  - 大量データ時のメモリ負荷を抑えるため、コレクション初期容量を調整。

## 未実施
- P99/メモリに関する実測・計測値の証跡取得。
- 大型レスポンスでのメモリフットプリント検証。

## 参照
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`
- `docs/DEVELOPMENT_STATUS.md`
