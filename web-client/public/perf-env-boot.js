(() => {
  // RUN_ID を計測系で共通利用する
  const runId = '20251124T200000Z';
  window.__PERF_RUN_ID__ = runId;

  // LHCI (HeadlessChrome) 実行時のみ React DevTools hook を無効化してクラッシュを防ぐ
  const isHeadlessChrome = navigator.userAgent.includes('HeadlessChrome');
  const allowDevtools = window.__ALLOW_REACT_DEVTOOLS__ === true;
  const disableHook = !allowDevtools && (isHeadlessChrome || window.__LHCI_DISABLE_REACT_DEVTOOLS__ === true);

  if (disableHook) {
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: undefined,
      writable: false,
      configurable: false,
    });
  }
})();
