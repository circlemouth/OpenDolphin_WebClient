const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const CSRF_META_NAME = 'csrf-token';
const CSRF_COOKIE_NAME = 'ODW_XSRF';

const parseCookie = (cookieString: string, name: string): string | null => {
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.split('=');
    if (!rawKey) {
      continue;
    }
    if (rawKey.trim() === name) {
      return rawValue.join('=').trim();
    }
  }
  return null;
};

const readFromMetaTag = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const element = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);
  if (!element) {
    return null;
  }
  const value = element.getAttribute('content');
  return value && value.trim().length > 0 ? value.trim() : null;
};

const readFromCookie = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  return parseCookie(document.cookie ?? '', CSRF_COOKIE_NAME);
};

let cachedToken: string | null = null;

export const getCsrfToken = (): string | null => {
  if (cachedToken) {
    return cachedToken;
  }
  const fromMeta = readFromMetaTag();
  if (fromMeta) {
    cachedToken = fromMeta;
    return cachedToken;
  }
  const fromCookie = readFromCookie();
  if (fromCookie) {
    cachedToken = fromCookie;
    return cachedToken;
  }
  return null;
};

export const refreshCsrfToken = () => {
  cachedToken = null;
  return getCsrfToken();
};

export const shouldAttachCsrfHeader = (method?: string) => {
  if (!method) {
    return false;
  }
  return !SAFE_METHODS.has(method.toUpperCase());
};

export const __internal = {
  CSRF_COOKIE_NAME,
  CSRF_META_NAME,
  parseCookie,
};
