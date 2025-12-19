# ORCA-03 `/orca/tensu/shinku` レスポンス拡充（RUN_ID=20251219T133053Z）

## 目的
- `/orca/tensu/shinku` のレスポンスに `taniname` / `ykzkbn` / `yakkakjncd` など必須列を含め、`/orca/tensu/name` と同等の情報を返す。

## 実施内容
- 現行実装の `QUERY_TENSU_BY_SHINKU` と `TensuMaster` へのマッピングが、`taniname` / `ykzkbn` / `yakkakjncd` を含む 14 列構成になっていることを確認。
- 既存実装で対応済みのためコード変更はなし。対応完了の証跡としてドキュメントを整備。

## 対象ファイル
- `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`

## レスポンス拡充対象
- `taniname`（単位名）
- `ykzkbn`（薬剤区分）
- `yakkakjncd`（薬価基準コード）
- `yukostymd` / `yukoedymd`（有効期間）

## テスト
- 未実施（実装既存・ドキュメント更新のみ）。

## 証跡
- `src/server_modernized_full_completion_phase2/04_orca_master_api/ORCA_03_tensu_shinkuレスポンス拡充.md`
