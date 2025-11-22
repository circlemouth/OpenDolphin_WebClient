import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let provider: WebTracerProvider | null = null;

const parseExporterHeaders = (): Record<string, string> | undefined => {
  const raw = import.meta.env.VITE_OTLP_HTTP_HEADERS;
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[OTel] VITE_OTLP_HTTP_HEADERS の JSON 解析に失敗しました。ヘッダーは未設定で続行します。', error);
    return undefined;
  }
};

export const initializeOtel = () => {
  if (provider) {
    return provider;
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

  const spanProcessor = new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: import.meta.env.VITE_OTLP_HTTP_ENDPOINT,
      headers: parseExporterHeaders(),
    }),
  );

  provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: import.meta.env.VITE_OTEL_SERVICE_NAME ?? 'open-dolphin-web-client',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: import.meta.env.VITE_ENV ?? 'local',
    }),
    spanProcessors: [spanProcessor],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [/\/api\//],
        clearTimingResources: true,
      }),
    ],
  });

  return provider;
};
