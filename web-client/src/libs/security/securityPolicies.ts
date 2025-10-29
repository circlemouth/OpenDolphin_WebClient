import { refreshCsrfToken } from '@/libs/security/csrf';

const isLocalhost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');

const SECURITY_META_TAGS: Array<{ name: string; content: string; httpEquiv?: string }> = [
  {
    httpEquiv: 'Content-Security-Policy',
    name: 'csp-policy',
    content:
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
  { name: 'referrer', content: 'no-referrer' },
  { httpEquiv: 'X-Content-Type-Options', name: 'x-content-type-options', content: 'nosniff' },
  { httpEquiv: 'X-Frame-Options', name: 'x-frame-options', content: 'DENY' },
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
  SECURITY_META_TAGS.forEach(applyMetaTag);
  setupSecurityPolicyViolationLogger();
  refreshCsrfToken();
};
