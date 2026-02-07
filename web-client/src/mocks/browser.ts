import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { exposeOutpatientScenarioControls } from './fixtures/outpatient';

const worker = setupWorker(...handlers);

export async function startMockWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    exposeOutpatientScenarioControls();
    console.info('[msw] development mock worker started');
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      console.warn(
        '[msw] failed to start worker (https + cert).',
        detail,
        'Hint: trust the local certificate or run with VITE_DEV_USE_HTTPS=0 (http://localhost) when MSW is enabled.',
      );
    } else {
      console.warn('[msw] failed to start worker', error);
    }
    return false;
  }
}
