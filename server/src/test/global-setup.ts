import { execFileSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './database-url.js';

// Runs once, in the main process, before any test worker starts.
export function setup() {
  const dbName = new URL(TEST_DATABASE_URL).pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against "${dbName}": the test database name must end in _test.`,
    );
  }

  try {
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? '';
    throw new Error(`Migrating the test database failed:\n${stderr}`, { cause: error });
  }
}
