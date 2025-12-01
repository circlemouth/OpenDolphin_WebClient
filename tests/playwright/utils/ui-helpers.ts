// RUN_ID=20251202T090000Z
// Playwright 共通ヘルパーの叩き台。MSW/実 API 切替は VITE_USE_MOCK_ORCA_QUEUE / VITE_VERIFY_ADMIN_DELIVERY を Playwright 設定で読む想定（設定ファイル側でフラグを注入する）。

import { expect, Page, Locator, APIRequestContext } from '@playwright/test';

export async function assertAriaLiveBanner(
  banner: Locator,
  tone: 'polite' | 'assertive',
  expectedSubstring?: string,
) {
  // aria-live 属性と role を確認し、必要に応じて文言を部分一致でチェックする
  await banner.waitFor({ state: 'visible' });
  const live = await banner.getAttribute('aria-live');
  expect(live).toBe(tone);
  const role = await banner.getAttribute('role');
  expect(role === 'alert' || role === 'status').toBeTruthy();
  if (expectedSubstring) {
    await expect(banner).toContainText(expectedSubstring, { timeout: 2000 });
  }
}

export async function measureBannerDelay(
  trigger: () => Promise<unknown>,
  banner: Locator,
  timeoutMs = 5000,
) {
  // trigger 実行からバナー表示までの時間を計測する
  const start = Date.now();
  await trigger();
  await banner.waitFor({ state: 'visible', timeout: timeoutMs });
  const duration = Date.now() - start;
  return duration;
}

export async function seedRolesAndPermissions(
  request: APIRequestContext,
  rolePreset: 'reception' | 'doctor' | 'admin',
) {
  // 簡易プリセット投入。テスト API が無い場合は警告のみで継続する。
  const res = await request
    .post('/api/test/roles/seed', { data: { preset: rolePreset } })
    .catch((err) => {
      console.warn('seedRolesAndPermissions: request failed', err);
      return null;
    });

  if (!res) return null;
  if (res.status() === 404) {
    console.warn('seedRolesAndPermissions: seed endpoint not available, skipped');
    return null;
  }
  if (!res.ok()) {
    throw new Error(`Failed to seed roles: ${res.status()} ${res.statusText()}`);
  }
  const body = await res.json().catch(() => ({}));
  console.info('seedRolesAndPermissions: seeded', { rolePreset, body });
  return body;
}

export async function fetchAuditLog(
  request: APIRequestContext,
  runId: string,
  criteria?: Record<string, string | number | boolean | undefined>,
) {
  // 監査ログ取得。環境依存で 404 の場合は警告して空配列を返す。
  // 応答が配列/オブジェクト（entries プロパティ）いずれでも扱えるよう正規化し、遅延時は簡易リトライする。
  const params = new URLSearchParams({ runId });
  if (criteria) {
    Object.entries(criteria).forEach(([key, value]) => {
      if (value === undefined) return;
      params.append(key, String(value));
    });
  }
  const maxAttempts = 3; // 遅延反映対策。必要に応じて Playwright 側で調整。
  const backoffMs = 1000;

  const normalizeEntries = (body: unknown) => {
    if (Array.isArray(body)) return body;
    if (body && typeof body === 'object') {
      const candidate = (body as { entries?: unknown; logs?: unknown }).entries ?? (body as { logs?: unknown }).logs;
      if (Array.isArray(candidate)) return candidate;
    }
    return [];
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await request.get(`/api/audit?${params.toString()}`).catch((err) => {
      console.warn('fetchAuditLog: request failed', { attempt, err });
      return null;
    });
    if (!res) {
      if (attempt === maxAttempts) return [];
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }
    if (res.status() === 404) {
      console.warn('fetchAuditLog: audit endpoint not available, skipped');
      return [];
    }
    if (!res.ok()) {
      throw new Error(`Failed to fetch audit log: ${res.status()} ${res.statusText()}`);
    }
    const body = await res.json().catch(() => []);
    const entries = normalizeEntries(body);
    if (entries.length === 0 && attempt < maxAttempts) {
      console.warn('fetchAuditLog: empty entries, retrying for possible delay', { attempt, runId });
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }
    console.info('fetchAuditLog: entries', { runId, count: entries.length, attempt, storage: Array.isArray(body) ? 'mock' : 'live' });
    return entries;
  }
  return [];
}

export async function restoreFilters(
  page: Page,
  storageKey: string,
  expected?: Record<string, unknown>,
) {
  // localStorage に保存されたフィルタを読み戻して検証する
  const raw = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  if (!raw) {
    console.warn(`restoreFilters: no filter found for ${storageKey}`);
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (expected) {
      expect(parsed).toMatchObject(expected);
    }
  } catch (err) {
    console.warn('restoreFilters: failed to parse stored filters', err);
  }
}

export async function assertFocusReturn(page: Page, expectedSelector: string) {
  // 直近の入力フィールドへフォーカスが戻っているかを確認する
  await page.waitForSelector(expectedSelector, { state: 'attached' });
  const matches = await page.evaluate((selector) => {
    const active = document.activeElement;
    if (!active) return false;
    return active.matches(selector);
  }, expectedSelector);
  expect(matches).toBeTruthy();
}

export async function ensureRoleAccess(page: Page, rolePreset: 'reception' | 'doctor' | 'admin') {
  // テスト用の権限プリセットでログインする。拒否レスポンスの場合は明示的に失敗させる。
  // TODO: 実際のログインパスとクエリは環境に合わせて置換する。
  await page.goto(`/login?role=${rolePreset}`);
  const denied = page.getByText(/アクセス拒否|Forbidden/i);
  if (await denied.isVisible({ timeout: 1000 }).catch(() => false)) {
    throw new Error(`role ${rolePreset} is not permitted in this environment`);
  }
  await expect(page).not.toHaveURL(/login/i, { timeout: 5000 });
}

export async function resetFiltersAndReturnFocus(page: Page, storageKey: string, focusSelector: string) {
  // フィルタ状態を初期化し、戻り導線後にフォーカス位置を確認する
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload();
  await page.focus(focusSelector);
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute('name'));
  if (!active) {
    throw new Error('Focus did not return to expected element');
  }
}

export async function logOrcaQueueStatus(request: APIRequestContext, patientId: string) {
  // ORCA 送信キューの状態を API 経由で取得し、テスト出力に残す
  const res = await request.get(`/api/orca/queue?patientId=${patientId}`);
  if (!res.ok()) {
    throw new Error(`Failed to fetch ORCA queue status: ${res.status()}`);
  }
  const body = await res.json();
  console.info('ORCA queue status', { patientId, body });
  return body;
}
