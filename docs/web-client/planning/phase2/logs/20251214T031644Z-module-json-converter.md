# 証跡ログ: ModuleJsonConverter 実装（RUN_ID=`20251214T031644Z`）

- 作業種別: module_json モダナイズ / ModuleJsonConverter 実装
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → `src/modernization/module_json/ModuleJsonConverter実装.md`
- 目的: beanJson 優先・beanBytes フォールバック方針をコンバータに集約し、polymorphic typing 付き ObjectMapper を構築する。

## 変更概要
- `common/src/main/java/open/dolphin/infomodel/ModuleJsonConverter.java` を新規追加。DefaultTyping.NON_FINAL + PROPERTY で型情報を埋め込み、allow-list（open.dolphin/java.util/java.time）付き PTValidator を設定。
- `ModuleJsonConverter#serialize/deserialize/decode` を実装し、失敗時は warn ログ＋null 返却で beanBytes へのフォールバックを許容。
- `common/src/main/java/open/dolphin/infomodel/ModelUtils.java` の `jsonEncode/jsonDecode/decodeModule` を ModuleJsonConverter 経由に変更し、既存呼び出し側の改修を不要化。

## ロギング/例外方針
- JSON 変換失敗時は warn ログを残し、例外はスローしない（beanBytes 継続を優先）。beanJson 復元失敗も warn のみ。

## 残タスク/確認事項
- モジュール payload 型の PTValidator allow-list 追加要否（外部ライブラリ型を含む場合の検証）。
- mvn テスト未実施。`mvn -pl server-modernized -am test` でコンパイル確認予定。

## 成果物
- `src/modernization/module_json/ModuleJsonConverter実装.md`
- `common/src/main/java/open/dolphin/infomodel/ModuleJsonConverter.java`
- `common/src/main/java/open/dolphin/infomodel/ModelUtils.java`
