# Auth/主要画面 簡易確認メモ (RUN_ID=20260118T205119Z)

- 日時: 2026-01-18T07:56:23-05:00
- 環境: デフォルト(.env.sample 相当), VITE_* 未上書き, `WEB_CLIENT_MODE=npm`

## 起動/疎通
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` 実行 → Docker daemon 不在で起動失敗 (`Cannot connect to the Docker daemon...`).
- そのため実サーバへのログイン/画面遷移は未実施。Docker 起動後に再実行が必要。

## テスト
- `npm run test -- --run src/features/administration/__tests__/TouchAdmPhrPanel.test.tsx` : pass
- `npm run test -- --run src/features/administration/__tests__/LegacyRestPanel.test.tsx` : pass
- `npm run build` : pass (vite production build)

## 追加メモ
- LoginScreen は標準認証: Authorization Basic base64("<facilityId:userId>:<password>") を送出。
- 旧ヘッダ認証は `VITE_ENABLE_LEGACY_HEADER_AUTH=1` 時のみ使用。失敗時フォールバックは `VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK=1` で有効。
- デモ/stub エンドポイントはデフォルト非表示（`VITE_ENABLE_DEMO_ENDPOINTS=0`, `VITE_ENABLE_STUB_ENDPOINTS=0`）。
