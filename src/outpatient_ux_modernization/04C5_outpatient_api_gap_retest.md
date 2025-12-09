# 04C5 外来 API ギャップ再検証（RUN_ID=20251209T071955Z）

- ステータス: **Blocked / 未完了**（Stage/Preview dev proxy 100.102.17.40 への 8000/443/8443 が全て TCP タイムアウトのため UI 巡回不可。ローカル環境は 200 OK 継続）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- 期間/優先度: 2025-12-19 09:00 - 2025-12-20 18:00 JST（計画） / Priority=High / Urgency=High
- スコープ: 04C4 で stub 実装した `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` の 404 解消を、MSW 無効化＋dev proxy（Stage/Preview を含む）経路で確認し、tone/telemetry (`resolveMasterSource` / `dataSourceTransition` / `cacheHit` / `missingMaster`) が Reception→Charts→Patients の一連の画面で整合していることを証跡化する。

## 0. 今回の実施サマリ（2025-12-09 JST）
- 実施日時: 2025-12-09 16:21-16:35 JST（UTC 07:21-07:35）
- 環境: `WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources ./setup-modernized-env.sh`（ブランチ `master`, commit `e62be433a077aafc2d7d32460745e3317ca06a06`）
- 結果: ローカル modernized サーバーで 2 エンドポイントとも **200 OK**。`runId=20251208T124645Z`, `dataSourceTransition=server`, `cacheHit={false,true}`, `missingMaster=false` を返却（X-Trace-Id=`00fd5c2f-...`, `1bd08bdc-...`）。dev proxy 先 `http://100.102.17.40:8000/...` と `https://100.102.17.40:{443,8443}/...` はいずれも TCP タイムアウト（HTTP 000）。
- 証跡: `docs/server-modernization/phase2/operations/logs/20251209T071955Z-integration-gap-retest.md`, `artifacts/webclient/e2e/20251209T071955Z-outpatient-gap/`（curl 応答・ヘッダ・dev proxy 失敗ログ・Vite dev ログ・追加 connectivity ログ）。
- 未了: Stage/Preview dev proxy での UI 巡回（tone/telemetry 目視）は、到達性が復旧してから同 RUN_ID で再走する。復旧待ちのため本タスクは Blocked 扱い。必要なら後続 RUN_ID へ移管してクローズ可。

## 1. 前提・ルール
- RUN_ID は `20251209T071955Z` で統一し、証跡・DOC_STATUS・manager checklist すべてに同じ値を記載する。
- ORCA 連携の検証は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の制約を守り、Stage/Preview への dev proxy 接続を行う際は証跡ログに経路と日時を記録する。ORCA 本番への直接アクセスは禁止。
- Python 実行禁止。Legacy `server/` 配下は変更しない。

## 2. 作業項目
1. **ローカル再検証 (MSW OFF)**  
   - `VITE_DISABLE_MSW=1 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` でモダナイズ版サーバー＋Web クライアントを起動し、Reception→Charts→Patients を通して 04C4 で追加した 2 エンドポイントが 200 応答することを確認。  
   - `resolveMasterSource/dataSourceTransition/cacheHit/missingMaster` の値をブラウザコンソール・Network パネルで採取し、スクリーンショットと HAR を `artifacts/webclient/e2e/20251209T071955Z-outpatient-gap/` に保存。  
   - **進捗:** curl ベースで 2 エンドポイントの 200 応答と `dataSourceTransition=server` / `cacheHit={false,true}` / `missingMaster=false` / `runId=20251208T124645Z` を取得。UI 巡回は未実施（dev server MSW OFF で起動済み、後続で取得可）。
2. **dev proxy 経由の疎通確認**  
   - `VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=<Stage or Preview host>` で同じ経路を再走し、stub ではなく実レスポンスでも 404 が解消されているか確認。接続先ホスト・日時・結果を `docs/server-modernization/phase2/operations/logs/20251209T071955Z-integration-gap-retest.md` に追記。  
   - **進捗:** `http://100.102.17.40:8000/openDolphin/resources/...` への POST は両方とも `HTTP 000`（タイムアウト、ヘッダ/ボディ無し）。追加で `https://100.102.17.40:{443,8443}/` も 5s で TCP タイムアウト。詳細ログ: `artifacts/webclient/e2e/20251209T071955Z-outpatient-gap/stage_connectivity_20251209T0730Z.txt`。Stage/Preview ルートは未復旧。
3. **異常系・degarde パスの再現**  
   - fixture 切替や dev proxy のレスポンス差で `missingMaster=false/true`, `cacheHit=false` などの組み合わせを確認し、tone/telemetry の差分を `artifacts/webclient/e2e/20251209T071955Z-outpatient-gap/` に追記。  
   - **進捗:** dev proxy 未達のため異常系は未再現。MSW OFF dev server でブラウザ／Playwright 巡回し、`missingMaster`/`cacheHit` 切替を後続で取得可能。
4. **ドキュメント更新**  
   - `docs/server-modernization/phase2/operations/logs/20251209T071955Z-integration-gap-retest.md` に手順・結果・接続先・残課題を記録（本ファイルと同 RUN_ID でリンク）。  
   - `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md` に 404 解消結果と RUN_ID を追記し、`ORCA_API_STATUS.md` へ影響有無を明記。  
   - `docs/web-client/planning/phase2/DOC_STATUS.md` と `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の該当行に RUN_ID・証跡パス・結果を反映（本タスク終了後に実施）。

## 3. 成果物
- `docs/server-modernization/phase2/operations/logs/20251209T071955Z-integration-gap-retest.md`（接続・検証ログ）
- `artifacts/webclient/e2e/20251209T071955Z-outpatient-gap/`（curl 応答・ヘッダ・dev proxy 失敗ログ・後続で HAR/スクショを追加予定）
- 更新ドキュメント: `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md`、`ORCA_API_STATUS.md`、`docs/web-client/planning/phase2/DOC_STATUS.md`、`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`

## 4. リスクと対応
- Stage/Preview への dev proxy が権限・DNS で失敗する可能性: 証跡ログに失敗理由を残し、再試行スケジュールを提示してマネージャーへエスカレーション。
- stub 固定値のため異常系が再現できない場合: fixtures で `cacheHit/missingMaster` を変化させるか、05 デバッグ整備タスクへ課題を引き継ぐ。
- ORCA 実環境のレスポンス shape 差分: `web-client-api-mapping.md` と照合し、差分はログ・DOC_STATUS に明記する。
