# 04A3 WEBクライアント受付UX検証とDOC_STATUS反映

- **RUN_ID=20251205T200000Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、`setup-modernized-env.sh`（WEB_CLIENT_MODE=npm/docker いずれも可）でローカル起動したモダナイズ版サーバー＋ Web クライアントを使って Reception→Charts の `tone=server` / `dataSourceTransition=server` / `missingMaster` を検証し、DOC_STATUS／UX ドキュメントへ反映する。Stage 接続は 06_STAGE検証タスクへ委譲。
- 期間: 2025-12-05 21:55 - 22:05 JST（優先度: high / 緊急度: medium）。
- YAML ID: `src/outpatient_ux_modernization/04A3_WEBクライアント受付UX検証とDOC_STATUS反映.md`

## 1. 目的
1. `setup-modernized-env.sh` でローカルのモダナイズ版サーバーを起動し、Reception→Charts のフローを `VITE_DISABLE_MSW=0`（通常接続）で走らせて `dataSourceTransition=server` と `missingMaster` バナーの tone/ARIA 表示が UX ポリシーと一致するか確認する。
2. `VITE_DISABLE_MSW=1` の無通信モードでも UI が落ちずに fallback 表示できるか、`missingMaster=false` ケースの `aria-live` が `polite` に切り替わるかを確認する。
3. ローカル検証のスクリーンショット・補助ログを `artifacts/webclient/e2e/20251205T200000Z-reception/` に保存し、`docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md` に手順と観測結果を記録。`docs/web-client/planning/phase2/DOC_STATUS.md` / `docs/web-client/ux/ux-documentation-plan.md` に RUN_ID と証跡を反映する。

## 2. 実施結果
- ローカルモダナイズ版サーバーでの Reception→Charts 検証は未着手。環境切替（Stage→ローカル）に伴い、旧 Stage 試走結果は参考情報として保持しつつ本タスクの達成条件には含めない。
- 参考（旧計画: Stage 試走）: `stage.open-dolphin` の DNS が解決できず ORCA/Charts データは取得不可。詳細は `docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md` の旧記録を参照（再検証時に上書き予定）。

## 3. 反映内容
- DOC_STATUS / UX 計画はローカル検証完了後に更新予定（現状は旧 Stage 試走のメモのみ）。RUN_ID と証跡パスはローカル検証ログで上書きする。
- operations log `docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md` はローカル検証手順と結果を追記・上書きする前提で保持。

## 4. 次のアクション
1. `setup-modernized-env.sh` でモダナイズ版サーバー＋ Web クライアントをローカル起動し、Reception→Charts を通常接続／`VITE_DISABLE_MSW=1` の両モードで走らせてスクリーンショットとログを取得する。
2. `artifacts/webclient/e2e/20251205T200000Z-reception/` にキャプチャと補助ログを保存し、operations log（`docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md`）へ検証条件・観測結果を整理して上書き。
3. DOC_STATUS の Web クライアント UX/Features 行と `docs/web-client/ux/ux-documentation-plan.md` にローカル検証結果と RUN_ID/証跡パスを追記し、ガント progress を完了相当へ更新する。
