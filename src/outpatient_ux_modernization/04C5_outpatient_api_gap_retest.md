# 04C5 外来 API ギャップ再検証（RUN_ID=20251209T150000Z）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- 期間/優先度: 2025-12-19 09:00 - 2025-12-20 18:00 JST（計画） / Priority=High / Urgency=High
- スコープ: 04C4 で stub 実装した `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` の 404 解消を、MSW 無効化＋dev proxy（Stage/Preview を含む）経路で確認し、tone/telemetry (`resolveMasterSource` / `dataSourceTransition` / `cacheHit` / `missingMaster`) が Reception→Charts→Patients の一連の画面で整合していることを証跡化する。

## 1. 前提・ルール
- RUN_ID は `20251209T150000Z` で統一し、証跡・DOC_STATUS・manager checklist すべてに同じ値を記載する。
- ORCA 連携の検証は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の制約を守り、Stage/Preview への dev proxy 接続を行う際は証跡ログに経路と日時を記録する。ORCA 本番への直接アクセスは禁止。
- Python 実行禁止。Legacy `server/` 配下は変更しない。

## 2. 作業項目
1. **ローカル再検証 (MSW OFF)**  
   - `VITE_DISABLE_MSW=1 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` でモダナイズ版サーバー＋Web クライアントを起動し、Reception→Charts→Patients を通して 04C4 で追加した 2 エンドポイントが 200 応答することを確認。  
   - `resolveMasterSource/dataSourceTransition/cacheHit/missingMaster` の値をブラウザコンソール・Network パネルで採取し、スクリーンショットと HAR を `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/` に保存。
2. **dev proxy 経由の疎通確認**  
   - `VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=<Stage or Preview host>` で同じ経路を再走し、stub ではなく実レスポンスでも 404 が解消されているか確認。接続先ホスト・日時・結果を `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md` に追記。  
   - DNS/権限で接続できない場合は理由と再試行要否を記録。
3. **異常系・degarde パスの再現**  
   - fixture 切替や dev proxy のレスポンス差で `missingMaster=false/true`, `cacheHit=false` などの組み合わせを確認し、tone/telemetry の差分を `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/` に追記。  
   - 再現困難なケースは TODO として残し、必要なら 05 デバッグ整備タスクへ引き渡す。
4. **ドキュメント更新**  
   - `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md` に手順・結果・接続先・残課題を記録。  
   - `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md` に 404 解消結果と RUN_ID を追記し、`ORCA_API_STATUS.md` へ影響有無を明記。  
   - `docs/web-client/planning/phase2/DOC_STATUS.md` と `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の該当行に RUN_ID・証跡パス・結果を反映。

## 3. 成果物
- `docs/server-modernization/phase2/operations/logs/20251209T150000Z-integration-gap-qa.md`（接続・検証ログ）
- `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`（HAR・スクリーンショット・tone/telemetry メモ）
- 更新ドキュメント: `src/outpatient_ux_modernization/04C3_WEBクライアントAPI接続検証.md`、`ORCA_API_STATUS.md`、`docs/web-client/planning/phase2/DOC_STATUS.md`、`docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`

## 4. リスクと対応
- Stage/Preview への dev proxy が権限・DNS で失敗する可能性: 証跡ログに失敗理由を残し、再試行スケジュールを提示してマネージャーへエスカレーション。
- stub 固定値のため異常系が再現できない場合: fixtures で `cacheHit/missingMaster` を変化させるか、05 デバッグ整備タスクへ課題を引き継ぐ。
- ORCA 実環境のレスポンス shape 差分: `web-client-api-mapping.md` と照合し、差分はログ・DOC_STATUS に明記する。
