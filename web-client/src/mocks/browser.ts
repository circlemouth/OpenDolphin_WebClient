import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { exposeOutpatientScenarioControls } from './fixtures/outpatient';

const worker = setupWorker(...handlers);

export async function startMockWorker() {
  if (typeof window === 'undefined') return;
  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    exposeOutpatientScenarioControls();
    console.info('[msw] development mock worker started');
  } catch (error) {
    console.warn('[msw] failed to start worker', error);
  }
}
