import { expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

expect.extend({ toHaveNoViolations });

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): Promise<void>;
  }

  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
