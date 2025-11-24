# ORCA-05/06/08 リリース／ロールバック戦略（RUN_ID=`20251124T131500Z`, 親=`20251124T000000Z`）

本書は ORCA マスターデータ REST（ORCA-05/06/08）を段階的に公開し、問題発生時に即時ロールバックできるようにするためのフラグ設計と運用手順をまとめる。サーバー／Web クライアント双方のフラグ、監査メタ、監視閾値、判定基準を単一の Runbook として使用する。

## 1. フラグ一覧とデフォルト
- **サーバー（feature flag）**
  - `ORCA_MASTER_BRIDGE_ENABLED`（bool, default=false）: ORCA-05/06/08 の routing を有効化。false 時は 404（`{"Code":404,"Message":"feature disabled"}`）で応答し、監査メタは送出しない。
  - `ORCA_MASTER_AUDIT_ENABLED`（bool, default=true）: `runId/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt` を必須で付与。false 時は最小レスポンスのみ返却し、監査は抑止。
  - `ORCA_MASTER_AUTH_MODE`（enum=`basic|mtls`, default=basic）: REST 認証モード切替。mtls 運用は別 RUN 指示でのみ使用。
- **クライアント（環境変数）**
  - `VITE_ORCA_MASTER_BRIDGE`（mock|snapshot|server, default=mock）: MSW/スナップショット/実サーバー切替。stage モードは `server` を使用。
  - `VITE_DISABLE_MSW`（0/1, default=0）: MSW 無効化。1 に設定すると snapshot→server 順でフェッチ。
  - `WEB_ORCA_MASTER_SOURCE`（deprecated alias）: 既存互換。設定があれば `VITE_ORCA_MASTER_BRIDGE` より優先。

## 2. 段階的リリース手順（サーバー → クライアント）
1. **Pre-flight（15 分）**  
   - `ORCA_MASTER_BRIDGE_ENABLED=false` のまま `/actuator/health` と `/orca/master/address?zip=1000001` を curl し、`404 feature disabled` を確認。  
   - `ORCA_MASTER_AUDIT_ENABLED=true` を維持し、log への traceId 出力と `runId` 埋め込みが失敗しないことを確認。
2. **Dark launch（30 分）**  
   - サーバーのみ `ORCA_MASTER_BRIDGE_ENABLED=true` でデプロイ。`VITE_ORCA_MASTER_BRIDGE=mock`（MSW）を維持し、バックエンドの audit 送出・P99 を計測（呼び出し元なしのため負荷極小）。  
   - メトリクス: 5xx=0%、P99 < 500ms を確認。問題があれば即 Step 0 に戻す。
3. **Canary（60 分）**  
   - クライアント canary (1–5%) に `VITE_ORCA_MASTER_BRIDGE=server` を配布。MSW 切替手順に従いブラウザ SW を unregister。  
   - routing: `/api/orca/master/*` → 新 REST、403/401 は既存セッションと同一ロジック。監査メタが欠落した場合は `ORCA_MASTER_AUDIT_ENABLED=false` へ切替えて遮断し、ログを保存。
4. **Ramp up（2–4 時間）**  
   - 25% → 50% → 100% の順に `VITE_ORCA_MASTER_BRIDGE=server` を拡大。各ステップで P99 / エラー率 / missingMaster 比率を 10 分間観測。  
   - サーバー側で `ORCA_MASTER_BRIDGE_ENABLED=true` を維持し、必要に応じて `ORCA_MASTER_AUTH_MODE=mtls` へ昇格（認証変更時は 30 分単位で切替）。

## 3. ロールバック手順と所要時間
- **即時切替（目標 5 分以内）**
  1. クライアント `.env` を `VITE_ORCA_MASTER_BRIDGE=mock` に戻し、ブラウザで SW unregister（Chrome: `chrome://serviceworker-internals`）。  
  2. CloudFront/ブラウザキャッシュを `Cache-Control: no-cache` で再取得（ハードリロード）。  
  3. 監査メタが残留しないことを `audit.logUiState`（dataSource=mock, cacheHit=false）で確認。
