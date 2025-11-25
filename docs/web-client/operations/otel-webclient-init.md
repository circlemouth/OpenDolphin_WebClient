# ブラウザ OTel 初期化・TraceContext 伝搬テンプレート（RUN_ID=20251122T071146Z）

本手順は Web クライアントで OpenTelemetry を有効化する際の雛形。モダナイズ版サーバーと接続する環境を前提に、トレース初期化・TraceContext 伝搬・リトライ時の TraceId 継承・エラー画面での TraceId 表示を統一する。

## 前提
- 対象: React/TypeScript フロントエンド（Vite/CRA どちらでも可）。
- Collector: OTLP/HTTP または gRPC（`/v1/traces`）。サンプリングポリシーは Collector 側で設定し、ブラウザ SDK は `AlwaysOn` で送信しても良い。
- 禁止: 個人情報を span 属性に含めること、`traceparent` を 8KB 超のヘッダに膨張させること。

## 1. ブラウザ SDK 初期化
1. 依存追加（例）:
   ```bash
   npm install @opentelemetry/api @opentelemetry/sdk-trace-web @opentelemetry/exporter-trace-otlp-http @opentelemetry/context-zone --save
   ```
2. ブートストラップ（`src/observability/otelClient.ts` など）:
   ```ts
   import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
   import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
   import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
   import { ZoneContextManager } from '@opentelemetry/context-zone';
   import { registerInstrumentations } from '@opentelemetry/instrumentation';
   import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

   const provider = new WebTracerProvider({
     resource: new Resource({
       'service.name': 'web-client',
       'deployment.environment': import.meta.env.VITE_ENV || 'local',
     }),
   });

   provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter({
     url: import.meta.env.VITE_OTLP_HTTP_ENDPOINT,
     headers: { 'x-scope-orgid': import.meta.env.VITE_TENANT_ID || 'default' },
   })));

   provider.register({ contextManager: new ZoneContextManager() });

   registerInstrumentations({
     instrumentations: [
       new FetchInstrumentation({
         propagateTraceHeaderCorsUrls: [/\/api\//],
         clearTimingResources: true,
       }),
     ],
   });
   ```
3. アプリ起動前に `otelClient.ts` を 1 度だけ import する。`traceparent` ヘッダの上限（8KB 未満）をサーバー側のリバースプロキシ設定と一致させる。

## 2. TraceContext 伝搬ルール
- `traceparent` と併せて `X-Request-Id` を生成し、全 API 呼び出しに付与する（生成関数を `lib/requestId.ts` に集約）。
- CORS 設定は `Access-Control-Allow-Headers: traceparent, tracestate, x-request-id` を必須とし、ORCA/モダナイズ版サーバーへの呼び出しで落ちないか事前に確認。
- SSE/WebSocket の再接続では、新規接続時に `traceparent` を再発行するが、画面上の操作ログは旧 TraceId も画面ログに残す。

## 3. リトライ時の TraceId 継承
- axios/fetch いずれも、リトライ前に `traceparent` を再利用するためのインターセプタを挟む。
- テンプレ（axios 例）:
  ```ts
  import axios from 'axios';
  import { context, trace } from '@opentelemetry/api';

  const client = axios.create();

  client.interceptors.request.use((config) => {
    const span = trace.getActiveSpan();
    const traceparent = span?.spanContext()
      ? `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`
      : undefined;
    if (traceparent) {
      config.headers = {
        ...config.headers,
        traceparent,
        'x-request-id': config.headers?.['x-request-id'] ?? crypto.randomUUID(),
      };
    }
    return config;
  });

  client.interceptors.response.use(undefined, async (error) => {
    const shouldRetry = error.response?.status >= 500 && error.config && !error.config.__retried;
    if (!shouldRetry) throw error;
    error.config.__retried = true;
    return client.request(error.config);
  });

  export default client;
  ```
- Fetch で実装する場合も同様に、現在の span から TraceId を取り出し、再リクエスト時にヘッダを復元する。

## 4. エラー画面での TraceId 表示
- グローバル ErrorBoundary で `trace.getActiveSpan()` から TraceId を取得し、エラー画面に表示する。PII を含めず、コピー可能な UI を用意する。
  ```ts
  import { trace } from '@opentelemetry/api';

  function ErrorScreen() {
    const traceId = trace.getActiveSpan()?.spanContext().traceId;
    return (
      <div role="alert">
        <p>エラーが発生しました。</p>
        {traceId && (
          <p>TraceId: <code>{traceId}</code></p>
        )}
      </div>
    );
  }
  export default ErrorScreen;
  ```
- UI 要件: (a) TraceId を選択コピーできること、(b) サポート連絡先や再試行ボタンとセットで表示すること、(c) ログ上限に抵触しないよう 32 文字の TraceId のみを表示すること。

## 5. 動作確認チェックリスト
- [ ] ブラウザ起動直後に `service.name=web-client` の span が Collector に到達する。
- [ ] API 呼び出し時のリクエストヘッダに `traceparent` と `x-request-id` が同時に存在し、モダナイズ版サーバーのログでも同一値が記録される。
- [ ] 500 系レスポンスでリトライしても TraceId が変わらず、`retry.count` 属性がインクリメントされる。
- [ ] ErrorBoundary で TraceId が表示され、サポートチャンネルへ通知する際にコピーできる。
- [ ] `docs/server-modernization/phase2/operations/TRACE_PROPAGATION_CHECK.md` の手順で trace-log 突合が通る。

## 6. 証跡・更新フロー
- 証跡: Collector/Grafana/Tempo のスクリーンショットと `traceId` 一覧を `artifacts/observability/20251122T071146Z/` へ格納。
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID=`20251122T071146Z` を記載し、備考へ証跡パスを追記する。
- 変更時は `src/modernized_server/10_オブザーバビリティと運用運転.md` の関連手順書節へリンクを追加し、`docs/server-modernization/phase2/operations/logs/20251122T071146Z-links.md` にも追記する。

## 7. UI 実装確認 (2025-11-22, RUN_ID=`20251122T071146Z`)
- Web クライアントに TraceId 可視化を組み込み済み。
  - グローバル ErrorBoundary (`TraceErrorBoundary`) で TraceId / RequestId を表示し、再読み込みボタンを提供。
  - HTTP エラー時は通知領域 (`TraceNoticeCenter`) に TraceId / RequestId / Status / URL をトースト表示。
- `src/libs/http/httpClient.ts` の axios リトライで TraceContext を継承。
  - 初回リクエストで親 span を生成し、各リトライは同一 TraceId 上で attempt span を生成して `traceparent`/`x-request-id` を再利用。
  - リトライ尽きた場合も TraceId/RequestId を通知し、SpanStatus を ERROR で終了。
- 手元動作: `npm run dev` + MSW で 500 系をモックし、ErrorBoundary と通知の双方で TraceId が同一であることを確認（詳細は `docs/server-modernization/phase2/operations/logs/20251122T071146Z-links.md` 参照）。
