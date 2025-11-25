import { http, HttpResponse, delay, passthrough } from 'msw';

/**
 * ORCA マスター向けフォールトインジェクションのテンプレート。
 * 実際のレスポンス形は web-client のハンドラに合わせて置換してください。
 */

type ScenarioId =
  | 'db-down'
  | 'slow-query'
  | 'http-500'
  | 'http-503'
  | 'too-many-requests'
  | 'dns-fail'
  | 'tls-fail'
  | null;

let currentFault: ScenarioId = null;

export const setOrcaMasterFault = (scenario: ScenarioId) => {
  currentFault = scenario;
  // ブラウザコンソールから window.__mswSetFault で操作できるようにする想定
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.__mswSetFault = setOrcaMasterFault;
    // @ts-ignore
    window.__mswClearFault = () => setOrcaMasterFault(null);
  }
};

const json = (body: unknown, init?: ResponseInit) =>
  HttpResponse.json(body, init);

export const orcaMasterFaultHandlers = [
  // address/hokenja
  http.get('http://100.102.17.40:8000/orca/master/:type', async ({ params }) => {
    switch (currentFault) {
      case 'db-down':
        return json({ Code: 503, Message: 'db down (msw fault)' }, { status: 503 });
      case 'http-500':
        return json({ Code: 500, Message: 'internal error (msw fault)' }, { status: 500 });
      case 'http-503':
        return json({ Code: 503, Message: 'service unavailable (msw fault)' }, { status: 503 });
      case 'too-many-requests':
        return json({ Code: 429, Message: 'rate limited (msw fault)' }, {
          status: 429,
          headers: { 'Retry-After': '5' },
        });
      case 'slow-query':
        await delay(4000);
        return json({ Code: 200, Message: 'delayed success (msw fault)' }, { status: 200 });
      case 'dns-fail':
      case 'tls-fail':
        return passthrough(); // 実ネットワークで失敗させる場合は MSW バイパス
      default:
        return passthrough();
    }
  }),

  // tensu
  http.get('http://100.102.17.40:8000/orca/tensu/:any*', async () => {
    if (currentFault === 'slow-query') {
      await delay(4000);
      return json({ Code: 200, Message: 'delayed success (msw fault)' }, { status: 200 });
    }
    if (currentFault === 'http-500') {
      return json({ Code: 500, Message: 'internal error (msw fault)' }, { status: 500 });
    }
    if (currentFault === 'db-down') {
      return json({ Code: 503, Message: 'db down (msw fault)' }, { status: 503 });
    }
    return passthrough();
  }),
];

// デフォルト状態に戻す
export const clearOrcaMasterFault = () => setOrcaMasterFault(null);

// 初期化: 何も注入しない
setOrcaMasterFault(null);
