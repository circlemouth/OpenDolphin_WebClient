// RUN_ID=20251212T090000Z
// Playwright 共通フィクスチャ: HAR/スクリーンショット保存とランタイムエラー検知を一元化する。

import fs from 'node:fs';
import path from 'node:path';

import { test as base, expect, type BrowserContext } from '@playwright/test';

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 160);

export const test = base.extend<{ context: BrowserContext }>({
  context: async ({ browser }, use, testInfo) => {
    const runId = process.env.RUN_ID ?? 'unknown-run-id';
    const mode = process.env.VITE_DISABLE_MSW === '1' ? 'msw-off' : 'msw-on';
    const artifactRoot =
      process.env.PLAYWRIGHT_ARTIFACT_DIR ??
      path.join(process.cwd(), 'artifacts', 'webclient', 'e2e', runId, mode);

    fs.mkdirSync(path.join(artifactRoot, 'har'), { recursive: true });
    fs.mkdirSync(path.join(artifactRoot, 'screenshots'), { recursive: true });

    const harFile = `${sanitizeFileName(testInfo.titlePath.join('__'))}.har`;
    const harPath = path.join(artifactRoot, 'har', harFile);

    const useOptions = (testInfo.project.use ?? {}) as { video?: string } & Record<string, unknown>;
    const { video: videoSetting, ...contextUseOptions } = useOptions;
    const envVideoDir = process.env.PLAYWRIGHT_RECORD_VIDEO_DIR;
    const recordVideoDir =
      envVideoDir ??
      (videoSetting && videoSetting !== 'off' ? path.join(artifactRoot, 'videos') : undefined);
    if (recordVideoDir) {
      fs.mkdirSync(recordVideoDir, { recursive: true });
    }
    const recordVideo = recordVideoDir
      ? {
          dir: recordVideoDir,
        }
      : undefined;

    const contextOptions = {
      ...contextUseOptions,
      recordVideo,
      recordHar: {
        path: harPath,
        mode: 'minimal',
        content: 'omit',
      },
    } as const;

    const context = await browser.newContext(contextOptions);

    const runtimeErrors: string[] = [];
    context.on('page', (page) => {
      page.on('pageerror', (err) => runtimeErrors.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // self-signed HTTPS で MSW サービスワーカー登録時に出る証明書エラーは無視する
        if (text.includes('SSL certificate error')) return;
        if (text.includes('ERR_CERT_AUTHORITY_INVALID')) return;
        runtimeErrors.push(`console: ${text}`);
      });
      // requestfailed は環境依存で発生しやすいので致命扱いしない（HAR に残す）。
    });

    await use(context);

    // 成果物としてスクリーンショットを保存（全ページの最終状態）。
    const pages = context.pages();
    if (pages.length > 0) {
      const shotBase = sanitizeFileName(testInfo.titlePath.join('__'));
      await Promise.all(
        pages.map((page, index) =>
          page
            .screenshot({
              path: path.join(artifactRoot, 'screenshots', `${shotBase}-${index}.png`),
              fullPage: true,
            })
            .catch(() => null),
        ),
      );
    }

    await context.close();

    if (runtimeErrors.length > 0) {
      testInfo.attachments.push({
        name: 'runtime-errors',
        contentType: 'text/plain',
        body: runtimeErrors.join('\n'),
      });
    }
  },
});

export { expect };
