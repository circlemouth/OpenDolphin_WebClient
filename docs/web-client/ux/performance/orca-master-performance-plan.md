# ORCA マスター取得のパフォーマンス予算と計測計画

- RUN_ID: `20251124T180000Z`（親: `20251124T000000Z`）
- 実測 RUN_ID: `20251124T180000Z`（親: `20251124T000000Z`、本タスクで採取）
- スコープ: `/charts/*` 画面での ORCA マスター取得（MSW/実API 切替を含む）とリスト描画まで
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md
- 前提: Python スクリプト禁止。開発 ORCA は `docs/web-client/operations/mac-dev-login.local.md` に記載の経路のみ使用。

## 1. 計測プロファイルと共通前提
| プロファイル | ハード/ネット | Chrome 設定 | 備考 |
| --- | --- | --- | --- |
| デスクトップ | 4 vCPU / 8 GB / Ethernet 相当 (300Mbps, 20ms RTT) | Lighthouse preset=desktop, throttling=150ms RTT / 1.6Mbps down / 0.8Mbps up | CI では `lhci collect` の desktop プリセットを使用 |
| モバイル | Moto G4 相当 / 1.5Mbps, 150ms RTT / CPU 4x slowdown | Lighthouse preset=mobile, throttlingMethod=simulate | DevTools Performance panel でも同一設定で再現 |

- UI 前提: `/charts/72001` を代表画面とし、MSW 有効 (`WEB_ORCA_MASTER_SOURCE=msw`) → 無効 (`server`) を往復させる。
- 初期状態: ログイン済み・Charts ロック済み・オーダパネル開状態。初回描画を対象にする。

## 2. パフォーマンス予算（デスクトップ / モバイル）
| 指標 | 目標（Desktop） | 目標（Mobile） | 補足 |
| --- | --- | --- | --- |
| FCP | ≤ 1.8s | ≤ 2.5s | 初回ペイント。Lighthouse/DevTools の `first-contentful-paint` を採用 |
| LCP | ≤ 2.5s | ≤ 3.5s | 主画面の診療科ラベル or タブを LCP ターゲットに固定 |
| CLS | ≤ 0.05 | ≤ 0.1 | マスターリスト差し替え時のレイアウトシフトを含めて測定 |
| INP | ≤ 200ms | ≤ 300ms | 「検索」ボタン → 結果レンダー完了までを Interaction 名でラベル付け |
| TTFB (初回 HTML) | ≤ 500ms | ≤ 800ms | 逆プロキシ + SSR を想定。現状 SPA なので参考値 |
| ORCA master fetch 往復 | ≤ 700ms | ≤ 1200ms | `/orca/master/*`, `/orca/tensu/ten` 1 リクエストあたり（ヘッダ含む） |
| データ整形（JSON→UI props） | ≤ 120ms | ≤ 180ms | `performance.mark` で計測、React へ渡す直前まで |
| 描画完了（フェッチ完了→list paint） | ≤ 250ms | ≤ 350ms | React commit まで。DevTools `Largest Contentful Paint` で裏付け |
| 1 リクエスト通信量 | ≤ 150 KB (gzip) | ≤ 150 KB (gzip) | JSON ペイロード。HAR で確認 |
| 初回ロード JS 軽量化枠 | ≤ 300 KB (gzip) | ≤ 250 KB (gzip) | charts bundle + MSW 切替フラグ含む |

- 逸脱アラート: LCP > 3.5s (desktop) / 4.5s (mobile) または INP > 500ms 発生時はデグレ扱い。
- サーバー未実装区間は MSW/スナップショットで計測し、実 API 提供後に同条件で再計測する。

## 3. 計測シナリオ
1. **MSW 前提**: `VITE_DISABLE_MSW=0`。Charts を開き、検索キーワード「初診」で `/orca/tensu/name/*` を 1 回発火。結果リスト描画までを採取。
2. **実サーバー前提**: `VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET=http://<mac-dev>`。同一操作を実 API で実施。API レスポンスはログに保存。
3. **切替往復**: 同一セッションで MSW→server→MSW を切替え、`dataSourceTransition`（監査メタ）が 2 回送出されることを確認し、LCP/INP の変化を比較。
4. **ペイロード上限**: `/orca/tensu/ten?min=110000000&max=110000199` の最大件数応答で HAR を保存し、通信量と整形時間を計測。

## 4. 計測手順とツール
### 4.1 Lighthouse CI（推奨）
- テンプレ: `artifacts/perf/orca-master/20251124T171500Z/templates/lighthouse.config.js`
- コマンド例（MSW 有効・デスクトップ）
  - `npm run dev -- --host 0.0.0.0 --port 4173`
  - `npx @lhci/cli collect --config=artifacts/perf/orca-master/20251124T171500Z/templates/lighthouse.config.js --url=http://localhost:4173/charts/72001?msw=1`
- 実サーバー計測時は `?msw=0` か `VITE_DISABLE_MSW=1` を URL/環境変数で切替。
- 出力は `./.lighthouseci` の HAR/JSON を `artifacts/perf/orca-master/<RUN_ID>/lhci/` へ移動して保存。

### 4.2 Chrome DevTools + Web Vitals (RUM)
- DevTools Performance panel で CPU/Network を上記プロファイルに設定し、`Ctrl+E` で記録 → `Save profile...`。
- RUM: `artifacts/perf/orca-master/20251124T171500Z/templates/web-vitals-rum.js` を `web-client/public/` に一時配置し、`<script defer src="/web-vitals-rum.js"></script>` で読み込む。
- `window.__PERF_ENDPOINT__` をローカル API（例: `/api/perf/vitals`）に設定し、CLS/LCP/INP/FCP/TTFB を `runId=20251124T171500Z` 付きで送出。MSW/実サーバーの 2 周期を同じ runId で揃える。

