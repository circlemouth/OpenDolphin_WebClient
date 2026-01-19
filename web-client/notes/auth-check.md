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

---

# Auth/主要画面 簡易確認メモ (RUN_ID=20260118T232947Z)

- 日時: 2026-01-19T00:18:30Z
- 環境: デフォルト(.env.sample 相当), VITE_* 未上書き, `WEB_CLIENT_MODE=npm`

## 起動/疎通
- `setup-modernized-env.sh` を `actuator/health` ヘルスチェック対応に変更し再生成。docker-compose.override.dev.yml も同様のヘルスチェックに置換。
- サーバーイメージを再ビルド（server-modernized）、再起動後 HEALTHY を確認。
- DB の開発ユーザ `dolphindev` を `1.3.6.1.4.1.9414.10.1:dolphindev` へ更新し、roles(admin/user/doctor) 付与。
- Basic 認証: ユーザー名=userId(`dolphindev`), パスワード=平文。`/resources/user/1.3.6.1.4.1.9414.10.1:dolphindev` で HTTP200/JSON を確認。
- Playwright 簡易操作: ログイン→セッション保存は成功（SessionStorage に auth 保存、API 200）。SPA 画面は `/f/.../login` 表示のままだが 401/403 は発生せず（要手動ナビゲーション）。

## テスト
- `cd web-client && npm test -- --run src/features/administration/__tests__/TouchAdmPhrPanel.test.tsx` : pass

## 追加メモ
- フロントは Basic 認証ユーザー名を userId のみに変更（施設IDは URL から解決）。サーバー側 LogFilter で Authorization Basic を解釈し、MD5/平文両対応で認証。
- サーバー UserResource を SecurityContext ベースに更新（userName/password ヘッダ依存を解消）。
