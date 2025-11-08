# Messaging Parity Check (JMS フォールバック検証)

## 1. 実施概要
- 実施日: 2025-11-08 21:06:39Z（JMS プローブ出力タイムスタンプ 20251108T210639Z）
- 実施者: JMS フォールバック検証担当（Phase5-1）
- 目的: Legacy/Modernized 並列スタックで `MessagingGateway` の JMS エンキュー処理とフォールバック経路を比較し、`open.dolphin.traceId` プロパティ拒否事象を再現する。
- コマンド:
  1. `COMPOSE_PROJECT_NAME=od-jms-debug PROJECT_NAME=od-jms-debug ./scripts/start_legacy_modernized.sh start`
  2. `./ops/tools/jms-probe.sh --scenario claim`
- アーティファクトルート: `artifacts/parity-manual/JMS/20251108T210639Z/`
- 送信ペイロード: `tmp/claim-tests/send_claim_success.json`（ヘッダー: `tmp/claim-tests/claim.headers`）

## 2. 環境・ルーティング
| 項目 | Legacy | Modernized |
| --- | --- | --- |
| アプリコンテナ | `opendolphin-server` | `opendolphin-server-modernized-dev` |
| DB | `opendolphin-postgres` | `opendolphin-postgres-modernized` |
| JMS ブローカー | ActiveMQ Artemis (WildFly 10 組込) | ActiveMQ Artemis (WildFly 33 組込) |
| HTTP ベース URL | `http://localhost:8080/openDolphin/resources` | `http://localhost:9080/openDolphin/resources` |
| リクエスト | `PUT /20/adm/eht/sendClaim`（`send_claim_success.json`） |

> NOTE: `opendolphin-claim-jms` コンテナは未配置のため、Modernized 側でも JMS 消費者は不在。フォールバック経路（同期送信）との差分のみに着目した。

## 3. HTTP/ログ結果サマリ
| 比較軸 | Legacy | Modernized |
| --- | --- | --- |
| HTTP ステータス | 404（レスポンスボディ無し） | 500（`StringIndexOutOfBoundsException`） |
| `send_parallel_request` 記録 | `artifacts/parity-manual/JMS/20251108T210639Z/http/claim/JMS_claim/legacy/` | `.../modern/` |
| JMS enqueue | 実装無し（同期 Claim） | `MessagingGateway` が JMS enq を試行するも `open.dolphin.traceId` で AMQ139012 発生 |
| フォールバック | そもそも JMS を経由しないため未発火 | `Claim fallback send started` → `EHTResource.sendPackage` が 9 桁番号前提で落ちる |
| 監査ログ | 無し | `open.dolphin.audit.external` に `CLAIM_REQUEST` 記録 |

## 4. ログ抜粋
- **JMS プロパティ拒否**: `artifacts/parity-manual/JMS/20251108T210639Z/logs/opendolphin-server-modernized-dev.log:31` にて `jakarta.jms.JMSRuntimeException: AMQ139012: The property name 'open.dolphin.traceId' is not a valid java identifier.`
- **フォールバック開始**: 同ログ `:155` に `Claim fallback send started [traceId=61c92269-7884-4e27-9c78-1551ddc337e7]`。
- **フォールバック失敗**: 同ログ `:416` に `open.dolphin.adm20.rest.EHTResource.sendPackage` が `StringIndexOutOfBoundsException` を送出し HTTP 500 を返却。
- **HTTP レスポンス差分**: `.../http/claim/JMS_claim/response.diff` にて Legacy=404, Modernized=500 の差分を確認（Modernized 側は NUL 付き `begin 0, end -1, length 9` 文字列のみ）。
- **ログ差分**: `.../logs/opendolphin-server-modernized-dev-vs-legacy.diff` にて、Legacy が認証 404 で停止する一方、Modernized は JMS enqueue → フォールバックまで処理が進むことを確認。

## 5. 追加観測事項
1. **JMS 命名規則**: Artemis (AMQP 1.0) は JMS プロパティ名にピリオドを許容しないため、`open.dolphin.traceId` が仕様違反。Legacy では JMS を使っていないため表面化していなかった。
2. **フォールバックの前提**: `EHTResource.sendPackage` が 9 桁請求番号を前提に `substring(0, 9)` 相当のロジックを持っており、今回のダミーデータでは `-1` を返し例外で落ちた。
3. **監視ギャップ**: `opendolphin-claim-jms.log` は `container "opendolphin-claim-jms" not found` となり、JMS 消費者向けログが採取できない。

## 6. 改善案
### 6.1 JMS プロパティ命名
- `MessagingGateway` / `MessageSender` の `TRACE_ID_PROPERTY` を JMS 仕様準拠の `open_dolphin_trace_id` もしくは `openDolphinTraceId` へ統一。
- `ExternalServiceAuditLogger` やモニタリング連携に影響する場合は `TRACE_PROPAGATION_CHECK.md` へ要追記。

### 6.2 フォールバック発火基準の明文化
- `MessagingGateway#enqueue` が例外を受けた場合のみフォールバックへ移行しているため、`Logger` WARN をトリガーに Micrometer カウンタ `dolphin.messaging.enqueue.fallback` を追加。
- フォールバック経路では `ClaimSender` のリトライ回数、例外種別、`traceId` を Structured Logging へ出力して `artifacts/parity-manual/JMS/.../logs/` のような CLI 採取にも残す。

### 6.3 監視・運用フロー
1. `ops/tools/jms-probe.sh` を `docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` の Gate に追加し、Claim API デプロイ後に必ず実行。
2. `OBSERVABILITY_AND_METRICS.md` へ JMS/Fallback カウンタを追加し、OTLP 収集失敗（`otep-collector` 未接続）も合わせて検知。
3. `opendolphin-claim-jms` コンシューマーを Compose に組み込み、`docker logs opendolphin-claim-jms` を本手順の採取対象に追加。

## 7. 次のアクション
1. `MessagingGateway` / `MessageSender` の JMS プロパティ名を修正し、`ops/tools/jms-probe.sh` で AMQ139012 が消えることを再確認。
2. `EHTResource.sendPackage` の 9 桁前提ロジックを排除（`String#indexOf` の戻り値検証 + 例外化）し、500 → 2xx へ戻す。
3. カウンタ・監視設定を `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と本メモへ反映。
4. 本調査結果を `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ5 項目へ反映済み。Runbook 連携も後述の更新を参照。