### 4.3 HAR / ペイロードサイズ採取
- DevTools Network → 右クリック「Save all as HAR with content」で保存。
- 取得ファイルを `artifacts/perf/orca-master/<RUN_ID>/har/` へ置き、主要リクエスト `/orca/master/*`, `/orca/tensu/ten` の `content.size` / `transferSize` を記録。
- JSON ペイロード単体は `curl ... | wc -c` でサイズ確認してもよい（Python 禁止）。

### 4.4 データ整形時間の測り方
- `web-client/src/features/charts/api/orca-api.ts` のデータ整形直前/直後に `performance.mark('orca-master:normalize:start')` / `performance.mark('orca-master:normalize:end')` を追加し、`performance.measure('orca-master:normalize')` をコンソールへ出力。
- DevTools Performance の Timings レーンで measure 名を確認し、予算 120ms (desktop) / 180ms (mobile) を超過しないか確認。

## 5. 成果物配置
- 本計画: `docs/web-client/ux/performance/orca-master-performance-plan.md`
- テンプレ/サンプル: `artifacts/perf/orca-master/20251124T171500Z/templates/`
  - `lighthouse.config.js` … LHCI 設定例（desktop/mobile プロファイル切替可能）
  - `web-vitals-rum.js` … RUM 送信スニペット（@web-vitals/rum 依存）
  - `README.md` … 実行手順、採取物の置き場命名規約

## 6. 次アクション
- 実 API 提供後、同一シナリオで再計測し `artifacts/perf/orca-master/<新RUN_ID>/` に保存。DOC_STATUS 備考を更新。
- INP/LCP 逸脱時は Charts UI のリスト仮想化／ローディング分割（検索→整形→描画の分割）を検討し、修正案を `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md` に追記する。

## 7. 2025-11-24 実測まとめ（RUN_ID=`20251124T173000Z`）
- プロファイル: MSW のみ（実 API は `VITE_DEV_PROXY_TARGET` 未設定につき未実施）。`VITE_DEV_USE_HTTPS=0` で HTTP 配信、`npm run dev -- --host 0.0.0.0 --port 4173` を別ターミナル起動。
- LHCI（desktop preset, throttling simulate）: median `performance=0.55`, `FCP≈28.6s`, `LCP≈55.8s`, `CLS=0`, `TBT=0`。LCP/INP は予算超過（2.5s/200ms 目標未達）。dev ビルド＋モックでの計測であり、SSR 不在・初回描画遅延が顕著。要: `npm run build && npm run preview` での再計測とルーティング初期化の確認。
- Web Vitals RUM（Playwright + `?perf=1&msw=1`, runId=`20251124T173000Z`）: `TTFB=10.7ms`, `FCP=368ms`, `LCP=368ms`, `CLS=0`, `INP=8ms`。モック環境かつ未スロットルのため参考値。`/__perf-log` は未実装で 404（コンソール記録のみ）。
- 成果物: `artifacts/perf/orca-master/20251124T173000Z/msw/lhci/`（3 run の JSON/HTML）、`.../msw/web-vitals.json`（RUM ログ）。`.../live/README.md` に未実施理由を記載。
- 課題/次ステップ: (1) プロダクションビルド + preview で LHCI を再実行し、LCP/INP の実態を確認。(2) `/__perf-log` を簡易エンドポイントまたは file sink で受けて 404 を解消。(3) 実 API プロファイル（`VITE_DEV_PROXY_TARGET`）が整い次第、`live/` で同手順を繰り返し、DOC_STATUS 備考を更新。

## 8. 2025-11-24 再計測（RUN_ID=`20251124T180000Z`）
- プロファイル: プロダクションビルド + `npm run preview -- --host 0.0.0.0 --port 4173`（`VITE_DEV_USE_HTTPS=0`）。MSW 前提（preview では Service Worker 無効だが `/charts/72001?msw=1` を使用）。
- LHCI（desktop preset, simulate throttling）: median `performance=0.75`, `FCP≈2.28s`（予算1.8s超過）, `LCP≈2.36s`（予算2.5s内）, `CLS=0`（OK）, `INP=N/A（シナリオ無操作のため未出力）`, `TTFB≈1.0ms`。成果物: `artifacts/perf/orca-master/20251124T180000Z/msw/lhci/`。
- RUM: sendBeacon 先を `http://localhost:4173/__perf-log` に固定し、Vite preview middleware でファイル保存。`?perf=1&msw=1` で手動アクセスし、`artifacts/perf/orca-master/20251124T180000Z/rum/` に 3 件保存（CLS/LCP/FCP 記録、mswEnabled=true を確認）。ランディングで 204 応答・ログファイル生成を確認。
- Live プロファイル: `VITE_DEV_PROXY_TARGET` 未提供のため未実施。理由と再計測手順を `artifacts/perf/orca-master/20251124T180000Z/live/README.md` に記載。
- 次ステップ: (1) INP 計測用に Interaction を含むシナリオ（検索クリック→結果描画）で再走行。必要なら LHCI puppeteerScript で操作を追加。 (2) 実 API 接続先確定後、`VITE_DISABLE_MSW=1` で同一手順を実施し、msw/live で比較。 (3) `performance.mark` 計測を UI へ追加してデータ整形時間を確認。
