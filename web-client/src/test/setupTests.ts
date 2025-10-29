import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

expect.extend({
  toHaveNoViolations,
});
