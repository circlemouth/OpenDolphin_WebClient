# MSW gate hardening (cmd_20260207_14_sub_3)

RUN_ID: 20260207T124128Z-cmd_20260207_14_sub_3-msw-gate-hardening

## 背景（P0）
- 旧実装は `VITE_DISABLE_MSW!=1` で **MSW worker が自動起動**し得た（誤設定で dev seed/fixture が UI に混入するリスク）。

## 目的
- MSW/fixture/開発seed が実運用相当の表示に混入しないよう、**起動条件を厳格化**する。
- production build に `src/mocks` がバンドルされない根拠と検証（dist スキャン）を用意する。
- MSW が有効な場合は UI 上で明示（バナー）し、実運用と混同されないようにする。
- CLAIM 復活は禁止（本変更は MSW/fixture の gate のみ）。

## Gate 仕様（AND 必須）
MSW worker が起動するのは以下を **すべて満たす場合のみ**:
- `import.meta.env.DEV === true`
- `VITE_ENABLE_MSW=1`
- URL に `?msw=1`
- （kill switch）`VITE_DISABLE_MSW!=1`

備考:
- `?msw=1` を後から付けても SPA の bootstrap は再実行されないため、**MSW を使う場合は `?msw=1` でリロードが必要**。

## 実装
- `web-client/src/main.tsx`
  - 旧: `VITE_DISABLE_MSW!=1` なら auto-start
  - 新: 上記 gate（DEV + env + URL param）を満たす時のみ dynamic import で worker 起動
  - 実行時状態を `window.__OD_MOCK_RUNTIME__` に記録
- `web-client/src/libs/devtools/mockGate.ts`
  - gate 判定 + runtime state（`window.__OD_MOCK_RUNTIME__`）+ update event
- `web-client/src/features/shared/MockModeBanner.tsx`
  - gate が許可された場合（= MSW 有効想定）に **MSW ON バナー**を表示
- `web-client/src/AppRouter.tsx`
  - Debug pages は `DEV && VITE_ENABLE_DEBUG_PAGES=1` の場合のみ許可
  - OutpatientMockPage は lazy import（本番 build で不要 chunk を作らない方向に寄せる）
- `web-client/plugins/flagged-mock-plugin.ts`
  - fixture 注入の default を OFF（明示 opt-in）
  - `VITE_ENABLE_MSW=1` + `?msw=1` を満たす場合のみ有効化（誤混入防止）
- `web-client/vite.config.ts`
  - flagged mock middleware は `VITE_ENABLE_FLAGGED_MOCKS=1` の時だけ登録
- `web-client/scripts/verify-prod-dist-no-mocks.mjs`
  - dist 内に `src/mocks`/`msw/browser`/`setupWorker(` などの参照が含まれないことをヒューリスティックに検査

## 検証（証跡）
- MSW ON バナー: `screenshots/msw-on-banner.png`
- production dist スキャン: `dist-scan.txt`
  - `pnpm -C web-client run build`
  - `OUTPUT_FILE=... pnpm -C web-client run verify:prod-no-mocks`

## 注意（実運用混入防止の考え方）
- `public/mockServiceWorker.js` 自体は dist にコピーされ得るが、上記 gate を満たさない限り **worker は起動しない**。
- 本変更は CLAIM 機能を復活させるものではない（/orca/claim/outpatient の導線追加なし）。
