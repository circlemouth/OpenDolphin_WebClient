# API Stability Mocks (RUN_ID=20251120T191203Z)

`msw-handlers.ts` で Charts / Reception / Administration / ORCA wrapper の代表 API をスタブし、Vite 開発サーバーの MSW 登録（`npm run dev` で自動ロード）へ組み込める最小セットを提供する。

## 使い方
1. `artifacts/api-stability/20251120T191203Z/mocks/msw-handlers.ts` をプロジェクトの MSW ルーター（例: `src/mocks/handlers.ts`）にインポートして配列へ追加する。  
   ```ts
   import { apiStabilityHandlers } from '../../artifacts/api-stability/20251120T191203Z/mocks/msw-handlers';
   export const handlers = [...apiStabilityHandlers, /* existing handlers */];
   ```
2. npm 起動手順（Vite 開発サーバーで MSW を自動登録）
   ```sh
   cd web-client
   npm ci          # 初回のみ
   npm run dev -- --host
   ```
   - `VITE_API_BASE_URL` の既定 `/api` に合わせて、以下のエンドポイントをフロントエンド MSW がフックする。
     - `GET /api/karte/docinfo/:params` (`list` に DocInfoModel を返却。`karteId,from,includeModified` を URL エンコードした 1 セグメントで受信)
     - `GET /api/pvt2/pvtList` (`list` に RawPatientVisit を返却。`patientModel` の id/patientId/fullName を必須とする)
     - `GET /api/user/:userId` (`UserModel` を返却。facilityModel/roles をオブジェクトで含む)
     - `GET /api/orca/tensu/name/:query/` (`list` に ORCA マスターを返却。`srycd`/`taniname`/`ten` 等のフィールド名で返す)
3. レスポンス内容は `../schemas/*.json` の期待値と一致するように設計している。必要に応じてレスポンス時間を `ctx.delay()` で調整し、SLA 超過時のクライアント挙動を再現する。

## 備考
- 本モックは Legacy/Modernized 双方のレスポンス差を吸収するため、DocInfo の `recordedAt/createdAt/updatedAt` や user/facilityModels を欠損させず返却する。
- ORCA wrapper は `list` フィールドに ORCA マスターの `srycd/name/taniname/ten` を格納し、UI 側の `mapTensuMaster` と同一フィールド名に合わせている。
