# 44 `/api/admin/config` `/api/admin/delivery` フラグ同期（RUN_ID=20251217T233755Z）

## 目的
- 設定配信（delivery）により、Charts の機能フラグ（表示/送信/マスタソース）を切り替えられるようにする。
- 設定が「いつ・誰に・どの runId で」適用されたかを UI と監査ログで追えるようにする。
- 設定変更が Charts の状態に影響する場合（例: server→fallback）に、ToneBanner で明確に通知する。

## 対象
- Web クライアント: `web-client/` 配下（Legacy 資産は参照のみ）
- エンドポイント:
  - `GET /api/admin/config`（編集/保存用）
  - `GET /api/admin/delivery`（配信済み設定の参照用）

## 実装方針（概要）
- **優先順位**: `delivery` の値を優先し、不足分を `config` で補完する。
- **同期トリガー**:
  - Charts 画面初期表示時に `effectiveAdminConfig` を取得。
  - Administration 画面の保存で broadcast が発行された場合、Charts は broadcast を契機に再取得して適用する。
- **適用の追跡**:
  - UI: 適用ユーザー（facilityId:userId）、適用時刻、runId、deliveryVersion/deliveryId を表示する。
  - 監査ログ: `admin/delivery.apply` を記録し、適用ユーザーと差分（前→後）を payload に含める。

## 追加/同期対象フラグ（Charts）
- `chartsDisplayEnabled`（boolean）: Charts のカード一式を表示するか。
- `chartsSendEnabled`（boolean）: Charts の ORCA送信（ActionBar）を許可するか。
- `chartsMasterSource`（`auto|server|mock|snapshot|fallback`）: Charts の master ソース優先度。
  - `auto`: 既存の `VITE_DISABLE_MSW` 等の環境に従う。
  - `fallback`: Charts 側で **送信停止**（warning）として扱い、ToneBanner で明示する。

## 期待する UX
- `chartsMasterSource` が `server` → `fallback` に切り替わった場合、Charts 上に ToneBanner（warning）を表示し、送信制御（ORCA送信の無効化/ブロック理由）を即時に明確化する。

## 検証メモ
- 監査ログ（UI 内部）:
  - `window.__AUDIT_EVENTS__` に `source=admin/delivery.apply` が残り、`appliedAt/appliedTo/runId/deliveryVersion` が確認できる。
- Vite preview/dev のモック応答（任意）:
  - `web-client/plugins/flagged-mock-plugin.ts` は `VITE_CHARTS_DISPLAY_ENABLED` / `VITE_CHARTS_SEND_ENABLED` / `VITE_CHARTS_MASTER_SOURCE` を読む。
  - 例: `VITE_CHARTS_MASTER_SOURCE=fallback` を与えると、Charts が warning として扱い、送信停止ガードが出る。
