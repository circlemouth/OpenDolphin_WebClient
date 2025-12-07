# 04B3 WEBクライアントCharts/Patients UX検証

- **RUN_ID=20251207T114629Z／ステータス: done**。既存起動中の Vite 開発サーバー（`http://localhost:5173`）へ接続し、Playwright の `route.fulfill` で API をスタブして Charts→Patients のトーン／ARIA／バリデーション／レスポンシブを確認。サーバーの起動・停止や Python 実行は行っていない。
- YAML ID: `src/outpatient_ux_modernization/04B3_WEBクライアントChartsPatientsUX検証.md`
- 証跡: `artifacts/webclient/e2e/20251207T114629Z-charts-patients/`（スクリーンショット 5 枚＋states.json＋console.log＋login-validation.json＋mobile-metrics.json）、ops ログ `docs/server-modernization/phase2/operations/logs/20251207T114629Z-charts-patients.md`。

## 1. 目的
1. Charts/Patients での `missingMaster` / `cacheHit` / `dataSourceTransition` のトーン、`aria-live`、監査メタ表示を reception と同一ポリシーで確認する。
2. AuthServiceControls の切替で telemetry（`resolve_master`→`charts_orchestration`）が発火することを確認し、flags 状態を JSON で残す。
3. ログイン必須フィールドのバリデーション、日本語メッセージ、モバイル幅でのレイアウト崩れ有無を確認する。

## 2. 実施結果
- **環境**: 既存 Vite dev server (`localhost:5173`) を利用。React DevTools preamble エラーを回避するため `context.addInitScript(() => window.__ALLOW_REACT_DEVTOOLS__ = true)` を付与。`/api/user/**`・`/api01rv2/**`・`/orca21/**`・`/orca12/**` を Playwright `route.fulfill` で 200 応答に固定（ORCA 接続なし）。
- **トーン/ARIA**（states.json）  
  - デフォルト: `dataSourceTransition=snapshot`、`missingMaster=true`、`cacheHit=false`。ToneBanner/DocumentTimeline/PatientsTab は `aria-live=assertive`、RUN_ID（セッション生成値）`20251207T115505Z`。  
  - server+cacheHit: missingMaster=false / cacheHit=true / dataSourceTransition=server に切替すると ToneBanner/DocumentTimeline/PatientsTab の `aria-live` が `polite` へ降格、バッジ値更新。  
  - fallback: missingMaster=true のまま cacheHit=true / dataSourceTransition=fallback では assertive に戻り、ToneBanner 文言は missingMaster 優先で表示。
- **telemetry**: console.log に `resolve_master` と `charts_orchestration` が各トグルで 2 ステージ出力され、`dataSourceTransition` 値が snapshot→server→fallback と遷移（`artifacts/.../console.log`）。
- **入力バリデーション**: 未入力で送信すると `施設IDを入力してください。/ユーザーIDを入力してください。/パスワードを入力してください。` を表示（`login-validation.json`＋05-login-validation.png）。MD5 は headless で SubtleCrypto が未サポートのため警告後に CryptoJS へフォールバックすることを確認（console.log）。
- **レスポンシブ**: 430x900 で 04-charts-mobile.png を採取。nav は wrap する一方、`scrollWidth=457px` / `clientWidth=430px` で横スクロールが発生（mobile-metrics.json）。親コンテナの `padding-inline` 過多と推測。

## 3. 反映状況
- `.kamui/apps/webclient-ux-outpatient-modernization-plan.yaml`: 本 RUN_ID 分の progress=100% へ更新予定（計画シート反映のみ残タスクなし）。
- DOC_STATUS `Web クライアント UX/Features` 行へ RUN_ID と証跡パスを追記済み（2025-12-07 付け）。
- Manager checklist（`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`）は ops ログ・証跡リンクと RUN_ID を引用して整合可。

## 4. 課題/対応策
- モバイル幅で 27px 程度の横スクロールが残存。次スプリントで `.app-shell__body` もしくは `.charts-page` の `padding-inline` を 16px 以下に縮小、または `overflow-x:hidden` を親に付ける改修を検討。
- Playwright 実行時に SubtleCrypto が未対応となる環境では MD5 警告が出る。クリティカルではないが、ログノイズ低減のため headless 用 fallback ログレベルを info→debug に落とす案を別チケットで検討。

## 5. 追加証跡
- スクリーンショット:  
  - `01-charts-default.png`（snapshot/missingMaster=true/cacheHit=false）  
  - `02-charts-server-cachehit.png`（server/cacheHit=true/missingMaster=false）  
  - `03-charts-fallback-missingMaster.png`（fallback/cacheHit=true/missingMaster=true）  
  - `04-charts-mobile.png`（モバイル幅 430px、横スクロール確認）  
  - `05-login-validation.png`（未入力バリデーション）
- JSON/ログ: `states.json`（トーン/ARIAサマリ）、`console.log`（telemetry 出力＋MD5 警告）、`login-validation.json`、`mobile-metrics.json`。
- ops ログ: `docs/server-modernization/phase2/operations/logs/20251207T114629Z-charts-patients.md`（手順・観測まとめ）。
