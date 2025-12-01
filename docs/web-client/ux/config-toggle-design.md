# 配信タイミング・ORCA キュー切替フラグ設計メモ（RUN_ID=20251202T090000Z）

## 目的
- Administration 設定配信タイミングと ORCA 送信キュー（モック/実 API）の挙動を安全に切り替え、検証ログを取得するためのフラグ設計案。

## 想定フラグ案
- `VITE_USE_MOCK_ORCA_QUEUE`: ORCA 送信キューをモックに切替（ON）、実 API を利用（OFF）。デフォルト OFF。モック時は送信キュー投入をローカルで完結させ、失敗時も実環境へ影響を与えない。
- `VITE_VERIFY_ADMIN_DELIVERY`: Administration 設定配信の検証モードを有効化。配信イベントを詳細ログ出力し、UI に検証バナーを表示する想定。
- `VITE_ADMIN_DELIVERY_LOG_LEVEL`（任意）: `info|debug` などで配信・権限チェックのログ詳細度を制御。

## レスポンス差分とヘッダー（モック ON/OFF）
- ORCA キュー `/api/orca/queue`:
  - `VITE_USE_MOCK_ORCA_QUEUE=1` → body 例: `{ source: "mock", queue: [...], runId: "20251202T090000Z", latencyMs: 1500 }`、ヘッダー: `x-orca-queue-mode: mock`, `x-admin-run-id: 20251202T090000Z`。監査ログは `storage=mock` として記録。
  - `VITE_USE_MOCK_ORCA_QUEUE=0` → body 例: `{ source: "live", queue: [...], deliveryVersion: "vCurrent", runId: "20251202T090000Z" }`、ヘッダー: `x-orca-queue-mode: live`, `etag: <version>`。監査ログは `storage=live`。
- 配信確認 `/api/admin/config`（`/delivery` 派生を含む）:
  - `VITE_VERIFY_ADMIN_DELIVERY=1` → body 例: `{ verified: true, deliveryVersion: "vCurrent", runId: "20251202T090000Z" }`、ヘッダー: `x-admin-delivery-verification: enabled`, `x-admin-run-id: 20251202T090000Z`。
  - `VITE_VERIFY_ADMIN_DELIVERY=0` → body: 従来通り（`verified` 不在/false）でヘッダー `x-admin-delivery-verification: disabled`。ETag が変化しない場合はキャッシュヒットとして扱う。

## 運用パターン
- 配信タイミング確認（本番同等設定）: `VITE_USE_MOCK_ORCA_QUEUE=0`, `VITE_VERIFY_ADMIN_DELIVERY=1`, `VITE_ADMIN_DELIVERY_LOG_LEVEL=info`。実 API で配信タイミングのみ検証し、ログを詳細化。
- ORCA キュー挙動のみ検証（影響最小化）: `VITE_USE_MOCK_ORCA_QUEUE=1`, `VITE_VERIFY_ADMIN_DELIVERY=1`。モックで送信ルールやキュー投入の UI を確認し、実 ORCA への送信を避ける。
- 権限制御・ブロック確認: `VITE_VERIFY_ADMIN_DELIVERY=1` を固定し、ロールを切替（system_admin→受付→一般）してガードの差分を観測。ORCA 側はモック/実いずれでも可だが、影響を避ける場合はモックで実施。

## 監査ログ項目（期待形）
- 主要フィールド: `runId`, `userRole`, `endpoint`, `deliveryVersion`, `queueMode (mock|live)`, `responseHeaderFlags`（`x-orca-queue-mode`, `x-admin-delivery-verification`, `etag`）、`latencyMs`, `result (success|failure|timeout)`, `retryCount`, `storage (mock|live)`。
- フラグ OFF 時も `runId` と `endpoint` を必ず残し、ヘッダー欠落/ETag 未更新を WARN として記録する。権限エラーは `result=forbidden` とし、UI 側の非活性表示と紐付ける。
- Playwright は `fetchAuditLog` で上記フィールドを取得し、レスポンスヘッダーとの差分をスナップショットする。差分がある場合は `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` に失敗ログとして追記する。

## ログ取得方法（例）
- フロント: コンソール/ネットワークログを収集（Playwright の `page.on('response')` やブラウザ DevTools の HAR）。`VITE_VERIFY_ADMIN_DELIVERY` 有効時は配信イベントにタグ付けして保存。
- サーバー/ORCA 側: `VITE_USE_MOCK_ORCA_QUEUE` OFF 時のみ実 API コールを記録し、`docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` へ転記。モック時はモックキューへの投入ログ（フロント/バック）を保存。
- 監査ログ: 設定変更成功/権限エラーともに記録し、保持期間・削除手順の検証時に参照する。

## ガード・注意点
- 権限制御: 配信検証時は必ず role=system_admin/管理者で変更を行い、受付/一般ロールではブロックが効くことを確認する。`VITE_VERIFY_ADMIN_DELIVERY` で UI に権限状態を可視化できると望ましい。
- ORCA_API_STATUS 連携: `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` にブロッカー/警告がある場合は `VITE_USE_MOCK_ORCA_QUEUE=1` に切り替え、実 API 送信を停止してから改善後に OFF へ戻す。
- 既存設定との互換: フラグ未設定時は現行挙動を維持し、CI/Playwright でフラグ有無の両ケースをカバーできるようにする。
