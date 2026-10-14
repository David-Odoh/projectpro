import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './src/test/database-url.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: { DATABASE_URL: TEST_DATABASE_URL },
    globalSetup: ['src/test/global-setup.ts'],
    setupFiles: ['src/test/setup.ts'],
    // Test files share one database and clear it between tests, so they must not run at the same time.
    fileParallelism: false,
  },
});
