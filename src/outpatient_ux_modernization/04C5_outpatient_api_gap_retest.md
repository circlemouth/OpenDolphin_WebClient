# 04C5 外来 API ギャップ再検証（RUN_ID=20251209T150000Z、parent=20251209T071955Z）

- ステータス: **Blocked（Stage/Preview 未復旧） / ローカル正常** — dev proxy 100.102.17.40 への 8000/443/8443 が引き続き TCP タイムアウト。ローカル modernized サーバーでは 04C4 stub の 200 応答を再確認済み。

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- 期間/優先度: 2025-12-19 09:00 - 2025-12-20 18:00 JST（計画） / Priority=High / Urgency=High
- スコープ: 04C4 で stub 実装した `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` の 404 解消を、MSW 無効化＋dev proxy（Stage/Preview を含む）経路で確認し、tone/telemetry (`resolveMasterSource` / `dataSourceTransition` / `cacheHit` / `missingMaster`) が Reception→Charts→Patients の一連の画面で整合していることを証跡化する。

## 0. 今回の実施サマリ（2025-12-09 JST）
- 実施日時: 2025-12-09 18:00-18:12 JST（UTC 09:00-09:12）
- 環境: `WEB_CLIENT_MODE=npm VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources`（既存プロセスを使用、再起動なし）
- 結果:
  - ローカル modernized サーバー: `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` が **HTTP 200**。`runId=20251208T124645Z`, `dataSourceTransition=server`, `cacheHit={false,true}`, `missingMaster=false`, `recordsReturned=1` を返却（traceId=`96e647c3-a8a2-4726-9829-d32edc06f883` / `deb71516-4910-4a3d-8831-58e7617e55fb`）。04C4 stub の 404/401 再発なし。
  - Stage/Preview dev proxy（100.102.17.40 の 8000/443/8443）: いずれも TCP タイムアウト（curl exit 28, TLS ハンドシェイク未到達）。UI 巡回は未実施。
- 証跡: `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md`, `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`（ローカル応答・コマンド・Stage/Preview タイムアウトログ）。
- 未了: Stage/Preview dev proxy 復旧後に UI tone/telemetry（Reception→Charts→Patients）と HAR/スクショを取得し、`missingMaster`/`cacheHit` 切替の異常系を fixture で再現する。

## 1. 前提・ルール
- RUN_ID は `20251209T150000Z`（parent=20251209T071955Z）で統一し、証跡・DOC_STATUS・manager checklist すべてに同じ値を記載する。
- ORCA 連携の検証は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の制約を守り、Stage/Preview への dev proxy 接続を行う際は証跡ログに経路と日時を記録する。ORCA 本番への直接アクセスは禁止。
- Python 実行禁止。Legacy `server/` 配下は変更しない。

## 2. 作業項目
1. **ローカル再検証 (MSW OFF)**  
   - `VITE_DISABLE_MSW=1 WEB_CLIENT_MODE=npm` で既存のモダナイズ版サーバーに接続し、Reception→Charts→Patients を通して 04C4 で追加した 2 エンドポイントが 200 応答することを確認。  
   - `resolveMasterSource/dataSourceTransition/cacheHit/missingMaster` をブラウザ Network/HAR で採取し、`artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/` に保存。  
   - **進捗:** curl で `/api01rv2/claim/outpatient/mock`（cacheHit=false, missingMaster=false, dataSourceTransition=server, runId=20251208T124645Z, traceId=96e647c3-a8a2-4726-9829-d32edc06f883）と `/orca21/medicalmodv2/outpatient`（cacheHit=true, missingMaster=false, traceId=deb71516-4910-4a3d-8831-58e7617e55fb）が **200 OK**。UI 巡回・HAR は dev server 起動状態のまま後続取得可。
2. **dev proxy 経由の疎通確認**  
   - `VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=<Stage or Preview host>` で同じ経路を再走し、stub ではなく実レスポンスでも 404 が解消されているか確認。接続先ホスト・日時・結果を `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md` に追記。  
   - **進捗:** `http://100.102.17.40:8000/openDolphin/resources/{api01rv2/claim/outpatient/mock, orca21/medicalmodv2/outpatient}` はいずれも TCP タイムアウト（curl exit 28, 5s）。`https://100.102.17.40:{443,8443}/` も同様に接続不可。ログ: `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/stage_http_8000*.txt`, `stage_https_{443,8443}.txt`。Stage/Preview ルート未復旧のため UI 巡回は保留。
3. **異常系・degarde パスの再現**  
   - fixture 切替や dev proxy のレスポンス差で `missingMaster=false/true`, `cacheHit=false` などの組み合わせを確認し、tone/telemetry の差分を `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/` に追記。  
   - **進捗:** dev proxy 未達のため異常系は未再現。Stage/Preview 復旧後に fixture 切替で `missingMaster`/`cacheHit` 差分を取得予定。ローカル dev server は起動中のため Playwright/手動で追加 HAR を採取可能。
4. **ドキュメント更新**  
    - `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md` に手順・結果・接続先・残課題を記録（本ファイルと同 RUN_ID でリンク）。  
   - `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md` に 404 解消結果と RUN_ID を追記し、`ORCA_API_STATUS.md` へ影響有無を明記。  
   - `docs/web-client/planning/phase2/DOC_STATUS.md` と `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の該当行に RUN_ID・証跡パス・結果を反映（本タスク終了後に実施）。

## 3. 成果物
- `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md`（接続・検証ログ）
- `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`（curl 応答・ヘッダ・dev proxy タイムアウトログ。後続で HAR/スクショを追加予定）
- 更新ドキュメント: `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md`、`ORCA_API_STATUS.md`、`docs/web-client/planning/phase2/DOC_STATUS.md`、`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`

## 4. リスクと対応
- Stage/Preview への dev proxy が権限・DNS で失敗する可能性: 証跡ログに失敗理由を残し、再試行スケジュールを提示してマネージャーへエスカレーション。
- stub 固定値のため異常系が再現できない場合: fixtures で `cacheHit/missingMaster` を変化させるか、05 デバッグ整備タスクへ課題を引き継ぐ。
- ORCA 実環境のレスポンス shape 差分: `web-client-api-mapping.md` と照合し、差分はログ・DOC_STATUS に明記する。
