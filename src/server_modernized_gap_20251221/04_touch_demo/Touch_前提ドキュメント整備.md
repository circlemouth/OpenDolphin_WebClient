# Touch_前提ドキュメント整備
- 期間: 2025-12-24 14:00 - 2025-12-25 14:00 / 優先度: high / 緊急度: high
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Touch_前提ドキュメント整備.md`

## 目的
- Touch/Demo 対応の作業手順書と参照リンクを先行整備し、実装タスクの着手準備を揃える。
- 共通 JSON 変換基盤の設計前提（互換性・監査・ヘッダー・DTO の扱い）を明文化する。

## 前提・制約
- Phase2 文書は Legacy/Archive（参照専用）。更新対象外。
- 旧サーバー資産（`server/`）は変更禁止。
- 変更対象は Web クライアント資産と `server-modernized/` のみ。
- モダナイズ版サーバーと Web クライアントは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、認証情報はスクリプト記載のものを使用する。
- ORCA 実環境に接続する場合は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の RUN_ID ルールに従う。

## 参照リンク（現行）
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `server-modernized/src/main/webapp/WEB-INF/web.xml`
- `server-modernized/src/main/java/open/dolphin/touch/`
- `server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/JsonTouchResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java`

## 参照リンク（Legacy/Archive）
- `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`
- `docs/server-modernization/phase2/domains/DOLPHIN_RESOURCE_ASP_MIGRATION.md`
- `docs/server-modernization/phase2/domains/DEMO_RESOURCE_ASP_MIGRATION.md`
- `docs/server-modernization/phase2/notes/rest-touch-diff-report.md`

## 作業手順書（Touch/Demo 先行準備）
1. `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の Touch/Demo/JsonTouch セクションを読み、対象 API 群と優先度（P0/P1/P2）を整理する。
2. `web.xml` の `resteasy.resources` と context-param（Touch/Demo/PHR）を確認し、公開済みリソースと前提ヘッダーを棚卸しする。
3. `server-modernized/src/main/java/open/dolphin/touch/` 配下の Resource/Service/DTO を確認し、JSON 応答に統合済みの経路と Legacy XML 依存の経路を切り分ける。
4. `/touch`・`/demo`・`/touch/jtouch`・`/10/adm/jtouch`・`/20/adm/jtouch` のエンドポイント一覧を整理し、機能重複と共通 DTO（`JsonTouchSharedService` / `Touch*Service`）の利用可否を確認する。
5. Touch/Demo 共通の必須ヘッダー・認証・施設 ID 検証・監査イベント命名（`TOUCH_*` / `DEMO_*`）を一覧化する。
6. エラーレスポンス形式（`TouchErrorResponse` 系）の統一方針を確認し、4xx/5xx の監査イベント記録方針を確定する。
7. 変換基盤（DTO/Mapper/Formatter）の共有ポイントを抽出し、Touch/Demo/JsonTouch/ADM10/ADM20 での再利用手順を下記「共通 JSON 変換基盤の設計前提」に反映する。

## 共通 JSON 変換基盤の設計前提（整理）
- **応答互換性**: Touch/Demo/JsonTouch/ADM10/ADM20 で同じ機能は同一 JSON 形状に統一し、Legacy XML 互換は JSON 変換層で吸収する。
- **DTO の単一化**: 既存 DTO（`Touch*Dtos` / `JsonTouchSharedService`）を優先し、重複 DTO を増やさない。
- **ヘッダー/監査の一貫性**: `X-Facility-Id` / `X-Trace-Id` / `X-Access-Reason` / `X-Consent-Token` / `X-Device-Id` / `X-Demo-Mode` などの要件は API 群で統一的に扱う。
- **失敗応答の標準化**: 例外時の JSON 形式と監査イベント記録を共通化し、Touch/Demo で差異が出ないようにする。
- **キャッシュ方針**: `TouchResponseCache` 等のキャッシュは TTL/キー設計を明文化し、Demo 固定施設の扱いと併記する。
- **テスト観点**: 変換前後の JSON 互換・ヘッダー不整合・施設不一致・監査記録の有無を最小テストセットとして固定する。

## 期待成果物
- Touch/Demo 対応の手順書（本ファイル）と参照リンクの一覧。
- JSON 変換基盤の設計前提（上記整理）を関係タスクへ展開できる状態。

## 非対象
- Phase2/Legacy 文書の更新。
- ORCA 実接続/Stage/Preview 実測。
