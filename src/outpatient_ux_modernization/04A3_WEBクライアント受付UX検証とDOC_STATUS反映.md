# 04A3 WEBクライアント受付UX検証とDOC_STATUS反映

- **RUN_ID=20251205T200000Z**。AGENTS→`docs/web-client/README.md`→`docs/server-modernization/phase2/INDEX.md`→`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の参照チェーンに従い、Reception→Charts の `tone=server` / `dataSourceTransition=server` 連携を Stage 実サーバー経由で QA し、DOC_STATUS／UX ドキュメントへ反映する。
- 期間: 2025-12-05 21:55 - 22:05 JST（優先度: high / 緊急度: medium）。
- YAML ID: `src/outpatient_ux_modernization/04A3_WEBクライアント受付UX検証とDOC_STATUS反映.md`

## 1. 目的
1. `VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET=http://stage.open-dolphin` を含む Stage シグネチャで Reception→Charts を再走し、`dataSourceTransition=server` と `missingMaster` バナーの tone/ARIA 表示が Stage 側の ORCA から伝播していることを確認する。
2. Playwright スクリーンショット（`artifacts/webclient/e2e/20251205T200000Z-reception/reception-stage.png`）と補助ログ（`artifacts/webclient/e2e/20251205T200000Z-reception/reception-stage.log`）を作成し、`docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md` へ実行手順・観測結果を残す。
3. `docs/web-client/planning/phase2/DOC_STATUS.md` の Web クライアント UX/Features 行と `docs/web-client/ux/ux-documentation-plan.md` のステータス欄に RUN_ID/証跡を追記し、`missingMaster` 周りの QA に Stage ログを紐づける。

## 2. 実施結果
- Playwright で Reception 画面をキャプチャし Stage ステータスを試行したが、`stage.open-dolphin` の DNS 解決ができず Stage サーバーからの ORCA/Charts データを取得できず。`dataSourceTransition`/`missingMaster` も Stage から返されず、ToneBanner はローカルの「接続先未設定」状態のまま変化がなかった。
- `curl -I http://stage.open-dolphin` でも `Could not resolve host` となり Stage への到達性がないことを確認。詳細は operations log へ記録済み。

## 3. 反映内容
- DOC_STATUS の Web クライアント UX/Features 行に RUN_ID=`20251205T200000Z` の Stage QA 試走とログ/スクリーンショットへのリンクを追記。
- `docs/web-client/ux/ux-documentation-plan.md` の `次ステップ` に上記 QA 経験と DNS 障害を追記し、再実行予定を明記。
- `docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md` には環境変数・コマンド・失敗要因・次アクションを整理した。

## 4. 次のアクション
1. `stage.open-dolphin` の DNS/ネットワークが復旧した時点で同じ RUN_ID を再利用し、Reception→Charts を再度走らせて `dataSourceTransition=server` と `missingMaster` バナーを Stage から確認・記録する。
2. 再実行時は `docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md` を上書きし、Playwright スクリーンショット・補助ログ・DOC_STATUS/UX 計画を最新状態に更新する。
