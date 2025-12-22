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
  - `ttlSecondsForOrigin` による TTL 切替を実装済み。

## 未実施
- P99/メモリに関する実測・計測値の証跡取得。
- 大型レスポンスでのメモリフットプリント検証。

## 参照
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`
- `docs/DEVELOPMENT_STATUS.md`
