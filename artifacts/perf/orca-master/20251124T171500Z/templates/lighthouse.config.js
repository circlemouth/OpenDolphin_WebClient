/** Lighthouse CI config for ORCA master fetch on Charts */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: null, // dev server は手動起動
      settings: {
        formFactor: 'desktop',
        preset: 'desktop',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: { mobile: false, width: 1366, height: 768, deviceScaleFactor: 1, disabled: false },
      },
      // URL は CLI 側の --url で渡す。例: http://localhost:4173/charts/72001?msw=1
      url: [],
      headful: false,
      disableStorageReset: false,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800, aggregationMethod: 'median' }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.05, aggregationMethod: 'median' }],
        'interactive': ['warn', { maxNumericValue: 4000, aggregationMethod: 'median' }],
        'total-byte-weight': ['warn', { maxNumericValue: 350000 }],
        'unused-javascript': ['warn', { maxNumericValue: 150000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};

// モバイル計測例:
// npx @lhci/cli collect --config=./artifacts/perf/orca-master/20251124T171500Z/templates/lighthouse.config.js \
//   --url=http://localhost:4173/charts/72001?msw=1#mobile \
//   --settings.preset=mobile --settings.formFactor=mobile --settings.throttling.rttMs=150 --settings.throttling.throughputKbps=1500 --settings.throttling.cpuSlowdownMultiplier=4 --settings.screenEmulation.mobile=true
