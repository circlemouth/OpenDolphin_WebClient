# 04A3 WEBクライアント受付UX検証とDOC_STATUS反映

- **RUN_ID=20251207T062903Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、ローカル起動したモダナイズ版サーバー＋ Web クライアントで Reception→Charts の `tone=server` / `dataSourceTransition=server` / `missingMaster` を検証し、DOC_STATUS／UX ドキュメントへ反映する。Stage 接続は 06_STAGE検証タスクへ委譲。
- 期間: 2025-12-07 06:42 - 06:48 UTC（優先度: high / 緊急度: medium）。
- YAML ID: `src/outpatient_ux_modernization/04A3_WEBクライアント受付UX検証とDOC_STATUS反映.md`

## 1. 目的
1. `VITE_DISABLE_MSW=0`（通常接続）で Reception→Charts の `dataSourceTransition=server` / `missingMaster` バナーの tone／ARIA が UX ポリシーと一致するか確認する（missingMaster=true / false 両ケース）。
2. `VITE_DISABLE_MSW=1`（無通信）でも UI がクラッシュせず fallback 表示できるか、`missingMaster=false` 時に `aria-live=polite` へ切り替わることを再確認する。
3. スクリーンショット・補助ログを `artifacts/webclient/e2e/20251207T062903Z-reception/` に保存し、`docs/server-modernization/phase2/operations/logs/20251207T062903Z-reception-qa.md` に手順と観測結果を記録。`docs/web-client/planning/phase2/DOC_STATUS.md` / `docs/web-client/ux/ux-documentation-plan.md` へ RUN_ID と証跡を反映する。

## 2. 実施結果
- 通常接続（MSW有効, port 4173）
  - missingMaster=true: ToneBanner aria-live=assertive（warning）、StatusBadge missingMaster=true / cacheHit=false。telemetry `resolve_master`→`charts_orchestration` に `dataSourceTransition=server` を記録。
  - missingMaster=false: ToneBanner aria-live=polite（info）、StatusBadge missingMaster=false / cacheHit=true。telemetry 2 ステージで cacheHit=true / missingMaster=false を保持。
- 無通信（MSW無効, port 4174）
  - API を abort しても UI は描画を継続し、初期値 missingMaster=true / cacheHit=false / dataSourceTransition=snapshot を warning トーン（aria-live=assertive）で表示。telemetry は発火せず。
- スクリーンショット・ログ: `artifacts/webclient/e2e/20251207T062903Z-reception/{fulfill-warn.png,fulfill-info.png,fallback-fallback.png,fulfill-results.json,fallback-results.json}`。
- 詳細ログ: `docs/server-modernization/phase2/operations/logs/20251207T062903Z-reception-qa.md` に手順・観測と既知課題を記載。
- QA（MSW有効/無効両方）は完了済み（RUN_ID=20251207T062903Z）。

## 3. 反映内容
- operations log: `docs/server-modernization/phase2/operations/logs/20251207T062903Z-reception-qa.md` を新規追加。
- DOC_STATUS「Web クライアント UX/Features」行へ RUN_ID と証跡パスを追記済み。
- `docs/web-client/ux/ux-documentation-plan.md` の進行メモに本 RUN の完了とガント完了相当を追記。

## 4. 次のアクション
1. fallback 時 telemetry 空転への対処方針検討（別 RUN で起票）。依存: `tmp/run-outpatient-ux.mjs` の abort シナリオ、`artifacts/webclient/e2e/20251207T062903Z-reception/fallback-{results.json,fallback.png}` の観測結果。
2. Stage 接続（06_TASK）を再許可されたタイミングで再実測し、server 実 API での tone/aria-live を突合する。

## 5. 進捗メモ（RUN_ID=20251207T062903Z）
- 2025-12-07 06:42-06:48 UTC: Reception→Charts の通常接続/無通信 QA 実施、スクリーンショット保存。
- 2025-12-07 06:50 UTC: operations log 追記（`docs/server-modernization/phase2/operations/logs/20251207T062903Z-reception-qa.md`）。
- 2025-12-07 06:55 UTC: DOC_STATUS / UX ドキュメントへ反映済み。
- 残件: fallback telemetry 空転の扱い検討を別 RUN で起票予定（依存ファイルは上記参照）。
