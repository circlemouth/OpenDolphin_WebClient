# ModuleJsonConverter 型情報フォールバック

- RUN_ID: `20251214T132418Z`
- 期間: 2025-12-15 12:00 〜 2025-12-17 12:00 (JST) / 優先度: medium / 緊急度: high / エージェント: codex
- 親 RUN_ID: `20251214T022944Z`（module_json ガント起点）
- YAML ID: `src/modernization/module_json/ModuleJsonConverter型情報フォールバック.md`

## 目的
- `@class` なしの beanJson で WARN となる経路を整理し、WARN を出さずに復元できるフォールバックを実装する。
- UI 側で polymorphic 型情報を付与する方針と、サーバー側での型情報フォールバックを比較・整備する。
- WARN なしで round-trip する回帰テストを追加し、beanJson 優先/beanBytes フォールバックの互換性を担保する。

## 参照チェーン
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. `src/modernization/module_json/キックオフ_RUN_ID採番.md`
6. 本ドキュメント

## 実施項目
- ModuleJsonConverter の deserialize に、型情報無し JSON を許容するフォールバック mapper を追加し、WARN しきい値を見直す。
- UI 側で `@class` を埋め込むケースと、サーバー側で Map として受けるフォールバックの役割分担を整理する。
- beanJson の `@class` なし JSON が WARN なしで decode できる回帰テストを追加し、Maven テストを通過させる。

## 成果/ログ
- 証跡ログ（web-client 側）: `docs/web-client/planning/phase2/logs/20251214T132418Z-module-json-typeinfo-fallback.md`（本 RUN_ID で更新予定）。
- DOC_STATUS 備考に本 RUN_ID と証跡パスを追記予定。
