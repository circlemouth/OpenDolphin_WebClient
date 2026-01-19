# Webクライアント ナビゲーション強化タスク前提ドキュメント

更新日: 2026-01-19  
RUN_ID: 20260119T134425Z

## 目的
`.kamui/apps/webclient-navigation-hardening-plan-20260119.yaml` の各タスク（403失効ガード、ログイン後遷移、タブ間同期、ストレージ掃除、失効ブロードキャスト、サブパス対応、ロールガード、回帰テスト）に着手する際の前提と参照先を一箇所にまとめ、実装・検証漏れを防止する。

## 共通前提
- 正本: `docs/DEVELOPMENT_STATUS.md`。
- 最新の課題整理: `docs/web-client/architecture/web-client-navigation-review-20260119.md`（RUN_ID=20260119T124836Z）。
- 対象範囲: `web-client/src` のナビゲーション/認証/ストレージ関連。`server/`（Legacy）は読み取り専用。
- 起動コマンド: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`。サブパス検証時は `VITE_BASE_PATH=/foo/` を付与して `npm run preview`（web-client）または docker compose を使用。
- ランタイム依存: BroadcastChannel と StorageEvent が利用できるブラウザを想定。フォールバックを入れる場合は graceful degradation を明記する。
- 観測・監査: runId/traceId/authFlags は `web-client/src/features/charts/authService.tsx` と `web-client/src/libs/http/header-flags.ts` を正とする。
- テスト基盤: `web-client/package.json` の `test`（vitest）、`lint`（eslint）、`preview`（vite preview）。E2E はリポジトリ直下の `playwright.config.ts` と `tests/e2e` を利用。

## タスク別前提

### 10_403失効ガード調整
- 仕様出典: 403 をログアウト扱いにしない方針（review doc の High）。
- 参照コード: `web-client/src/libs/http/httpClient.ts`（shouldNotifySessionExpired / notifySessionExpired）、`web-client/src/AppRouter.tsx`（sessionExpired ハンドラ）、`web-client/src/features/charts/authService.tsx`（logout 実装）。
- テスト候補: `web-client/src/libs/http/__tests__/` を新設するか、`AppRouter` 近傍の統合テストで失効イベントを確認。

### 11_ログイン後即遷移と戻り検知
- 参照コード: `web-client/src/AppRouter.tsx` の `handleLoginSuccess` / `LoginSwitchNotice`、`web-client/src/routes/facilityRoutes.ts` の `buildFacilityPath`。
- UX 期待: `state.from` を優先し、デフォルトは `/f/{facilityId}/reception`。戻り検知時のみ `LoginSwitchNotice` を表示。

### 20_認証と runId のタブ共有
- 参照コード: `web-client/src/features/charts/authService.tsx`（AuthServiceProvider, AuthServiceContext）、`web-client/src/libs/auth/storedAuth.ts`、`web-client/src/libs/http/header-flags.ts`。
- 前提: BroadcastChannel 名は `opendolphin:web-client:auth`。runId/authFlags の共有フォーマットをドキュメント化すること。

### 21_ストレージ掃除とスコープ化
- 対象キー: encounter-context / returnTo / soap-history / print-preview / lock 系（`web-client/src/features/charts/print/printPreviewStorage.ts`, `web-client/src/features/charts/soap/soapHistoryStorage.ts`, `web-client/src/features/charts/useChartsTabLock.ts` など）。
- 方針: `facilityId:userId` サフィックスへ移行し、ログアウト時に facility/user 単位で localStorage / sessionStorage を削除。旧キーの後方互換読み込みが必要。

### 22_失効同期ブロードキャスト
- 参照コード: `web-client/src/libs/http/httpClient.ts` の `notifySessionExpired`、`web-client/src/AppRouter.tsx` の失効イベント購読。
- 前提: 401/419/440 のみログアウト、403 は UI で吸収。BroadcastChannel + storage event 併用でデバウンス状態を共有。

### 30_VITE_BASE_PATH と basename 統一
- 参照コード: `web-client/vite.config.ts`（base 未設定）、`web-client/src/AppRouter.tsx`（BrowserRouter basename 未設定）、`web-client/src/routes/facilityRoutes.ts`（buildFacilityPath）。
- 運用前提: `VITE_BASE_PATH` を `.env*` に追加し、preview / 本番で同一値を使用。二重スラッシュ回帰テストを追加する。

### 40_Administration / Debug ロールガード
- 参照コード: `web-client/src/AppRouter.tsx` の `NAV_LINKS` とサイドバー描画、`web-client/src/features/administration/AdministrationPage.tsx`、`web-client/src/features/debug/LegacyRestConsolePage.tsx`。
- 前提: `roles: ['system_admin']` を基本とし、403 応答はログアウトさせずトースト/バナーで通知。監査ログの送出箇所も合わせる。

### 90_回帰テストとデプロイ前確認
- テスト対象: 403/401/419/440 判定、BroadcastChannel 連携、auth/runId 共有、ストレージ掃除、basename/base の挙動、ロールガード表示。
- ツール: `web-client` ディレクトリで `npm test`（vitest）、`npm run lint`、`npm run preview` + `VITE_BASE_PATH`。E2E は `npx playwright test`（preview サーバー接続設定を合わせる）。
- ドキュメント更新先: `docs/web-client/architecture/web-client-navigation-review-20260119.md` と計画 90 番の成果物（UAT チェックリスト追記）。
