import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount rendered trees between tests; RTL only does this automatically when Vitest globals are on.
afterEach(() => {
  cleanup();
});
