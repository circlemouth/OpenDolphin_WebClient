# ORCA-05/06/08 実サーバー接続前 Go-Live チェックリスト（RUN_ID=`20251124T184500Z`, 親=`20251124T000000Z`）

目的: ORCA マスター REST（ORCA-05/06/08）を実サーバーへ切り替える前に、接続先準備・証跡取得・ロールバック導線・権限確認を漏れなく確認する。`VITE_DEV_PROXY_TARGET` を書き換える前に本チェックリストを必ず完了する。

## 0. 参照系
- 接続先・認証: `docs/web-client/operations/mac-dev-login.local.md`
- ロールバック: `docs/server-modernization/phase2/operations/orca-master-rollback-plan.md`
- リリース段階: `docs/server-modernization/phase2/operations/orca-master-release-plan.md`
- 監視/アラート: `docs/server-modernization/phase2/operations/assets/observability/orca-master-alerts.yaml`、`docs/server-modernization/phase2/operations/assets/observability/orca-master-dashboard.json`
- ブリッジ計画: `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`
- OpenAPI: `docs/server-modernization/phase2/operations/assets/openapi/README.md`
- ログ: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md`

## 1. 接続先・認証情報確認
- [ ] `VITE_DEV_PROXY_TARGET` を mac-dev ORCA エンドポイントに設定（値は mac-dev-login.local.md を参照）
- [ ] Basic 認証ユーザー/パスワードを確認（パスワードは記載しない）
- [ ] 証明書利用有無: `client cert = no`（mTLS 未使用がデフォルト）
- [ ] `VITE_DISABLE_MSW=1` に設定する前に `.env.local` をバックアップ
- [ ] ブラウザ Service Worker `mockServiceWorker` を unregister 済み

## 2. MSW ON/OFF 切替手順（ブラウザ単位）
- [ ] 切替前に `npm run build && npm run preview -- --host` を実行し、MSW を無効化した preview で確認
- [ ] `.env.local` の `VITE_ORCA_MASTER_BRIDGE=server` / `VITE_DISABLE_MSW=1` を設定し再起動
- [ ] 切替後に `dataSourceTransition=mock|snapshot->server` が監査ログへ出力されることを DevTools Console で確認
- [ ] 必要に応じて `VITE_ORCA_MASTER_BRIDGE=mock` へ即時戻す手順をメモ（ロールバック欄に転記）

## 3. シード・事前データ状態
- [ ] `docs/server-modernization/phase2/operations/assets/orca-db-schema/seed-plan/orca-master-seed-plan.md` で対象シードが投入済みか確認
- [ ] `artifacts/api-stability/20251124T130000Z/seed/templates/` のテンプレートと実適用値に差異がないことを確認
- [ ] 必須マスター（薬剤/用法/材料/検査分類/保険者/住所/点数表）が ORCA 側に揃っているか担当者へ確認

## 4. ロールバック導線（実行前に可否を確認）
- [ ] クライアント側: `.env.local` を `VITE_ORCA_MASTER_BRIDGE=mock` に戻し SW unregister → 5 分以内に復旧可能
- [ ] サーバー側: `ORCA_MASTER_BRIDGE_ENABLED=false` で 404 応答へ切替可能（所要 <10 分）
- [ ] キャッシュ: React Query `invalidateQueries(['orca-master'])` 手順と Redis `orca-master:*` キー削除手順を共有
- [ ] ロールバック時の連絡テンプレ（Slack/PagerDuty）を `orca-master-release-plan.md` に沿って準備

## 5. 権限・認証チェック
- [ ] ORCA 側 Basic 認証で 401/403 が出ないことを curl で事前確認
- [ ] 施設 ID / ユーザー（doctor1/9001 など）で認可されることを API 1 本（例 `/orca/master/address?zip=1000001`）で確認
- [ ] 429/RateLimit が発生した場合の再試行間隔（30s 以上）を team に共有

## 6. 監視・アラート設定確認
- [ ] Alertmanager ルール `orca-master-p99-high` / `orca-master-error-rate` / `orca-master-429` が `assets/observability/orca-master-alerts.yaml` に配置されていることを確認
- [ ] Grafana ダッシュボード JSON (`orca-master-dashboard.json`) を staging へ import 済み
- [ ] アラート受信先（Slack/PagerDuty）が最新か確認
- [ ] RAMP 中の KPI 目標: P99 < 3000ms、error_rate < 2%、429_count = 0、missingMaster < 0.5%、fallbackUsed < 5%、cacheHit > 80%

## 7. 証跡取得テンプレート適用
- [ ] HAR: `artifacts/api-stability/20251124T184500Z/go-live/templates/har-template.md` をコピーし、`.../go-live/<date>/` に保存
- [ ] Console: `.../console-template.md` をコピー
- [ ] Audit: `.../audit-template.md` をコピーし runId/dataSource/traceId を必須記入
- [ ] Coverage: `.../coverage-template.md` をコピーし P99/5xx/429/missingMaster を集計
- [ ] 保存命名規約（README 同梱）に従い `RUN_ID` を含めたファイル名で保管

## 8. 実行順（最低限）
1. 0→1→2 を完了（環境/切替/認証）
2. 6 で監視を有効化し、ダッシュボードが更新されることを確認
3. 7 のテンプレートに沿って `canary` シナリオで HAR/Console/Audit を取得
4. RAMP 25%/50%/100% で coverage を更新、閾値超過時は 4 のロールバック導線を実施
5. すべての証跡パスを Run ログ `.../logs/20251123T135709Z-webclient-master-bridge.md#run-20251124t184500z` にリンク

## 9. 完了条件
- 上記チェックボックスがすべて `✓` になっている
- HAR/Console/Audit/Coverage が保存規約どおり配置され、RUN_ID が一致
- Alertmanager/Grafana が有効で、閾値に基づく判断ができる状態
- ロールバック手順が 10 分以内に実行できることを関係者が合意
