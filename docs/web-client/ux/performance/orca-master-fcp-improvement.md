# ORCA マスター FCP 改善メモ（RUN_ID=`20251124T183000Z`, 親=`20251124T000000Z`）

## 1. 計測条件
- 環境: `npm run build` → `npm run preview -- --host 0.0.0.0 --port 4173`（HTTPS, Service Worker 無効）。  
- ページ: `https://localhost:4173/charts/72001?msw=1`（Charts 代表画面 / MSW フラグ付き）。  
- ツール: Lighthouse CLI（desktop, throttling method=devtools, RTT=150ms, 1.6Mbps, CPU x4, headless, `--allow-insecure-localhost`）。  
- 成果物: `artifacts/perf/orca-master/20251124T183000Z/msw/lhci/lighthouse-devtools.json`（raw 1 run）。

## 2. 主な結果
- FCP 2.76s / LCP 3.06s / TTI 3.31s / TBT 52ms（すべて同 run）。  
- 転送: JS 377KB gzip（実サイズ 1.24MB, ファイル `dist/assets/index-_jhluqZJ.js` のみ）。リクエスト 4 件（Doc 1, JS 1, 画像 2）。  
- `unused-javascript` で ≈1200ms 削減余地を指摘。  
- Long tasks: 102ms / 79ms の 2 件のみ → CPU は軽く、FCP は JS ダウンロード＋初期実行待ちで支配。  
- 初期データ取得: API 呼び出しなし（MSW/実 API いずれも発火せず）。Service Worker 非登録のため影響なし。

## 3. FCP 遅延ボトルネック Top3
1) **単一巨大バンドル（1.24MB, gzip 377KB）**  
   - route/機能別の分割なしで全機能（管理/UX/ORCA ブリッジ等）が初回ロードに含まれる。  
   - RTT150ms・1.6Mbps 想定でダウンロードだけで約 1.9s を占有し、FCP 2.76s の主因。
2) **未使用 JS の混在（Lighthouse 推計で ~1.2s 無駄）**  
   - 管理画面・ブリッジ計画 UI・開発用モック/テレメトリのコードが Charts 初期描画に同梱されている。  
   - Tree-shaking しきれていない MSW/monitoring util・Zod 型群が bundle 体積を押し上げ。
3) **SSR/シェル欠如による “JS 待ち” 初期描画**  
   - HTML は空のまま、JS 実行完了まで可視コンテンツが出ない。  
   - Skeleton/Fallback がないため、ダウンロード完了まで FCP が発火しない。

## 4. 短期チューニング案（即日〜数日で適用可）
- **Charts ルート分割（目標 -0.9〜-1.2s FCP）**  
  - `React.lazy` + `vite build.rollupOptions.manualChunks` で Charts / Admin / Settings / Storybook 系を分離。  
  - Vendor も `react`, `react-dom`, `react-query` を別 chunk に分け初回 200〜250KB gzip を狙う。  
- **不要コードの遅延読込・ビルド除外（目標 -0.3〜-0.5s FCP）**  
  - 管理系・ORCA ブリッジ設定・テレメトリ/axe を `import.meta.env.MODE !== "production"` で gate。  
  - MSW/フィクスチャを `msw=1` 時のみ dynamic import し、デフォルト preview から除外。  
- **初期シェルを軽量化（体感 -0.2〜-0.4s）**  
  - `index.html` に AppShell の最小マークアップ + クリティカル CSS を直書きし、Charts main を `Suspense fallback` で即描画。  
  - LCP ターゲット（ヘッダ or タブ）を事前レンダーし、JS 完了前に 1st paint を発火させる。  
- **計測継続**  
  - 上記施策ごとに `lhci collect --config artifacts/perf/orca-master/...` を再走し、FCP/LCP 差分を同 RUN_ID ハッシュで記録。

## 5. 追加メモ
- Service Worker 無効時の負荷増はなし（登録されず、リクエストも 0）。  
- 実 API 接続時は fetch 待ちが追加されるため、JS 体積削減と並行して初期フェッチを `defer`/`prefetch` 切替で評価予定。  
- 本メモは ORCA マスター性能計画（`docs/web-client/ux/performance/orca-master-performance-plan.md`）の補助資料としてリンク済み。

---

