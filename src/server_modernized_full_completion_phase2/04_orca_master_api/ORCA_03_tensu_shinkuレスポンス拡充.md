# ORCA-03 `/orca/tensu/shinku` レスポンス拡充（RUN_ID=20251219T133053Z）

## 概要
- `/orca/tensu/shinku` のレスポンスへ `taniname` / `ykzkbn` / `yakkakjncd` など必須列を含め、`/orca/tensu/name` と同じ情報密度で返す。
- 既存実装が条件を満たしているため、ドキュメント整備のみ実施。

## 対応内容
- 対象: `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`
- 対応:
  - `QUERY_TENSU_BY_SHINKU` が `taniname` / `ykzkbn` / `yakkakjncd` を含む 14 列を SELECT 済み。
  - `getTensutensuByShinku` で `TensuMaster` に `taniname` / `ykzkbn` / `yakkakjncd` を設定済み。

## 影響範囲
- `/orca/tensu/shinku` の検索結果でも、単位名・薬剤区分・薬価基準コードを UI に返せる。
- `/orca/tensu/name` と同じ列構成のため、クライアント側のフォールバック依存を削減できる。

## テスト
- 未実施（実装既存・ドキュメント更新のみ）。

## 証跡
- `docs/server-modernization/phase2/operations/logs/20251219T133053Z-orca-03-tensu-shinku.md`
