# ORCA-07 JNDI DataSource 実装

## 目的
- ORCA DB 接続を JNDI DataSource に一本化し、`custom.properties` の認証情報参照を禁止する。
- 接続失敗時の挙動を明確化し、フェイルセーフに倒す。

## 実装内容
- ORCA JNDI 取得失敗時は `SQLException` をスローするように変更。
- `custom.properties` の `claim.jdbc.*` / `claim.user` / `claim.password` の読み取りをブロックし、警告ログを出力。
- 既存の `getConnection()` ラッパーを `throws SQLException` に更新。

## 変更ファイル
- `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java`
- `server-modernized/src/main/java/open/orca/rest/EtensuDao.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java`

## テスト

### 実行コマンド
```bash
mvn -pl server-modernized -Dtest=SecurityDefensiveCopyTest,LogFilterTest test
```

### 結果
- 失敗（コンパイルエラー）。本タスク起因ではない既存のコンパイルエラーを検知。

### 失敗内容（抜粋）
- `open/orca/rest/OrcaMasterResource.java`: `Response.Status.UNPROCESSABLE_ENTITY` が解決できない
- `open/orca/rest/EtensuDao.java`: `isRelated(Integer)` が static コンテキストで参照不可
- `open/dolphin/rest/StampResource.java`: `errorMessage` が未定義

## 影響範囲
- ORCA 接続失敗時に `SQLException` が呼び出し元へ伝播するため、既存の try/catch での扱いが継続される。
- `custom.properties` の認証情報キーは取得できず、空値または `null` が返る（ログで警告）。

## TODO
- 既存コンパイルエラーの整理後、対象テスト再実行。
