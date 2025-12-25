# Demo API 在庫更新/合意
- 期間: 2026-01-12 11:00 - 2026-01-13 11:00 / 優先度: low / 緊急度: low
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_在庫更新_合意.md`

## 目的
- MODERNIZED_REST_API_INVENTORY の Demo セクションを最新化し、Demo API の最小セット合意を確定する。

## 現行状況（2025-12-25 時点）
- 在庫更新: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の Demo セクションに 15 API の JSON 実装完了が反映済み。
- 合意状況: JSON 版 15 API の維持、XML 版の公開終了で合意済み（RUN_ID: 20251225T195836Z）。
- 公開設定: `server-modernized/src/main/webapp/WEB-INF/web.xml` は JSON 版のみ登録（XML 版は削除済み）。
- 参照: `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_整理.md` の合意結果。

## 追加対応（任意）
- デモ環境で JSON 版のみの動作確認を行い、必要なら 410/404 への移行方針を追記する。

## 参照
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_整理.md`
- `server-modernized/src/main/webapp/WEB-INF/web.xml`
