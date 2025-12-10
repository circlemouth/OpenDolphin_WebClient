# WEBクライアントAPI使用実績インベントリ（RUN_ID=20251210T222542Z）
- 期間: 2025-12-13 09:00 - 2025-12-14 09:00 JST（事前採取日: 2025-12-10）
- YAML ID: `src/orca_prod_bridge/implementation/WEBクライアントAPI使用実績インベントリ.md`
- 証跡: `docs/server-modernization/phase2/operations/logs/20251210T222542Z-api-usage.md` / `artifacts/webclient/api-usage/20251210T222542Z/`

## 実施サマリ
- MSW 無効 + Vite preview (`VITE_DISABLE_MSW=1`, `VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources`, `VITE_DEV_USE_HTTPS=0`) で `/login` → `/outpatient-mock` をブラウザ操作（Playwright）し、HAR を取得。
- 認証は既存ユーザー `LOCAL.FACILITY.0001:dolphin` / `dolphin`（MD5=`36cdf8…`）。`localStorage.devFacilityId/devUserId/devPasswordMd5` をログイン後に上書きして httpFetch のヘッダー補完を強制。
- 取得した HAR:
  - `webclient-api-usage.har`: GET `/api/user/LOCAL.FACILITY.0001:dolphin` = 200、POST `/api01rv2/claim/outpatient/mock` = 200（runId=`20251208T124645Z`, dataSource=server）、POST `/orca21/medicalmodv2/outpatient` = 415 (Content-Type/userName 無し)。
  - `webclient-api-usage-401.har`: Outpatient 呼び出しで `userName` 不在のまま 401 を返した再現ログ。

## プロキシ/ベースパス
- Vite 開発/preview 共通: `/api` は `/openDolphin/resources` へ rewrite、`/api01rv2` / `orca21` / `orca12` は書き換え無しで `VITE_DEV_PROXY_TARGET` へ中継。
- サーバーログの traceId (`/api/user`: 6634187b-9732-4634-bdb2-90aefb048820, `/api01rv2/claim/outpatient/mock`: d7e3203d-bf5d-4808-8913-8bfae96cc2d8, `/orca21/medicalmodv2/outpatient`: f134c2c2-7023-4fc5-9d49-69814112881a) で `/openDolphin/resources` に到達していることを確認。

## OpenAPI / UI 対応
- `/api/user/{facilityId:userId}`: Web クライアント Login（operationId: 既存 UserResource）。認可成功。
- `/api01rv2/claim/outpatient/mock`: モダナイズ側スタブ（ORCA spec 未定義）→ Reception/Outpatient モックの tone 取得。200 応答に `runId/dataSourceTransition` 等を含む。
- `/orca21/medicalmodv2/outpatient`: ORCA 本来の `/api21/medicalmodv2` に相当するラッパー。`Content-Type`/`userName` 不足のため 415。operationId 未定義（manifest: `medicalmod` ページのみ）。
- 未定義エンドポイントは UI 対応表へ「スタブ / 未定義」としてマークし、実 API との乖離を明示する。

## 今後の対応メモ
- Outpatient 呼び出し時に `userName` / `X-Facility-Id` / `Content-Type: application/json` を強制セットし、415 を解消した HAR を再取得する。
- `httpFetch` の localStorage 読み出しが Outpatient モックでも有効かを単体テスト化し、ヘッダー欠落を検知できるようにする。
- operationId 対応表（OpenAPI ↔ UI）で `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` を「ORCA spec 外スタブ」として明記し、経路リライト不要であることを併記する。
