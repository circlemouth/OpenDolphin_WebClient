# 04A3 WEBクライアント受付UX検証とDOC_STATUS反映

- **RUN_ID=20251207T113156Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、ローカル Web クライアント（MSW 有効）で Reception→Charts のトーン、ARIA、エラー時フォールバックを確認し、DOC_STATUS へ反映する。Stage/Preview 接続は実施しない。
- 期間: 2025-12-07 11:32 - 11:36 UTC（優先度: high / 緊急度: medium）。
- YAML ID: `src/outpatient_ux_modernization/04A3_WEBクライアント受付UX検証とDOC_STATUS反映.md`

## 1. 目的
1. `VITE_DEV_USE_HTTPS=0` で dev サーバーを起動し、`VITE_DISABLE_MSW=0`（通常接続）で Reception→Charts の `tone=server` / `dataSourceTransition=server` / `missingMaster` バナーが UX ポリシー（aria-live・文言・バッジ）と一致するか確認する。
2. `mode=fallback` で API を abort し、無通信時もクラッシュせず warning トーンでフォールバックし続けること、ARIA ライブ領域が assertive のままになることを再確認する。
3. スクリーンショット・補助ログを `artifacts/webclient/e2e/20251207T113156Z-reception/` に保存し、`docs/server-modernization/phase2/operations/logs/20251207T113156Z-reception-qa.md` に手順と観測結果を記録。DOC_STATUS へ RUN_ID と証跡を反映する。

## 2. 実施結果
- 通常接続（MSW 有効, port 4173, `VITE_DEV_USE_HTTPS=0`)
  - missingMaster=true: ToneBanner aria-live=assertive（warning）、「次アクション: マスタ再取得」。StatusBadge missingMaster=true / cacheHit=false。telemetry `resolve_master`→`charts_orchestration` に `dataSourceTransition=server` / missingMaster=true / cacheHit=false を記録。
  - missingMaster=false: ToneBanner aria-live=polite（info）、「cacheHit=true：再送直前の安定状態」。StatusBadge missingMaster=false / cacheHit=true。telemetry 2 ステージで missingMaster=false / cacheHit=true / dataSourceTransition=server を保持。
- 無通信（mode=fallback）
  - API abort でも UI は描画継続し、初期値 missingMaster=true / cacheHit=false / dataSourceTransition=snapshot を warning トーン（aria-live=assertive）で表示。`[outpatient-mock] failed to hydrate flags` ログのみでクラッシュなし。telemetry は 0 件（fetch 失敗のため）。
- スクリーンショット・ログ: `artifacts/webclient/e2e/20251207T113156Z-reception/{fulfill-warn.png,fulfill-info.png,fallback-fallback.png,fulfill-results.json,fallback-results.json}`。
- 詳細ログ: `docs/server-modernization/phase2/operations/logs/20251207T113156Z-reception-qa.md` に手順・観測と課題を記載。
- 補足: LoginScreen で SubtleCrypto の MD5 未対応警告が出るが CryptoJS フォールバックで処理継続（UX 影響なし）。

## 3. 反映内容
- operations log: `docs/server-modernization/phase2/operations/logs/20251207T113156Z-reception-qa.md` を追加。
- DOC_STATUS「Web クライアント UX/Features」行へ RUN_ID と証跡パスを追記。
- `docs/web-client/ux/ux-documentation-plan.md` の進行メモに本 RUN の完了を追記（別タスクで進行）。

## 4. 次のアクション
1. fallback 時 telemetry 空転への対処方針検討（別 RUN で起票）。依存: `tmp/run-outpatient-ux.mjs` の abort シナリオ、`artifacts/webclient/e2e/20251207T113156Z-reception/fallback-{results.json,fallback.png}` の観測結果。
2. Stage 接続（06_TASK）を再許可されたタイミングで実 API との tone/aria-live を突合する。

## 5. 進捗メモ（RUN_ID=20251207T113156Z）
- 2025-12-07 11:32-11:36 UTC: Reception→Charts の通常接続/無通信 QA 実施、スクリーンショット採取。
- 2025-12-07 11:38 UTC: operations log 追加（`docs/server-modernization/phase2/operations/logs/20251207T113156Z-reception-qa.md`）。
- 2025-12-07 11:40 UTC: DOC_STATUS 更新、証跡パス記載。
- 残件: fallback telemetry 空転の扱い検討を別 RUN で起票予定（依存ファイルは上記参照）。
