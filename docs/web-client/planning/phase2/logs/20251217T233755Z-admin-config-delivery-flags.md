# Administration 設定配信フラグ同期（RUN_ID=`20251217T233755Z`）

## 目的
- `/api/admin/config` と `/api/admin/delivery` の差分を UI 側で吸収し、**配信（delivery）優先＋不足は config 補完**で Charts の機能フラグを確定する。
- Charts に対して「表示/送信/マスタソース」を管理配信で切替できるようにし、**いつ・誰に・どの runId で**適用されたかを UI と監査ログで追跡する。
- masterSource 変更（例: `server → fallback`）など、Charts の状態に影響がある場合は ToneBanner で明示する。

## 実装サマリ
### 1) `config` + `delivery` を統合（delivery 優先）
- `web-client/src/features/administration/api.ts`
  - `fetchEffectiveAdminConfig()` を追加し、`/api/admin/delivery` の取得に失敗した場合は `/api/admin/config` にフォールバック。
  - `mergeAdminConfigResponses()` で `delivery` の値を優先し、不足分のみ `config` で補完。

### 2) Charts 向けフラグ（表示/送信/マスタソース）
- 追加フラグ（サーバー応答 or 配信ボディ想定）
  - `chartsDisplayEnabled: boolean`
  - `chartsSendEnabled: boolean`
  - `chartsMasterSource: 'auto' | 'server' | 'mock' | 'snapshot' | 'fallback'`
- `web-client/src/features/administration/AdministrationPage.tsx`
  - 上記フラグを UI で編集し、保存時に broadcast に含める。

### 3) Charts 側の適用追跡（いつ/誰に/runId）
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - `fetchEffectiveAdminConfig()` で取得したフラグを Charts 側に適用。
  - 適用時に `logAuditEvent({ source: 'admin/delivery.apply', payload: { appliedAt, appliedTo, role, runId, delivery... } })` を記録。
  - UI に `適用時刻 / 適用ユーザー / role / 配信runId / deliveredAt / deliveryId / deliveryVersion` を表示。

### 4) 影響時の ToneBanner
- `chartsMasterSource` 変更・`chartsSendEnabled=false`・`chartsDisplayEnabled=false` など、状態影響がある場合は ToneBanner で警告。
- `web-client/src/features/charts/ChartsActionBar.tsx`
  - `sendEnabled/sendDisabledReason` を追加し、管理配信で送信が禁止されたケースを明確にブロック。

### 5) Vite dev のモック応答拡張
- `web-client/plugins/flagged-mock-plugin.ts`
  - 管理配信レスポンス（`/api/admin/config|delivery`）に `charts*` フラグを含める。
  - 簡易制御:
    - 環境変数: `VITE_CHARTS_DISPLAY_ENABLED`, `VITE_CHARTS_SEND_ENABLED`, `VITE_CHARTS_MASTER_SOURCE`
    - ヘッダー: `x-charts-display-enabled`, `x-charts-send-enabled`, `x-charts-master-source`

## 変更ファイル（主要）
- `web-client/src/features/administration/api.ts`
- `web-client/src/features/administration/AdministrationPage.tsx`
- `web-client/src/features/charts/pages/ChartsPage.tsx`
- `web-client/src/features/charts/ChartsActionBar.tsx`
- `web-client/src/features/reception/api.ts`
- `web-client/src/features/charts/api.ts`
- `web-client/plugins/flagged-mock-plugin.ts`
- `web-client/src/features/shared/AdminBroadcastBanner.tsx`
- `web-client/src/libs/admin/broadcast.ts`
- `tests/e2e/orca-delivery.spec.ts`
- `tests/playwright/utils/fixtures/admin/delivery/*.json`

## 検証
- `npm --prefix web-client install --cache ./.npm-cache`（ローカル cache の都合で必要）
- `npm --prefix web-client run typecheck` ✅
- `npm --prefix web-client run test` ✅
- `npx playwright test tests/e2e/orca-delivery.spec.ts` ✅

