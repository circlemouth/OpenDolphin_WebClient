# PHR_ヘッダー_監査ID整備
- 期間: 2025-12-24 13:00 - 2025-12-26 13:00 / 優先度: high / 緊急度: high
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_ヘッダー_監査ID整備.md`

## 目的
- X-Facility-Id / X-Trace-Id の必須化と不一致時の失敗監査を統一する。
- PHR の 4xx/5xx を監査へ反映し、エラーレスポンス形式を維持する。

## 対応内容
- PHR: ヘッダー必須化
  - `PHRResource` で `X-Facility-Id` / `X-Trace-Id` の必須チェックと施設ID不一致の 403 化。
  - 不足/不一致は `PHR_*` のアクション名で失敗監査を記録。
- PHR: 4xx/5xx 監査
  - パラメータ不正/署名パラメータ不足などの 4xx を失敗監査に記録。
  - `error.phr.*` の JSON エラー形式は維持。

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
- `server-modernized/src/test/java/open/dolphin/rest/PHRResourceTest.java`

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- ORCA 実環境接続や Stage/Preview 実測は本タスクで未実施。
