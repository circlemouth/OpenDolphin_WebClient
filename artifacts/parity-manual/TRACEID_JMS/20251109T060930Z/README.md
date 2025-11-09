# 2025-11-09 Trace HTTP 200/400/401/500 採取

## 実行概要
- コマンド例: `PARITY_HEADER_FILE=tmp/trace-headers/trace-http-400.headers PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/20251109T060930Z ops/tools/send_parallel_request.sh --profile compose GET "/dolphin/activity/2025,04" trace_http_400`
- 各ケースで `X-Trace-Id` を事前に固定し、Legacy/Modernized 双方へ同一リクエストを送信。
- Modernized WildFly の `open.dolphin` ログから `traceId=` 行を抽出し、`logs/modern_trace_http_*.log` へ保存。Legacy 側は `LogFilter` 未対応のため HTTP ログのみ。

## 結果サマリ
| ケース | Legacy status | Modern status | 主要ログ |
| --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 | 200 | `trace_http_200/{legacy,modern}/` に HTTP 証跡。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | **500** | **500** | Modernized は `UnknownEntityException: AuditEvent` で 500。`logs/modern_trace_http_400.log` 参照。 |
| `trace_http_401` (`GET /touch/user/...`) | **500** | **500** | Modernized は `Remote user does not contain facility separator`。Legacy は 500 HTML。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 200 | **400** | Legacy 側が 200 + 空 JSON、Modernized は Jackson デシリアライズ失敗文言。 |

## マネージャー確認依頼
1. Legacy `LogFilter` に traceId 出力が無いため、`docker logs opendolphin-server` 側で同等ログを取得できるよう設定変更を検討（Checklist #49/#73/#74 対応）。  
2. Modernized で 400/401 ケースが 500 へ化けている。`AuditEvent` エンティティ未登録、`TouchUserService` 前認証失敗などアプリ側の修正が必要。  
3. JMS 連携（例: `/20/adm/factor2/*`）は今回再現できていない。`TRACEID_JMS/2025xxxxx/trace/` に従い、JMS が発生するケースのログ採取を別途行う。

## ファイル構成
- `<case>/<legacy|modern>/` … `meta.json`, `headers.txt`, `response.json`
- `logs/modern_server.log` … 実行ウィンドウ全体の WildFly ログ（ANSI コード除去済み）
- `logs/modern_trace_http_{200,400,401,500}.log` … `traceId=` 行の抜粋
