# config/delivery 不一致検知（syncMismatch）と raw 監査強化（RUN_ID=`20251218T022759Z`）

## 背景
- `/api/admin/config` と `/api/admin/delivery` を併用する運用では、「どちらが効いているか」「不一致があるか」を UI と監査ログで追えると、障害時の切り分けが速くなる。

## 変更点
### 1) syncMismatch（不一致検知）を付与
- `web-client/src/features/administration/api.ts`
  - `fetchEffectiveAdminConfig()` の返却に以下を追加:
    - `syncMismatch: boolean`（config と delivery の同一キーが不一致なら true）
    - `syncMismatchFields: (keyof AdminConfigPayload)[]`（不一致のキー一覧）
    - `rawConfig`, `rawDelivery`（正規化済みの生値をそれぞれ保持）

### 2) Charts の適用監査ログに raw(config/delivery) を分離して格納
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - `source='admin/delivery.apply'` の payload に以下を追加:
    - `syncMismatch`, `syncMismatchFields`
    - `raw: { config, delivery }`（config/delivery を分離して格納）
  - UI の「管理配信（適用メタ）」にも mismatch を表示。

### 3) Administration 画面で mismatch を見える化
- `web-client/src/features/administration/AdministrationPage.tsx`
  - `syncMismatch` / `mismatchFields` をピル表示。
  - キュー警告が無い場合でも mismatch を ToneBanner（warning）で表示。

## 検証
- `npm --prefix web-client run typecheck` ✅
- `npm --prefix web-client run test` ✅
- `npx playwright test tests/e2e/orca-delivery.spec.ts` ✅