- **サーバー無効化（目標 10 分以内）**
  1. `ORCA_MASTER_BRIDGE_ENABLED=false` に設定し、Rolling restart。  
  2. API は 404 を返し続けるため、クライアント側は自動で snapshot/mock へフォールバック。  
  3. 監査メタが空になるため、観測クエリ（PromQL）で `missingMaster` / `fallbackUsed` 送出ゼロを確認。
- **キャッシュ無効化**
  - Redis/内蔵キャッシュを `FLUSHDB` せず、キー prefix `orca-master:*` だけ削除（TTL リセット 5 分）。  
  - React Query 側は `queryClient.invalidateQueries(['orca-master'])` を実行（所要 <1 分）。
- **影響範囲**
  - 受付/カルテのマスター候補表示が MSW/snapshot に戻る。保存ブロックは継続するが、実 REST 由来の単価/保険者更新は反映されない。

## 4. 監視指標と判定基準（§7 SLA と整合）
- **主要 KPI**  
  - `error_rate` (5xx/total) > 2% が 5 分継続 → ロールバック検討。  
  - `P99` > 3s が 10 分継続 → ロールバック検討。  
  - `missingMaster_ratio` > 0.5%（masterType ごと、5 分平均） → 要調査。  
  - `cacheHit_ratio` < 80% が 15 分継続 → キャッシュ/ETag 異常としてローリング再取得。  
  - `audit_missing`（audit フィールド欠落率） > 0.1% → `ORCA_MASTER_AUDIT_ENABLED=false` で一時停止。
- **アラート閾値（暫定）**
  - PagerDuty Critical: `error_rate > 2%` or `P99 > 3s` 10 分。  
  - Warning: `missingMaster_ratio > 0.5%` or `cacheHit_ratio < 80%` 15 分。  
  - Informational: `dataSourceTransition` が 0 件（切替未発火）を 30 分検知。

## 5. ロールバックトリガと通知先
- **トリガ例**  
  - `5xx > 2%` が 5 分継続。  
  - `P99 > 3s` が 10 分継続。  
  - `missingMaster > 0.5%` または `fallbackUsed > 5%` が 10 分継続。  
  - 認証エラー連発 (`401/403 > 2%`) または audit フィールド欠落率 >0.1%。  
  - ORCA 側 DB/ネットワーク障害で 429/503 が 3 連続。
- **通知**  
  - Slack `#modernized-webclient`（一次）  
  - PagerDuty ORCA Bridge サービス（Critical/Warning）  
  - 連絡テンプレ: 「RUN_ID=20251124T131500Z / 事象 / メトリクス値 / 対応（フラグ切替 or 継続観測） / 次報予定」

## 6. 監査・ログ・キャッシュ運用
- すべてのレスポンスに `runId`（クライアントは親 RUN、サーバーは当日 RUN を上書き可）と `dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt/snapshotVersion` を付与。  
- `dataSourceTransition` を以下のイベントで必須送出: (1) MSW→server 切替、(2) snapshot version 更新、(3) audit 抑止 → 復帰。  
- キャッシュ TTL: address/hokenja 7 日、others 5 分。ETag/If-None-Match を有効化し、304 を `cacheHit=true` として計上。

## 7. 実行チェックリスト（抜粋）
- [ ] PRE: `ORCA_MASTER_BRIDGE_ENABLED=false` で 404/監査未送出を確認。  
- [ ] DARK: `ORCA_MASTER_BRIDGE_ENABLED=true`・`VITE_ORCA_MASTER_BRIDGE=mock` で P99/5xx を取得。  
- [ ] CANARY: 1–5% へ展開、`dataSourceTransition=mock->server` 送出を確認。  
- [ ] RAMP: 25/50/100% で KPI を監視し、閾値越え時はロールバック。  
- [ ] ROLLBACK: env フラグ巻き戻し・キャッシュ無効化を 10 分以内に完了。  
- [ ] LOG: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#run-20251124t131500z` へ結果を追記。  
- [ ] DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` 備考に RUN_ID と本ドキュメントを記載。

## 8. 参照
- `docs/server-modernization/phase2/operations/assets/openapi/README.md`（ORCA-05/06/08 OpenAPI と生成手順）  
- `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`（クライアント実装計画）  
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`（接続・SLA・監査項目）  
- `docs/server-modernization/phase2/operations/assets/orca-db-schema/error-fallback-test-matrix.md`（エラー/フォールバック網羅表）
