# ORCA-05/06/08 移行ステージング計画（RUN_ID=`20251124T194500Z`, 親=`20251124T000000Z`）

目的: ORCA マスターデータ REST（ORCA-05/06/08）を **Dev(MSW) → Dev(Server) → Stage → Canary(Prod 1–5%) → Ramp(25/50/100%)** の順に切り替える際、前提・フラグ・証跡・ロールバック条件を時系列で統一する。

## 1. ステージング表（前提・フラグ・証跡・ロールバック）
| フェーズ | 目的 / 対象トラフィック | 前提準備（seed/監視/CI/ログ） | フラグ設定（server / client） | 証跡・ログ取得 | ロールバック条件と即時アクション |
| --- | --- | --- | --- | --- | --- |
| Dev (MSW) | MSW フィクスチャで UI/監査の健全性確認 | - seed: 不要（MSW 既定値）<br>- 監視: Chrome DevTools + Vitest、console/network HAR<br>- CI: `npm test -- orca-master` / `npm run lint`<br>- ログ: `artifacts/api-stability/<RUN_ID>/msw-fixture/` ハッシュ | server: `ORCA_MASTER_BRIDGE_ENABLED=false`（デプロイ不要）<br>client: `VITE_ORCA_MASTER_BRIDGE=mock`, `VITE_DISABLE_MSW=0` | - HAR/console/audit を `.../ui-smoke/` へ<br>- 監査メタ `dataSource=mock` `runId=<RUN_ID>` 確認 | - MSW ハンドラ 404 / audit 欠落が出たらテスト中断<br>- 修正まで `npm test` 停止、ログは残すのみ |
| Dev (Server) | 開発 ORCA 直結で API スキーマ整合と audit 送出確認 | - seed: `seed-plan/orca-master-seed-plan.md` の最小セット投入済み<br>- 監視: curl + PromQL (P99/5xx) in dev Grafana<br>- アラート: off（手動監視）<br>- CI: `npm run openapi:orca-master` → `npm run typecheck` | server: `ORCA_MASTER_BRIDGE_ENABLED=true`, `ORCA_MASTER_AUDIT_ENABLED=true`<br>client: `VITE_DISABLE_MSW=1`, `VITE_ORCA_MASTER_BRIDGE=server`, `WEB_ORCA_MASTER_SOURCE` 未設定 | - curl 結果と audit 抜粋を `operations/logs/<RUN_ID>-dev-server.md` へ<br>- schema diff → `artifacts/api-stability/<RUN_ID>/dev-server/` | - 5xx>2% or P99>3s が 10 分継続 → `ORCA_MASTER_BRIDGE_ENABLED=false` へ戻す<br>- audit 欠落 >0.1% → `ORCA_MASTER_AUDIT_ENABLED=false` で遮断し原因記録 |
| Stage | Stage サーバーで本番相当データ＋CI Gate | - seed: Stage 用 seed 適用完了<br>- 監視: Stage Grafana/Alertmanager 起動、ログ転送先（S3/CloudWatch 等）確認<br>- アラート: warning しきい値のみ有効（PagerDuty mute）<br>- CI gate: `openapi diff`・`msw hash`・`typecheck` | server: `ORCA_MASTER_BRIDGE_ENABLED=true`, `ORCA_MASTER_AUTH_MODE=basic`（mtls 未使用）<br>client: `VITE_ORCA_MASTER_BRIDGE=server`（stage mode）, `.env.stage` で MSW 無効 | - E2E (mock→server) 成果物を `artifacts/api-stability/<RUN_ID>/stage/` に保存<br>- Alert/metric スクリーンショットをログに添付 | - Alert firing (error_rate>2% or P99>3s) 10 分 → Stage デプロイを rollback（server flag false）し MSW へ戻す<br>- schema diff 大きい場合: CI gate を fail し再デプロイ前に修正 |
| Canary (Prod 1–5%) | 本番少数で監査・性能を確認 | - seed: 本番 DB 前提（変更なし）<br>- 監視: PagerDuty Warning 有効、Grafana dashboard `orca-master-dashboard.json` を import<br>- ログ: 本番 audit/log sink 接続確認（マスキング設定済） | server: `ORCA_MASTER_BRIDGE_ENABLED=true`, `ORCA_MASTER_AUDIT_ENABLED=true`<br>client: Feature 配布対象 1–5% に `VITE_ORCA_MASTER_BRIDGE=server` 配信、その他は `mock` | - `dataSourceTransition=mock->server` が送出された HAR/Audit を `artifacts/api-stability/<RUN_ID>/canary/` へ<br>- Alert firing/メトリクス値を `operations/logs/<RUN_ID>-canary.md` に記録 | - error_rate>2% 5分 or P99>3s 10分継続, missingMaster>0.5% 10分 → 即座に client を `mock` へ戻し（配布停止）、server flag は true のまま観測 or 必要なら false に戻す<br>- 個別ユーザ影響報告があれば即 rollback |
| Ramp (25/50/100%) | 本番全面切替。段階毎に 10 分観測 | - 25%/50% 前に Alert を Critical まで有効化<br>- ログ保存口と S3/Audit アーカイブの書込み確認<br>- CI: 本番リリースタグで `msw hash`・`openapi diff` 再確認 | server: `ORCA_MASTER_BRIDGE_ENABLED=true`, 認証モード必要なら `mtls` へ昇格<br>client: 25%→50%→100% の順で `VITE_ORCA_MASTER_BRIDGE=server` 配信 | - 各拡大量ステップで HAR/PromQL スナップショットを `.../ramp/25|50|100/` に保存<br>- PagerDuty 通知 ID をログに記録 | - どの段階でも KPI 超過（error_rate>2%, P99>3s, missingMaster>0.5%, audit_missing>0.1%）が 10 分継続したら即前段階へ戻す（client=mock, server flag=false まで遡及可）。戻した時刻・理由をログに必須記録 |

