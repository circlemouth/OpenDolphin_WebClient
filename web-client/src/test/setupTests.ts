import { expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

expect.extend({ toHaveNoViolations });

if (typeof SharedArrayBuffer === 'undefined') {
  // jsdom で SharedArrayBuffer が無い環境でも依存ライブラリの初期化を通すためのフォールバック
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.SharedArrayBuffer = ArrayBuffer;
}

if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')) {
  Object.defineProperty(ArrayBuffer.prototype, 'resizable', {
    configurable: true,
    get() {
      return false;
    },
  });
}

if (typeof SharedArrayBuffer !== 'undefined' && !Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'growable')) {
  Object.defineProperty(SharedArrayBuffer.prototype, 'growable', {
    configurable: true,
    get() {
      return false;
    },
  });
}

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }

  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
