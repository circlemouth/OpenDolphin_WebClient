# Demo API 在庫更新/合意
- 期間: 2026-01-12 11:00 - 2026-01-13 11:00 / 優先度: low / 緊急度: low
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_在庫更新_合意.md`

## 目的
- MODERNIZED_REST_API_INVENTORY の Demo セクションを最新化し、Demo API の最小セット合意を確定する。

## 現行状況（2025-12-25 時点）
- 在庫更新: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の Demo セクションに 15 API の JSON 実装完了が反映済み。
- 合意状況: Touch/営業デモの一次情報が未取得のため、維持/廃止は **保留**。
- 参照: `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_整理.md` の判定表と合意形成フェーズ。

## 残タスク
- Touch/営業デモ運用の一次情報（手順書 or 実測ログ）を取得し、維持/廃止の合意を確定する。
- 合意後に在庫表の「保留」ステータスを更新し、必要であれば `web.xml` の公開整理方針に反映する。

## 参照
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_整理.md`
- `server-modernized/src/main/webapp/WEB-INF/web.xml`