## 2. 時系列テンプレ（日付なし・再利用可）
1. **Kickoff**: RUN_ID 採番（例: `20251124T194500Z`）→ 参照チェーン確認 → DOC_STATUS 更新予定を記録。  
2. **Dev(MSW)**: MSW フィクスチャ整合 → Vitest/lint → `ui-smoke` ログ保存。  
3. **Dev(Server)**: seed 適用確認 → `VITE_DISABLE_MSW=1` で curl + audit 抽出 → diff/スナップショット保存。  
4. **Stage**: CI gate（openapi diff, msw hash, typecheck）→ stage デプロイ → 10 分観測 → Alert screenshot 保存。  
5. **Canary**: 1–5% 配布 → `dataSourceTransition` 監査確認 → 10 分観測 → PagerDuty/Slack 通知ログ保存。  
6. **Ramp**: 25% → 50% → 100% の順で配布、各 10 分観測・ハッシュ/メトリクス保存。  
7. **Close/Archive**: KPI/アラート結果とロールバック有無をログ化し、DOC_STATUS 備考へ RUN_ID と成果物パスを記載。

## 3. 依存・リンク
- フラグ・リリース基準: `docs/server-modernization/phase2/operations/orca-master-release-plan.md`
- Go-Live 手順: `docs/server-modernization/phase2/operations/orca-master-go-live-checklist.md`
- OpenAPI/型生成: `docs/server-modernization/phase2/operations/assets/openapi/README.md`
- seed/スキーマ/エラー設計: `docs/server-modernization/phase2/operations/assets/orca-db-schema/{seed-plan/orca-master-seed-plan.md, error-fallback-test-matrix.md, field-mapping/orca-master-field-matrix.md}`
- 監視: `docs/server-modernization/phase2/operations/assets/observability/orca-master-dashboard.json`

## 4. Config Matrix（client/server flags）
ORCA マスターブリッジ切替時に使う推奨フラグ値と適用範囲。クライアントは `.env.stage.example` / `.env.prod.example` をコピーして利用する。

| フェーズ | クライアント推奨フラグ | サーバー推奨フラグ | 備考 / 配布ルール |
| --- | --- | --- | --- |
| Stage | `VITE_ORCA_MASTER_BRIDGE=server` `VITE_DISABLE_MSW=1` `VITE_DEV_PROXY_TARGET=https://stage.example.com/opendolphin/api` `VITE_DEV_USE_HTTPS=1` `VITE_ENABLE_TELEMETRY=1` `VITE_RUM_RUN_ID=20251124T213500Z` `VITE_PERF_LOG_ENDPOINT=https://stage.example.com/__perf-log` | `ORCA_MASTER_BRIDGE_ENABLED=true` `ORCA_MASTER_AUDIT_ENABLED=true` `ORCA_MASTER_AUTH_MODE=basic` | CI gate 通過後に全ユーザーへ一括適用。切替前後で `dataSourceTransition` を監査送出。 |
| Canary (Prod 1–5%) | 対象 1–5% のみ `VITE_ORCA_MASTER_BRIDGE=server`、他は `mock`。`VITE_DISABLE_MSW=1` は共通。Telemetry/RUM は prod エンドポイントを指定。 | `ORCA_MASTER_BRIDGE_ENABLED=true` `ORCA_MASTER_AUDIT_ENABLED=true`（Critical=OFF/Warning=ON） | アラート発火時は対象を即 `mock` へ戻す（server flag は維持または必要に応じて false）。 |
| Ramp (25/50/100%) | 25%→50%→100% の順で `VITE_ORCA_MASTER_BRIDGE=server` を拡大。その他フラグは Canary と同じ。 | `ORCA_MASTER_BRIDGE_ENABLED=true` `ORCA_MASTER_AUDIT_ENABLED=true` `ORCA_MASTER_AUTH_MODE=mtls` への昇格を検討 | 各ステップ 10 分観測。KPI 超過で一段階前へロールバック。 |
| Prod Steady | 全ユーザー `VITE_ORCA_MASTER_BRIDGE=server` `VITE_DISABLE_MSW=1` `VITE_ENABLE_TELEMETRY=1` `VITE_PERF_LOG_ENDPOINT=https://prod.example.com/__perf-log` | `ORCA_MASTER_BRIDGE_ENABLED=true` `ORCA_MASTER_AUDIT_ENABLED=true` `ORCA_MASTER_AUTH_MODE=mtls` | フラグはリリースタグと一緒に固定。変更時は RUN_ID をログへ記録し、Rollback plan に従う。 |
