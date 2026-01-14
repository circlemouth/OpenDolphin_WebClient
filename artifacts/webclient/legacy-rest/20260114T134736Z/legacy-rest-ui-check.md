# Legacy REST UI 確認ログ

RUN_ID: 20260114T134736Z
日時: 2026-01-14
対象: /debug/legacy-rest (Legacy REST 互換 API コンソール)

## 確認内容
- 2xx / 4xx のステータス判定が UI に表示されること
- 監査ログに legacy 判別タグ (`payload.legacy=true`) が残ること
- content-type に応じて JSON / テキスト / バイナリの表示が切替わること

## 証跡
- UI テスト: `web-client/src/features/debug/__tests__/LegacyRestConsolePage.test.tsx`
  - 200 応答で `HTTP 200 (2xx success)` 表示
  - 404 応答で `HTTP 404 (4xx client error)` 表示
  - 監査ログ `payload.legacy=true` / `payload.endpoint=/pvt` を検証

## 実行コマンド
- `npm --prefix web-client run test -- legacyRestApi.test.ts LegacyRestConsolePage.test.tsx`
- 実行ログ: `artifacts/webclient/legacy-rest/20260114T134736Z/legacy-rest-test-output.txt`

## 備考
- /reporting/karte 等のバイナリ応答は `mode=binary` としてサイズのみ表示する設計。
