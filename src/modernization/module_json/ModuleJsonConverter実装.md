# ModuleJsonConverter 実装

- RUN_ID: `20251214T031644Z`
- 期間: 2025-12-17 09:00 〜 2025-12-18 09:00 (JST) / 優先度: high / 緊急度: high / エージェント: claude code
- YAML ID: `src/modernization/module_json/ModuleJsonConverter実装.md`

## 目的
- module_json モダナイズでの JSON 直列化/復元を専用コンバータに集約し、beanJson 優先・beanBytes フォールバックの方針を明文化する。
- ObjectMapper に polymorphic typing を設定し、モジュール payload の型情報を保持したまま JSON 化する。

## 実装概要
- `common/src/main/java/open/dolphin/infomodel/ModuleJsonConverter.java` を新規追加。`BasicPolymorphicTypeValidator` による allow-list（open.dolphin/java.util/java.time）を設定し、DefaultTyping.NON_FINAL + PROPERTY で型情報を埋め込む。
- `serialize`：payload を JSON へ変換し、失敗時は null を返して beanBytes フォールバックを許容。Warn ログを記録。
- `deserialize`：beanJson を Object として復元。失敗時は null を返し、呼び出し側で beanBytes を利用できるようにする。
- `decode(ModuleModel)`：beanJson を優先して復元し、失敗または欠落時のみ `ModelUtils.xmlDecode(beanBytes)` にフォールバック。
- `ModelUtils.jsonEncode/jsonDecode/decodeModule` を ModuleJsonConverter 経由に差し替え、既存呼び出し側のコード改変を最小化。

## ロギング/例外方針
- JSON 変換失敗時は `warn` ログで型名とスタックトレースを残す。例外は呼び出し元へ投げず、null を返すことで既存 beanBytes 保存・復元ルートを維持。
- deserialization 失敗時も `warn` ログのみ発行し、フォールバックの利用を促す。

## 参照チェーン
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. `src/modernization/module_json/キックオフ_RUN_ID採番.md`
6. 本ドキュメント

## 証跡
- `docs/web-client/planning/phase2/logs/20251214T031644Z-module-json-converter.md`
