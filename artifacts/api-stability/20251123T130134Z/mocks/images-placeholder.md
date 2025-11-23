# /karte/images/* プレースホルダーモック（RUN_ID=20251123T130134Z-B）

## 目的
- 画像アップロード未移植の状態でも ChartsPage の添付一覧 UI が空状態表示で安定することを確認する。

## 対象 UI
- ChartsPage 右ペイン「画像」タブ（ImageAttachmentList）。
- 画像プレビュー/削除ボタン（現行は非活性想定）。

## エンドポイントと期待値
- `GET /api/karte/images?chartId=<id>` → 200 OK
- レスポンス: `{ "list": [], "page": 1, "total": 0, "meta": { "placeholder": true, "maxSizeBytes": 0 } }`
- `DELETE /api/karte/images/:imageId` → 204 No Content（モックでは無条件 204、`If-Match` ヘッダーは無視）

## MSW 実装方針
- GET: 空配列を返し、`X-Compat-Mode: placeholder-images` を付与。遅延は 30ms 以内で UI がスケルトン解除されることを確認。
- DELETE: `ctx.delay(10)` で即時 204 を返す。`?simulateConflict=1` で 409 + `{"reason":"locked"}` を返し、UI のエラー表示確認用。

## 実サーバー切替手順（記述のみ）
1. `VITE_DISABLE_MSW=1` でプレビューを起動し、`GET /api/karte/images` の 404/405/501 を確認。
2. エラー時は UI 側で空状態を表示するため、MSW のプレースホルダーとの差分（HTTP ステータス/エラーメッセージ）を `logs/20251123T130134Z-webclient-api-compat.md` に追記する。

## 残課題
- 画像アップロード API 実装時に `content-type`/`checksum`/`height,width` メタを追加する予定。別途 JSON スキーマを作成する。 
