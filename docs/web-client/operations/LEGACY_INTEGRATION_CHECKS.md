# Web クライアント連携検証チェックリスト（Legacy / Modernized）

旧サーバー（`server/`）とモダナイズサーバー（`server-modernized/`）を切り替えながら Web クライアントの受付・カルテ・通知フローを検証するための手順書。サーバー構築手順そのものは `operations/LOCAL_BACKEND_DOCKER.md` および `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` を参照し、本書ではフロントエンド観点の確認に集中する。

## 1. 事前準備
- `docker-compose.yml` + `docker-compose.modernized.dev.yml` で Legacy/Modernized の両方を起動できるようにする。起動ログは `docs/server-modernization/phase2/operations/logs/` に保存。
- Web クライアントは `npm run dev`（MSW 有効）ではなく `npm run build && npm run preview -- --host` で本番相当挙動を確認する。`VITE_DEV_PROXY_TARGET` で接続先を切り替え、切替時はブラウザの Service Worker から `mockServiceWorker` を無効化する。
- 状態管理と監査ログの差異を記録するため、検証ごとに `planning/phase2/DOC_STATUS.md` の備考欄へ日付・担当・実施サーバーを追記する。

## 2. 検証マトリクス
| 観点 | Legacy Server | Modernized Server | 記録方法 |
| --- | --- | --- | --- |
| `/pvt` 状態更新 | `PUT /pvt/{pvtPK,state}` で BIT_TREATMENT などが正しく反映されるか | Jakarta 版 `PVTServiceBean` でビットフラグが維持されるか | `devtools console` と `server.log`（ChartEventServiceBean）を比較。 |
| SSE (`/chart-events/stream`) | 実装なし（ロングポールのみ）。MSW モックで代替 | `jakarta.ws.rs.sse` を使用。`Last-Event-ID` リプレイを確認 | ブラウザ Network タブと `ChartEventSseSupport` ログを添付。 |
| CLAIM/JMS 送信 | 同期送信のみ。`MessagingGateway` 無効 | `MessagingGateway` + JMS enqueue + フォールバック | `server-modernized/log/server.log` の `MessagingGateway` INFO と `activemq-artemis.log` を収集。 |
| SMS/Plivo | 旧設定（HTTPClient 4.x） | OkHttp 5.x + `PLIVO_HTTP_*` | `.env.local` の設定値と `SmsGatewayConfig` INFO ログを記録。 |

## 3. 手順詳細
1. **受付状態 → SSE**
   - 受付画面から任意の患者を選び、`診察開始` → `診察終了` を行う。
   - Legacy サーバー: `network` タブで ロングポール `/chart-event` が 200 → pending になることを確認。
   - Modernized サーバー: SSE `/chart-events/stream` が 200 (text/event-stream) で接続し、`Last-Event-ID` がインクリメントすることを確認。レスポンスヘッダを添付。
2. **JMS / CLAIM**
   - `Charts` から CLAIM 送信操作を行い、Modernized サーバー側で `MessagingGateway dispatchClaim -> JMS enqueue` のログを確認。
   - ActiveMQ CLI で `queue runtimes list --consumer-count --message-count` を発行し、メッセージが滞留しないことを撮影。
3. **Fallback ルート**
   - `docker stop opendolphin-activemq` などで JMS を意図的に停止させ、`MessagingGateway` が同期フォールバックへ切り替わる WARN ログを確認。復旧後に `verify_startup.sh` を実行し、`dolphinQueue` が再作成されることを確認。
4. **予約状態整合**
   - `WatingList` 画面で BIT_OPEN/BIT_TREATMENT/BIT_CANCEL を一通り操作し、`common/PatientVisitModel` のビット値が期待通りかを `api/pvt2/pvtList` のレスポンスで確認。

## 4. 成果物の保存
- 検証ログやスクリーンショットは `docs/server-modernization/phase2/operations/logs/` に `YYYYMMDD-legacy-integration-<env>.md` 形式で保存。
- 本書に記載のチェックリストを完了したら `planning/phase2/DOC_STATUS.md` の「Active ドキュメント」欄に検証実施日と成果物パスを追記し、未実施項目は TODO のまま。 
- マネージャー／ワーカーにタスクを分割する場合は `【ワーカー指示】` として検証観点・切替対象サーバー・使用するドキュメントを明記し、完了報告は `【ワーカー報告】` で成果物パスを示す。
