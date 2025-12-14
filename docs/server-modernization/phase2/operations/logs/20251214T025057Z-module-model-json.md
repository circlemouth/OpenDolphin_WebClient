# RUN_ID: 20251214T025057Z
## 概要
- ModuleModel の JSON 併用永続化対応（beanJson 追加、beanBytes nullable）を実装。デコード経路のフォールバックと警告ログを整理。
- Flyway マイグレーション `V0229__module_model_json_column.sql` を追加し、`beanBytes` の NULL 許容と `beanJson` 列を新設。

## 変更ファイル（主なもの）
- `common/src/main/java/open/dolphin/infomodel/ModuleModel.java`：beanJson 追加、Hibernate 型指定、clone で beanJson をコピー。
- `common/src/main/java/open/dolphin/infomodel/ModelUtils.java`：jsonEncode/jsonDecode/decodeModule で JSON→XML フォールバックと WARN ログを実装。
- `common/src/main/java/open/dolphin/converter/ModuleModelConverter.java`：beanJson getter 追加。
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`：decodeBundle を decodeModule 呼び出しに置き換え。
- `server-modernized/src/main/java/open/dolphin/*/converter/*`：モジュール保存時に beanJson へ JSON シリアライズを追加（既存 beanBytes と併存）。
- `server-modernized/tools/flyway/sql/V0229__module_model_json_column.sql`：DDL 追加。

## テスト
- 未実施（コンパイル/UT なし）。今後 `mvn -pl server-modernized -am test` で確認予定。

## 備考
- JSON 生成失敗時は beanJson を null にし、既存の XML(beanBytes) 保存を継続する設計。
- JSON デコード失敗時は WARN を出し XML にフォールバック。JSON/バイト列の型は Postgres 方言（bytea/text）想定で columnDefinition を明示。
