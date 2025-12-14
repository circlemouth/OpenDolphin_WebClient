# MODULE_JSON_DEVELOPMENT（module_json JSON 化手順ガイド）

- RUN_ID: `20251214T082236Z`（親 RUN_ID=`20251214T022944Z`）
- スコープ: module_json モダナイズの開発手順と運用確認ポイントを一本化する。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/キックオフ_RUN_ID採番.md` → 本ガイド。

## 1. JSON 化仕様（サマリ）
- 保存方針: `ModuleModel` は **beanJson を優先保存**し、失敗時のみ beanBytes へフォールバックする。両方を保持して後方互換を確保する。
- カラム: `d_module.bean_json TEXT`（Flyway `V0225__alter_module_add_json.sql` で追加）、`beanBytes` は NULL 許容。既存データはそのまま保持。
- 直列化: `ModuleJsonConverter#serialize` が `ObjectMapper`（`DefaultTyping.NON_FINAL` + `JsonTypeInfo.As.PROPERTY`）で JSON 生成。`BasicPolymorphicTypeValidator` で `open.dolphin.*` / `java.util.*` / `java.time.*` を許可。
- 復元: `ModuleJsonConverter#deserialize/decode` が beanJson から復元し、失敗または欠落時のみ `ModelUtils.xmlDecode(beanBytes)` を使う。
- ログ方針: JSON 変換失敗は warn ログのみ。例外はスローせず null を返し、呼び出し側で beanBytes を利用できるようにする。

## 2. 開発手順（ローカル検証）
1. **前提確認**
   - `server-modernized/tools/flyway/sql/V0225__alter_module_add_json.sql` と `src/main/resources/db/migration/V0225__alter_module_add_json.sql` が揃っていること。
   - `common/src/main/java/open/dolphin/infomodel/ModuleJsonConverter.java` が存在し、`ModelUtils` 経由で呼ばれることを確認。
2. **DB マイグレーション**
   - まだ適用していない場合は `flyway info` で `V0225` が Pending か確認し、実行する（詳細手順は `operations/logs/20251214T031229Z-module-json-flyway-migrate.md` を参照）。
3. **環境起動**
   - `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を使用し、モダナイズ版サーバー＋ Web クライアントを起動。ログイン情報はスクリプト記載のものを利用。
4. **保存経路の動作確認**
   - カルテ保存（例: add/updateDocument）を 1 件実行し、`d_module` の対象レコードで `bean_json IS NOT NULL` になっていること、`beanBytes` が従来どおり残っていることを確認する。
   - 同じレコードを読み出し、`ModuleJsonConverter#decode` が成功していることを WARN ログ有無で確認する。warn 発生時は beanBytes 復元にフォールバックしているかをチェック。
5. **監査/テレメトリ**
   - JSON 経路でも監査ログが従来と同一であること（`d_audit_event` の event_type/patient_id/facility_id）が変わらないか確認する。テレメトリ／トレース ID の欠落がないかを `server_latest_logs.txt` などで確認。

## 3. 関連ドキュメント
- 設計
  - `src/modernization/module_json/キックオフ_RUN_ID採番.md`（親 RUN）
  - `src/modernization/module_json/Flywayスクリプト追加.md`
  - `src/modernization/module_json/ModuleJsonConverter実装.md`
  - `src/modernization/module_json/KarteServiceBean組み込み.md`
- 証跡ログ
  - `docs/web-client/planning/phase2/logs/20251214T022944Z-module-json-kickoff.md`
  - `docs/web-client/planning/phase2/logs/20251214T031229Z-module-json-flyway.md`
  - `docs/server-modernization/phase2/operations/logs/20251214T031229Z-module-json-flyway-migrate.md`
  - `docs/web-client/planning/phase2/logs/20251214T031644Z-module-json-converter.md`
  - `docs/web-client/planning/phase2/logs/20251214T041935Z-module-json-karte-service-bean.md`
  - `docs/web-client/planning/phase2/logs/20251214T082236Z-module-json-docs.md`（本更新）
  - `docs/server-modernization/phase2/operations/logs/20251214T082236Z-module-json-docs.md`（本更新）

## 4. フォローアップ
- Flyway 適用結果と ModuleJsonConverter の allow-list拡充が必要になった場合は、本ファイルに追記し `docs/web-client/planning/phase2/DOC_STATUS.md` の備考に RUN_ID を更新する。
- mvn テスト・手動検証の証跡を取得した際は、対応する RUN_ID のログを追加し、`docs/server-modernization/phase2/README.md` および `docs/web-client/README.md` の最新更新サマリを更新する。