## 2025-11-24 React DevTools hook エラー解消 & 再計測（RUN_ID=`20251124T200000Z`, 親=`20251124T000000Z`）

- 原因
  - `manualChunks` で `vendor-react` を強制分割した結果、バンドル内に React helper が二重展開され、`react-is` 側の `AsyncMode` 代入で `TypeError: Cannot set properties of undefined (setting 'AsyncMode')` が発生しハイドレーションが停止していた。
- 対応
  - `vite.config.ts` の `manualChunks` を削除し、Vite 既定の分割へ戻した。
  - headless 実行時のみ `public/perf-env-boot.js` で `__REACT_DEVTOOLS_GLOBAL_HOOK__` を `undefined` 固定し、RUM runId=`20251124T200000Z` を共有。
  - Web Vitals 送信先を `window.location.origin/__perf-log` へ変更し、HTTPS でも mixed content を回避。
- 計測（LHCI devtools throttle, 3run, MSW）
  - すべて `/login` へリダイレクトしたが NO_FCP は発生せず完走。FCP/LCP/CLS/INP (median): **0.133s / 0.133s / 0 / 0.133s**。
  - 成果物: `artifacts/perf/orca-master/20251124T200000Z/msw/lhci/`（3 run HTML/JSON）。
- RUM
  - `artifacts/perf/orca-master/20251124T200000Z/rum/` に 23 件保存（runId=`20251124T200000Z`, mswEnabled=true）。
- 次ステップ
  - manualChunks を外したことで初期 JS は再び一括化した。ログインをスキップした `/charts/72001?msw=1&perf=1` で再計測し、FCP/LCP への影響を確認する。

---

## 2025-11-24 FCP 改善試作 & 再計測状況（RUN_ID=`20251124T193000Z`, 親=`20251124T000000Z`）

- 実装サマリ
  - ルーティングを `React.lazy` へ切替し、Charts/Reception/Admin/Patiens を遅延ロード化。`vite.config.ts` に `manualChunks` を追加し、`vendor-react`/`vendor-query`/`vendor-emotion` と機能別 chunk を分離。
  - `index.html` に軽量 AppShell（スケルトン + クリティカル CSS）を直書きし、JS 実行前に 1st paint が走るように変更。
  - Telemetry/Audit/Security 初期化を動的 import に変更し、`VITE_ENABLE_TELEMETRY` が無効な prod ビルドでは OTEL 依存をバンドルから外れるようにした。
  - RUM runId/保存先を RUN_ID に合わせて更新（Vite runId=`20251124T193000Z`）。
- ビルド結果（`npm run build` → 成功）
  - entry `index-huccv5Bk.js` 6.56 kB gzip, `vendor-react` 84.31 kB gzip, `charts` 103.30 kB gzip, `administration` 76.77 kB gzip, `reception` 24.12 kB gzip, `patients` 24.80 kB gzip。単一巨大バンドル（377 kB gzip）から分割済み。
- 計測試行
  - `npm run preview -- --host 0.0.0.0 --port 4173` (HTTPS, MSW 無効) 起動済み。
  - `npx lhci collect --url=https://localhost:4173/charts/72001?msw=1&perf=1 --numberOfRuns=3 ...` を実行したが、ページロード時に `TypeError: Cannot set properties of undefined (setting 'AsyncMode')`（`vendor-react-C8svYgla.js` 内、React DevTools hook 周り）で NO_FCP となり、LHR を取得できず。画面は AppShell スケルトンのまま非ハイドレート。
  - RUM エンドポイントは動作し、`artifacts/perf/orca-master/20251124T193000Z/rum/` に web-vitals ログを保存（ただし runId が旧値 `20251124T180000Z` のものが混在）。
- 既知課題 / 次ステップ
  1. React DevTools hook 初期化エラーの原因切り分け（LHCI/Lighthouse が挿入する hook の有無を確認し、必要ならプレビュー配信用の防御 stub を head で定義）。
  2. `?msw=1&perf=1` でのハイドレーション確認（Playwright で body.innerHTML 変化と console error を取得するスクリプトを追加予定）。
  3. RUM の runId 整合性を修正し、計測リトライ後に `.../msw/lhci/` へ 3run JSON/HTML を保存、前回（20251124T180000Z）との差分を算出。
