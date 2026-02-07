# Images PhaseA (web-client)

- RUN_ID: 20260207T084304Z-cmd_20260207_10_sub_3-images-phaseA-web
- CreatedAt: 2026-02-07T08:43:11.037Z
- facilityId: 1.3.6.1.4.1.9414.72.103
- patientId (URL param only): 01415
- feature flag: VITE_PATIENT_IMAGES_MVP
- MSW: enabled (VITE_DISABLE_MSW=0)

## Memo

ERROR: expected images utility entry, but not found

## Console memo (warnings/errors)

```json
[
  {
    "type": "error",
    "text": "The pseudo class \":nth-child\" is potentially unsafe when doing server-side rendering. Try changing it to \":nth-of-type\".",
    "location": {
      "url": "http://localhost:4183/node_modules/.vite/deps/@emotion_react.js?v=1a469f0c",
      "lineNumber": 872,
      "columnNumber": 16
    },
    "ts": "2026-02-07T08:43:06.828Z"
  },
  {
    "type": "warning",
    "text": "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 response:mocked listeners added. Use emitter.setMaxListeners() to increase limit\n    at _Emitter.addListener (http://localhost:4183/node_modules/.vite/deps/chunk-2MXZYBKQ.js?v=1a469f0c:3881:33)\n    at _Emitter.once (http://localhost:4183/node_modules/.vite/deps/chunk-2MXZYBKQ.js?v=1a469f0c:3894:17)\n    at Object.onMockedResponse (http://localhost:4183/node_modules/.vite/deps/msw_browser.js?v=1a469f0c:1379:31)\n    at handleRequest (http://localhost:4183/node_modules/.vite/deps/chunk-2MXZYBKQ.js?v=1a469f0c:3790:110)\n    at async WorkerChannel.<anonymous> (http://localhost:4183/node_modules/.vite/deps/msw_browser.js?v=1a469f0c:1347:7)",
    "location": {
      "url": "http://localhost:4183/node_modules/.vite/deps/chunk-2MXZYBKQ.js?v=1a469f0c",
      "lineNumber": 3885,
      "columnNumber": 14
    },
    "ts": "2026-02-07T08:43:07.102Z"
  },
  {
    "type": "error",
    "text": "Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.%s \n    at PatientsTab (http://localhost:4183/src/features/charts/PatientsTab.tsx:34:3)\n    at div\n    at div\n    at div\n    at div\n    at section\n    at main\n    at ChartsContent (http://localhost:4183/src/features/charts/pages/ChartsPage.tsx:213:105)\n    at ChartsPage\n    at ConnectedCharts\n    at RenderedRoute (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:5638:26)\n    at Routes (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6532:3)\n    at FacilityShell (http://localhost:4183/src/AppRouter.tsx:608:26)\n    at RenderedRoute (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:5638:26)\n    at Outlet (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6466:26)\n    at div\n    at div\n    at AppLayout (http://localhost:4183/src/AppRouter.tsx:1512:22)\n    at AuthServiceProvider (http://localhost:4183/src/features/charts/authService.tsx:92:3)\n    at FacilityGate (http://localhost:4183/src/AppRouter.tsx:427:25)\n    at RenderedRoute (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:5638:26)\n    at Routes (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6532:3)\n    at AppRouterWithNavigation (http://localhost:4183/src/AppRouter.tsx:229:33)\n    at Router (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6475:13)\n    at BrowserRouter (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:9577:3)\n    at AppRouter\n    at QueryClientProvider (http://localhost:4183/node_modules/.vite/deps/@tanstack_react-query.js?v=1a469f0c:3086:3)",
    "location": {
      "url": "http://localhost:4183/node_modules/.vite/deps/chunk-W2CAXW3A.js?v=1a469f0c",
      "lineNumber": 520,
      "columnNumber": 37
    },
    "ts": "2026-02-07T08:43:07.607Z"
  },
  {
    "type": "error",
    "text": "Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.%s \n    at PatientsTab (http://localhost:4183/src/features/charts/PatientsTab.tsx:34:3)\n    at div\n    at div\n    at div\n    at div\n    at section\n    at main\n    at ChartsContent (http://localhost:4183/src/features/charts/pages/ChartsPage.tsx:213:105)\n    at ChartsPage\n    at ConnectedCharts\n    at RenderedRoute (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:5638:26)\n    at Routes (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6532:3)\n    at FacilityShell (http://localhost:4183/src/AppRouter.tsx:608:26)\n    at RenderedRoute (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:5638:26)\n    at Outlet (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6466:26)\n    at div\n    at div\n    at AppLayout (http://localhost:4183/src/AppRouter.tsx:1512:22)\n    at AuthServiceProvider (http://localhost:4183/src/features/charts/authService.tsx:92:3)\n    at FacilityGate (http://localhost:4183/src/AppRouter.tsx:427:25)\n    at RenderedRoute (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:5638:26)\n    at Routes (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6532:3)\n    at AppRouterWithNavigation (http://localhost:4183/src/AppRouter.tsx:229:33)\n    at Router (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:6475:13)\n    at BrowserRouter (http://localhost:4183/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c:9577:3)\n    at AppRouter\n    at QueryClientProvider (http://localhost:4183/node_modules/.vite/deps/@tanstack_react-query.js?v=1a469f0c:3086:3)",
    "location": {
      "url": "http://localhost:4183/node_modules/.vite/deps/chunk-W2CAXW3A.js?v=1a469f0c",
      "lineNumber": 520,
      "columnNumber": 37
    },
    "ts": "2026-02-07T08:43:07.881Z"
  }
]
```
