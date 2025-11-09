# 2025-11-09 REST 4xx/5xx エラー採取

## 実行概要
- コマンド例: `PARITY_HEADER_FILE=tmp/trace-headers/trace-http-400.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/rest-errors/20251109T060930Z ops/tools/send_parallel_request.sh --profile compose GET "/dolphin/activity/2025,04" trace_http_400`
- 対象: `rest_error_scenarios.manual.csv` に記載の 400/401/500 ケース。
- 出力: 各ケース配下に `legacy/` / `modern/` の HTTP 証跡、`logs/*.log` に Docker ログ抜粋。

## 結果サマリ
| ケース | 期待コード | Legacy | Modernized | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_400` (`/dolphin/activity/2025,04`) | 400 | **500** | **500** | Modernized は `UnknownEntityException: AuditEvent`。Legacy も 500 HTML 応答。 |
| `trace_http_401` (`/touch/user/...`) | 401 | **500** | **500** | Modernized ログに `Remote user does not contain facility separator`。Legacy は 500 HTML。 |
| `trace_http_500` (`/karte/pid/INVALID,%5Bdate%5D`) | 500 | 200 | 400 | Legacy 側が空 JSON で 200、Modernized は `Not able to deserialize data provided`。 |

## フォローアップ
1. いずれのケースも期待ステータスに到達せず。`docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` と `notes/touch-api-parity.md` にブロッカー内容を追記済み。アプリ修正後に同ディレクトリへ再取得を追加する。
2. Docker ログは `logs/legacy_server.log` / `logs/modern_server.log` に保存。`trace-http-*` ごとのフィルタログは `TRACEID_JMS/20251109T060930Z/logs/` を参照。
3. Legacy の 4xx/5xx 再現には `d_users` シードや `LogFilter` トグルが必要。別ワーカーが Compose を再起動した場合、この README の環境情報を参照して再セットアップを依頼。
