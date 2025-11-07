import { refreshCsrfToken } from '@/libs/security/csrf';

const isLocalhost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');

const buildContentSecurityPolicy = () => {
  const directives: Record<string, Set<string>> = {
    "default-src": new Set(["'self'"]),
    "script-src": new Set(["'self'"]),
    "style-src": new Set(["'self'", "'unsafe-inline'"]),
    "img-src": new Set(["'self'", 'data:']),
    "font-src": new Set(["'self'", 'data:']),
    "connect-src": new Set(["'self'", 'https:']),
    "worker-src": new Set(["'self'"]),
    "base-uri": new Set(["'self'"]),
    "form-action": new Set(["'self'"]),
  };

  if (import.meta.env.DEV) {
    directives["script-src"].add("'unsafe-eval'");
    directives["script-src"].add("'unsafe-inline'");
    directives["connect-src"].add('ws:');
    directives["connect-src"].add('wss:');
    directives["img-src"].add('blob:');
    directives["worker-src"].add('blob:');
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${Array.from(values).join(' ')}`)
    .join('; ');
};

const getSecurityMetaTags = () => [
  {
    httpEquiv: 'Content-Security-Policy',
    name: 'csp-policy',
    content: buildContentSecurityPolicy(),
  },
  { name: 'referrer', content: 'no-referrer' },
  { httpEquiv: 'X-Content-Type-Options', name: 'x-content-type-options', content: 'nosniff' },
  { name: 'color-scheme', content: 'light dark' },
];

const applyMetaTag = (meta: { name: string; content: string; httpEquiv?: string }) => {
  if (typeof document === 'undefined') {
    return;
  }

  const selector = meta.httpEquiv
    ? `meta[http-equiv="${meta.httpEquiv}"]`
    : `meta[name="${meta.name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    if (meta.httpEquiv) {
      element.setAttribute('http-equiv', meta.httpEquiv);
    } else {
      element.setAttribute('name', meta.name);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', meta.content);
};

const enforceHttps = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (window.location.protocol === 'https:') {
    return;
  }
  if (isLocalhost(window.location.hostname)) {
    return;
  }
  const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(httpsUrl);
};

const setupSecurityPolicyViolationLogger = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.addEventListener('securitypolicyviolation', (event) => {
    console.warn('CSP violation detected', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
    });
  });
};

export const initializeSecurityPolicies = () => {
  enforceHttps();
  getSecurityMetaTags().forEach(applyMetaTag);
  setupSecurityPolicyViolationLogger();
  refreshCsrfToken();
};
