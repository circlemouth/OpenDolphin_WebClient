# ORCA-08 ETENSU DAO 実装

- 状態: 完了
- 根拠: `server-modernized/src/main/java/open/orca/rest/EtensuDao.java`

## 実装内容（要点）
- `TBL_ETENSU_1` を起点に検索・ページング・バージョン絞り込みを実装。
- `TBL_ETENSU_1~5` の詳細を結合し、背反/加算/算定単位の情報を組み立てる。
- `EtensuSearchResult` で `items/totalCount/tensuVersion` を返却。

## 実装箇所
- `server-modernized/src/main/java/open/orca/rest/EtensuDao.java`
  - `search`: 検索条件の組み立て、総件数取得、詳細取得を実行。
  - `fetchRecords`: 基本項目取得（区分/名称/単価/単位/適用期間/点数表バージョン）。
  - `populateDetails`: 背反/加算/算定単位など詳細情報を補完。

## 補足
- 本ドキュメントはガント上の成果物整備を目的とした記録。
